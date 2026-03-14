const express = require("express")
const session = require("express-session")
const flash = require("connect-flash")
const mongoose = require("mongoose")
const path = require("path")

const app = express()

// View engine setup
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

app.use(express.urlencoded({ extended: true }))

app.use(session({
  secret: "cinevillage-secret",
  resave: false,
  saveUninitialized: false
}))

app.use(flash())

// Make flash messages and user available in all views
app.use(async (req, res, next) => {
  res.locals.success = req.flash("success")
  res.locals.error = req.flash("error")
  if (req.session.userId) {
    try {
      const Staff = require("./models/Staff")
      res.locals.user = await Staff.findById(req.session.userId)
    } catch (e) {
      res.locals.user = null
    }
  } else {
    res.locals.user = null
  }
  next()
})

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/cinevillage")
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log("MongoDB connection error:", err))

// Root redirect
app.get("/", (req, res) => res.redirect("/login"))

// authRoutes
const authRoutes = require("./routes/authRoutes")
const isAuthenticated = require("./middleware/authMiddleware")
app.use("/", authRoutes)

// hallRoutes
const hallRoutes = require("./routes/hallRoutes")
app.use("/admin", hallRoutes)

// chainRoutes
const chainRoutes = require("./routes/chainRoutes")
app.use("/admin", chainRoutes)

// movieRoutes
const movieRoutes = require("./routes/movieRoutes")
app.use("/admin", movieRoutes)

// screeningRoutes
const screeningRoutes = require("./routes/screeningRoutes")
app.use("/admin", screeningRoutes)

// adminRoutes
const adminRoutes = require("./routes/adminRoutes")
app.use("/admin", isAuthenticated, adminRoutes)

// staffRoutes
const staffRoutes = require("./routes/staffRoutes")
app.use("/admin/staff", staffRoutes)

// Start server
const PORT = 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
