import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/sonner"
import { Layout } from "@/components/layout"
import { HomePage } from "@/pages/home"
import { LoginPage } from "@/pages/login"
import { RegisterPage } from "@/pages/register"
import { ArticleDetailPage } from "@/pages/article-detail"
import { TopicDetailPage } from "@/pages/topic-detail"
import { CreateArticlePage } from "@/pages/create-article"
import { CreateTopicPage } from "@/pages/create-topic"
import { DiscoverPage } from "@/pages/discover"
import { BoardDetailPage, CategoryDetailPage } from "@/pages/board-detail"
import { UserProfilePage } from "@/pages/user-profile"
import { MePage } from "@/pages/me"
import { SettingsPage } from "@/pages/settings"
import { MessagesPage } from "@/pages/messages"
import { SearchPage } from "@/pages/search"
import { AdminPage } from "@/pages/admin"
import { AnnouncementsPage } from "@/pages/announcements"
import { BookmarksPage } from "@/pages/bookmarks"

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
