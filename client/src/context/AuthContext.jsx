import { useEffect, useMemo, useState } from "react"
import { getCurrentUser, loginWithCredentials, logoutCurrentUser } from "../api"
import AuthContext from "./authContextObject"

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadMe() {
      try {
        const data = await getCurrentUser()
        if (isMounted) {
          setUser(data.user)
        }
      } catch {
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadMe()

    return () => {
      isMounted = false
    }
  }, [])

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    async login(credentials) {
      const data = await loginWithCredentials(credentials)
      setUser(data.user)
      return data.user
    },
    async logout() {
      await logoutCurrentUser()
      setUser(null)
    }
  }), [user, isLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

