import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/sonner"
import { Layout } from "@/components/layout"

/* ── Eagerly loaded: only the 3 most-visited first-screen pages ── */
import { HomePage } from "@/pages/home"
import { ArticleDetailPage } from "@/pages/article-detail"
import { TopicDetailPage } from "@/pages/topic-detail"

/* ── Lazy loaded: everything else ── */
const LoginPage = lazy(() => import("@/pages/login").then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import("@/pages/register").then(m => ({ default: m.RegisterPage })))
const DiscoverPage = lazy(() => import("@/pages/discover").then(m => ({ default: m.DiscoverPage })))
const BoardDetailPage = lazy(() => import("@/pages/board-detail").then(m => ({ default: m.BoardDetailPage })))
const CategoryDetailPage = lazy(() => import("@/pages/board-detail").then(m => ({ default: m.CategoryDetailPage })))
const UserProfilePage = lazy(() => import("@/pages/user-profile").then(m => ({ default: m.UserProfilePage })))
const AnnouncementsPage = lazy(() => import("@/pages/announcements").then(m => ({ default: m.AnnouncementsPage })))
const CreateArticlePage = lazy(() => import("@/pages/create-article").then(m => ({ default: m.CreateArticlePage })))
const CreateTopicPage = lazy(() => import("@/pages/create-topic").then(m => ({ default: m.CreateTopicPage })))
const MePage = lazy(() => import("@/pages/me").then(m => ({ default: m.MePage })))
const SettingsPage = lazy(() => import("@/pages/settings").then(m => ({ default: m.SettingsPage })))
const MessagesPage = lazy(() => import("@/pages/messages").then(m => ({ default: m.MessagesPage })))
const SearchPage = lazy(() => import("@/pages/search").then(m => ({ default: m.SearchPage })))
const AdminPage = lazy(() => import("@/pages/admin").then(m => ({ default: m.AdminPage })))
const BookmarksPage = lazy(() => import("@/pages/bookmarks").then(m => ({ default: m.BookmarksPage })))
const DraftsPage = lazy(() => import("@/pages/drafts").then(m => ({ default: m.DraftsPage })))

/* Minimal fallback — intentionally not a skeleton */
function LazyFallback() {
  return <div className="px-4 pt-4" />
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LazyFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/article/:id" element={<ArticleDetailPage />} />
              <Route path="/topic/:id" element={<TopicDetailPage />} />
              <Route path="/create/article" element={<CreateArticlePage />} />
              <Route path="/create/topic" element={<CreateTopicPage />} />
              <Route path="/edit/article/:id" element={<CreateArticlePage />} />
              <Route path="/edit/topic/:id" element={<CreateTopicPage />} />
              <Route path="/category/:slug" element={<CategoryDetailPage />} />
              <Route path="/board/:slug" element={<BoardDetailPage />} />
              <Route path="/user/:username" element={<UserProfilePage />} />
              <Route path="/me" element={<MePage />} />
              <Route path="/me/articles" element={<BookmarksPage mode="my-articles" />} />
              <Route path="/me/bookmarks" element={<BookmarksPage mode="bookmark" />} />
              <Route path="/me/likes" element={<BookmarksPage mode="like" />} />
              <Route path="/me/drafts" element={<DraftsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/notifications" element={<MessagesPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/reports" element={<AdminPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </AuthProvider>
  )
}

function NotFound() {
  return (
    <div className="px-4 pt-20 text-center">
      <h2 className="text-xl font-serif-cn font-semibold mb-2">页面未找到</h2>
      <p className="text-sm text-muted-foreground">您访问的页面不存在</p>
    </div>
  )
}

export default App
