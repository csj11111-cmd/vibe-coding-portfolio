const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: true,
      enum: ["work", "personal", "study", "health", "other"],
    },
    priority: {
      type: String,
      required: true,
      enum: ["low", "medium", "high"],
    },
    description: {
      type: String,
      default: "",
    },
    done: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Todo", todoSchema);
