const express = require("express")
const router = express.Router()

const screeningController = require("../controllers/screeningController")
const authMiddleware = require("../middleware/authMiddleware")

router.get("/screenings", authMiddleware, screeningController.getScreenings)

router.get("/screenings/new", authMiddleware, screeningController.newScreeningForm)

router.post("/screenings", authMiddleware, screeningController.createScreening)

router.get("/screenings/:id/edit", authMiddleware, screeningController.editScreeningForm)
router.get("/screenings/:id/seats", authMiddleware, screeningController.viewScreeningSeats)

router.post("/screenings/:id/update", authMiddleware, screeningController.updateScreening)

router.post("/screenings/:id/delete", authMiddleware, screeningController.deleteScreening)

module.exports = router