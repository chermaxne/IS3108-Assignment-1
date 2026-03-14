const mongoose = require("mongoose")

const movieSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  duration: {
    type: Number, // minutes
    required: true
  },

  genre: {
    type: String
  },

  language: {
    type: String
  },

  releaseDate: {
    type: Date
  },

  rating: {
    type: String // PG, PG13, M18 etc
  },

  posterUrl: {
    type: String,
    default: ""
  },

  chains: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chain"
  }]

}, { timestamps: true })

module.exports = mongoose.model("Movie", movieSchema)