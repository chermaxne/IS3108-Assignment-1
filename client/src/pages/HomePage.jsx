import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getPublicMovies } from "../api"

export default function HomePage() {
  const [movies, setMovies] = useState([])
  const [locations, setLocations] = useState([])
  const [status, setStatus] = useState("all")
  const [location, setLocation] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    async function loadMovies() {
      setLoading(true)
      setError("")

      try {
        const data = await getPublicMovies({ status, location })

        if (mounted) {
          setMovies(data.movies || [])
          setLocations(data.locations || [])
        }
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.error || "Failed to load movies.")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadMovies()

    return () => {
      mounted = false
    }
  }, [status, location])

  return (
    <section className="discover-section">
      <div className="discover-head">
        <p className="eyebrow">Movie Discovery</p>
        <h1>Find Your Next Movie Night</h1>
        <p className="hero-copy">Browse active movies and jump into upcoming screening times.</p>
      </div>

      <div className="filter-row">
        <button
          className={status === "all" ? "chip active" : "chip"}
          onClick={() => setStatus("all")}
          type="button"
        >
          All Movies
        </button>
        <button
          className={status === "now-showing" ? "chip active" : "chip"}
          onClick={() => setStatus("now-showing")}
          type="button"
        >
          Now Showing
        </button>
        <button
          className={status === "coming-soon" ? "chip active" : "chip"}
          onClick={() => setStatus("coming-soon")}
          type="button"
        >
          Coming Soon
        </button>
      </div>

      <div className="filter-row location-row">
        <button
          className={location === "all" ? "chip active" : "chip"}
          onClick={() => setLocation("all")}
          type="button"
        >
          All Locations
        </button>
        {locations.map((item) => (
          <button
            key={item.chainId}
            className={location === item.chainId ? "chip active" : "chip"}
            onClick={() => setLocation(item.chainId)}
            type="button"
          >
            {item.name}
          </button>
        ))}
      </div>

      {loading ? <p>Loading movies...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && !error ? (
        <div className="movie-grid">
          {movies.map((movie) => (
            <article key={movie._id} className="movie-card">
              <div className="movie-poster-slot">
                {movie.posterUrl ? <img src={movie.posterUrl} alt={movie.title} /> : <span>No Poster</span>}
              </div>

              <div className="movie-content">
                <h3>{movie.title}</h3>

                <Link className="cta small" to={`/movies/${movie._id}`}>
                  View Details
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {!loading && !error && movies.length === 0 ? (
        <div className="empty-state-card">No movies available for this filter yet.</div>
      ) : null}
    </section>
  )
}
