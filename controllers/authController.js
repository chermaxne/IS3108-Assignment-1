const Staff = require("../models/Staff")
const bcrypt = require("bcrypt")

exports.login = async (req, res) => {

  try {

    const { username, password } = req.body

    const user = await Staff.findOne({ username })

    if (!user) {
      return res.render("auth/admin/login", { error: "User not authorised. Please try again." })
    }

    if (user.isActive === false) {
      return res.render("auth/admin/login", { error: "Account is deactivated. Please contact admin." })
    }

    const match = await bcrypt.compare(password, user.password)

    if (!match) {
      return res.render("auth/admin/login", { error: "Incorrect password. Please try again." })
    }

    req.session.userId = user._id

    res.redirect("/admin/dashboard")

  } catch (error) {
    res.render("auth/admin/login", { error: "Something went wrong. Please try again." })
  }

}

exports.showLogin = (req, res) => {
  res.render("auth/admin/login")
}

exports.logout = (req, res) => {

  req.session.destroy()
  
  res.redirect("/login")

}