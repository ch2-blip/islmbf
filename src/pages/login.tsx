import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { EightPointStar } from "@/components/geometric-pattern"

export function LoginPage() {
  const { signIn } = useAuth()
  const nav = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(username, password)
    setLoading(false)
    if (error) {
      toast.error("登录失败：用户名或密码错误")
      return
    }
    toast.success("欢迎回到静园")
    nav("/")
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Link to="/" className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <EightPointStar size={32} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-serif-cn font-semibold">静园</h1>
            <p className="text-xs text-muted-foreground mt-1 tracking-wider">JING·YUAN</p>
          </div>
        </Link>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="font-serif-cn">欢迎回来</CardTitle>
            <CardDescription>使用用户名与密码登录</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "登录中..." : "登录"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              还没有账号？{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">
                立即注册
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
