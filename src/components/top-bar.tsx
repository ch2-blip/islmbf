import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/user-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, LogOut, User as UserIcon, Shield, Settings, SquarePen as PenSquare, FileText, MessageSquare, Bookmark, Heart } from "lucide-react"
import { EightPointStar } from "./geometric-pattern"
import { InstallPwaButton } from "./install-pwa-button"

export function TopBar() {
  const { profile, user, isAdmin, signOut } = useAuth()
  const nav = useNavigate()
  const [siteName, setSiteName] = useState("静园")
  const [siteIcon, setSiteIcon] = useState("")

  useEffect(() => {
    let active = true
    async function load() {
      const { data } = await supabase
        .from("site_settings")
        .select("site_name, site_icon_url")
        .eq("id", 1)
        .maybeSingle()
      if (active && data) {
        setSiteName(data.site_name || "静园")
        setSiteIcon(data.site_icon_url || "")
        if (data.site_name) document.title = data.site_name
      }
    }
    load()
    const onUpdate = () => load()
    window.addEventListener("site-settings-updated", onUpdate)
    return () => {
      active = false
      window.removeEventListener("site-settings-updated", onUpdate)
    }
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-gradient-to-b from-card/90 via-card/80 to-card/60 backdrop-blur-md shadow-[0_1px_0_0_var(--primary-8)]">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 group">
          <span
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground overflow-hidden"
            style={{
              background: "linear-gradient(to bottom right, var(--primary), var(--accent))",
              boxShadow: "0 4px 6px rgba(47,107,91,0.3), inset 0 0 0 1px rgba(47,107,91,0.2)",
            }}
          >
            {siteIcon ? (
              <img src={siteIcon} alt={siteName} className="h-full w-full object-cover" />
            ) : (
              <EightPointStar size={20} />
            )}
          </span>
          <div className="leading-tight">
            <div className="text-base font-semibold font-serif-cn text-foreground">{siteName}</div>
            <div className="text-[10px] text-muted-foreground tracking-wide">JING·YUAN</div>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          <InstallPwaButton />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => nav("/search")}
            aria-label="搜索"
          >
            <Search className="h-4 w-4" />
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  aria-label="发布"
                >
                  <PenSquare className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm">发布</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => nav("/create/article")}>
                  <FileText className="mr-2 h-4 w-4" />
                  写文章
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav("/create/topic")}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  发话题
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => nav("/login")}
            >
              <PenSquare className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">发布</span>
            </Button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 pr-2"
                  aria-label="我的"
                >
                  <UserAvatar profile={profile} size="xs" />
                  <span className="hidden sm:inline text-sm">我的</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{profile?.username}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => nav("/me")}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  个人中心
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav("/me/drafts")}>
                  <FileText className="mr-2 h-4 w-4" />
                  我的草稿
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav("/me/bookmarks")}>
                  <Bookmark className="mr-2 h-4 w-4" />
                  我的收藏
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav("/me/likes")}>
                  <Heart className="mr-2 h-4 w-4" />
                  我的点赞
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => nav("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  账号设置
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => nav("/admin")}>
                    <Shield className="mr-2 h-4 w-4" />
                    管理后台
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await signOut(); nav("/") }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              onClick={() => nav("/login")}
              className="ml-1"
            >
              登录
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
