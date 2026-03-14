const Chain = require("../models/Chain")
const Hall = require("../models/Hall")
const Screening = require("../models/Screening")

// List all chains
exports.getChains = async (req, res) => {
  try {
    const chains = await Chain.find().sort({ name: 1 })

    // Get hall counts for each chain
    const chainData = await Promise.all(chains.map(async (chain) => {
      const hallCount = await Hall.countDocuments({ chain: chain._id })
      return { ...chain.toObject(), hallCount }
    }))

    res.render("auth/chain/chainList", { chains: chainData })
  } catch (error) {
    req.flash("error", error.message)
    res.redirect("/admin/dashboard")
  }
}

// Render new chain form
exports.newChainForm = (req, res) => {
  res.render("auth/chain/createChain")
}

// Create chain
exports.createChain = async (req, res) => {
  const { name, location, contactNumber, email, description, status } = req.body

  if (!name || !name.trim()) {
    req.flash("error", "Chain name is required.")
    return res.redirect("/admin/chains/new")
  }

  if (!location || !location.trim()) {
    req.flash("error", "Location is required.")
    return res.redirect("/admin/chains/new")
  }

  try {
    await Chain.create({
      name: name.trim(),
      location: location.trim(),
      contactNumber: contactNumber ? contactNumber.trim() : undefined,
      email: email ? email.trim() : undefined,
      description: description ? description.trim() : undefined,
      status
    })

    req.flash("success", "Chain '" + name.trim() + "' created successfully.")
    res.redirect("/admin/chains")
  } catch (error) {
    if (error.code === 11000) {
      req.flash("error", "A chain with this name already exists.")
    } else {
      req.flash("error", error.message)
    }
    res.redirect("/admin/chains/new")
  }
}

// Render edit chain form
exports.editChainForm = async (req, res) => {
  try {
    const chain = await Chain.findById(req.params.id)
    if (!chain) {
      req.flash("error", "Chain not found.")
      return res.redirect("/admin/chains")
    }

    const hallCount = await Hall.countDocuments({ chain: chain._id })

    res.render("auth/chain/editChain", { chain, hallCount })
  } catch (error) {
    req.flash("error", error.message)
    res.redirect("/admin/chains")
  }
}

// Update chain
exports.updateChain = async (req, res) => {
  const { name, location, contactNumber, email, description, status } = req.body

  if (!name || !name.trim()) {
    req.flash("error", "Chain name is required.")
    return res.redirect("/admin/chains/" + req.params.id + "/edit")
  }

  if (!location || !location.trim()) {
    req.flash("error", "Location is required.")
    return res.redirect("/admin/chains/" + req.params.id + "/edit")
  }

  try {
    await Chain.findByIdAndUpdate(req.params.id, {
      name: name.trim(),
      location: location.trim(),
      contactNumber: contactNumber ? contactNumber.trim() : undefined,
      email: email ? email.trim() : undefined,
      description: description ? description.trim() : undefined,
      status
    })

    req.flash("success", name.trim() + " updated successfully.")
    res.redirect("/admin/chains")
  } catch (error) {
    if (error.code === 11000) {
      req.flash("error", "A chain with this name already exists.")
    } else {
      req.flash("error", error.message)
    }
    res.redirect("/admin/chains/" + req.params.id + "/edit")
  }
}

// Delete chain
exports.deleteChain = async (req, res) => {
  try {
    const hallCount = await Hall.countDocuments({ chain: req.params.id })

    if (hallCount > 0) {
      req.flash("error", "Cannot delete this chain — it has " + hallCount + " hall(s) assigned. Reassign or remove them first.")
      return res.redirect("/admin/chains")
    }

    const chain = await Chain.findByIdAndDelete(req.params.id)
    req.flash("success", (chain ? chain.name : "") + " deleted successfully.")
    res.redirect("/admin/chains")
  } catch (error) {
    req.flash("error", error.message)
    res.redirect("/admin/chains")
  }
}

// View chain details (halls and movies)
exports.viewChain = async (req, res) => {
  try {
    const chain = await Chain.findById(req.params.id)
    if (!chain) {
      req.flash("error", "Chain not found.")
      return res.redirect("/admin/chains")
    }

    const halls = await Hall.find({ chain: chain._id }).sort({ name: 1 })

    // Get upcoming screenings for halls in this chain
    const hallIds = halls.map(h => h._id)
    const screenings = await Screening.find({
      hall: { $in: hallIds },
      startTime: { $gte: new Date() }
    })
      .populate("movie")
      .populate("hall")
      .sort({ startTime: 1 })
      .limit(20)

    // Get unique movies currently showing
    const movieMap = new Map()
    screenings.forEach(s => {
      if (s.movie && !movieMap.has(s.movie._id.toString())) {
        movieMap.set(s.movie._id.toString(), s.movie)
      }
    })
    const currentMovies = Array.from(movieMap.values())

    res.render("auth/chain/chainDetail", { chain, halls, screenings, currentMovies })
  } catch (error) {
    req.flash("error", error.message)
    res.redirect("/admin/chains")
  }
}
