import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { EightPointStar } from "@/components/geometric-pattern"
import { useSiteSettings } from "@/contexts/site-settings-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Lock } from "lucide-react"

const USERNAME_RE = /^[a-zA-Z0-9_\-\u4e00-\u9fa5]{2,20}$/

export function RegisterPage() {
  const { signUp } = useAuth()
  const { settings } = useSiteSettings()
  const nav = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const siteName = settings.site_name || ""
  const siteIcon = settings.site_icon_url || ""

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!USERNAME_RE.test(username.trim())) {
      toast.error("用户名需 2-20 位，支持中文、字母、数字、下划线和短横线")
      return
    }
    if (password.length < 6) {
      toast.error("密码至少 6 位")
      return
    }
    setLoading(true)
    const { error } = await signUp(username.trim(), password)
    setLoading(false)
    if (error) {
      if (error === "用户名已被占用") {
        toast.error("注册失败：用户名已被占用")
      } else {
        toast.error("注册失败：" + error)
      }
      return
    }
    toast.success(siteName ? `注册成功，欢迎加入${siteName}` : "注册成功")
    nav("/")
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Link to="/" className="flex flex-col items-center gap-3">
          <span
            className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-primary-foreground"
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
              <EightPointStar size={32} />
            )}
          </span>
          <div className="text-center">
            <h1 className="text-2xl font-serif-cn font-semibold">
              {siteName ? `加入${siteName}` : "创建账号"}
            </h1>
          </div>
        </Link>

        {!settings.registration_open ? (
          <Alert className="border-accent/40 bg-accent/10">
            <Lock className="h-4 w-4" />
            <AlertTitle>注册已关闭</AlertTitle>
            <AlertDescription className="text-xs leading-relaxed text-muted-foreground">
              当前站点暂未开放新用户注册，请稍后再来或联系管理员。
            </AlertDescription>
          </Alert>
        ) : (
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="font-serif-cn">创建账号</CardTitle>
            <CardDescription>仅需用户名与密码</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  required
                  minLength={2}
                  maxLength={20}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="2-20 位，中文/字母/数字"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 位字符"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "创建中..." : "创建账号"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              已有账号？{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                直接登录
              </Link>
            </div>
          </CardContent>
        </Card>
        )}

        <div className="text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
