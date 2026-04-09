import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import useAuth from "../context/useAuth"

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, isLoading } = useAuth()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true })
    }
  }, [isLoading, isAuthenticated, navigate])

  const redirectPath = location.state?.from?.pathname || "/dashboard"

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      await login({ username, password })
      navigate(redirectPath, { replace: true })
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-wrapper">
        <div className="login-brand">
          <h1>CineVillage</h1>
          <p className="brand-tagline">Internal Staff Portal</p>
        </div>

        <form className="login-card" onSubmit={handleSubmit}>
          <h2 className="card-title">Staff Sign In</h2>
          <p className="muted">Access restricted to authorised personnel only.</p>

          {error ? <p className="error-banner">{error}</p> : null}

          <label htmlFor="username">Username</label>
          <input
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter your username"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
          />

          <button type="submit" className="btn btn-login" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="footer-note">© {new Date().getFullYear()} CineVillage Management Systems</p>
      </div>
    </div>
  )
}
