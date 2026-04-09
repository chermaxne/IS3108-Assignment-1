import { NavLink, Outlet } from "react-router-dom"

export default function PublicLayout() {
  return (
    <div className="public-app">
      <main className="public-main">
        <aside className="side-panel">
          <div className="side-brand">
            <h1 className="side-brand-name">CineVillage</h1>
            <p className="side-brand-sub">Guest Portal</p>
          </div>

          <nav className="side-nav">
            <p className="side-section">Overview</p>

            <NavLink to="/" end className={({ isActive }) => isActive ? "side-link active" : "side-link"}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Home
            </NavLink>

            <p className="side-section">Discover</p>

            <NavLink to="/movies" className={({ isActive }) => isActive ? "side-link active" : "side-link"}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
              Movies
            </NavLink>

            <NavLink to="/my-tickets" className={({ isActive }) => isActive ? "side-link active" : "side-link"}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4z"/><path d="M12 5v14"/></svg>
              My Tickets
            </NavLink>
          </nav>
        </aside>

        <section className="public-content">
          <Outlet />
        </section>
      </main>
    </div>
  )
}
