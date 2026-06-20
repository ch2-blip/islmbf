import { useState, useEffect, useRef, useCallback } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { useSiteSettings } from "@/contexts/site-settings-context"
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
import { Search, LogOut, User as UserIcon, Shield, Settings, SquarePen as PenSquare, FileText, MessageSquare, Bookmark, Heart, Bell } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { EightPointStar } from "./geometric-pattern"
import { InstallPwaButton } from "./install-pwa-button"
import { onReportsSeen, getReportsLastSeen } from "@/lib/admin-badge"

const USER_MENU_STATE = { modal: 'user-menu' } as const

export function TopBar() {
  const { profile, user, isAdmin, signOut } = useAuth()
  const { settings } = useSiteSettings()
  const nav = useNavigate()
  const location = useLocation()

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [newReports, setNewReports] = useState(0)
  const historyPushedRef = useRef(false)

  // Fetch unread notification count
  useEffect(() => {
    if (!user) return
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)
      .then(({ count }) => setUnreadCount(count ?? 0))
  }, [user?.id, location.pathname])

  // Fetch unseen reports for admins
  useEffect(() => {
    if (!user || !isAdmin) return
    const lastSeen = getReportsLastSeen()
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .gt("created_at", lastSeen)
      .then(({ count }) => setNewReports(count ?? 0))
  }, [user?.id, isAdmin, location.pathname])

  // Register callback so admin page can clear badge instantly
  useEffect(() => {
    onReportsSeen(() => setNewReports(0))
    return () => onReportsSeen(null)
  }, [])

  const totalBadge = unreadCount + (isAdmin ? newReports : 0)

  const closedByPopstateRef = useRef(false)

  useEffect(() => {
    if (userMenuOpen) setUserMenuOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  useEffect(() => {
    if (!userMenuOpen) return
    const handlePopstate = () => {
      closedByPopstateRef.current = true
      historyPushedRef.current = false
      setUserMenuOpen(false)
    }
    window.addEventListener('popstate', handlePopstate)
    return () => window.removeEventListener('popstate', handlePopstate)
  }, [userMenuOpen])

  useEffect(() => {
    if (!userMenuOpen) return
    const handleScrollOrTouch = (e: Event) => {
      const target = e.target as HTMLElement
      if (target?.closest?.('[data-slot="dropdown-menu-content"]')) return
      if (historyPushedRef.current) {
        historyPushedRef.current = false
        history.back()
      }
      setUserMenuOpen(false)
    }
    window.addEventListener('scroll', handleScrollOrTouch, { passive: true, capture: true })
    window.addEventListener('touchmove', handleScrollOrTouch, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScrollOrTouch, { capture: true })
      window.removeEventListener('touchmove', handleScrollOrTouch)
    }
  }, [userMenuOpen])

  const handleUserMenuOpenChange = useCallback((open: boolean) => {
    if (open) {
      if (!historyPushedRef.current) {
        history.pushState(USER_MENU_STATE, '')
        historyPushedRef.current = true
      }
      closedByPopstateRef.current = false
      setUserMenuOpen(true)
    } else {
      if (historyPushedRef.current && !closedByPopstateRef.current) {
        historyPushedRef.current = false
        history.back()
      }
      closedByPopstateRef.current = false
      setUserMenuOpen(false)
    }
  }, [])

  const handleMenuNavigate = useCallback((path: string) => {
    const shouldReplace = historyPushedRef.current
    historyPushedRef.current = false
    closedByPopstateRef.current = false
    setUserMenuOpen(false)
    nav(path, shouldReplace ? { replace: true } : undefined)
  }, [nav])

  const handleMenuSignOut = useCallback(async () => {
    const shouldReplace = historyPushedRef.current
    historyPushedRef.current = false
    closedByPopstateRef.current = false
    setUserMenuOpen(false)
    await signOut()
    nav("/", shouldReplace ? { replace: true } : undefined)
  }, [signOut, nav])

  const siteName = settings.site_name || ""
  const siteIcon = settings.site_icon_url || ""

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-card shadow-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary-foreground"
            style={{
              ...(!siteIcon ? {
                background: "linear-gradient(to bottom right, var(--primary), var(--accent))",
                boxShadow: "0 4px 6px rgba(47,107,91,0.3), inset 0 0 0 1px rgba(47,107,91,0.2)",
              } : {
                boxShadow: "0 2px 4px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(0,0,0,0.06)",
              }),
            }}
          >
            {siteIcon ? (
              <img src={siteIcon} alt={siteName} className="h-full w-full rounded-xl object-contain" />
            ) : (
              <EightPointStar size={22} />
            )}
          </span>
          <span className="text-xl font-semibold font-serif-cn text-foreground leading-tight">{siteName}</span>
        </Link>

        <div className="flex items-center gap-1">
          <InstallPwaButton />
          <Button variant="ghost" size="icon" onClick={() => nav("/search")} aria-label="搜索">
            <Search className="h-4 w-4" />
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5" aria-label="发布">
                  <PenSquare className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm">发布</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => nav("/create/article")}>
                  <FileText className="mr-2 h-4 w-4" /> 写文章
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav("/create/topic")}>
                  <MessageSquare className="mr-2 h-4 w-4" /> 发话题
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => nav("/login")}>
              <PenSquare className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">发布</span>
            </Button>
          )}

          {user ? (
            <DropdownMenu open={userMenuOpen} onOpenChange={handleUserMenuOpenChange}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 pr-2 relative" aria-label="我的">
                  <UserAvatar profile={profile} size="xs" className="!h-8 !w-8" />
                  <span className="hidden sm:inline text-sm">我的</span>
                  {/* Simple static red dot — no animation, no glow, no ping */}
                  {totalBadge > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#ef4444",
                      }}
                    />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{profile?.username}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleMenuNavigate("/me")}>
                  <UserIcon className="mr-2 h-4 w-4" /> 个人中心
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleMenuNavigate("/me/drafts")}>
                  <FileText className="mr-2 h-4 w-4" /> 我的草稿
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleMenuNavigate("/me/bookmarks")}>
                  <Bookmark className="mr-2 h-4 w-4" /> 我的收藏
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleMenuNavigate("/me/likes")}>
                  <Heart className="mr-2 h-4 w-4" /> 我的点赞
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleMenuNavigate("/notifications")}>
                  <Bell className="mr-2 h-4 w-4" /> 消息通知
                  {unreadCount > 0 && (
                    <span
                      style={{
                        marginLeft: "auto",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: 18,
                        minWidth: 18,
                        borderRadius: 9,
                        padding: "0 5px",
                        fontSize: 10,
                        fontWeight: 600,
                        backgroundColor: "#ef4444",
                        color: "#fff",
                      }}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleMenuNavigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" /> 账号设置
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => handleMenuNavigate("/admin")}>
                    <Shield className="mr-2 h-4 w-4" /> 管理后台
                    {newReports > 0 && (
                      <span
                        style={{
                          marginLeft: "auto",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: 18,
                          minWidth: 18,
                          borderRadius: 9,
                          padding: "0 5px",
                          fontSize: 10,
                          fontWeight: 600,
                          backgroundColor: "#ef4444",
                          color: "#fff",
                        }}
                      >
                        {newReports > 99 ? "99+" : newReports}
                      </span>
                    )}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleMenuSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> 退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => nav("/login")} className="ml-1">
              登录
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
