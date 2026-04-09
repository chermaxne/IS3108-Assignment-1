import http from "./http"

export async function getPublicMovies(filters = {}) {
  const response = await http.get("/api/public/movies", {
    params: {
      status: filters.status === "all" ? undefined : filters.status,
      location: filters.location === "all" ? undefined : filters.location
    }
  })

  return response.data
}

export async function getPublicMovieDetails(movieId) {
  const response = await http.get(`/api/public/movies/${movieId}`)
  return response.data
}

export async function createPublicBooking(payload) {
  const response = await http.post("/api/public/bookings", payload)
  return response.data
}

export async function getPublicBookingsByEmail(email) {
  const response = await http.get("/api/public/bookings", {
    params: { email }
  })

  return response.data
}