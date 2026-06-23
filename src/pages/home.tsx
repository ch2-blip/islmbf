import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Article, Topic, Announcement } from "@/lib/database.types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArticleCard } from "@/components/article-card"
import { TopicCard } from "@/components/topic-card"
import { Card } from "@/components/ui/card"
import { Megaphone, Sparkles } from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"
import { timeAgo } from "@/lib/hijri"
import { getCache, setCache, mergeCommentCounts } from "@/lib/page-cache"
import { HomeHero } from "@/components/home-hero"
import { fetchStaticHome, checkVersionChanged } from "@/lib/static-data"
import { prefetchTopics } from "@/lib/topic-prefetch"
import { prefetchArticles } from "@/lib/article-prefetch"

type HomeCache = {
  articles: Article[]
  topics: Topic[]
  announcement: Announcement | null
}

const CACHE_KEY = "home"

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: "articles" | "topics" = searchParams.get("tab") === "topics" ? "topics" : "articles"
  const setTab = (v: "articles" | "topics") => {
    const next = new URLSearchParams(searchParams)
    if (v === "articles") next.delete("tab")
    else next.set("tab", v)
    setSearchParams(next, { replace: true })
  }
  const cached = getCache<HomeCache>(CACHE_KEY)
  const [articles, setArticles] = useState<Article[]>(cached?.articles ?? [])
  const [topics, setTopics] = useState<Topic[]>(cached?.topics ?? [])
  const [announcement, setAnnouncement] = useState<Announcement | null>(cached?.announcement ?? null)
  const [loaded, setLoaded] = useState(!!cached)
  // Refs hold latest state so async refreshCommentCounts can read current IDs
  const articlesRef = useRef(articles)
  const topicsRef = useRef(topics)
  articlesRef.current = articles
  topicsRef.current = topics

  useEffect(() => {
    loadAll()
  }, [])

  // After data is loaded (from any source), refresh real comment counts from comments table
  const countRefreshedRef = useRef(false)
  useEffect(() => {
    if (loaded && !countRefreshedRef.current) {
      countRefreshedRef.current = true
      refreshCommentCounts()
    }
  }, [loaded])

  // Prefetch first 15 topic details when topics tab is visible
  useEffect(() => {
    if (tab === "topics" && topics.length > 0) {
      const ids = topics.slice(0, 15).map((t) => t.id)
      prefetchTopics(ids)
    }
  }, [tab, topics.length > 0])

  /**
   * Load priority:
   * 1. sessionStorage cache (already in useState init above)
   * 2. /static-data/home.json (same-origin, fast)
   * 3. Supabase (cross-origin, slower — fallback)
   * 
   * After display, background-check version.json for freshness.
   */
  async function loadAll() {
    // If no sessionStorage cache, try static JSON first
    if (!cached) {
      const staticData = await fetchStaticHome<HomeCache & { generatedAt?: string }>()
      if (staticData && staticData.articles?.length > 0) {
        setArticles(mergeCommentCounts(staticData.articles))
        setTopics(mergeCommentCounts(staticData.topics ?? []))
        setAnnouncement(staticData.announcement ?? null)
        setLoaded(true)
        // Write to sessionStorage for subsequent navigation
        setCache<HomeCache>(CACHE_KEY, {
          articles: staticData.articles,
          topics: staticData.topics ?? [],
          announcement: staticData.announcement ?? null,
        })
        // NOTE: Do NOT pre-cache individual articles here!
        // home.json articles lack the 'content' field — caching them as
        // article:{id} would cause article-detail to show empty body.
        // Instead, background-prefetch full article detail JSONs (with content)
        prefetchArticles(staticData.articles.slice(0, 8).map(a => a.id))
        // Topics in home.json DO include content, so those are safe to cache.
        for (const t of staticData.topics ?? []) {
          setCache<Topic>(`topic:${t.id}`, t, (t as any).updated_at)
        }
        // Background: check version then revalidate via Supabase
        backgroundRevalidate()
        return
      }
    }

    // Fallback: original Supabase query (also used for revalidation)
    await loadFromSupabase()

    // Background version check (even if we had sessionStorage cache)
    backgroundRevalidate()
  }

  /** Original Supabase loading — always works as fallback */
  async function loadFromSupabase() {
    const [arRes, tpRes, anRes] = await Promise.all([
      supabase
        .from("articles")
        .select("*, author:profiles!articles_author_id_fkey(*), category:categories(*)")
        .eq("status", "published")
        .order("is_pinned", { ascending: false })
        .order("sort_order", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(20),
      supabase
        .from("topics")
        .select("*, author:profiles!topics_author_id_fkey(*), board:boards(*)")
        .eq("status", "published")
        .order("is_pinned", { ascending: false })
        .order("last_reply_at", { ascending: false })
        .limit(30),
      supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    const nextArticles = mergeCommentCounts((arRes.data as Article[]) ?? [])
    const nextTopics = mergeCommentCounts((tpRes.data as Topic[]) ?? [])
    const nextAnnouncement = anRes.data ?? null
    setArticles(nextArticles)
    setTopics(nextTopics)
    setAnnouncement(nextAnnouncement)
    setLoaded(true)
    setCache<HomeCache>(CACHE_KEY, {
      articles: nextArticles,
      topics: nextTopics,
      announcement: nextAnnouncement,
    })
    // NOTE: Do NOT pre-cache individual articles from the home list query!
    // Instead, background-prefetch full article detail JSONs (with content)
    prefetchArticles(nextArticles.slice(0, 8).map(a => a.id))
    // Pre-cache individual topics for instant detail page display
    for (const t of nextTopics) {
      setCache<Topic>(`topic:${t.id}`, t, (t as any).updated_at)
    }
  }

  /** Background version check — if version changed, silently refresh from static JSON */
  async function backgroundRevalidate() {
    const { changed, version } = await checkVersionChanged()
    if (changed) {
      const freshData = await fetchStaticHome<HomeCache & { generatedAt?: string }>(version)
      if (freshData && freshData.articles?.length > 0) {
        setArticles(mergeCommentCounts(freshData.articles))
        setTopics(mergeCommentCounts(freshData.topics ?? []))
        setAnnouncement(freshData.announcement ?? null)
        setCache<HomeCache>(CACHE_KEY, {
          articles: freshData.articles,
          topics: freshData.topics ?? [],
          announcement: freshData.announcement ?? null,
        })
      }
    }
    // Always refresh real comment counts from DB after revalidation
    refreshCommentCounts()
  }

  /**
   * Lightweight background query: count real comments from the comments table
   * for currently displayed articles and topics. This does NOT rely on
   * topics.comment_count / articles.comment_count columns (which depend on
   * triggers and may be stale). Instead, it queries the comments table directly.
   */
  async function refreshCommentCounts() {
    const articleIds = articlesRef.current.map(a => a.id)
    const topicIds = topicsRef.current.map(t => t.id)

    if (articleIds.length === 0 && topicIds.length === 0) return

    // Query all non-deleted comments for these IDs (just target_id column)
    const allIds = [...articleIds, ...topicIds]
    const { data: rows } = await supabase
      .from("comments")
      .select("target_id")
      .in("target_id", allIds)
      .eq("is_deleted", false)

    if (!rows) return

    // Count per target_id client-side
    const countMap = new Map<string, number>()
    for (const r of rows) {
      countMap.set(r.target_id, (countMap.get(r.target_id) || 0) + 1)
    }

    // Update articles with real counts
    setArticles(prev =>
      mergeCommentCounts(prev.map(a => ({
        ...a,
        comment_count: countMap.get(a.id) ?? 0,
      })))
    )

    // Update topics with real counts
    setTopics(prev =>
      mergeCommentCounts(prev.map(t => ({
        ...t,
        comment_count: countMap.get(t.id) ?? 0,
      })))
    )
  }

  return (
    <div className="space-y-4 pb-2">
      <HomeHero />

      <div className="px-4 space-y-4">
      {announcement && (
        <Link to="/announcements">
          <Card className="flex items-start gap-3 p-3.5 border-accent/30 bg-accent/5 hover:bg-accent/10 transition-colors">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20">
              <Megaphone className="h-4 w-4 text-accent-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-accent-foreground/70 mb-0.5">社区公告 · {timeAgo(announcement.created_at)}</div>
              <div className="font-medium text-sm line-clamp-2">{announcement.title}</div>
            </div>
          </Card>
        </Link>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as "articles" | "topics")} className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-muted/60 h-11">
          <TabsTrigger value="articles" className="font-serif-cn text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            文章
          </TabsTrigger>
          <TabsTrigger value="topics" className="font-serif-cn text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            话题
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="mt-4 space-y-4 min-h-[50vh]">
          {articles.length === 0 ? (
            loaded ? <EmptyState type="article" /> : null
          ) : (
            articles.map((a) => <ArticleCard key={a.id} article={a} />)
          )}
        </TabsContent>

        <TabsContent value="topics" className="mt-4 min-h-[50vh]">
          {topics.length === 0 ? (
            loaded ? <EmptyState type="topic" /> : null
          ) : (
            <Card className="overflow-hidden divide-y-0 p-0">
              {topics.map((t) => (
                <TopicCard key={t.id} topic={t} />
              ))}
            </Card>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}

function EmptyState({ type }: { type: "article" | "topic" }) {
  return (
    <Card className="p-10 text-center bg-muted/30 border-dashed">
      <p className="text-sm text-muted-foreground font-serif-cn">
        {type === "article" ? "暂无文章，快来写下第一篇吧" : "暂无话题，快来发起第一个讨论吧"}
      </p>
    </Card>
  )
}
