const Movie = require("../models/Movie")
const Screening = require("../models/Screening")
const Hall = require("../models/Hall")
const Staff = require("../models/Staff")
const Chain = require("../models/Chain")

exports.dashboard = async (req, res) => {

  try {

    const now = new Date()

    // ── Core stats ──
    const activeMovieIds = await Screening.distinct("movie", { startTime: { $gte: now } })
    const activeMovies = activeMovieIds.length

    const todayStart = new Date(); todayStart.setHours(0,0,0,0)
    const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999)
    const todayScreenings = await Screening.countDocuments({ startTime: { $gte: todayStart, $lte: todayEnd } })

    const totalHalls = await Hall.countDocuments({ status: { $nin: ["Under Maintenance", "Closed"] } })
    const totalMovies = await Movie.countDocuments()
    const totalChains = await Chain.countDocuments({ status: "Active" })
    const totalStaff  = await Staff.countDocuments({ isActive: true })

    // ── This week screenings ──
    const weekStart = new Date(); weekStart.setHours(0,0,0,0)
    const weekEnd   = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7)
    const weekScreenings = await Screening.countDocuments({ startTime: { $gte: weekStart, $lte: weekEnd } })

    // ── Genre breakdown (top 6) ──
    const genreAgg = await Movie.aggregate([
      { $match: { genre: { $ne: null, $ne: "" } } },
      { $group: { _id: "$genre", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ])
    const genreBreakdown = genreAgg.map(g => ({ genre: g._id, count: g.count }))
    const genreMax = genreBreakdown.length > 0 ? genreBreakdown[0].count : 1

    // ── Chain screening counts (next 7 days) ──
    const chainScreeningAgg = await Screening.aggregate([
      { $match: { startTime: { $gte: now, $lte: weekEnd } } },
      { $lookup: { from: "halls", localField: "hall", foreignField: "_id", as: "hallDoc" } },
      { $unwind: "$hallDoc" },
      { $lookup: { from: "chains", localField: "hallDoc.chain", foreignField: "_id", as: "chainDoc" } },
      { $unwind: "$chainDoc" },
      { $group: { _id: "$chainDoc.name", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])

    // ── Recently added movies (last 5) ──
    const recentMovies = await Movie.find().populate("chains").sort({ createdAt: -1 }).limit(5)

    // ── Upcoming screenings (next 10) ──
    const upcomingScreenings = await Screening.find({ startTime: { $gte: now } })
      .populate("movie")
      .populate({ path: "hall", populate: { path: "chain" } })
      .sort({ startTime: 1 })
      .limit(10)

    // ── Today's schedule (all screenings today, sorted) ──
    const todaySchedule = await Screening.find({ startTime: { $gte: todayStart, $lte: todayEnd } })
      .populate("movie")
      .populate({ path: "hall", populate: { path: "chain" } })
      .sort({ startTime: 1 })

    const user = await Staff.findById(req.session.userId)

    res.render("auth/admin/dashboard", {
      activeMovies,
      todayScreenings,
      totalHalls,
      totalMovies,
      totalChains,
      totalStaff,
      weekScreenings,
      genreBreakdown,
      genreMax,
      chainScreeningAgg,
      recentMovies,
      upcomingScreenings,
      todaySchedule,
      user
    })

  } catch (error) {
    res.send(error.message)
  }
}