const Movie = require("../models/Movie")
const Screening = require("../models/Screening")
const Booking = require("../models/Booking")
const Chain = require("../models/Chain")
const { validateEmail, validateCustomerName, validateSeatLabel } = require("../utils/validators")

function hallPrice(hallType) {
  const normalizedHallType = String(hallType || "").trim().toUpperCase()
  const prices = {
    STANDARD: 12,
    IMAX: 18,
    VIP: 22,
    "4DX": 20,
    "DOLBY ATMOS": 16
  }

  return prices[normalizedHallType] || 12
}

function screeningPrice(screening) {
  const hallType = screening && screening.hall ? screening.hall.hallType : null
  return hallPrice(hallType)
}

function normalizeCurrency(value) {
  return Number(Number(value || 0).toFixed(2))
}

function buildConfirmationCode() {
  const stamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `CV-${stamp}-${random}`
}

function rowIndexToLetters(rowIndex) {
  let value = rowIndex + 1
  let label = ""

  while (value > 0) {
    const remainder = (value - 1) % 26
    label = String.fromCharCode(65 + remainder) + label
    value = Math.floor((value - 1) / 26)
  }

  return label
}

function normalizeSeatLabel(label) {
  return String(label || "").trim().toUpperCase()
}

function isSeatLayoutGap(value) {
  return typeof value === "string" && ["gap", "aisle", "empty", "blocked"].includes(value.toLowerCase())
}

function buildSeatLabelsFromHall(hall) {
  const rows = Number(hall && hall.rows) || 0
  const columns = Number(hall && hall.columns) || 0
  const seatLayout = Array.isArray(hall && hall.seatLayout) ? hall.seatLayout : []
  const labels = []

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < columns; c += 1) {
      const layoutCell = seatLayout?.[r]?.[c]
      if (isSeatLayoutGap(layoutCell)) continue
      labels.push(`${rowIndexToLetters(r)}${c + 1}`)
    }
  }

  if (labels.length === 0 && rows > 0 && columns > 0) {
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < columns; c += 1) {
        labels.push(`${rowIndexToLetters(r)}${c + 1}`)
      }
    }
  }

  return labels
}

function parseSeatLabel(label) {
  const normalized = normalizeSeatLabel(label)
  const match = normalized.match(/^([A-Z]+)(\d+)$/)
  if (!match) return null

  const rowLetters = match[1]
  const colNumber = Number(match[2])
  if (Number.isNaN(colNumber) || colNumber < 1) return null

  let rowNumber = 0
  for (let i = 0; i < rowLetters.length; i += 1) {
    rowNumber = rowNumber * 26 + (rowLetters.charCodeAt(i) - 64)
  }

  return {
    rowIndex: rowNumber - 1,
    colIndex: colNumber - 1
  }
}

function isSeatWithinHall(label, rows, columns) {
  const parsed = parseSeatLabel(label)
  if (!parsed) return false

  return (
    parsed.rowIndex >= 0 && parsed.rowIndex < rows &&
    parsed.colIndex >= 0 && parsed.colIndex < columns
  )
}

async function getLegacySoldSeatsByScreening(screeningIds, seatLabelsByScreening = new Map()) {
  if (!Array.isArray(screeningIds) || screeningIds.length === 0) {
    return new Map()
  }

  const bookings = await Booking.find({ screening: { $in: screeningIds } }).select("screening selectedSeats seatCount")
  const soldSeatMap = new Map()

  bookings.forEach((booking) => {
    const screeningId = booking.screening.toString()
    if (!soldSeatMap.has(screeningId)) soldSeatMap.set(screeningId, new Set())

    const soldSeats = Array.isArray(booking.selectedSeats) ? booking.selectedSeats : []
    soldSeats.forEach((seat) => soldSeatMap.get(screeningId).add(normalizeSeatLabel(seat)))
  })

  bookings.forEach((booking) => {
    const screeningId = booking.screening.toString()
    const soldSet = soldSeatMap.get(screeningId)
    if (!soldSet) return

    const selectedSeats = Array.isArray(booking.selectedSeats) ? booking.selectedSeats : []
    if (selectedSeats.length > 0) return

    const labels = seatLabelsByScreening.get(screeningId) || []
    let seatPointer = 0
    for (let i = 0; i < Number(booking.seatCount || 0); i += 1) {
      while (seatPointer < labels.length) {
        const label = labels[seatPointer]
        seatPointer += 1
        if (!soldSet.has(label)) {
          soldSet.add(label)
          break
        }
      }
    }
  })

  return soldSeatMap
}

