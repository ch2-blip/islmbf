import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import type { Profile, Article, Topic } from "@/lib/database.types"
import { UserAvatar, roleBadgeText } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArticleCard } from "@/components/article-card"
import { TopicCard } from "@/components/topic-card"
import { ArrowLeft, Shield, BadgeCheck, Calendar } from "lucide-react"
import { timeAgo } from "@/lib/hijri"
import { useAuth } from "@/contexts/auth-context"

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>()
  const nav = useNavigate()
  const { profile: me } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [avatarOpen, setAvatarOpen] = useState(false)

  useEffect(() => {
    if (!username) return
    load()
  }, [username])

  async function load() {
    if (!username) return
    setLoading(true)
    const { data: p } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle()
    setProfile(p)
    if (p) {
      const [a, t] = await Promise.all([
        supabase
          .from("articles")
          .select("*, author:profiles!articles_author_id_fkey(*), category:categories(*)")
          .eq("author_id", p.id)
          .eq("status", "published")
          .order("published_at", { ascending: false }),
        supabase
          .from("topics")
          .select("*, author:profiles!topics_author_id_fkey(*), board:boards(*)")
          .eq("author_id", p.id)
          .eq("status", "published")
          .order("created_at", { ascending: false }),
      ])
      setArticles((a.data as Article[]) ?? [])
      setTopics((t.data as Topic[]) ?? [])
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="px-4 pt-4" />
  }

  if (!profile) {
    return (
      <div className="px-4 pt-12 text-center">
        <p className="text-muted-foreground mb-4">用户不存在</p>
        <Button variant="outline" onClick={() => nav("/")}>返回首页</Button>
      </div>
    )
  }

  const isMe = me?.id === profile.id

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <button
        onClick={() => nav(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </button>

      <Card className="p-5">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => setAvatarOpen(true)}
            className="shrink-0 cursor-zoom-in rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="查看头像大图"
          >
            <UserAvatar profile={profile} size="xl" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <h1 className="text-lg font-semibold">{profile.username}</h1>
              {roleBadgeText(profile) && (
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded text-primary"
                  style={{ backgroundColor: "var(--primary-10)" }}
                >
                  <Shield className="h-2.5 w-2.5" /> {roleBadgeText(profile)}
                </span>
              )}
              {profile.is_verified_scholar && (
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded text-accent-foreground"
                  style={{ backgroundColor: "var(--accent-12)" }}
                >
                  <BadgeCheck className="h-2.5 w-2.5" /> 认证学者
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              {profile.bio || "这位信士尚未填写简介"}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> 加入于 {timeAgo(profile.created_at)}
              </span>
            </div>
          </div>
          {isMe && (
            <Button variant="outline" size="sm" onClick={() => nav("/settings")}>
              编辑资料
            </Button>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-semibold text-primary">{articles.length}</div>
            <div className="text-xs text-muted-foreground">文章</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-primary">{topics.length}</div>
            <div className="text-xs text-muted-foreground">话题</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-primary">{profile.comment_count}</div>
            <div className="text-xs text-muted-foreground">评论</div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="articles">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="articles">文章</TabsTrigger>
          <TabsTrigger value="topics">话题</TabsTrigger>
        </TabsList>
        <TabsContent value="articles" className="mt-4 space-y-3">
          {articles.length === 0 ? (
            <EmptyHint text="暂无文章" />
          ) : (
            articles.map((a) => <ArticleCard key={a.id} article={a} />)
          )}
        </TabsContent>
        <TabsContent value="topics" className="mt-4">
          {topics.length === 0 ? (
            <EmptyHint text="暂无话题" />
          ) : (
            <Card>
              {topics.map((t) => (
                <TopicCard key={t.id} topic={t} />
              ))}
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={avatarOpen} onOpenChange={setAvatarOpen}>
        <DialogContent className="max-w-md p-0 border-0 bg-transparent shadow-none [&>button]:bg-background/70 [&>button]:rounded-full [&>button]:p-1.5">
          <div className="flex flex-col items-center gap-3 p-2">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-full max-h-[70vh] object-contain rounded-xl shadow-2xl ring-1 ring-border/60 bg-card"
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center rounded-xl bg-card text-primary font-serif-cn font-semibold text-6xl shadow-2xl ring-1 ring-border/60">
                {profile.username.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="rounded-full bg-background/85 backdrop-blur px-4 py-1.5 text-sm font-medium shadow">
              {profile.username}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return (
    <Card className="p-10 text-center bg-muted/30 border-dashed">
      <p className="text-sm text-muted-foreground">{text}</p>
    </Card>
  )
}
