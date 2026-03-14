const express = require("express")
const router = express.Router()

const movieController = require("../controllers/movieController")
const authMiddleware = require("../middleware/authMiddleware")

router.get("/movies", authMiddleware, movieController.getMovies)
router.get("/movies/new", authMiddleware, movieController.newMovieForm)

router.post("/movies", authMiddleware, movieController.createMovie)

router.get("/movies/:id/edit", authMiddleware, movieController.editMovieForm)
router.post("/movies/:id/update", authMiddleware, movieController.updateMovie)

router.post("/movies/:id/delete", authMiddleware, movieController.deleteMovie)

module.exports = router