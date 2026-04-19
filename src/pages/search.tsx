import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import type { Article, Topic } from "@/lib/database.types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Search } from "lucide-react"
import { ArticleCard } from "@/components/article-card"
import { TopicCard } from "@/components/topic-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function SearchPage() {
  const nav = useNavigate()
  const [q, setQ] = useState("")
  const [articles, setArticles] = useState<Article[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  async function doSearch(e?: React.FormEvent) {
    e?.preventDefault()
    if (q.trim().length < 2) return
    setSearching(true)
    setHasSearched(true)
    const pattern = `%${q.trim()}%`
    const [a, t] = await Promise.all([
      supabase
        .from("articles")
        .select("*, author:profiles!articles_author_id_fkey(*), category:categories(*)")
        .eq("status", "published")
        .or(`title.ilike.${pattern},content.ilike.${pattern}`)
        .limit(20),
      supabase
        .from("topics")
        .select("*, author:profiles!topics_author_id_fkey(*), board:boards(*)")
        .eq("status", "published")
        .or(`title.ilike.${pattern},content.ilike.${pattern}`)
        .limit(30),
    ])
    setArticles((a.data as Article[]) ?? [])
    setTopics((t.data as Topic[]) ?? [])
    setSearching(false)
  }

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <button
        onClick={() => nav(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </button>

      <form onSubmit={doSearch} className="flex gap-2">
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索文章、话题..."
          className="flex-1"
        />
        <Button type="submit" disabled={searching || q.trim().length < 2}>
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {!hasSearched && (
        <Card className="p-10 text-center bg-muted/30 border-dashed">
          <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">输入关键词搜索文章或话题</p>
        </Card>
      )}

      {hasSearched && (
        <Tabs defaultValue="all">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="all">综合 ({articles.length + topics.length})</TabsTrigger>
            <TabsTrigger value="articles">文章 ({articles.length})</TabsTrigger>
            <TabsTrigger value="topics">话题 ({topics.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4 space-y-3">
            {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
            {topics.length > 0 && (
              <Card>{topics.map((t) => <TopicCard key={t.id} topic={t} />)}</Card>
            )}
            {articles.length === 0 && topics.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">未找到相关结果</p>
            )}
          </TabsContent>
          <TabsContent value="articles" className="mt-4 space-y-3">
            {articles.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">未找到相关文章</p>
            ) : (
              articles.map((a) => <ArticleCard key={a.id} article={a} />)
            )}
          </TabsContent>
          <TabsContent value="topics" className="mt-4">
            {topics.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">未找到相关话题</p>
            ) : (
              <Card>{topics.map((t) => <TopicCard key={t.id} topic={t} />)}</Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
