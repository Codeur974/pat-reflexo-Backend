const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      enum: ["09:00", "10:00", "11:00"],
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "pending", "confirmed"],
      default: "available",
    },
    client: {
      firstName: { type: String, default: null },
      lastName: { type: String, default: null },
      phone: { type: String, default: null },
    },
  },
  {
    timestamps: true,
    toObject: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

slotSchema.index({ date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model("Slot", slotSchema);
