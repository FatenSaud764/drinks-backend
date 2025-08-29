// Minimal client-side auth state (no server auth)
import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  // Read initial user from localStorage
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('swiftserve_user')
    return saved ? JSON.parse(saved) : null
  })

  // Keep localStorage in sync with user state
  useEffect(() => {
    if (user) localStorage.setItem('swiftserve_user', JSON.stringify(user))
    else localStorage.removeItem('swiftserve_user')
  }, [user])

  // Fake login/logout helpers
  const login = (username = 'guest') => setUser({ id: 1, username })
  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
