import { useSiteSettings } from "@/contexts/site-settings-context"

export function SiteFooter() {
  const { settings } = useSiteSettings()
  const hasFooter = !!settings.footer_text?.trim()
  const hasIcp = !!settings.icp_text?.trim()
  if (!hasFooter && !hasIcp) return null
  return (
    <footer className="mx-auto w-full max-w-3xl px-4 pt-6 pb-4 text-center">
      {hasFooter && (
        <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {settings.footer_text}
        </p>
      )}
      {hasIcp && (
        <p className="mt-2 text-[11px] text-muted-foreground/80">{settings.icp_text}</p>
      )}
    </footer>
  )
}
