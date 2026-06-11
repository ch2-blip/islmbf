import { useEffect, useState, useRef } from "react"
import { useParams, Link, useNavigate, useNavigationType } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import type { Topic, Comment } from "@/lib/database.types"
import { UserAvatar, UserNameWithBadge } from "@/components/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CommentSection } from "@/components/comment-section"
import { getCache, setCache } from "@/lib/page-cache"
import { fetchStaticTopic } from "@/lib/static-data"
import { Heart, Share2, ArrowLeft, Trash2, Pencil, Pin, Lock } from "lucide-react"
import { timeAgo } from "@/lib/hijri"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"

/** Combined snapshot: topic + comments displayed together */
type TopicSnapshot = {
  topic: Topic
  comments: Comment[]
}

export function TopicDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { user, isModerator } = useAuth()

  /* ── Combined cache hit: topic + comments appear together ── */
  const cached = id ? getCache<TopicSnapshot>(`topic-snap:${id}`) : undefined
  const [topic, setTopic] = useState<Topic | null>(cached?.topic ?? null)
  const [cachedComments, setCachedComments] = useState<Comment[]>(cached?.comments ?? [])
  const [loaded, setLoaded] = useState(!!cached)

  /* ── Interaction state (non-blocking) ── */
  const [liked, setLiked] = useState(false)

  /* Prevent duplicate RPC calls */
  const viewCounted = useRef(false)

  const navType = useNavigationType()

  useEffect(() => {
    if (!id) return
    viewCounted.current = false

    // Scroll to top only when navigating forward (PUSH), not on browser back (POP)
    if (navType !== "POP") window.scrollTo(0, 0)

    // Try combined cache for instant display
    const snap = getCache<TopicSnapshot>(`topic-snap:${id}`)
    if (snap) {
      setTopic(snap.topic)
      setCachedComments(snap.comments)
      setLoaded(true)
    } else {
      setTopic(null)
      setCachedComments([])
      setLoaded(false)
    }

    // Load topic + comments in parallel
    loadAll(id)
  }, [id])

  /* Load interactions separately after topic is ready */
  useEffect(() => {
    if (topic && id) loadInteractions(id)
  }, [topic?.id, user?.id])

  /**
   * Primary fetch — tries static JSON first, then Supabase.
   * Static JSON includes topic + comments together for sync display.
   */
  async function loadAll(topicId: string) {
    // Try static JSON if no sessionStorage cache
    const hadCache = !!getCache<TopicSnapshot>(`topic-snap:${topicId}`)
    if (!hadCache) {
      const staticSnap = await fetchStaticTopic<{ topic: Topic; comments: Comment[]; generatedAt?: string }>(topicId)
      if (staticSnap?.topic) {
        setTopic(staticSnap.topic)
        setCachedComments(staticSnap.comments ?? [])
        setLoaded(true)
        setCache<TopicSnapshot>(`topic-snap:${topicId}`, {
          topic: staticSnap.topic,
          comments: staticSnap.comments ?? [],
        }, staticSnap.topic.updated_at)
        // Background revalidate from Supabase
        revalidateFromSupabase(topicId)
        return
      }
    }

    // Fallback: Supabase query
    await revalidateFromSupabase(topicId)
  }

  /** Supabase fetch — loads topic AND comments in parallel. Both arrive together. */
  async function revalidateFromSupabase(topicId: string) {
    const [topicRes, commentsRes] = await Promise.all([
      supabase
        .from("topics")
        .select("*, author:profiles!topics_author_id_fkey(*), board:boards(*)")
        .eq("id", topicId)
        .maybeSingle(),
      supabase
        .from("comments")
        .select("*, author:profiles!comments_author_id_fkey(*)")
        .eq("target_type", "topic")
        .eq("target_id", topicId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(100),
    ])

    const t = topicRes.data as Topic | null
    const c = (commentsRes.data as Comment[]) ?? []

    if (t) {
      setTopic(t)
      setCachedComments(c)
      setLoaded(true)

      // Save combined snapshot cache
      setCache<TopicSnapshot>(`topic-snap:${topicId}`, { topic: t, comments: c }, (t as any).updated_at)

      // Fire-and-forget: increment views
      if (!viewCounted.current) {
        viewCounted.current = true
        const newCount = (t.view_count ?? 0) + 1
        setTopic({ ...t, view_count: newCount } as Topic)

        const homeCache = getCache<any>("home")
        if (homeCache?.topics) {
          const idx = homeCache.topics.findIndex((x: any) => x.id === topicId)
          if (idx !== -1) {
            homeCache.topics[idx].view_count = newCount
            setCache("home", homeCache)
          }
        }

        supabase.rpc("increment_topic_views", { topic_id: topicId })
          .then(({ error }) => { if (error) console.error(error) })
      }
    } else {
      setLoaded(true)
    }
  }

  /** Called by CommentSection after it refreshes or after user posts/deletes */
  function handleCommentsChange(comments: Comment[]) {
    setCachedComments(comments)
    // Update combined cache
    if (topic && id) {
      setCache<TopicSnapshot>(`topic-snap:${id}`, { topic, comments }, (topic as any).updated_at)
    }
  }

  async function loadInteractions(topicId: string) {
    if (!user) return
    const { data: likeData } = await supabase
      .from("reactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("target_type", "topic")
      .eq("target_id", topicId)
      .eq("reaction_type", "like")
      .maybeSingle()
    setLiked(!!likeData)
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
    if (!loaded) return <div className="px-4 pt-4 min-h-[60vh]" />
    return (
      <div className="px-4 pt-12 text-center min-h-[60vh]">
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

      {/* Comments: rendered immediately with cached data — no 300ms delay */}
      <Card className="p-5">
        <CommentSection
          targetType="topic"
          targetId={topic.id}
          initialComments={cachedComments}
          onCommentsChange={handleCommentsChange}
        />
      </Card>
    </div>
  )
}
