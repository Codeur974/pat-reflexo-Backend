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
  public_id: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    default: "",
  },
});

const NewsSchema = new mongoose.Schema(
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
    coverPublicId: {
      type: String,
      default: null,
    },
    files: [FileSchema],
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("News", NewsSchema);
