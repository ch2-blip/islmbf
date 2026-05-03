import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { toast } from "sonner"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISS_KEY = "pwa-install-dismissed-at"
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

export function InstallPwaButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as { standalone?: boolean }).standalone === true
    if (standalone) setInstalled(true)

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
      toast.success("已安装到桌面，欢迎常来")
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  if (installed) return null
  if (!deferred) return null

  const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0)
  if (dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return null

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === "dismissed") {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    }
    setDeferred(null)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={install}
      className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
      aria-label="安装到本地"
    >
      <Download className="h-4 w-4" />
      安装
    </Button>
  )
}
