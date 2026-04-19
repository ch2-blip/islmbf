import { Link, useLocation, useNavigate } from "react-router-dom"
import { Hop as Home, Compass, Plus, MessageSquare, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, MessagesSquare } from "lucide-react"

export function BottomNav() {
  const location = useLocation()
  const nav = useNavigate()
  const { user } = useAuth()
  const [createOpen, setCreateOpen] = useState(false)

  const items = [
    { to: "/", label: "首页", icon: Home },
    { to: "/discover", label: "发现", icon: Compass },
    { to: "__create__", label: "发布", icon: Plus, primary: true },
    { to: "/messages", label: "消息", icon: MessageSquare },
    { to: "/me", label: "我的", icon: User },
  ]

  function handleCreate() {
    if (!user) {
      nav("/login")
      return
    }
    setCreateOpen(true)
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-3xl items-center justify-around">
          {items.map((item) => {
            const Icon = item.icon
            const active =
              item.to !== "__create__" &&
              (item.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.to))

            if (item.to === "__create__") {
              return (
                <button
                  key={item.label}
                  onClick={handleCreate}
                  className="flex flex-col items-center justify-center px-3 py-2 -translate-y-3"
                  aria-label="发布"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background">
                    <Icon className="h-5 w-5" />
                  </span>
                </button>
              )
            }

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2.5 text-[10px] transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "fill-primary/10")} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center font-serif-cn">选择发布类型</DialogTitle>
            <DialogDescription className="text-center">
              文章适合长文与正式内容，话题适合轻松分享
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6 border-primary/20 hover:bg-primary/5"
              onClick={() => {
                setCreateOpen(false)
                nav("/create/article")
              }}
            >
              <FileText className="h-6 w-6 text-primary" />
              <div className="flex flex-col">
                <span className="font-serif-cn font-semibold">写文章</span>
                <span className="text-xs text-muted-foreground font-normal">经训、感悟、长文</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6 border-accent/30 hover:bg-accent/5"
              onClick={() => {
                setCreateOpen(false)
                nav("/create/topic")
              }}
            >
              <MessagesSquare className="h-6 w-6 text-accent-foreground" />
              <div className="flex flex-col">
                <span className="font-serif-cn font-semibold">发帖子</span>
                <span className="text-xs text-muted-foreground font-normal">闲聊、求助、分享</span>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
