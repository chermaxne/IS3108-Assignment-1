const express = require("express")
const router = express.Router()

const hallController = require("../controllers/hallController")
const authMiddleware = require("../middleware/authMiddleware")
const Chain = require("../models/Chain")

router.get("/halls", authMiddleware, hallController.getHalls)

router.get("/halls/new", authMiddleware, async (req, res) => {
  const chains = await Chain.find({ status: { $ne: "Closed" } }).sort({ name: 1 })
  res.render("auth/hall/createHall", { chains })
})

router.post("/halls", authMiddleware, hallController.createHall)

router.get("/halls/:id/edit", authMiddleware, hallController.editHallForm)
router.post("/halls/:id/update", authMiddleware, hallController.updateHall)

router.get("/halls/:id/layout", authMiddleware, hallController.viewLayout)
router.post("/halls/:id/layout", authMiddleware, hallController.updateLayout)

router.post("/halls/:id/delete", authMiddleware, hallController.deleteHall)

module.exports = router