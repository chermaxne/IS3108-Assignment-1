const Screening = require("../models/Screening")
const Movie = require("../models/Movie")   
const Hall = require("../models/Hall")     
const Chain = require("../models/Chain")   

// Build plain-object cascade data for screening form dropdowns
// All ObjectIds are converted to strings here so EJS just does JSON.stringify
function buildCascadeData(movies, halls, chains) {
  const movieChainMap = {}
  movies.forEach(m => {
    movieChainMap[m._id.toString()] = (m.chains || [])
      .filter(c => c != null)
      .map(c => c._id ? c._id.toString() : c.toString())
  })

  const chainList = chains.map(c => ({
    _id: c._id.toString(),
    name: c.name,
    location: c.location
  }))

  const hallList = halls.map(h => ({
    _id: h._id.toString(),
    name: h.name,
    status: h.status,
    chainId: h.chain ? h.chain._id.toString() : null,
    chainName: h.chain ? h.chain.name : '',
    chainLocation: h.chain ? h.chain.location : ''
  }))

  return { movieChainMap, chainList, hallList }
}

// list all screenings
exports.getScreenings = async (req, res) => {
  try {
    const { movie, hall, status, sort } = req.query

    // Build filter
    const filter = {}
    if (movie) filter.movie = movie
    if (hall) filter.hall = hall

    // Status filter (computed from dates)
    const now = new Date()
    if (status === 'upcoming') {
      filter.startTime = { $gt: now }
    } else if (status === 'showing') {
      filter.startTime = { $lte: now }
      filter.endTime = { $gt: now }
    } else if (status === 'completed') {
      filter.endTime = { $lte: now }
    }

    // Build sort
    let sortObj = { startTime: -1 }
    if (sort === 'date-asc') sortObj = { startTime: 1 }
    else if (sort === 'date-desc') sortObj = { startTime: -1 }

    let screenings = await Screening.find(filter)
      .populate("movie")
      .populate({ path: "hall", populate: { path: "chain" } })
      .sort(sortObj)

    // In-memory sort for populated fields
    if (sort === 'movie') {
      screenings.sort((a, b) => {
        const nameA = a.movie ? a.movie.title : ''
        const nameB = b.movie ? b.movie.title : ''
        return nameA.localeCompare(nameB)
      })
    } else if (sort === 'hall') {
      screenings.sort((a, b) => {
        const nameA = a.hall ? a.hall.name : ''
        const nameB = b.hall ? b.hall.name : ''
        return nameA.localeCompare(nameB)
      })
    }

    // Data for filter dropdowns
    const movies = await Movie.find().sort({ title: 1 })
    const halls = await Hall.find().populate("chain").sort({ name: 1 })

    res.render("auth/screening/screeningList", {
      screenings,
      movies,
      halls,
      filters: { movie: movie || '', hall: hall || '', status: status || '', sort: sort || '' }
    })
  } catch (error) {
    res.send(error.message)
  }
}

// render new screening form
exports.newScreeningForm = async (req, res) => {
  try {
    const movies = await Movie.find().populate("chains").sort({ title: 1 })
    const halls = await Hall.find({ status: "Active" }).populate("chain").sort({ name: 1 })
    const chains = await Chain.find({ status: "Active" }).sort({ name: 1 })
    const cascade = buildCascadeData(movies, halls, chains)
    res.render("auth/screening/newScreening", { movies, halls, chains, ...cascade })
  } catch (error) {
    req.flash("error", error.message)
    res.redirect("/admin/screenings")
  }
}

exports.createScreening = async (req, res) => {
  try {
    const { movieId, hallId, screeningDate, startTime } = req.body
    const formData = { movieId, hallId, screeningDate, startTime }

    const movies = await Movie.find().populate("chains").sort({ title: 1 })
    const halls = await Hall.find({ status: "Active" }).populate("chain").sort({ name: 1 })
    const chains = await Chain.find({ status: "Active" }).sort({ name: 1 })
    const cascade = buildCascadeData(movies, halls, chains)

  const movie = await Movie.findById(movieId)
  const hall = await Hall.findById(hallId)

  if (!movie) {
    return res.render("auth/screening/newScreening", { movies, halls, chains, ...cascade, formData, error: ["Selected movie not found."] })
  }

  if (!hall) {
    return res.render("auth/screening/newScreening", { movies, halls, chains, ...cascade, formData, error: ["Selected hall not found."] })
  }

  if (hall.status === "Under Maintenance" || hall.status === "Closed") {
    return res.render("auth/screening/newScreening", { movies, halls, chains, ...cascade, formData, error: ["This hall is currently " + hall.status.toLowerCase() + ". Please select a different hall."] })
  }

  const start = new Date(`${screeningDate}T${startTime}`)

  if (start < new Date()) {
    return res.render("auth/screening/newScreening", { movies, halls, chains, ...cascade, formData, error: ["Cannot schedule a screening in the past."] })
  }

  const end = new Date(start.getTime() + movie.duration * 60000)

  const overlap = await Screening.findOne({
    hall: hallId,
    startTime: { $lt: end },
    endTime: { $gt: start }
  })

  if (overlap) {
    return res.render("auth/screening/newScreening", { movies, halls, chains, ...cascade, formData, error: ["Screening overlaps with an existing schedule. Please choose a different time or hall."] })
  }

  await Screening.create({
    movie: movieId,
    hall: hallId,
    startTime: start,
    endTime: end
  })

  req.flash("success", "Screening scheduled successfully.")
  res.redirect("/admin/screenings")

  } catch (error) {
    req.flash("error", error.message)
    res.redirect("/admin/screenings")
  }
}

