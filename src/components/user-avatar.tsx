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

const haloMap: Record<string, string> = {
  none: "",
  gold: "ring-2 ring-amber-400/70 shadow-[0_0_14px_rgba(251,191,36,0.55)]",
  emerald: "ring-2 ring-emerald-400/70 shadow-[0_0_14px_rgba(52,211,153,0.55)]",
  rose: "ring-2 ring-rose-400/70 shadow-[0_0_14px_rgba(251,113,133,0.55)]",
  sky: "ring-2 ring-sky-400/70 shadow-[0_0_14px_rgba(56,189,248,0.55)]",
}

const shapeMap: Record<string, string> = {
  circle: "rounded-full",
  square: "rounded-none",
  rounded: "rounded-lg",
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
  const shape = shapeMap[profile?.avatar_shape ?? "circle"] ?? shapeMap.circle
  const halo = showHalo ? haloMap[profile?.halo_style ?? "none"] ?? "" : ""
  const initials = profile?.username?.slice(0, 2).toUpperCase() ?? "?"
  return (
    <Avatar className={cn(sizeMap[size], shape, halo, "border border-border", className)}>
      <AvatarImage src={profile?.avatar_url || undefined} className={cn(shape)} />
      <AvatarFallback className={cn("bg-primary/10 text-primary font-semibold", shape)}>
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
