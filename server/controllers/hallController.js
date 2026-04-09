const Hall = require("../models/Hall")
const Screening = require("../models/Screening")
const Chain = require("../models/Chain")

// Generate default seat layout grid
function generateSeatLayout(rows, columns) {
  const layout = []
  for (let r = 0; r < rows; r++) {
    const row = []
    for (let c = 0; c < columns; c++) {
      row.push("standard")
    }
    layout.push(row)
  }
  return layout
}

exports.getHalls = async (req, res) => {
  try {
    const { chain, hallType, status, sort } = req.query

    // Build filter
    const filter = {}
    if (chain) filter.chain = chain
    if (hallType) filter.hallType = hallType
    if (status) filter.status = status

    // Build sort
    let sortObj = { name: 1 }
    if (sort === 'name-desc') sortObj = { name: -1 }
    else if (sort === 'type') sortObj = { hallType: 1, name: 1 }
    else if (sort === 'seats-desc') sortObj = { rows: -1, columns: -1 }
    else if (sort === 'seats-asc') sortObj = { rows: 1, columns: 1 }
    else if (sort === 'status') sortObj = { status: 1, name: 1 }

    const halls = await Hall.find(filter).populate("chain").sort(sortObj)
    const chains = await Chain.find().sort({ name: 1 })

    res.render("auth/hall/hallList", {
      halls,
      chains,
      filters: { chain: chain || '', hallType: hallType || '', status: status || '', sort: sort || '' }
    })
  } catch (error) {
    res.send(error.message)
  }
}

exports.createHall = async (req, res) => {
  const { name, hallType, rows, columns, seatTypes, hasGap, status, chain } = req.body

  // Server-side validation
  if (!name || !name.trim()) {
    req.flash("error", "Hall name is required.")
    return res.redirect("/admin/halls/new")
  }

  if (!rows || rows < 1 || rows > 30) {
    req.flash("error", "Rows must be between 1 and 30.")
    return res.redirect("/admin/halls/new")
  }

  if (!columns || columns < 1 || columns > 30) {
    req.flash("error", "Seats per row must be between 1 and 30.")
    return res.redirect("/admin/halls/new")
  }

  try {
    await Hall.create({
      name: name.trim(),
      chain,
      hallType,
      rows,
      columns,
      seatTypes,
      hasGap: hasGap === 'on',
      seatLayout: generateSeatLayout(parseInt(rows), parseInt(columns)),
      status
    })

    req.flash("success", name.trim() + " created successfully.")
    res.redirect("/admin/halls")
  } catch (error) {
    if (error.code === 11000) {
      req.flash("error", "A hall with this name already exists in the selected chain.")
    } else {
      req.flash("error", error.message)
    }
    res.redirect("/admin/halls/new")
  }
}

// Render edit hall form with cascade warning
exports.editHallForm = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id)
    if (!hall) {
      req.flash("error", "Hall not found.")
      return res.redirect("/admin/halls")
    }

    const chains = await Chain.find({ status: { $ne: "Closed" } }).sort({ name: 1 })

    // Count future screenings for cascade awareness
    const futureScreeningCount = await Screening.countDocuments({
      hall: req.params.id,
      startTime: { $gte: new Date() }
    })

    let warning = null
    if (futureScreeningCount > 0) {
      warning = "This hall has " + futureScreeningCount + " upcoming screening(s). You can still edit basic details, but changing dimensions, chain, or setting status to 'Under Maintenance'/'Closed' is blocked while future screenings exist."
    }

    res.render("auth/hall/editHall", { hall, warning, chains })
  } catch (error) {
    res.send(error.message)
  }
}

