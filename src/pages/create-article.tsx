import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import type { Article, Category } from "@/lib/database.types"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { ArrowLeft, FileText, ImagePlus, Info, Loader as Loader2, ShieldCheck, Video, X } from "lucide-react"
import { CoverFocalPicker } from "@/components/cover-focal-picker"

const DRAFT_LIMIT = 100

export function CreateArticlePage() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const nav = useNavigate()
  const { user, profile, isAdmin } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [coverImage, setCoverImage] = useState("")
  const [coverFocalY, setCoverFocalY] = useState<number>(50)
  const [content, setContent] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [excerptEnabled, setExcerptEnabled] = useState(false)
  const [excerptText, setExcerptText] = useState("")
  const [existingStatus, setExistingStatus] = useState<Article["status"] | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [siteAllowVideo, setSiteAllowVideo] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  const canPostVideo = isAdmin || !!profile?.can_post_video || siteAllowVideo

  useEffect(() => {
    if (!user) {
      nav("/login")
      return
    }
    supabase
      .from("categories")
      .select("*")
      .order("sort_order")
      .then(({ data }) => setCategories(data ?? []))

    supabase
      .from("site_settings")
      .select("allow_video_posts")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => setSiteAllowVideo(!!data?.allow_video_posts))

    if (isEdit && id) {
      supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setTitle(data.title)
            setCategoryId(data.category_id ?? "")
            setCoverImage(data.cover_image)
            setCoverFocalY(typeof data.cover_focal_y === "number" ? data.cover_focal_y : 50)
            setContent(data.content)
            setVideoUrl(data.video_url ?? "")
            setExcerptEnabled(!!data.excerpt_enabled)
            setExcerptText(data.excerpt ?? "")
            setExistingStatus(data.status)
          }
        })
    }
  }, [user, id, isEdit, nav])

  async function onPickFile(file: File) {
    if (!user) return
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("图片不能超过 5MB")
      return
    }
    setUploading(true)
    const ext = file.name.split(".").pop() || "jpg"
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from("article-images")
      .upload(path, file, { upsert: false, contentType: file.type })
    if (error) {
      setUploading(false)
      toast.error("上传失败：" + error.message)
      return
    }
    const { data } = supabase.storage.from("article-images").getPublicUrl(path)
    setCoverImage(data.publicUrl)
    setCoverFocalY(50)
    setUploading(false)
    toast.success("封面已上传")
  }

  async function onPickVideo(file: File) {
    if (!user) return
    if (!file.type.startsWith("video/")) {
      toast.error("请选择视频文件")
      return
    }
    if (file.size > 500 * 1024 * 1024) {
      toast.error("视频不能超过 500MB")
      return
    }
    setUploadingVideo(true)
    const ext = file.name.split(".").pop() || "mp4"
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from("article-videos")
      .upload(path, file, { upsert: false, contentType: file.type })
    if (error) {
      setUploadingVideo(false)
      toast.error("上传失败：" + error.message)
      return
    }
    const { data } = supabase.storage.from("article-videos").getPublicUrl(path)
    setVideoUrl(data.publicUrl)
    setUploadingVideo(false)
    toast.success("视频已上传")
  }

  function validate(forDraft: boolean): boolean {
    if (title.trim().length < 2) {
      toast.error("标题至少 2 个字符")
      return false
    }
    if (!forDraft && content.trim().length < 20) {
      toast.error("文章内容过短，请至少 20 个字符")
      return false
    }
    if (videoUrl.trim() && !/^https?:\/\//i.test(videoUrl.trim())) {
      toast.error("视频链接需以 http(s):// 开头")
      return false
    }
    return true
  }

  function basePayload() {
    const finalExcerpt = excerptEnabled ? excerptText.trim().slice(0, 300) : ""
    return {
      title: title.trim(),
      category_id: categoryId || null,
      cover_image: coverImage.trim(),
      cover_focal_y: coverImage.trim() ? coverFocalY : 50,
      excerpt: finalExcerpt,
      excerpt_enabled: excerptEnabled,
      content: content.trim(),
      video_url: videoUrl.trim(),
    }
  }

  async function saveDraft() {
    if (!user) return
    if (!validate(true)) return
    setSavingDraft(true)

    if (isEdit && id) {
      const { error } = await supabase
        .from("articles")
        .update({ ...basePayload(), status: "draft" })
        .eq("id", id)
      setSavingDraft(false)
      if (error) {
        toast.error("保存失败：" + error.message)
        return
      }
      toast.success("草稿已保存")
      nav("/me/drafts")
      return
    }

    const { count } = await supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("author_id", user.id)
      .eq("status", "draft")
    if ((count ?? 0) >= DRAFT_LIMIT) {
      setSavingDraft(false)
      toast.error(`草稿数量已达上限（${DRAFT_LIMIT} 份），请先删除一些`)
      return
    }

    const { error } = await supabase
      .from("articles")
      .insert({ ...basePayload(), status: "draft", author_id: user.id })
    setSavingDraft(false)
    if (error) {
      toast.error("保存失败：" + error.message)
      return
    }
    toast.success("草稿已保存")
    nav("/me/drafts")
  }

  async function submit() {
    if (!user) return
    if (!validate(false)) return
    setSubmitting(true)

    const status = isAdmin ? "published" : "pending"
    // Only set published_at when FIRST publishing (new or draft→published).
    // Editing an already-published article must NOT change published_at,
    // otherwise it jumps to the top of the list like a new article.
    const isFirstPublish = !isEdit || existingStatus !== "published"
    const payload = {
      ...basePayload(),
      status,
      ...(status === "published" && isFirstPublish ? { published_at: new Date().toISOString() } : {}),
    }

    if (isEdit && id) {
      const { error } = await supabase.from("articles").update(payload).eq("id", id)
      setSubmitting(false)
      if (error) {
        toast.error("保存失败：" + error.message)
        return
      }
      toast.success(isAdmin ? "修改已保存" : "已提交，等待审核")
      nav(isAdmin ? `/article/${id}` : "/me")
    } else {
      const { data, error } = await supabase
        .from("articles")
        .insert({ ...payload, author_id: user.id })
        .select()
        .single()
      setSubmitting(false)
      if (error || !data) {
        toast.error("发布失败：" + (error?.message ?? ""))
        return
      }
      if (isAdmin) {
        toast.success("文章已发布")
        nav(`/article/${data.id}`)
      } else {
        toast.success("已提交，等待审核")
        nav("/me")
      }
    }
  }

  const isDraftEdit = existingStatus === "draft"
  const publishLabel = submitting
    ? "提交中..."
    : isEdit && !isDraftEdit
      ? "保存修改"
      : isAdmin
        ? "发布文章"
        : "提交审核"

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <button
        onClick={() => nav(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </button>

      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-lg font-serif-cn font-semibold">
            {isEdit ? (isDraftEdit ? "编辑草稿" : "编辑文章") : "写文章"}
          </h1>
          <p className="text-xs text-muted-foreground">长文、经训释义、生活感悟</p>
        </div>
      </div>

      {!isAdmin && !isDraftEdit && (
        <Alert className="border-accent/40 bg-accent/10">
          <ShieldCheck className="h-4 w-4 text-accent-foreground" />
          <AlertTitle className="text-sm font-medium">文章将经过审核后发布</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed text-muted-foreground">
            为了维护社区的内容氛围，用户提交的文章会先进入审核队列，由管理员确认后方可公开展示。可以先保存为草稿随时继续编辑。
          </AlertDescription>
        </Alert>
      )}

      {isAdmin && (
        <Alert className="border-primary/30 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle className="text-sm font-medium">管理员直接发布</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed text-muted-foreground">
            您以管理员身份发布文章，将跳过审核并立即公开展示。
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="title">标题</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="给文章起一个合适的标题"
            maxLength={120}
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label>分类</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="选择文章分类" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>封面图（可选）</Label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onPickFile(f)
              e.target.value = ""
            }}
          />
          {coverImage ? (
            <div className="space-y-2">
              <div className="relative">
                <CoverFocalPicker src={coverImage} value={coverFocalY} onChange={setCoverFocalY} />
                <button
                  type="button"
                  onClick={() => setCoverImage("")}
                  className="absolute right-2 top-2 rounded-full bg-background/85 p-1 text-foreground hover:bg-background shadow ring-1 ring-border z-10"
                  aria-label="移除封面"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="rounded-md border border-border/60 overflow-hidden">
                <div className="px-2.5 py-1.5 bg-muted/40 text-[11px] text-muted-foreground">
                  首页卡片预览
                </div>
                <div className="aspect-[16/7] w-full bg-muted">
                  <img
                    src={coverImage}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ objectPosition: `center ${coverFocalY}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex h-32 w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ImagePlus className="h-5 w-5" />
              )}
              <span className="text-xs">
                {uploading ? "上传中..." : "点击从本地上传封面图"}
              </span>
              <span className="text-[10px]">支持 JPG / PNG / WebP，小于 5MB</span>
            </button>
          )}
        </div>
        {canPostVideo && (
          <div className="space-y-1.5">
            <Label htmlFor="video" className="flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5" />
              视频（可选）
            </Label>
            <Input
              id="video"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://... 可粘贴 MP4 / 视频站链接"
            />
            {isAdmin && (
              <>
                <input
                  ref={videoRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) onPickVideo(f)
                    e.target.value = ""
                  }}
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => videoRef.current?.click()}
                    disabled={uploadingVideo}
                    className="gap-1.5"
                  >
                    {uploadingVideo ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Video className="h-3.5 w-3.5" />
                    )}
                    {uploadingVideo ? "上传中..." : "本地上传视频"}
                  </Button>
                  <span className="text-[10px] text-muted-foreground">
                    管理员限定 · 支持 MP4 / WebM，小于 500MB
                  </span>
                </div>
                {videoUrl && (
                  <video
                    src={videoUrl}
                    controls
                    className="w-full max-h-60 rounded-md border border-border/60 bg-muted"
                  />
                )}
              </>
            )}
          </div>
        )}
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Label className="text-sm">开头重点摘录</Label>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                开启后，在文章正文上方显示一段黄线引文
              </p>
            </div>
            <Switch checked={excerptEnabled} onCheckedChange={setExcerptEnabled} />
          </div>
          {excerptEnabled && (
            <Textarea
              value={excerptText}
              onChange={(e) => setExcerptText(e.target.value.slice(0, 300))}
              placeholder="写一段作为文章开头的重点摘录（最多 300 字）"
              rows={3}
              className="font-serif-cn leading-relaxed"
            />
          )}
          {excerptEnabled && (
            <p className="text-right text-[11px] text-muted-foreground">
              {excerptText.length} / 300
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="content">正文</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="在此撰写您的文章..."
            rows={14}
            className="font-serif-cn leading-relaxed"
          />
          <p className="text-xs text-muted-foreground">
            支持多段落。请保持内容符合伊斯兰精神，尊重不同教法学派观点。
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-4 mt-2 border-t border-border/60">
          <Button variant="outline" onClick={() => nav(-1)} disabled={submitting || savingDraft}>
            取消
          </Button>
          <Button
            variant="secondary"
            onClick={saveDraft}
            disabled={submitting || savingDraft || uploading}
          >
            {savingDraft ? "保存中..." : "保存草稿"}
          </Button>
          <Button onClick={submit} disabled={submitting || savingDraft || uploading}>
            {publishLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