// render edit screening form
exports.editScreeningForm = async (req, res) => {
  try {
    const screening = await Screening.findById(req.params.id).populate({ path: "movie", populate: { path: "chains" } }).populate({ path: "hall", populate: { path: "chain" } })
    if (!screening) {
      req.flash("error", "Screening not found.")
      return res.redirect("/admin/screenings")
    }

    const now = new Date()
    const start = new Date(screening.startTime)
    const end = new Date(screening.endTime)

    // Block editing of currently-running screenings
    if (start <= now && end > now) {
      req.flash("error", "Cannot edit a screening that is currently showing.")
      return res.redirect("/admin/screenings")
    }

    // Block editing of completed screenings
    if (end <= now) {
      req.flash("error", "Cannot edit a completed screening.")
      return res.redirect("/admin/screenings")
    }

    const movies = await Movie.find().populate("chains").sort({ title: 1 })
    const halls = await Hall.find({ status: "Active" }).populate("chain").sort({ name: 1 })
    const chains = await Chain.find({ status: "Active" }).sort({ name: 1 })
    const cascade = buildCascadeData(movies, halls, chains)

    res.render("auth/screening/editScreening", { screening, movies, halls, chains, ...cascade })
  } catch (error) {
    req.flash("error", error.message)
    res.redirect("/admin/screenings")
  }
}

// update screening
exports.updateScreening = async (req, res) => {
  try {
    const screeningId = req.params.id
    const { movieId, hallId, screeningDate, startTime } = req.body

    const movie = await Movie.findById(movieId)
    const hall = await Hall.findById(hallId)

    if (!movie) {
      req.flash("error", "Selected movie not found.")
      return res.redirect("/admin/screenings/" + screeningId + "/edit")
    }

    if (!hall) {
      req.flash("error", "Selected hall not found.")
      return res.redirect("/admin/screenings/" + screeningId + "/edit")
    }

    if (hall.status === "Under Maintenance" || hall.status === "Closed") {
      req.flash("error", "This hall is currently " + hall.status.toLowerCase() + ". Please select a different hall.")
      return res.redirect("/admin/screenings/" + screeningId + "/edit")
    }

    const start = new Date(`${screeningDate}T${startTime}`)

    if (start < new Date()) {
      req.flash("error", "Cannot schedule a screening in the past.")
      return res.redirect("/admin/screenings/" + screeningId + "/edit")
    }

    const end = new Date(start.getTime() + movie.duration * 60000)

    // Check overlap excluding the current screening
    const overlap = await Screening.findOne({
      _id: { $ne: screeningId },
      hall: hallId,
      startTime: { $lt: end },
      endTime: { $gt: start }
    })

    if (overlap) {
      req.flash("error", "Screening overlaps with an existing schedule. Please choose a different time or hall.")
      return res.redirect("/admin/screenings/" + screeningId + "/edit")
    }

    await Screening.findByIdAndUpdate(screeningId, {
      movie: movieId,
      hall: hallId,
      startTime: start,
      endTime: end
    })

    req.flash("success", "Screening updated successfully.")
    res.redirect("/admin/screenings")
  } catch (error) {
    req.flash("error", error.message)
    res.redirect("/admin/screenings/" + req.params.id + "/edit")
  }
}

exports.deleteScreening = async (req, res) => {
  try {
    const screening = await Screening.findById(req.params.id)

    if (!screening) {
      req.flash("error", "Screening not found.")
      return res.redirect("/admin/screenings")
    }

    const now = new Date()
    const start = new Date(screening.startTime)
    const end = new Date(screening.endTime)

    // Block deletion of currently-running screenings
    if (start <= now && end > now) {
      req.flash("error", "Cannot delete a screening that is currently showing.")
      return res.redirect("/admin/screenings")
    }

    await Screening.findByIdAndDelete(req.params.id)
    req.flash("success", "Screening deleted successfully.")
    res.redirect("/admin/screenings")
  } catch (error) {
    req.flash("error", error.message)
    res.redirect("/admin/screenings")
  }
}