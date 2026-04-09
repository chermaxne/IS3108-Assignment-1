const mongoose = require("mongoose")

const chainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },

  location: {
    type: String,
    required: true
  },

  contactNumber: {
    type: String
  },

  email: {
    type: String
  },

  description: {
    type: String
  },

  status: {
    type: String,
    enum: ["Active", "Closed", "Coming Soon"],
    default: "Active"
  }
}, { timestamps: true })

module.exports = mongoose.model("Chain", chainSchema)
