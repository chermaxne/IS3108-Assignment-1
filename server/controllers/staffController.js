const Staff = require("../models/Staff")
const bcrypt = require("bcrypt")

// Get all staff
exports.listStaff = async (req, res) => {

  try {

    const staff = await Staff.find().select("-password")

    res.render("auth/staff/staffList", { staff, userId: req.session.userId })

  } catch (error) {

    req.flash("error", error.message)
    res.redirect("/admin/dashboard")

  }

}

// Show create staff form
exports.showCreateStaff = (req, res) => {

  res.render("auth/staff/createStaff")

}

// Create new staff
exports.createStaff = async (req, res) => {

  try {

    const { username, password, confirmPassword, role } = req.body

    // Validation
    if (!username || !password || !confirmPassword) {
      return res.render("auth/staff/createStaff", { error: "All fields are required" })
    }

    if (password !== confirmPassword) {
      return res.render("auth/staff/createStaff", { error: "Passwords do not match" })
    }

    if (password.length < 6) {
      return res.render("auth/staff/createStaff", { error: "Password must be at least 6 characters" })
    }

    // Check if user exists
    const existingUser = await Staff.findOne({ username })
    if (existingUser) {
      return res.render("auth/staff/createStaff", { error: "Username already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new staff
    const newStaff = new Staff({
      username,
      password: hashedPassword,
      role: role || "staff",
      isActive: true
    })

    await newStaff.save()

    req.flash("success", `Staff member '${username}' created successfully`)
    res.redirect("/admin/staff")

  } catch (error) {

    req.flash("error", error.message)
    res.redirect("/admin/staff")

  }

}

// Show edit staff form
exports.showEditStaff = async (req, res) => {

  try {

    const staff = await Staff.findById(req.params.id)

    if (!staff) {
      return res.redirect("/admin/staff")
    }

    res.render("auth/staff/editStaff", { staff })

  } catch (error) {

    req.flash("error", error.message)
    res.redirect("/admin/staff")

  }

}

// Update staff details
exports.updateStaff = async (req, res) => {

  try {

    const { username, role, isActive } = req.body

    // Validation
    if (!username) {
      return res.render("auth/staff/editStaff", { staff: req.body, error: "Username is required" })
    }

    // Check if username already taken by another user
    const existingUser = await Staff.findOne({ username, _id: { $ne: req.params.id } })
    if (existingUser) {
      const staff = await Staff.findById(req.params.id)
      return res.render("auth/staff/editStaff", { staff, error: "Username already exists" })
    }

    const updateData = {
      username,
      role: role || "staff",
      isActive: isActive === "on" ? true : false
    }

    const staff = await Staff.findByIdAndUpdate(req.params.id, updateData, { new: true })

    req.flash("success", "Staff member updated successfully")
    res.redirect("/admin/staff")

  } catch (error) {

    req.flash("error", error.message)
    res.redirect("/admin/staff")

  }

}

// Show change password form
exports.showChangePassword = async (req, res) => {

  try {

    const staff = await Staff.findById(req.params.id)

    if (!staff) {
      return res.redirect("/admin/staff")
    }

    res.render("auth/staff/changePassword", { staff })

  } catch (error) {

    req.flash("error", error.message)
    res.redirect("/admin/staff")

  }

}

// Change password
exports.changePassword = async (req, res) => {

  try {

    const { newPassword, confirmPassword } = req.body

    // Validation
    if (!newPassword || !confirmPassword) {
      const staff = await Staff.findById(req.params.id)
      return res.render("auth/staff/changePassword", { staff, error: "All fields are required" })
    }

    if (newPassword !== confirmPassword) {
      const staff = await Staff.findById(req.params.id)
      return res.render("auth/staff/changePassword", { staff, error: "Passwords do not match" })
    }

    if (newPassword.length < 6) {
      const staff = await Staff.findById(req.params.id)
      return res.render("auth/staff/changePassword", { staff, error: "Password must be at least 6 characters" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await Staff.findByIdAndUpdate(req.params.id, { password: hashedPassword })

    req.flash("success", "Password changed successfully")
    res.redirect("/admin/staff")

  } catch (error) {

    req.flash("error", error.message)
    res.redirect("/admin/staff")

  }

}

// Delete staff
exports.deleteStaff = async (req, res) => {

  try {

    const staffId = req.params.id

    // Prevent admin from deleting themselves
    if (req.session.userId === staffId) {
      req.flash("error", "You cannot delete your own account")
      return res.redirect("/admin/staff")
    }

    const staff = await Staff.findById(staffId)

    if (!staff) {
      req.flash("error", "Staff member not found")
      return res.redirect("/admin/staff")
    }

    await Staff.findByIdAndDelete(staffId)

    req.flash("success", `Staff member '${staff.username}' deleted `)
    res.redirect("/admin/staff")

  } catch (error) {

    req.flash("error", error.message)
    res.redirect("/admin/staff")

  }

}