exports.getMovies = async (req, res) => {
  try {
    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    const statusFilter = req.query.status
    const locationFilter = req.query.location

    const [movies, chains, screenings] = await Promise.all([
      Movie.find().populate("chains").sort({ releaseDate: -1, title: 1 }),
      Chain.find({ status: "Active" }).sort({ name: 1 }),
      Screening.find({ startTime: { $gte: now } })
        .populate("movie")
        .populate({ path: "hall", populate: { path: "chain" } })
        .sort({ startTime: 1 })
    ])

    const nextScreeningMap = new Map()
    screenings.forEach((screening) => {
      if (!screening.movie) return

      const movieId = screening.movie._id.toString()
      if (!nextScreeningMap.has(movieId)) {
        nextScreeningMap.set(movieId, screening.startTime)
      }
    })

    const locations = chains.map((chain) => ({
      chainId: chain._id.toString(),
      name: chain.name,
      location: chain.location
    }))

    const discoveredMovies = movies
      .map((movie) => {
        const movieChains = Array.isArray(movie.chains) ? movie.chains : []
        const hasChains = movieChains.length > 0

        if (locationFilter && hasChains) {
          const hasMatchingChain = movieChains.some((chain) => {
            if (!chain || !chain._id) return false
            return chain._id.toString() === locationFilter
          })

          if (!hasMatchingChain) {
            return null
          }
        } else if (locationFilter && !hasChains) {
          return null
        }

        const release = movie.releaseDate ? new Date(movie.releaseDate) : null
        let status = "now-showing"

        if (release) {
          const releaseDateOnly = new Date(release)
          releaseDateOnly.setHours(0, 0, 0, 0)

          if (releaseDateOnly > today) {
            status = "coming-soon"
          }
        }

        if (statusFilter && statusFilter !== status) {
          return null
        }

        return {
          _id: movie._id,
          title: movie.title,
          description: movie.description,
          duration: movie.duration,
          genre: movie.genre,
          language: movie.language,
          rating: movie.rating,
          posterUrl: movie.posterUrl,
          releaseDate: movie.releaseDate,
          status,
          nextScreening: nextScreeningMap.get(movie._id.toString()) || null,
          chains: movieChains.map((chain) => ({
            _id: chain._id,
            name: chain.name,
            location: chain.location
          }))
        }
      })
      .filter(Boolean)

    return res.json({ movies: discoveredMovies, locations })
  } catch (error) {
    return res.status(500).json({ error: "Failed to load movies." })
  }
}

