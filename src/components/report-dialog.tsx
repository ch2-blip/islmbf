import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetType: "article" | "topic" | "comment" | "user"
  targetId: string
}

export function ReportDialog({ open, onOpenChange, targetType, targetId }: Props) {
  const { user } = useAuth()
  const nav = useNavigate()
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const labels: Record<string, string> = {
    article: "文章",
    topic: "话题",
    comment: "评论",
    user: "用户",
  }

  async function submit() {
    if (!user) {
      toast.error("请先登录")
      nav("/login")
      return
    }
    if (reason.trim().length < 2) {
      toast.error("请填写举报原因")
      return
    }
    setSubmitting(true)
    try {
      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
        reason: reason.trim(),
      })
      if (error) {
        toast.error("举报失败：" + error.message)
        return
      }
      toast.success("已提交举报，感谢您维护社区环境")
      onOpenChange(false)
      setReason("")
    } catch {
      toast.error("举报失败，请检查网络后重试")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>举报{labels[targetType] || "内容"}</DialogTitle>
          <DialogDescription>请说明您举报的原因，管理员将尽快处理</DialogDescription>
        </DialogHeader>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="如：言语不当、垃圾广告、抄袭等"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "提交中..." : "提交举报"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
