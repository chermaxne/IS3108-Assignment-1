import { NavLink, Outlet, useNavigate } from "react-router-dom"
import useAuth from "../context/useAuth"

const navOverview = [
  { to: "/dashboard", label: "Dashboard" }
]

const navManagement = [
  { to: "/chains", label: "Chains" },
  { to: "/halls", label: "Halls" },
  { to: "/movies", label: "Movies" },
  { to: "/screenings", label: "Screenings" }
]

export default function AppLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  })

  async function handleLogout() {
    await logout()
    navigate("/login")
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1 className="brand">CineVillage</h1>
          <p className="brand-sub">Admin Portal</p>
        </div>
        <nav className="nav-list">
          <p className="nav-section">Overview</p>
          {navOverview.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              {item.label}
            </NavLink>
          ))}

          <p className="nav-section">Management</p>
          {navManagement.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              {item.label}
            </NavLink>
          ))}

          {user?.role === "admin" ? (
            <NavLink
              to="/staff"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              Staff Management
            </NavLink>
          ) : null}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-title">Dashboard</div>
          <div className="topbar-right">
            <span>Welcome, <strong className="user-label">{user?.username || "Manager"}</strong></span>
            <span className="badge-date">{today}</span>
          </div>
        </header>

        <section className="content-panel">
          <Outlet />
        </section>
      </main>
    </div>
  )
}
