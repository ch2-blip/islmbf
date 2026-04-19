import { Outlet } from "react-router-dom"
import { TopBar } from "./top-bar"

export function Layout() {
  return (
    <div className="min-h-svh bg-background flex flex-col">
      <TopBar />
      <main className="flex-1 mx-auto w-full max-w-3xl pb-8">
        <Outlet />
      </main>
    </div>
  )
}
