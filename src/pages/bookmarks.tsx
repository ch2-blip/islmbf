import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import type { Article, Topic } from "@/lib/database.types"
import { ArticleCard } from "@/components/article-card"
import { TopicCard } from "@/components/topic-card"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Bookmark, Heart, FileText } from "lucide-react"

type Mode = "bookmark" | "like" | "my-articles"

export function BookmarksPage({ mode }: { mode: Mode }) {
  const { user } = useAuth()
  const nav = useNavigate()
  const [articles, setArticles] = useState<Article[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      nav("/login")
      return
    }
    load()
  }, [user, mode, nav])

  async function load() {
    if (!user) return
    setLoading(true)
    if (mode === "my-articles") {
      const { data } = await supabase
        .from("articles")
        .select("*, author:profiles!articles_author_id_fkey(*), category:categories(*)")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false })
      setArticles((data as Article[]) ?? [])
      setTopics([])
    } else {
      const { data: rx } = await supabase
        .from("reactions")
        .select("target_type, target_id")
        .eq("user_id", user.id)
        .eq("reaction_type", mode)
      const ids = rx ?? []
      const articleIds = ids.filter((r) => r.target_type === "article").map((r) => r.target_id)
      const topicIds = ids.filter((r) => r.target_type === "topic").map((r) => r.target_id)
      const [a, t] = await Promise.all([
        articleIds.length
          ? supabase
              .from("articles")
              .select("*, author:profiles!articles_author_id_fkey(*), category:categories(*)")
              .in("id", articleIds)
          : { data: [] },
        topicIds.length
          ? supabase
              .from("topics")
              .select("*, author:profiles!topics_author_id_fkey(*), board:boards(*)")
              .in("id", topicIds)
          : { data: [] },
      ])
      setArticles((a.data as Article[]) ?? [])
      setTopics((t.data as Topic[]) ?? [])
    }
    setLoading(false)
  }

  const titleMap = {
    bookmark: { icon: Bookmark, title: "我的收藏" },
    like: { icon: Heart, title: "我的点赞" },
    "my-articles": { icon: FileText, title: "我发布的文章" },
  }
  const Icon = titleMap[mode].icon

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <button
        onClick={() => nav(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </button>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-serif-cn font-semibold">{titleMap[mode].title}</h1>
      </div>

      {loading ? null : articles.length === 0 && topics.length === 0 ? (
        <Card className="p-10 text-center bg-muted/30 border-dashed">
          <p className="text-sm text-muted-foreground">暂无内容</p>
        </Card>
      ) : mode === "my-articles" ? (
        <div className="space-y-3">
          {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
        </div>
      ) : (
        <Tabs defaultValue="articles">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="articles">文章 ({articles.length})</TabsTrigger>
            <TabsTrigger value="topics">话题 ({topics.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="articles" className="mt-3 space-y-3">
            {articles.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">暂无</p>
            ) : (
              articles.map((a) => <ArticleCard key={a.id} article={a} />)
            )}
          </TabsContent>
          <TabsContent value="topics" className="mt-3">
            {topics.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">暂无</p>
            ) : (
              <Card>{topics.map((t) => <TopicCard key={t.id} topic={t} />)}</Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