// Update hall
exports.updateHall = async (req, res) => {
  const { name, hallType, rows, columns, hasGap, status, chain } = req.body

  // Server-side validation
  if (!name || !name.trim()) {
    req.flash("error", "Hall name is required.")
    return res.redirect("/admin/halls/" + req.params.id + "/edit")
  }

  if (!rows || rows < 1 || rows > 30) {
    req.flash("error", "Rows must be between 1 and 30.")
    return res.redirect("/admin/halls/" + req.params.id + "/edit")
  }

  if (!columns || columns < 1 || columns > 30) {
    req.flash("error", "Seats per row must be between 1 and 30.")
    return res.redirect("/admin/halls/" + req.params.id + "/edit")
  }

  try {
    const currentHall = await Hall.findById(req.params.id)

    if (!currentHall) {
      req.flash("error", "Hall not found.")
      return res.redirect("/admin/halls")
    }

    const futureScreeningCount = await Screening.countDocuments({
      hall: req.params.id,
      startTime: { $gte: new Date() }
    })

    const nextRows = parseInt(rows)
    const nextColumns = parseInt(columns)
    const isDimensionChanged = currentHall.rows !== nextRows || currentHall.columns !== nextColumns
    const isChainChanged = currentHall.chain && currentHall.chain.toString() !== chain
    const isStatusRestrictedChange = currentHall.status !== status && (status === "Under Maintenance" || status === "Closed")

    if (futureScreeningCount > 0 && (isDimensionChanged || isChainChanged || isStatusRestrictedChange)) {
      req.flash("error", "This hall has future screenings. You cannot change dimensions, chain, or set status to Under Maintenance/Closed until those screenings are completed or removed.")
      return res.redirect("/admin/halls/" + req.params.id + "/edit")
    }

    const updateData = {
      name: name.trim(),
      chain,
      hallType,
      rows: nextRows,
      columns: nextColumns,
      hasGap: hasGap === 'on',
      status
    }

    // Regenerate seat layout if dimensions changed
    if (isDimensionChanged) {
      updateData.seatLayout = generateSeatLayout(nextRows, nextColumns)
    }

    await Hall.findByIdAndUpdate(req.params.id, updateData)

    req.flash("success", name.trim() + " updated successfully.")
    res.redirect("/admin/halls")
  } catch (error) {
    if (error.code === 11000) {
      req.flash("error", "A hall with this name already exists in the selected chain.")
    } else {
      req.flash("error", error.message)
    }
    res.redirect("/admin/halls/" + req.params.id + "/edit")
  }
}

exports.deleteHall = async (req, res) => {
  try {
    const futureScreening = await Screening.findOne({
      hall: req.params.id,
      startTime: { $gte: new Date() }
    })

    if (futureScreening) {
      req.flash("error", "Cannot delete this hall — it has future screenings scheduled.")
      return res.redirect("/admin/halls")
    }

    const hall = await Hall.findByIdAndDelete(req.params.id)
    req.flash("success", (hall ? hall.name : '') + " deleted successfully.")
    res.redirect("/admin/halls")
  } catch (error) {
    req.flash("error", error.message)
    res.redirect("/admin/halls")
  }
}

// View hall seating layout
exports.viewLayout = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id).populate("chain")
    if (!hall) {
      req.flash("error", "Hall not found.")
      return res.redirect("/admin/halls")
    }

    // Generate layout if it doesn't exist yet
    if (!hall.seatLayout || hall.seatLayout.length === 0) {
      hall.seatLayout = generateSeatLayout(hall.rows, hall.columns)
      await hall.save()
    }

    res.render("auth/hall/hallLayout", { hall })
  } catch (error) {
    res.send(error.message)
  }
}

// Update hall seating layout
exports.updateLayout = async (req, res) => {
  try {
    const { seatLayout } = req.body
    await Hall.findByIdAndUpdate(req.params.id, {
      seatLayout: JSON.parse(seatLayout)
    })
    req.flash("success", "Seat layout updated successfully.")
    res.redirect("/admin/halls/" + req.params.id + "/layout")
  } catch (error) {
    req.flash("error", error.message)
    res.redirect("/admin/halls/" + req.params.id + "/layout")
  }
}