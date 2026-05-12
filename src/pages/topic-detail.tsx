import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import type { Topic } from "@/lib/database.types"
import { UserAvatar, UserNameWithBadge } from "@/components/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CommentSection } from "@/components/comment-section"
import { getCache, setCache } from "@/lib/page-cache"
import { Heart, Share2, ArrowLeft, Trash2, Pencil, Pin, Lock } from "lucide-react"
import { timeAgo } from "@/lib/hijri"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"

export function TopicDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { user, isModerator } = useAuth()
  const cached = id ? getCache<Topic>(`topic:${id}`) : undefined
  const [topic, setTopic] = useState<Topic | null>(cached ?? null)
  const [loaded, setLoaded] = useState(!!cached)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    if (!id) return
    const c = getCache<Topic>(`topic:${id}`)
    setTopic(c ?? null)
    setLoaded(!!c)
    load()
  }, [id])

  async function load() {
    if (!id) return
    const { data } = await supabase
      .from("topics")
      .select("*, author:profiles!topics_author_id_fkey(*), board:boards(*)")
      .eq("id", id)
      .maybeSingle()
    if (data) {
      const optimisticTopic = { ...data, view_count: data.view_count + 1 } as Topic
      setTopic(optimisticTopic)
      setLoaded(true)
      setCache<Topic>(`topic:${id}`, optimisticTopic)
      
      const homeCache = getCache<any>("home")
      if (homeCache && homeCache.topics) {
        const idx = homeCache.topics.findIndex((t: any) => t.id === id)
        if (idx !== -1) {
          homeCache.topics[idx].view_count = optimisticTopic.view_count
          setCache("home", homeCache)
        }
      }

      await supabase.rpc("increment_topic_views", { topic_id: id })
    }
    if (user && data) {
      const { data: likeData } = await supabase
        .from("reactions")
        .select("id")
        .eq("user_id", user.id)
        .eq("target_type", "topic")
        .eq("target_id", id)
        .eq("reaction_type", "like")
        .maybeSingle()
      setLiked(!!likeData)
    }
  }

  async function toggleLike() {
    if (!user || !topic) {
      toast.error("请先登录")
      return
    }
    if (liked) {
      await supabase
        .from("reactions")
        .delete()
        .eq("user_id", user.id)
        .eq("target_type", "topic")
        .eq("target_id", topic.id)
        .eq("reaction_type", "like")
      setLiked(false)
      await supabase
        .from("topics")
        .update({ like_count: Math.max(0, topic.like_count - 1) })
        .eq("id", topic.id)
      setTopic({ ...topic, like_count: Math.max(0, topic.like_count - 1) })
    } else {
      await supabase.from("reactions").insert({
        user_id: user.id,
        target_type: "topic",
        target_id: topic.id,
        reaction_type: "like",
      })
      setLiked(true)
      await supabase
        .from("topics")
        .update({ like_count: topic.like_count + 1 })
        .eq("id", topic.id)
      setTopic({ ...topic, like_count: topic.like_count + 1 })
    }
  }

  async function deleteTopic() {
    if (!topic) return
    if (!confirm("确定删除这个话题？")) return
    await supabase.from("topics").delete().eq("id", topic.id)
    toast.success("已删除")
    nav("/")
  }

  function share() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: topic?.title, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
      toast.success("链接已复制")
    }
  }

  if (!topic) {
    if (!loaded) return <div className="px-4 pt-4" />
    return (
      <div className="px-4 pt-12 text-center">
        <p className="text-muted-foreground mb-4">话题不存在或已删除</p>
        <Button variant="outline" onClick={() => nav("/")}>返回首页</Button>
      </div>
    )
  }

  const canEdit = user?.id === topic.author_id || isModerator

  return (
    <div className="px-4 pt-4 pb-8 space-y-5">
      <button
        onClick={() => nav(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </button>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {topic.is_pinned && <Pin className="h-4 w-4 text-accent fill-accent/30" />}
          {topic.is_closed && <Lock className="h-4 w-4 text-muted-foreground" />}
          {topic.board && (
            <Link to={`/board/${topic.board.slug}`}>
              <Badge variant="secondary">{topic.board.name}</Badge>
            </Link>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-semibold leading-tight mb-4 font-serif-cn">
          {topic.title}
        </h1>

        <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-border/60">
          <Link to={`/user/${topic.author?.username}`} className="flex items-center gap-2.5 min-w-0">
            <UserAvatar profile={topic.author} size="sm" className="shrink-0" />
            <div className="min-w-0">
              <UserNameWithBadge profile={topic.author} className="text-sm" />
              <div className="text-xs text-muted-foreground">
                {timeAgo(topic.created_at)} · {topic.view_count} 浏览
              </div>
            </div>
          </Link>
          {canEdit && (
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => nav(`/edit/topic/${topic.id}`)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={deleteTopic}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>

        <div className="text-[15px] text-foreground whitespace-pre-wrap leading-relaxed">
          {topic.content}
        </div>

        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border/60">
          <Button
            variant={liked ? "default" : "outline"}
            size="sm"
            onClick={toggleLike}
            className="gap-1.5"
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            {topic.like_count > 0 ? topic.like_count : "点赞"}
          </Button>
          <Button variant="outline" size="sm" onClick={share} className="gap-1.5">
            <Share2 className="h-4 w-4" />
            分享
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <CommentSection targetType="topic" targetId={topic.id} />
      </Card>
    </div>
  )
}
