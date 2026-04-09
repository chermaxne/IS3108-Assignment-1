const express = require("express")
const router = express.Router()

const chainController = require("../controllers/chainController")
const authMiddleware = require("../middleware/authMiddleware")

router.get("/chains", authMiddleware, chainController.getChains)

router.get("/chains/new", authMiddleware, chainController.newChainForm)
router.post("/chains", authMiddleware, chainController.createChain)

router.get("/chains/:id", authMiddleware, chainController.viewChain)

router.get("/chains/:id/edit", authMiddleware, chainController.editChainForm)
router.post("/chains/:id/update", authMiddleware, chainController.updateChain)

router.post("/chains/:id/delete", authMiddleware, chainController.deleteChain)

module.exports = router
