const express = require("express")
const router = express.Router()

const staffController = require("../controllers/staffController")
const authMiddleware = require("../middleware/authMiddleware")
const adminMiddleware = require("../middleware/adminMiddleware")

// All staff routes require authentication
router.use(authMiddleware)

// All staff management routes require admin role
router.use(adminMiddleware)

// List all staff
router.get("/", staffController.listStaff)

// Show create staff form
router.get("/create", staffController.showCreateStaff)

// Create new staff
router.post("/create", staffController.createStaff)

// Show edit staff form
router.get("/edit/:id", staffController.showEditStaff)

// Update staff
router.post("/edit/:id", staffController.updateStaff)

// Show change password form
router.get("/change-password/:id", staffController.showChangePassword)

// Change password
router.post("/change-password/:id", staffController.changePassword)

// Delete staff
router.post("/delete/:id", staffController.deleteStaff)

module.exports = router
