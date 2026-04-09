import { useState } from "react"
import { getPublicBookingsByEmail } from "../api"

export default function MyTicketsPage() {
  const [email, setEmail] = useState(localStorage.getItem("cinevillage:lastBookingEmail") || "")
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searched, setSearched] = useState(false)

  async function handleSearch(event) {
    event.preventDefault()
    setError("")
    setLoading(true)
    setSearched(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      localStorage.setItem("cinevillage:lastBookingEmail", normalizedEmail)

      const data = await getPublicBookingsByEmail(normalizedEmail)

      setBookings(data.bookings || [])
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load tickets.")
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="tickets-wrap">
      <div className="tickets-header">
        <p className="eyebrow">Booking History</p>
        <h1 className="section-title">My Tickets</h1>
        <p className="hero-copy">Enter the same email used during checkout to see your confirmations.</p>
      </div>

      <form className="tickets-search-form" onSubmit={handleSearch}>
        <label htmlFor="ticketsEmail">Email</label>
        <input
          id="ticketsEmail"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />
        <button className="cta small" type="submit" disabled={loading}>
          {loading ? "Loading..." : "Find Tickets"}
        </button>
      </form>

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p>Loading tickets...</p> : null}

      {!loading && searched && bookings.length === 0 && !error ? (
        <div className="empty-state-card">No bookings found for this email yet.</div>
      ) : null}

      {!loading && bookings.length > 0 ? (
        <div className="tickets-list">
          {bookings.map((booking) => (
            <article key={booking.id} className="ticket-card">
              <div className="ticket-top">
                <h3>{booking.screening.movieTitle}</h3>
                <span className="status-badge live">{booking.confirmationCode}</span>
              </div>

              <p className="small-meta">
                {new Date(booking.screening.startTime).toLocaleString()} • {booking.screening.chainName} • {booking.screening.hallName}
              </p>
              <p className="small-meta">Seats: {(booking.selectedSeats || []).join(", ") || "-"}</p>
              <p className="small-meta">
                {Number(booking.seatCount || 0)} x SGD {Number(booking.pricePerSeat || 0).toFixed(2)} = SGD {Number(booking.totalPrice || 0).toFixed(2)}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
