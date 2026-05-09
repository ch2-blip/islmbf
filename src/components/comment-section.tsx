import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Comment } from "@/lib/database.types"
import { useAuth } from "@/contexts/auth-context"
import { UserAvatar, UserNameWithBadge } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { timeAgo } from "@/lib/hijri"
import { toast } from "sonner"
import { Reply, Trash2, Flag } from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface Props {
  targetType: "article" | "topic"
  targetId: string
}

export function CommentSection({ targetType, targetId }: Props) {
  const { user, profile, isModerator } = useAuth()
  const nav = useNavigate()
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState("")
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [reportOpen, setReportOpen] = useState<Comment | null>(null)
  const [reportReason, setReportReason] = useState("")

  useEffect(() => {
    load()
  }, [targetType, targetId])

  async function load() {
    const { data } = await supabase
      .from("comments")
      .select("*, author:profiles!comments_author_id_fkey(*)")
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })
    setComments((data as Comment[]) ?? [])
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
    const { error } = await supabase.from("comments").insert({
      author_id: user.id,
      target_type: targetType,
      target_id: targetId,
      parent_id: replyTo?.id ?? null,
      content: content.trim(),
    })
    setSubmitting(false)
    if (error) {
      toast.error("发送失败：" + error.message)
      return
    }
    toast.success("评论已发送")
    setContent("")
    setReplyTo(null)
    load()
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
    load()
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
  const replies = (parentId: string) => comments.filter((c) => c.parent_id === parentId)

  return (
    <div className="space-y-4">
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

      <div className="space-y-5">
        {topLevel.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">还没有评论，来发表第一条吧</p>
        )}
        {topLevel.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            replies={replies(c.id)}
            onReply={setReplyTo}
            onDelete={deleteComment}
            onReport={setReportOpen}
            canDelete={(cc) => user?.id === cc.author_id || isModerator}
            currentUserId={user?.id}
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

function CommentItem({
  comment,
  replies,
  onReply,
  onDelete,
  onReport,
  canDelete,
  currentUserId,
}: {
  comment: Comment
  replies: Comment[]
  onReply: (c: Comment) => void
  onDelete: (id: string) => void
  onReport: (c: Comment) => void
  canDelete: (c: Comment) => boolean
  currentUserId?: string
}) {
  return (
    <div className="flex gap-3">
      <UserAvatar profile={comment.author} size="sm" className="shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <UserNameWithBadge profile={comment.author} />
          {comment.author?.is_verified_scholar && (
            <span 
              className="text-[10px] px-1.5 py-0.5 rounded text-accent-foreground"
              style={{ backgroundColor: "var(--accent-22)" }}
            >
              认证学者
            </span>
          )}
          <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
        </div>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
          {comment.content}
        </p>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <button className="hover:text-primary flex items-center gap-1" onClick={() => onReply(comment)}>
            <Reply className="h-3 w-3" /> 回复
          </button>
          {canDelete(comment) && (
            <button className="hover:text-destructive flex items-center gap-1" onClick={() => onDelete(comment.id)}>
              <Trash2 className="h-3 w-3" /> 删除
            </button>
          )}
          {currentUserId && currentUserId !== comment.author_id && (
            <button className="hover:text-destructive flex items-center gap-1" onClick={() => onReport(comment)}>
              <Flag className="h-3 w-3" /> 举报
            </button>
          )}
        </div>
        {replies.length > 0 && (
          <div className="mt-3 space-y-3 pl-4 border-l-2 border-border/60">
            {replies.map((r) => (
              <div key={r.id} className="flex gap-2.5">
                <UserAvatar profile={r.author} size="xs" className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <UserNameWithBadge profile={r.author} />
                    <span className="text-[10px] text-muted-foreground">{timeAgo(r.created_at)}</span>
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed mt-0.5">
                    {r.content}
                  </p>
                  {canDelete(r) && (
                    <button
                      className="mt-1 text-[10px] text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(r.id)}
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
