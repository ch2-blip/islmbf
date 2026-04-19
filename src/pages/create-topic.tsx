import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import type { Board } from "@/lib/database.types"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { ArrowLeft, MessagesSquare } from "lucide-react"

export function CreateTopicPage() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const nav = useNavigate()
  const { user } = useAuth()
  const [boards, setBoards] = useState<Board[]>([])
  const [title, setTitle] = useState("")
  const [boardId, setBoardId] = useState<string>("")
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) {
      nav("/login")
      return
    }
    supabase
      .from("boards")
      .select("*")
      .order("sort_order")
      .then(({ data }) => setBoards(data ?? []))
    if (isEdit && id) {
      supabase
        .from("topics")
        .select("*")
        .eq("id", id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setTitle(data.title)
            setBoardId(data.board_id ?? "")
            setContent(data.content)
          }
        })
    }
  }, [user, id, isEdit, nav])

  async function submit() {
    if (!user) return
    if (title.trim().length < 3) {
      toast.error("标题至少 3 个字符")
      return
    }
    setSubmitting(true)

    const payload = {
      title: title.trim(),
      board_id: boardId || null,
      content: content.trim(),
      status: "published" as const,
    }

    if (isEdit && id) {
      const { error } = await supabase.from("topics").update(payload).eq("id", id)
      setSubmitting(false)
      if (error) {
        toast.error("保存失败：" + error.message)
        return
      }
      toast.success("已更新")
      nav(`/topic/${id}`)
    } else {
      const { data, error } = await supabase
        .from("topics")
        .insert({ ...payload, author_id: user.id })
        .select()
        .single()
      setSubmitting(false)
      if (error || !data) {
        toast.error("发布失败：" + (error?.message ?? ""))
        return
      }
      toast.success("话题已发布")
      nav(`/topic/${data.id}`)
    }
  }

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <button
        onClick={() => nav(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </button>

      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 text-accent-foreground">
          <MessagesSquare className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-lg font-serif-cn font-semibold">{isEdit ? "编辑话题" : "发帖子"}</h1>
          <p className="text-xs text-muted-foreground">轻松聊聊，分享日常</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>板块</Label>
          <Select value={boardId} onValueChange={setBoardId}>
            <SelectTrigger>
              <SelectValue placeholder="选择一个板块" />
            </SelectTrigger>
            <SelectContent>
              {boards.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">标题</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="想和大家聊点什么？"
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">内容（可选）</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="更详细地描述一下..."
            rows={8}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => nav(-1)} disabled={submitting}>
            取消
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "发布中..." : isEdit ? "保存修改" : "发布"}
          </Button>
        </div>
      </div>
    </div>
  )
}
