import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import type { Article } from "@/lib/database.types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, Trash2 } from "lucide-react"
import { toast } from "sonner"

export function DraftsPage() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [drafts, setDrafts] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      nav("/login")
      return
    }
    load()
  }, [user, nav])

  async function load() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("author_id", user.id)
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
    setDrafts((data as Article[]) ?? [])
    setLoading(false)
  }

  async function remove(id: string) {
    if (!confirm("确定要删除这份草稿吗？")) return
    const { error } = await supabase.from("articles").delete().eq("id", id)
    if (error) {
      toast.error("删除失败：" + error.message)
      return
    }
    toast.success("已删除")
    setDrafts((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <button
        onClick={() => nav(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-serif-cn font-semibold">我的草稿</h1>
        <span className="text-xs text-muted-foreground">{drafts.length} / 100</span>
      </div>

      {loading ? null : drafts.length === 0 ? (
        <Card className="p-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <p className="text-sm text-muted-foreground">还没有草稿</p>
          <Button size="sm" onClick={() => nav("/create/article")}>开始写作</Button>
        </Card>
      ) : (
        <Card className="divide-y divide-border/60">
          {drafts.map((d) => (
            <div key={d.id} className="p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <Link
                  to={`/edit/article/${d.id}`}
                  className="block font-medium text-sm hover:text-primary truncate"
                >
                  {d.title || "（未命名草稿）"}
                </Link>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {d.content.slice(0, 120) || "（空白内容）"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  上次保存：{new Date(d.updated_at).toLocaleString("zh-CN")}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => nav(`/edit/article/${d.id}`)}>
                  编辑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={() => remove(d.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> 删除
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
