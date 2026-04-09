import { useEffect, useState } from "react"
import { getDashboardSummary } from "../api"

function StatCard({ label, value, tone }) {
  return (
    <article className={`stat-card ${tone}`}>
      <p className="small-label">{label}</p>
      <h3 className="stat-value">{value}</h3>
    </article>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let isMounted = true

    async function loadSummary() {
      try {
        const data = await getDashboardSummary()
        if (isMounted) {
          setData(data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.error || "Failed to load dashboard data.")
        }
      }
    }

    loadSummary()

    return () => {
      isMounted = false
    }
  }, [])

  if (error) {
    return <p className="error-text">{error}</p>
  }

  if (!data) {
    return <p>Loading dashboard...</p>
  }

  const { stats, recentMovies, upcomingScreenings } = data
  const tones = ["green", "gold", "blue", "purple", "orange", "teal", "gold"]
  const statItems = [
    ["Now Showing", stats.activeMovies],
    ["Today Screenings", stats.todayScreenings],
    ["Available Halls", stats.totalHalls],
    ["Movies", stats.totalMovies],
    ["Active Chains", stats.totalChains],
    ["Active Staff", stats.totalStaff],
    ["This Week", stats.weekScreenings]
  ]

  return (
    <div className="dashboard-grid">
      <div className="stat-grid">
        {statItems.map(([label, value], index) => (
          <StatCard key={label} label={label} value={value} tone={tones[index]} />
        ))}
      </div>

      <section className="list-card">
        <h2 className="card-headline">Recently Added Movies</h2>
        <ul>
          {recentMovies.map((movie) => (
            <li key={movie._id}>{movie.title}</li>
          ))}
        </ul>
      </section>

      <section className="list-card">
        <h2 className="card-headline">Upcoming Screenings</h2>
        <ul>
          {upcomingScreenings.map((screening) => (
            <li key={screening._id}>
              {screening.movie?.title || "Unknown Movie"} - {screening.hall?.name || "Unknown Hall"}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
