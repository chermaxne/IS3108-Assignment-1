const Movie = require("../models/Movie")       
const Screening = require("../models/Screening")
const Chain = require("../models/Chain") 

// get all movies for listing
exports.getMovies = async (req,res)=>{
  try {
    const { genre, language, rating, chain, sort } = req.query

    // Build filter
    const filter = {}
    if (genre) filter.genre = genre
    if (language) filter.language = language
    if (rating) filter.rating = rating
    if (chain) filter.chains = chain

    // Build sort
    let sortObj = { title: 1 }
    if (sort === 'title-desc') sortObj = { title: -1 }
    else if (sort === 'duration-asc') sortObj = { duration: 1 }
    else if (sort === 'duration-desc') sortObj = { duration: -1 }
    else if (sort === 'release-new') sortObj = { releaseDate: -1 }
    else if (sort === 'release-old') sortObj = { releaseDate: 1 }

    const movies = await Movie.find(filter).populate("chains").sort(sortObj)

    // Get distinct values for filter dropdowns
    const genres = await Movie.distinct("genre")
    const languages = await Movie.distinct("language")
    const ratings = await Movie.distinct("rating")
    const chains = await Chain.find().sort({ name: 1 })

    res.render("auth/movie/movieList", {
      movies,
      genres: genres.filter(Boolean).sort(),
      languages: languages.filter(Boolean).sort(),
      ratings: ratings.filter(Boolean).sort(),
      chains,
      filters: { genre: genre || '', language: language || '', rating: rating || '', chain: chain || '', sort: sort || '' }
    })
  } catch (error) {
    req.flash("error", error.message)
    res.redirect("/admin/dashboard")
  }
}

// render new movie form
exports.newMovieForm = async (req, res) => {
  const chains = await Chain.find({ status: { $ne: "Closed" } }).sort({ name: 1 })
  res.render("auth/movie/newMovie", { chains })
}

// render edit movie form
exports.editMovieForm = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).populate("chains")
    if (!movie) {
      req.flash("error", "Movie not found.")
      return res.redirect("/admin/movies")
    }
    const chains = await Chain.find({ status: { $ne: "Closed" } }).sort({ name: 1 })
    res.render("auth/movie/editMovie", { movie, chains })
  } catch (error) {
    req.flash("error", error.message)
    res.redirect("/admin/movies")
  }
}

// create new movie
exports.createMovie = async (req,res)=>{

  try {
    const { title, description, duration, genre, language, releaseDate, rating, chains, posterUrl } = req.body

    // Server-side validation
    if (!title || !title.trim()) {
      req.flash("error", "Movie title is required.")
      return res.redirect("/admin/movies/new")
    }

    if (!duration || duration < 1) {
      req.flash("error", "Duration must be at least 1 minute.")
      return res.redirect("/admin/movies/new")
    }

    if (duration > 600) {
      req.flash("error", "Duration cannot exceed 600 minutes.")
      return res.redirect("/admin/movies/new")
    }

    // Normalise chains to always be an array
    let chainIds = []
    if (chains) {
      chainIds = Array.isArray(chains) ? chains : [chains]
    }

    await Movie.create({
      title: title.trim(),
      description,
      duration,
      genre,
      language,
      releaseDate,
      rating,
      posterUrl: posterUrl || "",
      chains: chainIds
    })

    req.flash("success", "Movie '" + title.trim() + "' created successfully.")
    res.redirect("/admin/movies")
  } catch (error) {
    req.flash("error", error.message)
    res.redirect("/admin/movies/new")
  }

}

// update movie
exports.updateMovie = async (req,res)=>{

  try {
    const movieId = req.params.id

    if (!req.body.title || !req.body.title.trim()) {
      req.flash("error", "Movie title is required.")
      return res.redirect("/admin/movies/" + movieId + "/edit")
    }

    if (!req.body.duration || req.body.duration < 1) {
      req.flash("error", "Duration must be at least 1 minute.")
      return res.redirect("/admin/movies/" + movieId + "/edit")
    }

    // Normalise chains to always be an array
    let chainIds = []
    if (req.body.chains) {
      chainIds = Array.isArray(req.body.chains) ? req.body.chains : [req.body.chains]
    }

    await Movie.findByIdAndUpdate(movieId, {
      title: req.body.title.trim(),
      description: req.body.description,
      duration: req.body.duration,
      genre: req.body.genre,
      language: req.body.language,
      releaseDate: req.body.releaseDate,
      rating: req.body.rating,
      posterUrl: req.body.posterUrl || "",
      chains: chainIds
    })

    req.flash("success", "Movie updated successfully.")
    res.redirect("/admin/movies")
  } catch (error) {
    req.flash("error", error.message)
    res.redirect("/admin/movies/" + req.params.id + "/edit")
  }

}

// delete movie with validation
exports.deleteMovie = async (req,res)=>{
  try {
    const movieId = req.params.id

    const futureScreenings = await Screening.findOne({
      movie: movieId,
      startTime: { $gte: new Date() }
    })

    if(futureScreenings){
      req.flash("error", "Cannot delete this movie — it has future screenings scheduled.")
      return res.redirect("/admin/movies")
    }

    await Movie.findByIdAndDelete(movieId)

    req.flash("success", "Movie deleted successfully.")
    res.redirect("/admin/movies")
  } catch (error) {
    req.flash("error", error.message)
    res.redirect("/admin/movies")
  }
}