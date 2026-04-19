import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import type { Board, Topic, Category, Article } from "@/lib/database.types"
import { TopicCard } from "@/components/topic-card"
import { ArticleCard } from "@/components/article-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export function BoardDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const nav = useNavigate()
  const [board, setBoard] = useState<Board | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    load()
  }, [slug])

  async function load() {
    if (!slug) return
    setLoading(true)
    const { data: b } = await supabase.from("boards").select("*").eq("slug", slug).maybeSingle()
    setBoard(b)
    if (b) {
      const { data } = await supabase
        .from("topics")
        .select("*, author:profiles!topics_author_id_fkey(*), board:boards(*)")
        .eq("board_id", b.id)
        .eq("status", "published")
        .order("is_pinned", { ascending: false })
        .order("last_reply_at", { ascending: false })
      setTopics((data as Topic[]) ?? [])
    }
    setLoading(false)
  }

  if (!board && !loading) {
    return (
      <div className="px-4 pt-12 text-center">
        <p className="text-muted-foreground mb-4">板块不存在</p>
        <Button variant="outline" onClick={() => nav("/")}>返回首页</Button>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <button
        onClick={() => nav(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </button>

      {board && (
        <div>
          <h1 className="text-xl font-serif-cn font-semibold">{board.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{board.description}</p>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : topics.length === 0 ? (
        <Card className="p-10 text-center bg-muted/30">
          <p className="text-sm text-muted-foreground">该板块暂无话题</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {topics.map((t) => (
            <TopicCard key={t.id} topic={t} />
          ))}
        </Card>
      )}
    </div>
  )
}

export function CategoryDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const nav = useNavigate()
  const [category, setCategory] = useState<Category | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    load()
  }, [slug])

  async function load() {
    if (!slug) return
    setLoading(true)
    const { data: c } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle()
    setCategory(c)
    if (c) {
      const { data } = await supabase
        .from("articles")
        .select("*, author:profiles!articles_author_id_fkey(*), category:categories(*)")
        .eq("category_id", c.id)
        .eq("status", "published")
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false })
      setArticles((data as Article[]) ?? [])
    }
    setLoading(false)
  }

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <button
        onClick={() => nav(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </button>

      {category && (
        <div>
          <h1 className="text-xl font-serif-cn font-semibold">{category.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : articles.length === 0 ? (
        <Card className="p-10 text-center bg-muted/30">
          <p className="text-sm text-muted-foreground">该分类暂无文章</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {articles.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  )
}
