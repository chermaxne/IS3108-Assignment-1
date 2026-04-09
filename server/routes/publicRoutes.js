const express = require("express")
const router = express.Router()

const publicController = require("../controllers/publicController")

router.get("/movies", publicController.getMovies)
router.get("/movies/:id", publicController.getMovieDetails)
router.post("/bookings", publicController.createBooking)
router.get("/bookings", publicController.getBookingsByEmail)

module.exports = router
