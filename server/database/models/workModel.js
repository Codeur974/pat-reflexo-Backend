const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["image", "video"],
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
});
const WorkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    cover: {
      type: String,
      required: true,
    },
    files: [FileSchema],
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Work", WorkSchema);
