const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const Staff = require("./models/Staff")

mongoose.connect("mongodb://localhost:27017/cinevillage")

async function createAdmin() {

  try {

    // Check if admin already exists
    const existingAdmin = await Staff.findOne({ username: "admin" })

    if (existingAdmin) {
      console.log("Admin user already exists")
      mongoose.connection.close()
      return
    }

    const password = await bcrypt.hash("admin123", 10)

    await Staff.create({
      username: "admin",
      password: password,
      role: "admin",
      isActive: true
    })

    console.log("✅ Admin user created successfully")
    console.log("Username: admin")
    console.log("Password: admin123")

    mongoose.connection.close()

  } catch (error) {

    console.log("Error creating admin:", error.message)
    mongoose.connection.close()

  }

}

createAdmin()