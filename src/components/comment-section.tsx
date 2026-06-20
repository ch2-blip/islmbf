import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Comment } from "@/lib/database.types"
import { useAuth } from "@/contexts/auth-context"
import { UserAvatar, UserNameWithBadge } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { timeAgo } from "@/lib/hijri"
import { toast } from "sonner"
import { Reply, Trash2, Flag, ThumbsUp } from "lucide-react"
import { useNavigate, Link } from "react-router-dom"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { setCommentCountOverride } from "@/lib/page-cache"

interface Props {
  targetType: "article" | "topic"
  targetId: string
  /** The author ID of the parent article/topic — used for "楼主" label and notifications */
  authorId?: string
  /** Pre-loaded comments for instant display (used by topic-detail cache) */
  initialComments?: Comment[]
  /** Called whenever comments list changes (load, post, delete) */
  onCommentsChange?: (comments: Comment[]) => void
}

export function CommentSection({ targetType, targetId, authorId, initialComments, onCommentsChange }: Props) {
  const { user, profile, isModerator } = useAuth()
  const nav = useNavigate()
  const [comments, setComments] = useState<Comment[]>(initialComments ?? [])
  const [content, setContent] = useState("")
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [reportOpen, setReportOpen] = useState<Comment | null>(null)
  const [reportReason, setReportReason] = useState("")
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    load()
  }, [targetType, targetId])

  // Load which comments the current user has liked
  useEffect(() => {
    if (!user) return
    supabase
      .from("reactions")
      .select("target_id")
      .eq("user_id", user.id)
      .eq("target_type", "comment")
      .eq("reaction_type", "like")
      .then(({ data }) => {
        if (data) setLikedIds(new Set(data.map((r: any) => r.target_id)))
      })
  }, [user?.id])

  function updateComments(next: Comment[]) {
    setComments(next)
    onCommentsChange?.(next)
    setCommentCountOverride(targetId, next.length)
  }

  async function load() {
    const { data } = await supabase
      .from("comments")
      .select("*, author:profiles!comments_author_id_fkey(*)")
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
    const next = (data as Comment[]) ?? []
    setComments(next)
    onCommentsChange?.(next)
    setCommentCountOverride(targetId, next.length)
  }

  async function submit() {
    if (!user || !profile) {
      toast.error("请先登录")
      nav("/login")
      return
    }
    if (content.trim().length < 2) {
      toast.error("评论内容过短")
      return
    }
    setSubmitting(true)
    try {
      const { data: inserted, error } = await supabase.from("comments").insert({
        author_id: user.id,
        target_type: targetType,
        target_id: targetId,
        parent_id: replyTo?.id ?? null,
        content: content.trim(),
      }).select("*, author:profiles!comments_author_id_fkey(*)").single()
      if (error) {
        toast.error("发送失败：" + error.message)
        return
      }
      toast.success("评论已发送")

      if (inserted) {
        updateComments([inserted as Comment, ...comments])
      }

      // Send notification via RPC (requires Supabase SQL to be executed first)
      if (authorId && authorId !== user.id) {
        const label = targetType === "article" ? "文章" : "话题"
        supabase.rpc("send_comment_notification", {
          p_user_id: authorId,
          p_type: "comment",
          p_title: `${profile.username} 评论了你的${label}`,
          p_content: content.trim().slice(0, 80),
          p_link: `/${targetType === "article" ? "article" : "topic"}/${targetId}`,
        }).then(({ error: rpcErr }) => {
          if (rpcErr) console.warn("[notification]", rpcErr.message)
        })
      }

      if (replyTo && replyTo.author_id !== user.id && replyTo.author_id !== authorId) {
        supabase.rpc("send_comment_notification", {
          p_user_id: replyTo.author_id,
          p_type: "reply",
          p_title: `${profile.username} 回复了你的评论`,
          p_content: content.trim().slice(0, 80),
          p_link: `/${targetType === "article" ? "article" : "topic"}/${targetId}`,
        }).then(({ error: rpcErr }) => {
          if (rpcErr) console.warn("[notification]", rpcErr.message)
        })
      }

      setContent("")
      setReplyTo(null)
    } catch (err: any) {
      console.error("[comment-submit]", err)
      toast.error("发送失败，请检查网络后重试")
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteComment(id: string) {
    if (!confirm("确定删除这条评论？")) return
    const { error } = await supabase
      .from("comments")
      .update({ is_deleted: true })
      .eq("id", id)
    if (error) {
      toast.error("删除失败")
      return
    }
    toast.success("已删除")
    updateComments(comments.filter(c => c.id !== id))
  }

  async function toggleCommentLike(commentId: string) {
    if (!user) {
      toast.error("请先登录")
      nav("/login")
      return
    }
    const isLiked = likedIds.has(commentId)
    if (isLiked) {
      await supabase
        .from("reactions")
        .delete()
        .eq("user_id", user.id)
        .eq("target_type", "comment")
        .eq("target_id", commentId)
        .eq("reaction_type", "like")
      setLikedIds(prev => { const s = new Set(prev); s.delete(commentId); return s })
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, like_count: Math.max(0, (c.like_count || 0) - 1) } : c))
    } else {
      await supabase.from("reactions").insert({
        user_id: user.id,
        target_type: "comment",
        target_id: commentId,
        reaction_type: "like",
      })
      setLikedIds(prev => new Set(prev).add(commentId))
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, like_count: (c.like_count || 0) + 1 } : c))
    }
  }

  async function submitReport() {
    if (!reportOpen || !user) return
    if (reportReason.trim().length < 2) {
      toast.error("请填写举报原因")
      return
    }
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: "comment",
      target_id: reportOpen.id,
      reason: reportReason.trim(),
    })
    if (error) {
      toast.error("举报失败")
      return
    }
    toast.success("已提交举报，感谢您维护社区环境")
    setReportOpen(null)
    setReportReason("")
  }

  const topLevel = comments.filter((c) => !c.parent_id)
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parent_id === parentId).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

  const ownerLabel = targetType === "article" ? "作者" : "楼主"

  return (
    <div className="space-y-5">
      <h3 className="font-serif-cn text-lg font-semibold flex items-center gap-2">
        评论
        <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>
      </h3>

      {user ? (
        <div className="space-y-2">
          {replyTo && (
            <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-xs">
              <span className="text-muted-foreground">
                回复 <span className="text-primary font-medium">@{replyTo.author?.username}</span>
              </span>
              <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground">
                取消
              </button>
            </div>
          )}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享您的想法，请保持友善与尊重..."
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button onClick={submit} disabled={submitting} size="sm">
              {submitting ? "发送中..." : "发送评论"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-md bg-muted/50 p-4 text-center text-sm text-muted-foreground">
          <Button variant="link" onClick={() => nav("/login")} className="p-0 h-auto">
            登录后参与讨论
          </Button>
        </div>
      )}

      <div>
        {topLevel.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">还没有评论，来发表第一条吧</p>
        )}
        {topLevel.map((c, idx) => (
          <CommentItem
            key={c.id}
            comment={c}
            replies={getReplies(c.id)}
            onReply={setReplyTo}
            onDelete={deleteComment}
            onReport={setReportOpen}
            onToggleLike={toggleCommentLike}
            canDelete={(cc) => user?.id === cc.author_id || isModerator}
            currentUserId={user?.id}
            authorId={authorId}
            ownerLabel={ownerLabel}
            likedIds={likedIds}
            showDivider={idx > 0}
          />
        ))}
      </div>

      <Dialog open={!!reportOpen} onOpenChange={(o) => !o && setReportOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>举报评论</DialogTitle>
            <DialogDescription>请说明您举报的原因，管理员将尽快处理</DialogDescription>
          </DialogHeader>
          <Input
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="如：言语不当、垃圾广告等"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(null)}>取消</Button>
            <Button onClick={submitReport}>提交举报</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ── Owner badge style ──
 * Use inline style with explicit hex colors to avoid Tailwind oklch/color-mix
 * issues on mobile browsers (QQ, Baidu) where bg-primary/10 renders as solid block.
 */
const ownerBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  fontSize: "11px",
  lineHeight: "1",
  padding: "2px 8px",
  borderRadius: "4px",
  backgroundColor: "#dcfce7",
  color: "#166534",
  fontWeight: 600,
  whiteSpace: "nowrap",
  border: "1px solid #bbf7d0",
  letterSpacing: "0.02em",
}

