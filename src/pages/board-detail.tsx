import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import type { Board, Topic, Category, Article } from "@/lib/database.types"
import { TopicCard } from "@/components/topic-card"
import { ArticleCard } from "@/components/article-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getCache, setCache } from "@/lib/page-cache"

type BoardCache = { board: Board | null; topics: Topic[] }

export function BoardDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const nav = useNavigate()
  const cached = slug ? getCache<BoardCache>(`board:${slug}`) : undefined
  const [board, setBoard] = useState<Board | null>(cached?.board ?? null)
  const [topics, setTopics] = useState<Topic[]>(cached?.topics ?? [])
  const [loaded, setLoaded] = useState(!!cached)

  useEffect(() => {
    if (!slug) return
    const c = getCache<BoardCache>(`board:${slug}`)
    setBoard(c?.board ?? null)
    setTopics(c?.topics ?? [])
    setLoaded(!!c)
    load()
  }, [slug])

  async function load() {
    if (!slug) return
    const { data: b } = await supabase.from("boards").select("*").eq("slug", slug).maybeSingle()
    setBoard(b)
    let nextTopics: Topic[] = []
    if (b) {
      const { data } = await supabase
        .from("topics")
        .select("*, author:profiles!topics_author_id_fkey(*), board:boards(*)")
        .eq("board_id", b.id)
        .eq("status", "published")
        .order("is_pinned", { ascending: false })
        .order("last_reply_at", { ascending: false })
      nextTopics = (data as Topic[]) ?? []
      setTopics(nextTopics)
    }
    setLoaded(true)
    setCache<BoardCache>(`board:${slug}`, { board: b, topics: nextTopics })
  }

  if (!board && loaded) {
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

      {topics.length === 0 ? (
        loaded ? (
          <Card className="p-10 text-center bg-muted/30">
            <p className="text-sm text-muted-foreground">该板块暂无话题</p>
          </Card>
        ) : null
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

type CategoryCache = { category: Category | null; articles: Article[] }

export function CategoryDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const nav = useNavigate()
  const cached = slug ? getCache<CategoryCache>(`category:${slug}`) : undefined
  const [category, setCategory] = useState<Category | null>(cached?.category ?? null)
  const [articles, setArticles] = useState<Article[]>(cached?.articles ?? [])
  const [loaded, setLoaded] = useState(!!cached)
  useEffect(() => {
    if (!slug) return
    const c = getCache<CategoryCache>(`category:${slug}`)
    setCategory(c?.category ?? null)
    setArticles(c?.articles ?? [])
    setLoaded(!!c)
    load()
  }, [slug])

  async function load() {
    if (!slug) return
    const { data: c } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle()
    setCategory(c)
    let nextArticles: Article[] = []
    if (c) {
      const { data } = await supabase
        .from("articles")
        .select("*, author:profiles!articles_author_id_fkey(*), category:categories(*)")
        .eq("category_id", c.id)
        .eq("status", "published")
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false })
      nextArticles = (data as Article[]) ?? []
      setArticles(nextArticles)
    }
    setLoaded(true)
    setCache<CategoryCache>(`category:${slug}`, { category: c, articles: nextArticles })
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

      {articles.length === 0 ? (
        loaded ? (
          <Card className="p-10 text-center bg-muted/30">
            <p className="text-sm text-muted-foreground">该分类暂无文章</p>
          </Card>
        ) : null
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
