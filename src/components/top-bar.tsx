import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

export function TopBar() {
  const { profile, user, isAdmin, signOut } = useAuth()
  const nav = useNavigate()

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm group-hover:shadow-md transition-shadow">
            <EightPointStar size={20} />
          </span>
          <div className="leading-tight">
            <div className="text-base font-semibold font-serif-cn text-foreground">静园</div>
            <div className="text-[10px] text-muted-foreground tracking-wide">JING·YUAN</div>
          </div>
        </Link>

        <div className="flex items-center gap-1">
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
                  <Avatar className="h-6 w-6 border border-border">
                    <AvatarImage src={profile?.avatar_url} alt={profile?.username} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                      {profile?.username?.slice(0, 2).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
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
                <DropdownMenuItem onClick={() => nav("/me/articles")}>
                  <FileText className="mr-2 h-4 w-4" />
                  我的文章
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
