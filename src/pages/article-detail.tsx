import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import type { Article } from "@/lib/database.types"
import { UserAvatar } from "@/components/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CommentSection } from "@/components/comment-section"
import { getCache, setCache } from "@/lib/page-cache"
import { Heart, Bookmark, Share2, ArrowLeft, Trash2, Pencil } from "lucide-react"
import { timeAgo } from "@/lib/hijri"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { ArabesqueDivider } from "@/components/geometric-pattern"

export function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { user, isModerator } = useAuth()
  const cacheKey = id ? `article:${id}` : ""
  const cached = cacheKey ? getCache<Article>(cacheKey) : undefined
  const [article, setArticle] = useState<Article | null>(cached ?? null)
  const [loaded, setLoaded] = useState(!!cached)
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)

  useEffect(() => {
    if (!id) return
    const c = getCache<Article>(`article:${id}`)
    setArticle(c ?? null)
    setLoaded(!!c)
    load()
  }, [id])

  async function load() {
    if (!id) return
    const { data } = await supabase
      .from("articles")
      .select("*, author:profiles!articles_author_id_fkey(*), category:categories(*)")
      .eq("id", id)
      .maybeSingle()
    setArticle(data as Article)
    setLoaded(true)
    if (data) {
      setCache<Article>(`article:${id}`, data as Article)
      await supabase
        .from("articles")
        .update({ view_count: data.view_count + 1 })
        .eq("id", id)
    }
    if (user && data) {
      const [{ data: likeData }, { data: bmData }] = await Promise.all([
        supabase
          .from("reactions")
          .select("id")
          .eq("user_id", user.id)
          .eq("target_type", "article")
          .eq("target_id", id)
          .eq("reaction_type", "like")
          .maybeSingle(),
        supabase
          .from("reactions")
          .select("id")
          .eq("user_id", user.id)
          .eq("target_type", "article")
          .eq("target_id", id)
          .eq("reaction_type", "bookmark")
          .maybeSingle(),
      ])
      setLiked(!!likeData)
      setBookmarked(!!bmData)
    }
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
        setArticle({ ...article, like_count: Math.max(0, article.like_count - 1) })
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
        setArticle({ ...article, like_count: article.like_count + 1 })
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
    if (!loaded) return <div className="px-4 pt-4" />
    return (
      <div className="px-4 pt-12 text-center">
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
          <UserAvatar profile={article.author} size="md" />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{article.author?.username}</div>
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
        <img
          src={article.cover_image}
          alt={article.title}
          className="w-full rounded-lg mb-6 aspect-[16/9] object-cover"
        />
      )}

      {article.excerpt && (
        <p className="text-base text-muted-foreground italic border-l-2 border-accent pl-4 mb-6 font-serif-cn leading-relaxed">
          {article.excerpt}
        </p>
      )}

      <div className="prose prose-sm sm:prose-base max-w-none font-serif-cn text-foreground/90 leading-loose whitespace-pre-wrap">
        {article.content}
      </div>

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
      </div>
      </Card>

      <Card className="p-5 sm:p-6 shadow-sm">
        <CommentSection targetType="article" targetId={article.id} />
      </Card>
    </article>
  )
}
