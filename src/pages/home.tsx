import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Article, Topic, Announcement } from "@/lib/database.types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArticleCard } from "@/components/article-card"
import { TopicCard } from "@/components/topic-card"
import { Card } from "@/components/ui/card"
import { Megaphone, Sparkles } from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"
import { timeAgo } from "@/lib/hijri"
import { getCache, setCache } from "@/lib/page-cache"
import { HomeHero } from "@/components/home-hero"
import { fetchStaticHome, checkVersionChanged } from "@/lib/static-data"
import { prefetchTopics } from "@/lib/topic-prefetch"

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

  useEffect(() => {
    loadAll()
  }, [])

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
        setArticles(staticData.articles)
        setTopics(staticData.topics ?? [])
        setAnnouncement(staticData.announcement ?? null)
        setLoaded(true)
        // Write to sessionStorage for subsequent navigation
        setCache<HomeCache>(CACHE_KEY, {
          articles: staticData.articles,
          topics: staticData.topics ?? [],
          announcement: staticData.announcement ?? null,
        })
        // Pre-cache individual articles/topics for instant detail pages
        for (const a of staticData.articles) {
          setCache<Article>(`article:${a.id}`, a, (a as any).updated_at)
        }
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
    const nextArticles = (arRes.data as Article[]) ?? []
    const nextTopics = (tpRes.data as Topic[]) ?? []
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
    // Pre-cache individual articles for instant detail page display
    for (const a of nextArticles) {
      setCache<Article>(`article:${a.id}`, a, (a as any).updated_at)
    }
    // Pre-cache individual topics for instant detail page display
    for (const t of nextTopics) {
      setCache<Topic>(`topic:${t.id}`, t, (t as any).updated_at)
    }
  }

  /** Background version check — if version changed, silently refresh from static JSON */
  async function backgroundRevalidate() {
    const { changed, version } = await checkVersionChanged()
    if (changed) {
      // Pass version as cache-busting param to bypass CDN/browser cache
      const freshData = await fetchStaticHome<HomeCache & { generatedAt?: string }>(version)
      if (freshData && freshData.articles?.length > 0) {
        setArticles(freshData.articles)
        setTopics(freshData.topics ?? [])
        setAnnouncement(freshData.announcement ?? null)
        setCache<HomeCache>(CACHE_KEY, {
          articles: freshData.articles,
          topics: freshData.topics ?? [],
          announcement: freshData.announcement ?? null,
        })
      }
    }
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
