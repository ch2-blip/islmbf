import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import type { Article, Topic, Report, Announcement, SensitiveWord, Category, Board } from "@/lib/database.types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { ArrowLeft, Shield, Users, Flag, Megaphone, TriangleAlert as AlertTriangle, FileText, MessageSquare, Plus, Trash2, Settings2 } from "lucide-react"
import { timeAgo } from "@/lib/hijri"
import { SiteSettingsPanel } from "./admin-site-panel"
import { UsersPanelFull } from "./admin-users-panel"
import { UserStatsPanel } from "./admin-user-stats"
import { notifyReportsSeen } from "@/lib/admin-badge"

export function AdminPage() {
  const { isAdmin, isModerator } = useAuth()
  const nav = useNavigate()
  const [adminTab, setAdminTab] = useState("reports")

  useEffect(() => {
    if (!isModerator) {
      toast.error("无权访问")
      nav("/")
    }
  }, [isModerator, nav])

  // Clear report badge when reports tab is active
  useEffect(() => {
    if (adminTab === "reports" && isModerator) {
      notifyReportsSeen()
    }
  }, [adminTab, isModerator])

  if (!isModerator) return null

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <button
        onClick={() => nav(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </button>

      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-serif-cn font-semibold">管理后台</h1>
      </div>

      <Tabs value={adminTab} onValueChange={setAdminTab}>
        <TabsList className="w-full grid grid-cols-4 sm:grid-cols-7 h-auto">
          <TabsTrigger value="reports" className="text-xs py-2">
            <Flag className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">举报</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="text-xs py-2">
            <FileText className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">内容</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs py-2" disabled={!isAdmin}>
            <Users className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">用户</span>
          </TabsTrigger>
          <TabsTrigger value="announcements" className="text-xs py-2" disabled={!isAdmin}>
            <Megaphone className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">公告</span>
          </TabsTrigger>
          <TabsTrigger value="sensitive" className="text-xs py-2" disabled={!isAdmin}>
            <AlertTriangle className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">敏感词</span>
          </TabsTrigger>
          <TabsTrigger value="taxonomy" className="text-xs py-2" disabled={!isAdmin}>
            <MessageSquare className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">板块</span>
          </TabsTrigger>
          <TabsTrigger value="site" className="text-xs py-2" disabled={!isAdmin}>
            <Settings2 className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">站点</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-4"><ReportsPanel /></TabsContent>
        <TabsContent value="content" className="mt-4"><ContentPanel /></TabsContent>
        <TabsContent value="users" className="mt-4">{isAdmin && <><UserStatsPanel /><div className="mt-4" /><UsersPanelFull /></>}</TabsContent>
        <TabsContent value="announcements" className="mt-4">{isAdmin && <AnnouncementsPanel />}</TabsContent>
        <TabsContent value="sensitive" className="mt-4">{isAdmin && <SensitivePanel />}</TabsContent>
        <TabsContent value="taxonomy" className="mt-4">{isAdmin && <TaxonomyPanel />}</TabsContent>
        <TabsContent value="site" className="mt-4">{isAdmin && <SiteSettingsPanel />}</TabsContent>
      </Tabs>
    </div>
  )
}

function ReportsPanel() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from("reports")
      .select("*, reporter:profiles!reports_reporter_id_fkey(*)")
      .order("created_at", { ascending: false })
      .limit(100)
    setReports((data as Report[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handle(id: string, status: "resolved" | "rejected") {
    await supabase.from("reports").update({ status, handled_at: new Date().toISOString() }).eq("id", id)
    toast.success("已处理")
    load()
  }

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">加载中...</p>

  return (
    <Card className="divide-y divide-border/60">
      {reports.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">暂无举报</p>
      ) : (
        reports.map((r) => (
          <div key={r.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Badge variant={r.status === "pending" ? "destructive" : "secondary"}>
                  {r.status === "pending" ? "待处理" : r.status === "resolved" ? "已处理" : "已驳回"}
                </Badge>
                <Badge variant="outline">{r.target_type}</Badge>
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">举报者：</span>
              <span className="font-medium">{r.reporter?.username}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">原因：</span>
              {r.reason}
            </div>
            <div className="text-xs text-muted-foreground break-all">目标 ID：{r.target_id}</div>
            {r.status === "pending" && (
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={() => handle(r.id, "resolved")}>标记已处理</Button>
                <Button size="sm" variant="outline" onClick={() => handle(r.id, "rejected")}>驳回</Button>
              </div>
            )}
          </div>
        ))
      )}
    </Card>
  )
}

function ContentPanel() {
  const [articles, setArticles] = useState<Article[]>([])
  const [topics, setTopics] = useState<Topic[]>([])

  async function load() {
    const [a, t] = await Promise.all([
      supabase
        .from("articles")
        .select("*, author:profiles!articles_author_id_fkey(*)")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("topics")
        .select("*, author:profiles!topics_author_id_fkey(*)")
        .order("created_at", { ascending: false })
        .limit(50),
    ])
    setArticles((a.data as Article[]) ?? [])
    setTopics((t.data as Topic[]) ?? [])
  }

  useEffect(() => { load() }, [])

  async function togglePin(type: "article" | "topic", id: string, current: boolean) {
    const tbl = type === "article" ? "articles" : "topics"
    await supabase.from(tbl).update({ is_pinned: !current }).eq("id", id)
    toast.success(!current ? "已置顶" : "已取消置顶")
    load()
  }

  async function toggleFeatured(id: string, current: boolean) {
    await supabase.from("articles").update({ is_featured: !current }).eq("id", id)
    toast.success(!current ? "已加精" : "已取消加精")
    load()
  }

  async function del(type: "article" | "topic", id: string) {
    if (!confirm("确定删除？")) return
    const tbl = type === "article" ? "articles" : "topics"
    await supabase.from(tbl).delete().eq("id", id)
    toast.success("已删除")
    load()
  }

  return (
    <Tabs defaultValue="articles">
      <TabsList className="w-full grid grid-cols-2">
        <TabsTrigger value="articles">文章 ({articles.length})</TabsTrigger>
        <TabsTrigger value="topics">话题 ({topics.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="articles" className="mt-4">
        <Card className="divide-y divide-border/60">
          {articles.map((a) => (
            <div key={a.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {a.author?.username} · {timeAgo(a.created_at)} · {a.view_count} 阅读
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                  {a.is_pinned && <Badge variant="secondary" className="text-[10px]">置顶</Badge>}
                  {a.is_featured && <Badge className="text-[10px] bg-accent text-accent-foreground">精选</Badge>}
                </div>
              </div>
              <div className="flex gap-1 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => togglePin("article", a.id, a.is_pinned)}>
                  {a.is_pinned ? "取消置顶" : "置顶"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleFeatured(a.id, a.is_featured)}>
                  {a.is_featured ? "取消精选" : "加精"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => del("article", a.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </Card>
      </TabsContent>
      <TabsContent value="topics" className="mt-4">
        <Card className="divide-y divide-border/60">
          {topics.map((t) => (
            <div key={t.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {t.author?.username} · {timeAgo(t.created_at)}
                  </div>
                </div>
                {t.is_pinned && <Badge variant="secondary" className="text-[10px] shrink-0">置顶</Badge>}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => togglePin("topic", t.id, t.is_pinned)}>
                  {t.is_pinned ? "取消置顶" : "置顶"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => del("topic", t.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </Card>
      </TabsContent>
    </Tabs>
  )
}

function AnnouncementsPanel() {
  const [items, setItems] = useState<Announcement[]>([])
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const { user } = useAuth()

  async function load() {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false })
    setItems(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function submit() {
    if (!user || !title || !content) return
    await supabase.from("announcements").insert({ title, content, created_by: user.id, is_active: true })
    setTitle(""); setContent("")
    toast.success("已发布")
    load()
  }

  async function toggle(id: string, current: boolean) {
    await supabase.from("announcements").update({ is_active: !current }).eq("id", id)
    load()
  }

  async function del(id: string) {
    if (!confirm("确定删除？")) return
    await supabase.from("announcements").delete().eq("id", id)
    load()
  }

  return (
    <div className="space-y-3">
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">发布公告</h3>
        <Input placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea placeholder="内容" value={content} onChange={(e) => setContent(e.target.value)} rows={3} />
        <Button onClick={submit} size="sm"><Plus className="h-3 w-3 mr-1" />发布</Button>
      </Card>
      <Card className="divide-y divide-border/60">
        {items.map((a) => (
          <div key={a.id} className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{a.title}</span>
                  <Badge variant={a.is_active ? "default" : "secondary"} className="text-[10px]">
                    {a.is_active ? "启用" : "停用"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.content}</div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => toggle(a.id, a.is_active)}>
                {a.is_active ? "停用" : "启用"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => del(a.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}

function SensitivePanel() {
  const [items, setItems] = useState<SensitiveWord[]>([])
  const [word, setWord] = useState("")
  const [severity, setSeverity] = useState<"warn" | "block">("warn")

  async function load() {
    const { data } = await supabase.from("sensitive_words").select("*").order("created_at", { ascending: false })
    setItems(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function add() {
    if (!word.trim()) return
    const { error } = await supabase.from("sensitive_words").insert({ word: word.trim(), severity })
    if (error) {
      toast.error(error.message)
      return
    }
    setWord("")
    toast.success("已添加")
    load()
  }

  async function del(id: string) {
    await supabase.from("sensitive_words").delete().eq("id", id)
    load()
  }

  return (
    <div className="space-y-3">
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm">添加敏感词</h3>
        <div className="flex gap-2">
          <Input placeholder="敏感词" value={word} onChange={(e) => setWord(e.target.value)} />
          <Select value={severity} onValueChange={(v) => setSeverity(v as "warn" | "block")}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="warn">警告</SelectItem>
              <SelectItem value="block">拦截</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={add} size="sm"><Plus className="h-4 w-4" /></Button>
        </div>
      </Card>
      <Card className="divide-y divide-border/60">
        {items.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">暂无敏感词</p>
        ) : (
          items.map((w) => (
            <div key={w.id} className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{w.word}</span>
                <Badge variant={w.severity === "block" ? "destructive" : "secondary"} className="text-[10px]">
                  {w.severity === "block" ? "拦截" : "警告"}
                </Badge>
              </div>
              <Button size="sm" variant="ghost" onClick={() => del(w.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </Card>
    </div>
  )
}

function TaxonomyPanel() {
  const [categories, setCategories] = useState<Category[]>([])
  const [boards, setBoards] = useState<Board[]>([])
  const [catName, setCatName] = useState("")
  const [catSlug, setCatSlug] = useState("")
  const [catDesc, setCatDesc] = useState("")
  const [boardName, setBoardName] = useState("")
  const [boardSlug, setBoardSlug] = useState("")
  const [boardDesc, setBoardDesc] = useState("")

  async function load() {
    const [c, b] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("boards").select("*").order("sort_order"),
    ])
    setCategories(c.data ?? [])
    setBoards(b.data ?? [])
  }
  useEffect(() => { load() }, [])

  async function addCategory() {
    if (!catName || !catSlug) return
    const { error } = await supabase.from("categories").insert({ name: catName, slug: catSlug, description: catDesc })
    if (error) { toast.error(error.message); return }
    setCatName(""); setCatSlug(""); setCatDesc("")
    toast.success("已添加")
    load()
  }

  async function addBoard() {
    if (!boardName || !boardSlug) return
    const { error } = await supabase.from("boards").insert({ name: boardName, slug: boardSlug, description: boardDesc })
    if (error) { toast.error(error.message); return }
    setBoardName(""); setBoardSlug(""); setBoardDesc("")
    toast.success("已添加")
    load()
  }

  return (
    <Tabs defaultValue="categories">
      <TabsList className="w-full grid grid-cols-2">
        <TabsTrigger value="categories">文章分类</TabsTrigger>
        <TabsTrigger value="boards">话题板块</TabsTrigger>
      </TabsList>
      <TabsContent value="categories" className="mt-3 space-y-3">
        <Card className="p-4 space-y-2">
          <Label className="text-sm">添加分类</Label>
          <Input placeholder="名称" value={catName} onChange={(e) => setCatName(e.target.value)} />
          <Input placeholder="标识（英文小写）" value={catSlug} onChange={(e) => setCatSlug(e.target.value)} />
          <Input placeholder="描述" value={catDesc} onChange={(e) => setCatDesc(e.target.value)} />
          <Button onClick={addCategory} size="sm"><Plus className="h-3 w-3 mr-1" />添加</Button>
        </Card>
        <Card className="divide-y divide-border/60">
          {categories.map((c) => (
            <div key={c.id} className="p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.slug} · {c.description}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={async () => { if (confirm("确定删除？")) { await supabase.from("categories").delete().eq("id", c.id); load() } }}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </Card>
      </TabsContent>
      <TabsContent value="boards" className="mt-3 space-y-3">
        <Card className="p-4 space-y-2">
          <Label className="text-sm">添加板块</Label>
          <Input placeholder="名称" value={boardName} onChange={(e) => setBoardName(e.target.value)} />
          <Input placeholder="标识（英文小写）" value={boardSlug} onChange={(e) => setBoardSlug(e.target.value)} />
          <Input placeholder="描述" value={boardDesc} onChange={(e) => setBoardDesc(e.target.value)} />
          <Button onClick={addBoard} size="sm"><Plus className="h-3 w-3 mr-1" />添加</Button>
        </Card>
        <Card className="divide-y divide-border/60">
          {boards.map((b) => (
            <div key={b.id} className="p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{b.name}</div>
                <div className="text-xs text-muted-foreground">{b.slug} · {b.description}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={async () => { if (confirm("确定删除？")) { await supabase.from("boards").delete().eq("id", b.id); load() } }}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </Card>
      </TabsContent>
    </Tabs>
  )
}
