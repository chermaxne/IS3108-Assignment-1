const mongoose = require("mongoose")

const bookingSchema = new mongoose.Schema({
  screening: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Screening",
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: false,
    trim: true,
    default: "",
    lowercase: true
  },
  seatCount: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  selectedSeats: {
    type: [String],
    default: []
  },
  pricePerSeat: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  confirmationCode: {
    type: String,
    required: true,
    unique: true
  }
}, { timestamps: true })

module.exports = mongoose.model("Booking", bookingSchema)
