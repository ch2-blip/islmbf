import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import type { Article, Topic } from "@/lib/database.types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Search } from "lucide-react"
import { ArticleCard } from "@/components/article-card"
import { TopicCard } from "@/components/topic-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/* ── Session-level search cache ── */
type SearchCache = {
  articles: Article[]
  topics: Topic[]
  q: string
}

const CACHE_PREFIX = "search:"
const SESSION_CACHE: Map<string, SearchCache> = new Map()

function cacheKey(q: string) {
  return `${CACHE_PREFIX}${q.trim().toLowerCase()}`
}

function readCache(q: string): SearchCache | null {
  // Try in-memory first (fastest, survives re-render)
  const mem = SESSION_CACHE.get(cacheKey(q))
  if (mem) return mem
  // Fall back to sessionStorage (survives back-navigation page remount)
  try {
    const raw = sessionStorage.getItem(cacheKey(q))
    if (raw) {
      const parsed = JSON.parse(raw) as SearchCache
      SESSION_CACHE.set(cacheKey(q), parsed)
      return parsed
    }
  } catch {}
  return null
}

function writeCache(q: string, data: SearchCache) {
  SESSION_CACHE.set(cacheKey(q), data)
  try {
    sessionStorage.setItem(cacheKey(q), JSON.stringify(data))
  } catch {}
}

export function SearchPage() {
  const nav = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const urlQ = searchParams.get("q") ?? ""
  const urlTab = searchParams.get("tab") ?? "all"

  const [q, setQ] = useState(urlQ)
  const [articles, setArticles] = useState<Article[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [searching, setSearching] = useState(false)
  // revalidating = background refresh while cache already shown
  const [revalidating, setRevalidating] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [activeTab, setActiveTab] = useState(urlTab)

  // Ref to the search input — used to blur (dismiss keyboard) after search
  const inputRef = useRef<HTMLInputElement>(null)

  // Prevent stale async results from overwriting newer ones
  const currentQueryRef = useRef<string>("")

  // On mount: restore from cache immediately, then revalidate in background
  useEffect(() => {
    if (urlQ.trim().length < 2) return

    const trimmed = urlQ.trim()
    currentQueryRef.current = trimmed

    const cached = readCache(trimmed)
    if (cached) {
      // Instant display from cache — no flash of empty
      setArticles(cached.articles)
      setTopics(cached.topics)
      setHasSearched(true)
      // Quietly revalidate in background without clearing results
      setRevalidating(true)
      runSearch(trimmed, /* background */ true).finally(() => setRevalidating(false))
    } else {
      // No cache — show loading and fetch
      runSearch(trimmed, false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // only on mount

  async function runSearch(query: string, background: boolean) {
    if (!background) {
      setSearching(true)
    }
    setHasSearched(true)

    const pattern = `%${query}%`
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

    // Discard if user has already started a different query
    if (currentQueryRef.current !== query) return

    const freshArticles = (a.data as Article[]) ?? []
    const freshTopics = (t.data as Topic[]) ?? []

    // Update state — if background, only replace when results actually differ
    setArticles(freshArticles)
    setTopics(freshTopics)

    // Persist to cache
    writeCache(query, { articles: freshArticles, topics: freshTopics, q: query })

    if (!background) {
      setSearching(false)
    }
  }

  async function doSearch(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = q.trim()
    if (trimmed.length < 2) return

    currentQueryRef.current = trimmed

    // Write q (and tab if not default) to URL — creates a history entry
    // so browser back returns here with the search params intact
    const next = new URLSearchParams()
    next.set("q", trimmed)
    if (activeTab !== "all") next.set("tab", activeTab)
    setSearchParams(next, { replace: false })

    // Dismiss keyboard immediately — user doesn't need to type anymore
    inputRef.current?.blur()

    // Check cache first for instant display
    const cached = readCache(trimmed)
    if (cached) {
      setArticles(cached.articles)
      setTopics(cached.topics)
      setHasSearched(true)
      setRevalidating(true)
      await runSearch(trimmed, /* background */ true)
      setRevalidating(false)
    } else {
      await runSearch(trimmed, false)
    }
  }

  function handleTabChange(tab: string) {
    setActiveTab(tab)
    const next = new URLSearchParams(searchParams)
    if (tab === "all") {
      next.delete("tab")
    } else {
      next.set("tab", tab)
    }
    // replace: true so tab switches don't pile up in history
    setSearchParams(next, { replace: true })
  }

  const showEmpty = hasSearched && !searching && !revalidating
  const isLoading = searching && !revalidating  // true loading (no cache shown)

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <button
        onClick={() => nav(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </button>

      <form onSubmit={doSearch} className="flex gap-2">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索文章、话题..."
          className="flex-1 h-9 min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
        />
        <Button type="submit" disabled={isLoading || q.trim().length < 2}>
          {revalidating ? (
            <Search className="h-4 w-4 opacity-50 animate-pulse" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* Initial empty state — only when nothing searched yet */}
      {!hasSearched && (
        <Card className="p-10 text-center bg-muted/30 border-dashed">
          <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">输入关键词搜索文章或话题</p>
        </Card>
      )}

      {/* Loading state — only when no cache to show */}
      {isLoading && (
        <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">
          搜索中...
        </div>
      )}

      {/* Results — shown immediately from cache, updated quietly in background */}
      {hasSearched && !isLoading && (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
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
            {showEmpty && articles.length === 0 && topics.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">未找到相关结果</p>
            )}
          </TabsContent>
          <TabsContent value="articles" className="mt-4 space-y-3">
            {articles.length === 0 ? (
              showEmpty && (
                <p className="text-center text-sm text-muted-foreground py-8">未找到相关文章</p>
              )
            ) : (
              articles.map((a) => <ArticleCard key={a.id} article={a} />)
            )}
          </TabsContent>
          <TabsContent value="topics" className="mt-4">
            {topics.length === 0 ? (
              showEmpty && (
                <p className="text-center text-sm text-muted-foreground py-8">未找到相关话题</p>
              )
            ) : (
              <Card>{topics.map((t) => <TopicCard key={t.id} topic={t} />)}</Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
