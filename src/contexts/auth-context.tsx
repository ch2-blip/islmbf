import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { Profile, UserPermissions } from "@/lib/database.types"
import type { Session, User } from "@supabase/supabase-js"

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  permissions: UserPermissions | null
  loading: boolean
  isAdmin: boolean
  isModerator: boolean
  signIn: (username: string, password: string) => Promise<{ error: string | null }>
  signUp: (username: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string) {
    const [{ data: p }, { data: perms }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_permissions").select("*").eq("user_id", userId).maybeSingle(),
    ])
    setProfile(p)
    setPermissions(perms)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) {
        loadProfile(data.session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession) {
        ;(async () => {
          await loadProfile(newSession.user.id)
        })()
      } else {
        setProfile(null)
        setPermissions(null)
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  function usernameToEmail(username: string) {
    const normalized = username.trim().toLowerCase()
    return `${encodeURIComponent(normalized)}@jingyuan.local`
  }

  async function signIn(username: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    })
    return { error: error?.message ?? null }
  }

  async function signUp(username: string, password: string) {
    const trimmed = username.trim()
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", trimmed)
      .maybeSingle()
    if (existing) {
      return { error: "用户名已被占用" }
    }
    const { error } = await supabase.auth.signUp({
      email: usernameToEmail(trimmed),
      password,
      options: { data: { username: trimmed } },
    })
    if (error) {
      const msg = error.message
      if (/already registered|already exists|duplicate/i.test(msg)) {
        return { error: "用户名已被占用" }
      }
      return { error: msg }
    }
    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function refreshProfile() {
    if (session) await loadProfile(session.user.id)
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    if (!profile?.username) return { error: "用户未登录" }
    // Verify current password by attempting sign-in
    const email = usernameToEmail(profile.username)
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    })
    if (verifyErr) return { error: "当前密码不正确" }
    // Update to new password
    const { error: updateErr } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (updateErr) return { error: updateErr.message }
    return { error: null }
  }

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    permissions,
    loading,
    isAdmin: profile?.role === "admin",
    isModerator: profile?.role === "moderator" || profile?.role === "admin",
    signIn,
    signUp,
    signOut,
    refreshProfile,
    changePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
