import { Outlet } from "react-router-dom"
import { TopBar } from "./top-bar"
import { SiteFooter } from "./site-footer"

export function Layout() {
  return (
    <div
      className="flex flex-col bg-background"
      style={{ minHeight: '100vh' }}
    >
      <TopBar />
      <main className="flex-1 mx-auto w-full max-w-3xl pb-8" style={{ transform: "translateZ(0)" }}>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
