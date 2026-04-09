import { Fragment, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { useEffect } from "react"
import { createPublicBooking, getPublicMovieDetails } from "../api"

function buildSeatGrid(rows, columns, soldSet, selectedSet, seatLayout = []) {
  const grid = []

  for (let r = 0; r < rows; r += 1) {
    let value = r + 1
    let rowLabel = ""
    while (value > 0) {
      const remainder = (value - 1) % 26
      rowLabel = String.fromCharCode(65 + remainder) + rowLabel
      value = Math.floor((value - 1) / 26)
    }
    const rowSeats = []

    for (let c = 1; c <= columns; c += 1) {
      const layoutCell = seatLayout?.[r]?.[c - 1]
      const seatType = typeof layoutCell === "string" ? layoutCell.toLowerCase() : "standard"
      const isGap = ["gap", "aisle", "empty"].includes(seatType)
      const isBlocked = seatType === "blocked"
      const isWheelchair = seatType === "wheelchair"
      const label = `${rowLabel}${c}`
      rowSeats.push({
        label,
        seatType,
        isGap,
        isBlocked,
        isWheelchair,
        sold: soldSet.has(label),
        selected: selectedSet.has(label)
      })
    }

    grid.push(rowSeats)
  }

  return grid
}

function shouldInsertCenterAisle(hasGap, seatCount, seatIndex) {
  if (!hasGap || seatCount <= 1) return false
  return seatIndex === Math.floor(seatCount / 2)
}

export default function MovieDetailsPage() {
  const { movieId } = useParams()
  const [movie, setMovie] = useState(null)
  const [screenings, setScreenings] = useState([])
  const [selectedChain, setSelectedChain] = useState("all")
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ name: "", email: localStorage.getItem("cinevillage:lastBookingEmail") || "" })
  const [selectedSeats, setSelectedSeats] = useState([])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(true)
  const [isBooking, setIsBooking] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadMovie() {
      try {
        const data = await getPublicMovieDetails(movieId)
        if (mounted) {
          setMovie(data.movie)
          setScreenings(data.screenings || [])
        }
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.error || "Failed to load movie details.")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadMovie()
    return () => {
      mounted = false
    }
  }, [movieId])

  const chainOptions = useMemo(() => {
    const map = new Map()
    screenings.forEach((screening) => {
      if (!screening.chain?._id) return
      map.set(screening.chain._id, screening.chain)
    })
    return Array.from(map.values())
  }, [screenings])

  const filteredScreenings = useMemo(() => {
    if (selectedChain === "all") return screenings
    return screenings.filter((screening) => screening.chain?._id === selectedChain)
  }, [screenings, selectedChain])

  const screeningsByDate = useMemo(() => {
    const map = new Map()
    filteredScreenings.forEach((screening) => {
      const dateKey = new Date(screening.startTime).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      })

      if (!map.has(dateKey)) map.set(dateKey, [])
      map.get(dateKey).push(screening)
    })

    return Array.from(map.entries())
  }, [filteredScreenings])

  const selectedScreening = useMemo(
    () => screenings.find((screening) => screening._id === selected),
    [screenings, selected]
  )

  const soldSeatSet = useMemo(() => {
    if (!selectedScreening) return new Set()
    return new Set((selectedScreening.soldSeats || []).map((seat) => String(seat).toUpperCase()))
  }, [selectedScreening])

  const seatGrid = useMemo(() => {
    if (!selectedScreening) return []
    const rows = selectedScreening.hall?.rows || 0
    const columns = selectedScreening.hall?.columns || 0
    const seatLayout = selectedScreening.hall?.seatLayout || []
    return buildSeatGrid(rows, columns, soldSeatSet, new Set(selectedSeats), seatLayout)
  }, [selectedScreening, soldSeatSet, selectedSeats])

  const checkoutSummary = useMemo(() => {
    if (!selectedScreening) {
      return { seatCount: 0, pricePerSeat: 0, totalPrice: 0 }
    }

    const pricePerSeat = Number(selectedScreening.pricePerSeat || 0)
    const seatCount = selectedSeats.length
    return {
      seatCount,
      pricePerSeat,
      totalPrice: Number((seatCount * pricePerSeat).toFixed(2))
    }
  }, [selectedScreening, selectedSeats])

  function toggleSeat(label) {
    if (!selectedScreening) return

    const rows = selectedScreening.hall?.rows || 0
    const columns = selectedScreening.hall?.columns || 0
    const seatLayout = selectedScreening.hall?.seatLayout || []
    const parsed = String(label).toUpperCase().match(/^([A-Z]+)(\d+)$/)

    if (!parsed) return

    let rowIndex = 0
    for (let i = 0; i < parsed[1].length; i += 1) {
      rowIndex = rowIndex * 26 + (parsed[1].charCodeAt(i) - 64)
    }
    rowIndex -= 1
    const colIndex = Number(parsed[2]) - 1

    if (rowIndex < 0 || rowIndex >= rows || colIndex < 0 || colIndex >= columns) return

    const layoutCell = seatLayout?.[rowIndex]?.[colIndex]
    const seatType = typeof layoutCell === "string" ? layoutCell.toLowerCase() : "standard"
    if (["gap", "aisle", "empty", "blocked"].includes(seatType) || soldSeatSet.has(label)) return

    setSelectedSeats((prev) => {
      if (prev.includes(label)) {
        return prev.filter((seat) => seat !== label)
      }

      if (prev.length >= 10) {
        setError("You can select up to 10 seats per booking.")
        return prev
      }

      setError("")
      return [...prev, label]
    })
  }

  async function handleBooking(event) {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (!selected) {
      setError("Please choose a screening first.")
      return
    }

    if (selectedSeats.length < 1) {
      setError("Please select at least one seat.")
      return
    }

    setIsBooking(true)

    try {
      const data = await createPublicBooking({
        screeningId: selected,
        name: form.name,
        email: form.email,
        selectedSeats
      })

      const booking = data.booking
      const screeningPricePerSeat = Number(selectedScreening?.pricePerSeat)
      const bookedPricePerSeat = Number(booking.pricePerSeat || 0)
      const pricePerSeat = Number.isFinite(screeningPricePerSeat) && screeningPricePerSeat >= 0
        ? screeningPricePerSeat
        : bookedPricePerSeat
      const seatCount = Number(booking.seatCount || booking.selectedSeats?.length || 0)
      const totalPrice = Number((pricePerSeat * seatCount).toFixed(2))
      setSuccess(
        `Booked successfully. Confirmation: ${booking.confirmationCode}. Seats: ${booking.selectedSeats.join(", ")}. ${seatCount} seat(s) x SGD ${pricePerSeat.toFixed(2)} = SGD ${totalPrice.toFixed(2)}.`
      )
      localStorage.setItem("cinevillage:lastBookingEmail", form.email.trim().toLowerCase())
      setForm({ name: "", email: form.email.trim().toLowerCase() })
      setSelectedSeats([])
      setSelected(null)

      const refreshedData = await getPublicMovieDetails(movieId)
      setMovie(refreshedData.movie)
      setScreenings(refreshedData.screenings || [])
    } catch (err) {
      const statusCode = err?.response?.status
      const apiCode = err?.response?.data?.code
      const apiError = err?.response?.data?.error || "Failed to complete booking."
      const normalizedError = String(apiError).toLowerCase()
      const isConcurrencyError = statusCode === 409 || apiCode === "SEAT_TAKEN" || normalizedError.includes("already sold") || normalizedError.includes("only")

      if (isConcurrencyError) {
        const message = "One or more seats were just taken by someone else. Please reselect seats and try again."
        setError(message)
        window.alert(message)
      } else {
        setError(apiError)
      }
    } finally {
      setIsBooking(false)
    }
  }

  if (loading) return <p>Loading movie details...</p>
  if (error && !movie) return <p className="error-text">{error}</p>

  return (
    <section className="movie-detail-wrap">
      <div className="booking-hero">
        <div className="booking-poster-shell">
          {movie.posterUrl ? (
            <img className="booking-poster" src={movie.posterUrl} alt={movie.title} />
          ) : (
            <div className="booking-poster-fallback">No Poster</div>
          )}
        </div>

        <div className="booking-hero-content">
          <h2 className="section-title">{movie.title}</h2>
          <p className="booking-meta-line">
            {movie.genre || "Genre TBA"} • {movie.duration || "-"} minutes • {movie.language || "-"}
          </p>
          <h3>Synopsis</h3>
          <p className="description">{movie.description || "No synopsis available yet."}</p>
        </div>
      </div>

      <div className="booking-panels">
        <aside className="cinema-picker-panel">
          <h3>Select a cinema</h3>
          <div className="cinema-list">
            <button
              type="button"
              className={`cinema-chip ${selectedChain === "all" ? "active" : ""}`}
              onClick={() => {
                setSelectedChain("all")
                setSelected(null)
                setSelectedSeats([])
                setError("")
                setSuccess("")
              }}
            >
              All Cinemas
            </button>
            {chainOptions.map((chain) => (
              <button
                key={chain._id}
                type="button"
                className={`cinema-chip ${selectedChain === chain._id ? "active" : ""}`}
                onClick={() => {
                  setSelectedChain(chain._id)
                  setSelected(null)
                  setSelectedSeats([])
                  setError("")
                  setSuccess("")
                }}
              >
                {chain.name}
              </button>
            ))}
          </div>
        </aside>

        <div className="showtime-list booking-time-panel">
          <h3>Select time slot for {movie.title}</h3>
          {screeningsByDate.length === 0 ? <p>No upcoming screenings available.</p> : null}

          {screeningsByDate.map(([dateLabel, dateScreenings]) => (
            <div key={dateLabel} className="timeslot-day-group">
              <p className="timeslot-day-label">{dateLabel}</p>
              <div className="timeslot-buttons">
                {dateScreenings.map((screening) => (
                  <button
                    key={screening._id}
                    type="button"
                    className={`timeslot-btn ${selected === screening._id ? "active" : ""}`}
                    onClick={() => {
                      setSelected(screening._id)
                      setSelectedSeats([])
                      setError("")
                      setSuccess("")
                    }}
                  >
                    {new Date(screening.startTime).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                    <span style={{ display: "block", fontSize: "0.72rem", opacity: 0.85 }}>
                      {screening.hall?.hallType || "Standard"} · SGD {Number(screening.pricePerSeat || 0).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {success ? <p className="success-text booking-success-banner">{success}</p> : null}

      {selectedScreening ? (
        <form className="booking-form" onSubmit={handleBooking}>
          <h3>Complete Booking</h3>
          <p>
            {movie.title} • {new Date(selectedScreening.startTime).toLocaleString()} • {selectedScreening.chain.name} • {selectedScreening.hall.name}
          </p>

          <p className="small-meta">
            Pick your seats ({selectedSeats.length} selected)
          </p>

          <div className="checkout-summary">
            <h4>Checkout</h4>
            <p>Seats: {selectedSeats.length > 0 ? selectedSeats.join(", ") : "None selected"}</p>
            <p>
              Total: {checkoutSummary.seatCount} x SGD {checkoutSummary.pricePerSeat.toFixed(2)} = SGD {checkoutSummary.totalPrice.toFixed(2)}
            </p>
          </div>

          <div className="seat-picker-wrap">
            <div className="seat-picker-stage">
              <div className="seat-screen">Screen</div>
            </div>
            <div className="seat-picker-grid">
              {seatGrid.map((row, rowIndex) => (
                <div key={`row-${rowIndex}`} className="seat-picker-row">
                  <span className="seat-row-label">
                    {(row.find((seat) => !seat.isGap)?.label || String.fromCharCode(65 + rowIndex)).replace(/\d+/g, "")}
                  </span>
                  <div className="seat-row-seats">
                      {row.map((seat, seatIndex) => (
                        <Fragment key={seat.label}>
                          {shouldInsertCenterAisle(selectedScreening.hall?.hasGap, row.length, seatIndex) ? (
                            <span className="seat-picker gap" aria-hidden="true" />
                          ) : null}
                          {seat.isGap ? (
                            <span className="seat-picker gap" aria-hidden="true" />
                          ) : (
                            <button
                              type="button"
                              className={`seat-picker ${seat.isBlocked ? "blocked" : (seat.sold ? "sold" : "available")} ${seat.isWheelchair ? "wheelchair" : ""} ${seat.selected ? "selected" : ""}`}
                              onClick={() => toggleSeat(seat.label)}
                              disabled={seat.sold || seat.isBlocked}
                              title={seat.isWheelchair ? `${seat.label} (Wheelchair)` : (seat.isBlocked ? `${seat.label} (Blocked)` : seat.label)}
                            >
                              {seat.isWheelchair ? "♿" : seat.label}
                            </button>
                          )}
                        </Fragment>
                      ))}
                  </div>
                  <span className="seat-row-label">
                    {(row.find((seat) => !seat.isGap)?.label || String.fromCharCode(65 + rowIndex)).replace(/\d+/g, "")}
                  </span>
                </div>
              ))}
            </div>
            <div className="seat-picker-legend">
              <span className="legend available">Available</span>
              <span className="legend wheelchair">Wheelchair</span>
              <span className="legend blocked">Blocked</span>
              <span className="legend selected">Selected</span>
              <span className="legend sold">Sold</span>
            </div>
          </div>

          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />

          {error ? <p className="error-text">{error}</p> : null}
          <div className="booking-actions">
            <button className="cta small" type="submit" disabled={isBooking}>
              {isBooking ? "Booking..." : "Book"}
            </button>
            <button className="secondary small" type="button" onClick={() => setSelected(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </section>
  )
}
