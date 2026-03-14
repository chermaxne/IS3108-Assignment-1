const mongoose = require("mongoose")

const screeningSchema = new mongoose.Schema({

  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie",
    required: true
  },

  hall: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hall",
    required: true
  },

  startTime: {
    type: Date,
    required: true
  },

  endTime: {
    type: Date,
    required: true
  }

}, { timestamps: true })

module.exports = mongoose.model("Screening", screeningSchema)