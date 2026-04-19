import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Article, Topic, Announcement } from "@/lib/database.types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArticleCard } from "@/components/article-card"
import { TopicCard } from "@/components/topic-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { Megaphone, Sparkles } from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"
import { timeAgo } from "@/lib/hijri"

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: "articles" | "topics" = searchParams.get("tab") === "topics" ? "topics" : "articles"
  const setTab = (v: "articles" | "topics") => {
    const next = new URLSearchParams(searchParams)
    if (v === "articles") next.delete("tab")
    else next.set("tab", v)
    setSearchParams(next, { replace: true })
  }
  const [articles, setArticles] = useState<Article[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
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
    setArticles((arRes.data as Article[]) ?? [])
    setTopics((tpRes.data as Topic[]) ?? [])
    setAnnouncement(anRes.data)
    setLoading(false)
  }

  return (
    <div className="px-4 pt-4 space-y-4">
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
          {loading ? (
            <ArticleSkeletons />
          ) : articles.length === 0 ? (
            <EmptyState type="article" />
          ) : (
            articles.map((a) => <ArticleCard key={a.id} article={a} />)
          )}
        </TabsContent>

        <TabsContent value="topics" className="mt-4">
          {loading ? (
            <TopicSkeletons />
          ) : topics.length === 0 ? (
            <EmptyState type="topic" />
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
  )
}

function ArticleSkeletons() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-[16/7] w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </Card>
      ))}
    </>
  )
}

function TopicSkeletons() {
  return (
    <Card>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 p-4 border-b last:border-b-0">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </Card>
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