exports.getMovieDetails = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id)
    if (!movie) {
      return res.status(404).json({ error: "Movie not found." })
    }

    const now = new Date()
    const screenings = await Screening.find({
      movie: movie._id
    })
      .populate({ path: "hall", populate: { path: "chain" } })
      .sort({ startTime: 1 })

    const screeningIds = screenings.map((screening) => screening._id)

    const seatLabelsByScreening = new Map()
    screenings.forEach((screening) => {
      const hall = screening.hall || {}
      const rows = Number(hall.rows) || 0
      const columns = Number(hall.columns) || 0
      const seatLayout = Array.isArray(hall.seatLayout) ? hall.seatLayout : []
      const labels = []

      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < columns; c += 1) {
          const layoutCell = seatLayout?.[r]?.[c]
          if (isSeatLayoutGap(layoutCell)) continue
          labels.push(`${rowIndexToLetters(r)}${c + 1}`)
        }
      }

      if (labels.length === 0 && rows > 0 && columns > 0) {
        for (let r = 0; r < rows; r += 1) {
          for (let c = 0; c < columns; c += 1) {
            labels.push(`${rowIndexToLetters(r)}${c + 1}`)
          }
        }
      }

      seatLabelsByScreening.set(screening._id.toString(), labels)
    })

    const legacySoldSeatMap = await getLegacySoldSeatsByScreening(screeningIds, seatLabelsByScreening)

    const formattedScreenings = screenings
      .filter((screening) => screening.hall && screening.hall.chain)
      .map((screening) => ({
        _id: screening._id,
        startTime: screening.startTime,
        endTime: screening.endTime,
        hall: {
          _id: screening.hall._id,
          name: screening.hall.name,
          hallType: screening.hall.hallType,
          rows: screening.hall.rows,
          columns: screening.hall.columns,
          hasGap: Boolean(screening.hall.hasGap),
          seatLayout: screening.hall.seatLayout
        },
        chain: {
          _id: screening.hall.chain._id,
          name: screening.hall.chain.name,
          location: screening.hall.chain.location
        },
        pricePerSeat: screeningPrice(screening) === null ? null : normalizeCurrency(screeningPrice(screening)),
        soldSeats: Array.from(new Set([
          ...((screening.soldSeats || []).map((seat) => normalizeSeatLabel(seat))),
          ...(Array.from(legacySoldSeatMap.get(screening._id.toString()) || []))
        ]))
      }))

    return res.json({ movie, screenings: formattedScreenings })
  } catch (error) {
    return res.status(500).json({ error: "Failed to load movie details." })
  }
}

