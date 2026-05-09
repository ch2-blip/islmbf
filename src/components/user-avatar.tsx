import type { Profile } from "@/lib/database.types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type Size = "xs" | "sm" | "md" | "lg" | "xl"

const sizeMap: Record<Size, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-lg",
}

const haloColorMap: Record<string, string> = {
  gold: "rgba(251,191,36,0.6)",
  emerald: "rgba(52,211,153,0.6)",
  rose: "rgba(251,113,133,0.6)",
  sky: "rgba(56,189,248,0.6)",
}

const haloBorderMap: Record<string, string> = {
  gold: "rgb(251,191,36)",
  emerald: "rgb(52,211,153)",
  rose: "rgb(251,113,133)",
  sky: "rgb(56,189,248)",
}

const shapeRadiusMap: Record<string, string> = {
  circle: "9999px",
  square: "0px",
  rounded: "8px",
}

export function UserAvatar({
  profile,
  size = "md",
  className,
  showHalo = true,
}: {
  profile: Pick<Profile, "username" | "avatar_url" | "avatar_shape" | "halo_style"> | null | undefined
  size?: Size
  className?: string
  showHalo?: boolean
}) {
  const shape = profile?.avatar_shape ?? "circle"
  const haloStyle = profile?.halo_style ?? "none"
  const borderRadius = shapeRadiusMap[shape] ?? shapeRadiusMap.circle
  const initials = profile?.username?.slice(0, 2).toUpperCase() ?? "?"

  const inlineStyle: React.CSSProperties = {
    borderRadius,
    boxShadow: showHalo && haloColorMap[haloStyle] ? `0 0 12px ${haloColorMap[haloStyle]}` : undefined,
    border: showHalo && haloBorderMap[haloStyle] ? `2px solid ${haloBorderMap[haloStyle]}` : "1px solid var(--border)",
  }

  return (
    <Avatar className={cn(sizeMap[size], className)} style={inlineStyle}>
      <AvatarImage src={profile?.avatar_url || undefined} style={{ borderRadius }} />
      <AvatarFallback className="bg-secondary text-primary font-semibold" style={{ borderRadius }}>
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

export function roleBadgeText(profile: Pick<Profile, "role" | "badge_text"> | null | undefined): string | null {
  if (!profile) return null
  if (profile.badge_text && profile.badge_text.trim().length > 0) return profile.badge_text
  if (profile.role === "admin") return "管理员"
  if (profile.role === "moderator") return "版主"
  return null
}

import { Shield } from "lucide-react"

export function UserNameWithBadge({
  profile,
  className,
}: {
  profile: Pick<Profile, "username" | "role" | "badge_text"> | null | undefined
  className?: string
}) {
  const text = roleBadgeText(profile)
  return (
    <div className={cn("flex items-center gap-1.5 min-w-0", className)}>
      <span className="truncate">{profile?.username}</span>
      {text && (
        <span 
          className="shrink-0 inline-flex items-center gap-0.5 rounded-sm border px-1.5 py-0.5 text-[9px] font-medium text-primary leading-none"
          style={{ backgroundColor: "var(--primary-10)", borderColor: "var(--primary-20)" }}
        >
          {profile?.role === "admin" && <Shield className="h-2.5 w-2.5" />}
          {text}
        </span>
      )}
    </div>
  )
}
