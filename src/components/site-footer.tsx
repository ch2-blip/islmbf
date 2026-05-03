import { useSiteSettings } from "@/contexts/site-settings-context"

export function SiteFooter() {
  const { settings } = useSiteSettings()
  if (!settings.footer_text && !settings.icp_text) return null
  return (
    <footer className="mt-6 border-t border-border/60 bg-muted/30 py-5 text-center text-xs text-muted-foreground">
      {settings.footer_text && (
        <div className="px-4 mb-1 whitespace-pre-wrap leading-relaxed">
          {settings.footer_text}
        </div>
      )}
      {settings.icp_text && (
        <div className="px-4 text-[11px] opacity-80">{settings.icp_text}</div>
      )}
    </footer>
  )
}