function CommentItem({
  comment,
  replies,
  onReply,
  onDelete,
  onReport,
  onToggleLike,
  canDelete,
  currentUserId,
  authorId,
  ownerLabel,
  likedIds,
  showDivider,
}: {
  comment: Comment
  replies: Comment[]
  onReply: (c: Comment) => void
  onDelete: (id: string) => void
  onReport: (c: Comment) => void
  onToggleLike: (id: string) => void
  canDelete: (c: Comment) => boolean
  currentUserId?: string
  authorId?: string
  ownerLabel: string
  likedIds: Set<string>
  showDivider: boolean
}) {
  const isLiked = likedIds.has(comment.id)
  const isOwner = !!authorId && comment.author_id === authorId

  return (
    <>
      {showDivider && <div className="border-t border-border/50" />}
      <div className="py-6">
        <div className="flex gap-3.5">
          {comment.author?.username ? (
            <Link to={`/user/${comment.author.username}`} className="shrink-0 mt-0.5">
              <UserAvatar profile={comment.author} size="sm" />
            </Link>
          ) : (
            <UserAvatar profile={comment.author} size="sm" className="shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            {/* Author info */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {comment.author?.username ? (
                <Link to={`/user/${comment.author.username}`} className="hover:underline">
                  <UserNameWithBadge profile={comment.author} />
                </Link>
              ) : (
                <UserNameWithBadge profile={comment.author} />
              )}
              {isOwner && (
                <span style={ownerBadgeStyle}>{ownerLabel}</span>
              )}
              {comment.author?.is_verified_scholar && (
                <span
                  className="inline-flex items-center text-[10px] leading-none px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: "var(--accent-22)", color: "var(--accent-foreground)" }}
                >
                  认证学者
                </span>
              )}
              <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
            </div>

            {/* Comment content — main reading area */}
            <div className="mb-5">
              <p
                className="text-[15px] whitespace-pre-wrap break-words leading-[1.85]"
                style={{ fontFamily: "var(--font-reading)", color: "#333" }}
              >
                {comment.content}
              </p>
            </div>

            {/* Action buttons — light, small, right-aligned, separated from content */}
            <div className="flex items-center justify-end gap-4 text-[11px]" style={{ color: "rgba(0,0,0,0.38)" }}>
              <button
                className={`flex items-center gap-1 transition-colors ${isLiked ? "text-primary" : "hover:text-primary"}`}
                style={isLiked ? {} : { color: "inherit" }}
                onClick={() => onToggleLike(comment.id)}
              >
                <ThumbsUp className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`} />
                {(comment.like_count || 0) > 0 ? comment.like_count : "点赞"}
              </button>
              <button className="flex items-center gap-1 hover:text-primary transition-colors" style={{ color: "inherit" }} onClick={() => onReply(comment)}>
                <Reply className="h-3.5 w-3.5" /> 回复
              </button>
              {canDelete(comment) && (
                <button className="flex items-center gap-1 hover:text-destructive transition-colors" style={{ color: "inherit" }} onClick={() => onDelete(comment.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> 删除
                </button>
              )}
              {currentUserId && currentUserId !== comment.author_id && (
                <button className="flex items-center gap-1 hover:text-destructive transition-colors" style={{ color: "inherit" }} onClick={() => onReport(comment)}>
                  <Flag className="h-3.5 w-3.5" /> 举报
                </button>
              )}
            </div>

            {/* Replies */}
            {replies.length > 0 && (
              <div className="mt-5 space-y-0 pl-4 border-l-2 border-border/50">
                {replies.map((r) => {
                  const replyIsOwner = !!authorId && r.author_id === authorId
                  return (
                    <div key={r.id} className="flex gap-2.5 py-3.5">
                      {r.author?.username ? (
                        <Link to={`/user/${r.author.username}`} className="shrink-0 mt-0.5">
                          <UserAvatar profile={r.author} size="xs" />
                        </Link>
                      ) : (
                        <UserAvatar profile={r.author} size="xs" className="shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                          {r.author?.username ? (
                            <Link to={`/user/${r.author.username}`} className="hover:underline">
                              <UserNameWithBadge profile={r.author} />
                            </Link>
                          ) : (
                            <UserNameWithBadge profile={r.author} />
                          )}
                          {replyIsOwner && (
                            <span style={ownerBadgeStyle}>{ownerLabel}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground">{timeAgo(r.created_at)}</span>
                        </div>
                        <p
                          className="text-sm whitespace-pre-wrap break-words leading-[1.75] mt-0.5"
                          style={{ fontFamily: "var(--font-reading)", color: "#444" }}
                        >
                          {r.content}
                        </p>
                        <div className="mt-2.5 flex items-center justify-end gap-3 text-[11px]" style={{ color: "rgba(0,0,0,0.35)" }}>
                          <button className="hover:text-primary flex items-center gap-1" style={{ color: "inherit" }} onClick={() => onReply(r)}>
                            <Reply className="h-3 w-3" /> 回复
                          </button>
                          {canDelete(r) && (
                            <button className="hover:text-destructive flex items-center gap-1" style={{ color: "inherit" }} onClick={() => onDelete(r.id)}>
                              <Trash2 className="h-3 w-3" /> 删除
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
