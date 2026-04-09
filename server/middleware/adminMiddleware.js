const Staff = require("../models/Staff")

async function isAdmin(req, res, next) {

  if (!req.session.userId) {
    return res.redirect("/login")
  }

  try {

    const user = await Staff.findById(req.session.userId)

    if (!user || user.role !== "admin") {
      req.flash("error", "You do not have permission to access this section")
      return res.redirect("/admin/dashboard")
    }

    next()

  } catch (error) {
    req.flash("error", "Something went wrong")
    res.redirect("/admin/dashboard")
  }

}

module.exports = isAdmin
