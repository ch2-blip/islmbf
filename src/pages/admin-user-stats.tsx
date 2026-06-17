import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Users, UserPlus, Shield, BookOpen } from "lucide-react"

interface UserStats {
  total: number
  today: number
  yesterday: number
  last7d: number
  last30d: number
  adminCount: number
  moderatorCount: number
  userCount: number
  scholarCount: number
}

/** Get Beijing-time midnight for a given day offset (0 = today, -1 = yesterday, etc.) */
function bjMidnight(dayOffset: number): string {
  // Current time in Beijing
  const now = new Date()
  // Beijing is UTC+8
  const bjNow = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  // Get date parts in Beijing time
  const y = bjNow.getUTCFullYear()
  const m = bjNow.getUTCMonth()
  const d = bjNow.getUTCDate()
  // Create midnight in Beijing for the offset day, then convert back to UTC
  const bjMidnightMs = Date.UTC(y, m, d + dayOffset) - 8 * 60 * 60 * 1000
  return new Date(bjMidnightMs).toISOString()
}

export function UserStatsPanel() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    setError(false)
    try {
      const todayStart = bjMidnight(0)
      const tomorrowStart = bjMidnight(1)
      const yesterdayStart = bjMidnight(-1)
      const d7Start = bjMidnight(-7)
      const d30Start = bjMidnight(-30)

      const [
        totalRes,
        todayRes,
        yesterdayRes,
        last7dRes,
        last30dRes,
        adminRes,
        moderatorRes,
        userRes,
        scholarRes,
      ] = await Promise.all([
        // Total
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        // Today (Beijing time)
        supabase.from("profiles").select("id", { count: "exact", head: true })
          .gte("created_at", todayStart).lt("created_at", tomorrowStart),
        // Yesterday (Beijing time)
        supabase.from("profiles").select("id", { count: "exact", head: true })
          .gte("created_at", yesterdayStart).lt("created_at", todayStart),
        // Last 7 days
        supabase.from("profiles").select("id", { count: "exact", head: true })
          .gte("created_at", d7Start),
        // Last 30 days
        supabase.from("profiles").select("id", { count: "exact", head: true })
          .gte("created_at", d30Start),
        // Role counts
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "moderator"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "scholar"),
      ])

      setStats({
        total: totalRes.count ?? 0,
        today: todayRes.count ?? 0,
        yesterday: yesterdayRes.count ?? 0,
        last7d: last7dRes.count ?? 0,
        last30d: last30dRes.count ?? 0,
        adminCount: adminRes.count ?? 0,
        moderatorCount: moderatorRes.count ?? 0,
        userCount: userRes.count ?? 0,
        scholarCount: scholarRes.count ?? 0,
      })
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-5">
        <p className="text-sm text-muted-foreground text-center py-4">用户统计加载中...</p>
      </Card>
    )
  }

  if (error || !stats) {
    return (
      <Card className="p-5">
        <p className="text-sm text-destructive text-center py-4">
          用户统计加载失败，请稍后重试
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Growth stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard icon={<Users className="h-4 w-4" />} label="用户总数" value={stats.total} accent />
        <StatCard icon={<UserPlus className="h-4 w-4" />} label="今日新增" value={stats.today} />
        <StatCard icon={<UserPlus className="h-4 w-4" />} label="昨日新增" value={stats.yesterday} />
        <StatCard label="近 7 天新增" value={stats.last7d} />
        <StatCard label="近 30 天新增" value={stats.last30d} />
      </div>

      {/* Role distribution */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" />
          角色分布
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <RoleCard label="管理员" value={stats.adminCount} color="text-red-600 dark:text-red-400" />
          <RoleCard label="版主" value={stats.moderatorCount} color="text-blue-600 dark:text-blue-400" />
          <RoleCard label="普通用户" value={stats.userCount} color="text-foreground" />
          {stats.scholarCount > 0 && (
            <RoleCard
              label="学者"
              value={stats.scholarCount}
              color="text-amber-600 dark:text-amber-400"
              icon={<BookOpen className="h-3 w-3" />}
            />
          )}
        </div>
      </Card>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon?: React.ReactNode
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <Card className={`p-3 ${accent ? "border-primary/30 bg-primary/5" : ""}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <p className={`text-xl font-semibold tabular-nums ${accent ? "text-primary" : ""}`}>
        {value}
      </p>
    </Card>
  )
}

function RoleCard({
  label,
  value,
  color,
  icon,
}: {
  label: string
  value: number
  color: string
  icon?: React.ReactNode
}) {
  return (
    <div className="text-center py-2">
      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <p className={`text-lg font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  )
}