exports.createBooking = async (req, res) => {
  try {
    const payload = req.body || {}
    const screeningId = String(payload.screeningId || "").trim()
    const name = String(payload.name || "").trim()
    const email = String(payload.email || "").trim()

    let selectedSeats = payload.selectedSeats
    if (typeof selectedSeats === "string") {
      const raw = selectedSeats.trim()
      if (raw.startsWith("[")) {
        try {
          const parsed = JSON.parse(raw)
          selectedSeats = Array.isArray(parsed) ? parsed : []
        } catch {
          selectedSeats = []
        }
      } else if (raw.length > 0) {
        selectedSeats = raw.split(",").map((seat) => seat.trim()).filter(Boolean)
      }
    }

    const missingFields = []
    if (!screeningId) missingFields.push("screening")
    if (!name) missingFields.push("customer name")
    if (!email) missingFields.push("customer email")
    if (!Array.isArray(selectedSeats)) missingFields.push("selected seats")

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required field(s): ${missingFields.join(", ")}.`
      })
    }

    // Validate email format
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      return res.status(400).json({ error: emailValidation.error })
    }

    // Validate customer name
    const nameValidation = validateCustomerName(name)
    if (!nameValidation.isValid) {
      return res.status(400).json({ error: nameValidation.error })
    }

    const normalizedSeats = selectedSeats
      .map((seat) => normalizeSeatLabel(seat))
      .filter(Boolean)

    // Validate each seat label format
    for (const seat of selectedSeats) {
      const seatValidation = validateSeatLabel(seat)
      if (!seatValidation.isValid) {
        return res.status(400).json({ error: `Invalid seat: ${seatValidation.error}` })
      }
    }

    const uniqueSeatSet = new Set(normalizedSeats)
    if (uniqueSeatSet.size !== normalizedSeats.length) {
      return res.status(400).json({ error: "Duplicate seats selected." })
    }

    if (normalizedSeats.length < 1 || normalizedSeats.length > 10) {
      return res.status(400).json({ error: "You can book between 1 and 10 seats." })
    }

    const screening = await Screening.findById(screeningId)
      .populate("movie")
      .populate({ path: "hall", populate: { path: "chain" } })

    if (!screening || !screening.hall || !screening.movie) {
      return res.status(404).json({ error: "Screening not found." })
    }

    if (new Date(screening.startTime) <= new Date()) {
      return res.status(400).json({ error: "This screening has already started." })
    }

    const validSeatLabels = buildSeatLabelsFromHall(screening.hall)
    const capacity = validSeatLabels.length
    const allSeatLabels = new Set(validSeatLabels)

    const isInvalidSeat = normalizedSeats.some(
      (seat) => !allSeatLabels.has(seat) || !isSeatWithinHall(seat, screening.hall.rows, screening.hall.columns)
    )
    if (isInvalidSeat) {
      return res.status(400).json({ error: "One or more selected seats are invalid for this hall." })
    }

    const reserveQuery = {
      _id: screening._id,
      startTime: { $gt: new Date() },
      soldSeats: { $nin: normalizedSeats }
    }

    const reserveUpdate = {
      $addToSet: {
        soldSeats: { $each: normalizedSeats }
      }
    }

    const reserveResult = await Screening.updateOne(reserveQuery, reserveUpdate)
    const seatsReserved = reserveResult.modifiedCount === 1

    if (!seatsReserved) {
      return res.status(409).json({
        error: "One or more seats were just taken by another booking.",
        code: "SEAT_TAKEN"
      })
    }

    const screeningTicketPrice = screeningPrice(screening)
    if (screeningTicketPrice === null) {
      return res.status(400).json({
        error: "This screening has no ticket price configured. Please contact support."
      })
    }

    const pricePerSeat = normalizeCurrency(screeningTicketPrice)
    const totalPrice = normalizeCurrency(pricePerSeat * normalizedSeats.length)

    let booking
    try {
      booking = await Booking.create({
        screening: screening._id,
        name,
        email: email.toLowerCase(),
        seatCount: normalizedSeats.length,
        selectedSeats: normalizedSeats,
        pricePerSeat,
        totalPrice,
        confirmationCode: buildConfirmationCode()
      })
    } catch (error) {
      await Screening.updateOne(
        { _id: screening._id },
        { $pull: { soldSeats: { $in: normalizedSeats } } }
      )
      throw error
    }

    return res.status(201).json({
      booking: {
        id: booking._id,
        confirmationCode: booking.confirmationCode,
        seatCount: booking.seatCount,
        selectedSeats: booking.selectedSeats,
        pricePerSeat: booking.pricePerSeat,
        totalPrice: booking.totalPrice,
        movieTitle: screening.movie.title,
        startTime: screening.startTime,
        chainName: screening.hall.chain ? screening.hall.chain.name : "",
        hallName: screening.hall.name
      }
    })
  } catch (error) {
    return res.status(500).json({ error: "Failed to complete booking." })
  }
}

exports.getBookingsByEmail = async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase()

    if (!email) {
      return res.status(400).json({ error: "Email is required." })
    }

    const bookings = await Booking.find({ email })
      .populate({
        path: "screening",
        populate: [
          { path: "movie", select: "title" },
          { path: "hall", select: "name", populate: { path: "chain", select: "name location" } }
        ]
      })
      .sort({ createdAt: -1 })

    const formatted = bookings
      .filter((booking) => booking.screening)
      .map((booking) => ({
        id: booking._id,
        confirmationCode: booking.confirmationCode,
        createdAt: booking.createdAt,
        seatCount: booking.seatCount,
        selectedSeats: booking.selectedSeats,
        pricePerSeat: booking.pricePerSeat,
        totalPrice: booking.totalPrice,
        screening: {
          id: booking.screening._id,
          startTime: booking.screening.startTime,
          endTime: booking.screening.endTime,
          movieTitle: booking.screening.movie ? booking.screening.movie.title : "Unknown Movie",
          hallName: booking.screening.hall ? booking.screening.hall.name : "Unknown Hall",
          chainName: booking.screening.hall && booking.screening.hall.chain
            ? booking.screening.hall.chain.name
            : "Unknown Cinema",
          chainLocation: booking.screening.hall && booking.screening.hall.chain
            ? booking.screening.hall.chain.location
            : ""
        }
      }))

    return res.json({ bookings: formatted })
  } catch (error) {
    return res.status(500).json({ error: "Failed to load booking history." })
  }
}
