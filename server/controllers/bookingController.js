const Booking = require("../models/Booking")

exports.listBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate({
        path: "screening",
        populate: [
          { path: "movie" },
          { path: "hall", populate: { path: "chain" } }
        ]
      })
      .sort({ createdAt: -1 })

    res.render("auth/booking/bookingList", { bookings })
  } catch (error) {
    req.flash("error", error.message)
    res.redirect("/admin/dashboard")
  }
}
