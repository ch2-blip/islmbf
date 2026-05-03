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
import { GeometricPattern, EightPointStar } from "@/components/geometric-pattern"

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

  async function loadAll() {
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
  }

  return (
    <div className="space-y-4 pb-2">
      <section className="relative mx-4 mt-4 overflow-hidden rounded-2xl shadow-sm ring-1 ring-primary/15">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-[color-mix(in_oklab,var(--primary)_55%,var(--accent))] to-accent" />
        <GeometricPattern className="absolute inset-0 h-full w-full text-primary-foreground/25" />
        <div
          aria-hidden
          className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary-foreground/15 blur-2xl"
        />
        <div
          aria-hidden
          className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-accent/30 blur-2xl"
        />
        <div className="relative flex items-center gap-3 px-5 py-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur-sm ring-1 ring-primary-foreground/25 text-primary-foreground">
            <EightPointStar size={26} />
          </span>
          <div className="min-w-0 flex-1 text-primary-foreground">
            <div className="text-[11px] uppercase tracking-[0.22em] opacity-80">
              AS-SALĀMU ‘ALAYKUM
            </div>
            <div className="font-serif-cn text-lg font-semibold leading-tight mt-0.5">
              愿平安与宁静与你同在
            </div>
            <div className="text-[11px] opacity-85 mt-0.5">
              在静园，以经训润心，以清语会友
            </div>
          </div>
        </div>
      </section>

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

        <TabsContent value="articles" className="mt-4 space-y-4">
          {articles.length === 0 ? (
            loaded ? <EmptyState type="article" /> : null
          ) : (
            articles.map((a) => <ArticleCard key={a.id} article={a} />)
          )}
        </TabsContent>

        <TabsContent value="topics" className="mt-4">
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
