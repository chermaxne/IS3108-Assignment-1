const mongoose = require("mongoose")

const hallSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  chain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chain",
    required: true
  },

  hallType: {
    type: String,
    enum: ["Standard", "IMAX", "VIP", "4DX", "Dolby Atmos"],
    default: "Standard"
  },

  rows: {
    type: Number,
    required: true
  },

  columns: {
    type: Number,
    required: true
  },

  seatTypes: {
    type: [String],
    default: ["standard"]
  },

  hasGap: {
    type: Boolean,
    default: false
  },

  seatLayout: {
    type: [[String]],
    default: []
  },

  status: {
    type: String,
    enum: ["Active", "Under Maintenance", "Closed"],
    default: "Active"
  }
}, { timestamps: true })

// Same hall name is allowed across different chains, but not within the same chain
hallSchema.index({ name: 1, chain: 1 }, { unique: true })

module.exports = mongoose.model("Hall", hallSchema)