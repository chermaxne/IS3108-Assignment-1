const express = require("express")
const router = express.Router()

const adminController = require("../controllers/adminController")
const bookingController = require("../controllers/bookingController")
const authMiddleware = require("../middleware/authMiddleware")
const adminMiddleware = require("../middleware/adminMiddleware")

router.get("/dashboard", authMiddleware, adminController.dashboard)
router.get("/bookings", authMiddleware, adminMiddleware, bookingController.listBookings)

module.exports = router