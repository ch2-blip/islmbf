import { useEffect, useState, useRef } from "react"
import { useParams, Link, useNavigate, useNavigationType } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import type { Article } from "@/lib/database.types"
import { UserAvatar, UserNameWithBadge } from "@/components/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CommentSection } from "@/components/comment-section"
import { getCache, setCache } from "@/lib/page-cache"
import { fetchStaticArticle } from "@/lib/static-data"
import { Heart, Bookmark, Share2, ArrowLeft, Trash2, Pencil, Flag } from "lucide-react"
import { timeAgo } from "@/lib/hijri"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { ArabesqueDivider } from "@/components/geometric-pattern"
import { detailThumb } from "@/lib/image-proxy"
import { ReportDialog } from "@/components/report-dialog"

export function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { user, isModerator } = useAuth()

  /* ── State ── */
  const [article, _setArticle] = useState<Article | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [contentSource, setContentSource] = useState("")

  /* Refs */
  const viewCounted = useRef(false)
  const currentIdRef = useRef<string | null>(null)
  const contentRef = useRef<string>("")   // last known good content

  const navType = useNavigationType()

  /**
   * SAFE setArticle — the core protection against empty-content overwrites.
   *
   * Rules:
   * 1. If newArticle has content → accept it, update contentRef
   * 2. If newArticle has NO content but contentRef has content for SAME article
   *    → patch content from contentRef before setting state (preserve body)
   * 3. Never allow a content-bearing article to be replaced by content-empty data
   */
  function safeSetArticle(newArticle: Article | null, source: string) {
    if (!newArticle) {
      console.warn(`[article] safeSetArticle(null) from ${source}`)
      _setArticle(null)
      return
    }

    const newContent = newArticle.content
    const hasContent = typeof newContent === "string" && newContent.trim().length > 0

    if (hasContent) {
      contentRef.current = newContent
      setContentSource(source)
      console.warn(`[article] ✅ setArticle from ${source} id=${newArticle.id} contentLen=${newContent.length}`)
      _setArticle(newArticle)
    } else {
      // New data lacks content — try to preserve existing content
      if (contentRef.current && currentIdRef.current === newArticle.id) {
        console.warn(`[article] ⚠️ REJECTED empty content from ${source} id=${newArticle.id}, preserving existing content (len=${contentRef.current.length})`)
        _setArticle({ ...newArticle, content: contentRef.current })
      } else {
        console.warn(`[article] ⚠️ ${source} has no content, no previous content to preserve id=${newArticle.id}`)
        _setArticle(newArticle)
        setContentSource(source + " (no-content)")
      }
    }
  }

  useEffect(() => {
    if (!id) return

    currentIdRef.current = id
    viewCounted.current = false
    contentRef.current = ""  // reset for new article

    if (navType !== "POP") window.scrollTo(0, 0)

    // Try cache — but ONLY accept if it has content
    const c = getCache<Article>(`article:${id}`)
    if (c) {
      const cContent = (c as any).content
      const cHasContent = typeof cContent === "string" && cContent.trim().length > 0
      console.warn(`[article] Cache hit for ${id} hasContent=${cHasContent} contentLen=${cContent?.length ?? 0}`)
      if (cHasContent) {
        safeSetArticle(c, "cache")
        setLoaded(true)
      } else {
        // Cache exists but has no content — ignore it for display, still fetch
        console.warn(`[article] Cache for ${id} has NO content — ignoring, will fetch fresh`)
        _setArticle(null)
        setLoaded(false)
      }
    } else {
      _setArticle(null)
      setLoaded(false)
    }

    loadArticle(id)

    setShowComments(false)
    const t = setTimeout(() => setShowComments(true), 300)
    return () => clearTimeout(t)
  }, [id])

  /* Load interactions separately after article is ready */
  useEffect(() => {
    if (article && id) {
      loadInteractions(id)
    }
  }, [article?.id, user?.id])

  /**
   * Primary fetch — tries static JSON first, then Supabase.
   * Static JSON gives instant display for first-time visitors.
   *
   * IMPORTANT: After every await, we check currentIdRef to ensure the user
   * hasn't navigated to a different article while we were waiting.
   */
  async function loadArticle(articleId: string) {
    // Check cache content status (cache may have been populated without content)
    const cachedArticle = getCache<Article>(`article:${articleId}`)
    const cacheHasContent = cachedArticle && typeof cachedArticle.content === "string" && cachedArticle.content.trim().length > 0
    console.warn(`[article] loadArticle ${articleId} cacheHasContent=${cacheHasContent}`)

    // Always try static JSON first if cache doesn't have content
    if (!cacheHasContent) {
      const staticArticle = await fetchStaticArticle<Article>(articleId)

      if (currentIdRef.current !== articleId) {
        console.warn(`[article] Discarding stale static JSON for ${articleId}`)
        return
      }

      if (staticArticle) {
        const content = (staticArticle as any).content as string | undefined
        const hasContent = typeof content === "string" && content.trim().length > 0
        console.warn(`[article] Static JSON hit ${articleId} hasContent=${hasContent} len=${content?.length ?? 0}`)

        if (hasContent) {
          safeSetArticle(staticArticle, "static-json")
          setLoaded(true)
          setCache<Article>(`article:${articleId}`, staticArticle, staticArticle.updated_at)
          revalidateFromSupabase(articleId)
          return
        } else {
          console.warn(`[article] Static JSON for ${articleId} has empty content, falling back to Supabase`)
        }
      } else {
        console.warn(`[article] Static JSON miss for ${articleId}, falling back to Supabase`)
      }
    }

    await revalidateFromSupabase(articleId)
  }

  /** Supabase fetch — used as primary or background revalidation */
  async function revalidateFromSupabase(articleId: string) {
    const { data } = await supabase
      .from("articles")
      .select("*, author:profiles!articles_author_id_fkey(*), category:categories(*)")
      .eq("id", articleId)
      .maybeSingle()

    if (currentIdRef.current !== articleId) {
      console.warn(`[article] Discarding stale Supabase response for ${articleId}`)
      return
    }

    if (data) {
      const contentLen = ((data as any).content as string | undefined)?.length ?? 0
      console.warn(`[article] Supabase hit ${articleId} contentLen=${contentLen}`)

      safeSetArticle(data as Article, "supabase")
      setLoaded(true)
      // Only cache if data has content
      if (contentLen > 0) {
        setCache<Article>(`article:${articleId}`, data as Article, (data as any).updated_at)
      }

      if (!viewCounted.current) {
        viewCounted.current = true
        const newCount = (data.view_count ?? 0) + 1
        const withView = { ...data, view_count: newCount } as Article

        if (currentIdRef.current === articleId) {
          safeSetArticle(withView, "supabase-view")
          if (contentLen > 0) {
            setCache<Article>(`article:${articleId}`, withView, (data as any).updated_at)
          }

          const homeCache = getCache<{ articles: Article[], topics: any[], announcement: any }>("home")
          if (homeCache?.articles) {
            homeCache.articles = homeCache.articles.map(a =>
              a.id === articleId ? { ...a, view_count: newCount } : a
            )
            setCache("home", homeCache)
          }
        }

        supabase.rpc("increment_article_views", { article_id: articleId })
          .then(({ error }) => { if (error) console.error(error) })
      }
    } else {
      console.warn(`[article] Supabase returned null for ${articleId}`)
      if (currentIdRef.current === articleId) {
        setLoaded(true)
      }
    }
  }

  /**
   * Secondary fetch — loads like/bookmark status AFTER article renders.
   * Completely non-blocking for article content.
   */
  async function loadInteractions(articleId: string) {
    if (!user) return
    const [{ data: likeData }, { data: bmData }] = await Promise.all([
      supabase
        .from("reactions")
        .select("id")
        .eq("user_id", user.id)
        .eq("target_type", "article")
        .eq("target_id", articleId)
        .eq("reaction_type", "like")
        .maybeSingle(),
      supabase
        .from("reactions")
        .select("id")
        .eq("user_id", user.id)
        .eq("target_type", "article")
        .eq("target_id", articleId)
        .eq("reaction_type", "bookmark")
        .maybeSingle(),
    ])
    setLiked(!!likeData)
    setBookmarked(!!bmData)
  }

  async function toggleReaction(type: "like" | "bookmark") {
    if (!user || !article) {
      toast.error("请先登录")
      return
    }
    const current = type === "like" ? liked : bookmarked
    if (current) {
      await supabase
        .from("reactions")
        .delete()
        .eq("user_id", user.id)
        .eq("target_type", "article")
        .eq("target_id", article.id)
        .eq("reaction_type", type)
      if (type === "like") {
        setLiked(false)
        await supabase
          .from("articles")
          .update({ like_count: Math.max(0, article.like_count - 1) })
          .eq("id", article.id)
        safeSetArticle({ ...article, like_count: Math.max(0, article.like_count - 1) }, "like-remove")
      } else {
        setBookmarked(false)
      }
    } else {
      await supabase.from("reactions").insert({
        user_id: user.id,
        target_type: "article",
        target_id: article.id,
        reaction_type: type,
      })
      if (type === "like") {
        setLiked(true)
        await supabase
          .from("articles")
          .update({ like_count: article.like_count + 1 })
          .eq("id", article.id)
        safeSetArticle({ ...article, like_count: article.like_count + 1 }, "like-add")
      } else {
        setBookmarked(true)
        toast.success("已收藏")
      }
    }
  }

  async function deleteArticle() {
    if (!article) return
    if (!confirm("确定删除这篇文章？此操作不可撤销")) return
    const { error } = await supabase.from("articles").delete().eq("id", article.id)
    if (error) {
      toast.error("删除失败")
      return
    }
    toast.success("已删除")
    nav("/")
  }

  function share() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: article?.title, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
      toast.success("链接已复制")
    }
  }

  if (!article) {
    if (!loaded) return <div className="px-4 pt-4 min-h-[60vh]" />
    return (
      <div className="px-4 pt-12 text-center min-h-[60vh]">
        <p className="text-muted-foreground mb-4">文章不存在或已删除</p>
        <Button variant="outline" onClick={() => nav("/")}>返回首页</Button>
      </div>
    )
  }

  const canEdit = user?.id === article.author_id || isModerator

  return (
    <article className="px-4 pt-4 pb-8 space-y-4">
      <button
        onClick={() => nav(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </button>

      <Card className="p-5 sm:p-7 shadow-sm">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {article.category && (
          <Badge variant="outline" className="border-primary/30 text-primary">
            {article.category.name}
          </Badge>
        )}
        {article.is_featured && <Badge className="bg-accent text-accent-foreground border-0">精选</Badge>}
      </div>

      <h1 className="font-serif-cn text-2xl sm:text-3xl font-bold leading-tight text-foreground mb-4">
        {article.title}
      </h1>

      <div className="flex items-center justify-between gap-4 pb-5 mb-5 border-b border-border/60">
        <Link to={`/user/${article.author?.username}`} className="flex items-center gap-2.5 min-w-0">
          <UserAvatar profile={article.author} size="md" className="shrink-0" />
          <div className="min-w-0">
            <UserNameWithBadge profile={article.author} className="text-sm" />
            <div className="text-xs text-muted-foreground">
              发布于 {timeAgo(article.published_at)} · {article.view_count} 阅读
            </div>
          </div>
        </Link>
        {canEdit && (
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => nav(`/edit/article/${article.id}`)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={deleteArticle}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>

      {article.cover_image && (
        <div className="mb-6 overflow-hidden rounded-lg bg-muted">
          <img
            src={detailThumb(article.cover_image)}
            alt={article.title}
            className="block w-full h-auto max-h-[85vh] object-contain"
            loading="lazy"
          />
        </div>
      )}

      {article.video_url && (
        <div className="mb-6 overflow-hidden rounded-lg bg-foreground/90 ring-1 ring-border/60">
          <video
            src={article.video_url}
            controls
            playsInline
            preload="metadata"
            poster={article.cover_image || undefined}
            className="block w-full h-auto max-h-[85vh] bg-foreground"
          />
        </div>
      )}

      {article.excerpt_enabled && article.excerpt && (
        <p className="text-base text-muted-foreground italic border-l-2 border-accent pl-4 mb-6 font-serif-cn leading-relaxed whitespace-pre-wrap">
          {article.excerpt}
        </p>
      )}

      <div className="reading-body max-w-none whitespace-pre-wrap">
        {article.content ? (
          article.content
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p>正文加载中…</p>
            <button onClick={() => { contentRef.current = ""; loadArticle(article.id) }} className="mt-3 text-sm text-primary underline">点击重试</button>
          </div>
        )}
      </div>
      {/* Debug info — only visible in development */}
      {import.meta.env.DEV && (
        <div className="text-[10px] text-muted-foreground/40 mt-1 text-right select-none">
          content: {article.content?.length ?? 0} chars · source: {contentSource}
        </div>
      )}

      <ArabesqueDivider className="my-8" />

      <div className="flex items-center justify-center gap-2">
        <Button
          variant={liked ? "default" : "outline"}
          size="sm"
          onClick={() => toggleReaction("like")}
          className="gap-1.5"
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          {article.like_count > 0 ? article.like_count : "点赞"}
        </Button>
        <Button
          variant={bookmarked ? "default" : "outline"}
          size="sm"
          onClick={() => toggleReaction("bookmark")}
          className="gap-1.5"
        >
          <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
          {bookmarked ? "已收藏" : "收藏"}
        </Button>
        <Button variant="outline" size="sm" onClick={share} className="gap-1.5">
          <Share2 className="h-4 w-4" />
          分享
        </Button>
        {user && user.id !== article.author_id && (
          <Button variant="ghost" size="sm" onClick={() => setReportOpen(true)} className="gap-1.5 text-muted-foreground">
            <Flag className="h-4 w-4" />
            举报
          </Button>
        )}
      </div>
      </Card>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="article"
        targetId={article.id}
      />

      {/* Comments: deferred mount — does NOT block article content */}
      {showComments && (
        <Card className="p-5 sm:p-6 shadow-sm">
          <CommentSection
            targetType="article"
            targetId={article.id}
            authorId={article.author_id}
            onCommentsChange={(cmts) => {
              const newCount = cmts.length
              if (newCount !== article.comment_count) {
                const updated = { ...article, comment_count: newCount }
                safeSetArticle(updated, "comment-count")
                setCache<Article>(`article:${article.id}`, updated, article.updated_at)
                // Also update home cache
                const homeCache = getCache<{ articles: Article[], topics: any[], announcement: any }>("home")
                if (homeCache?.articles) {
                  homeCache.articles = homeCache.articles.map(a =>
                    a.id === article.id ? { ...a, comment_count: newCount } : a
                  )
                  setCache("home", homeCache)
                }
              }
            }}
          />
        </Card>
      )}
    </article>
  )
}
