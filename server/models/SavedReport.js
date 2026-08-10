const mongoose = require("mongoose");

const savedReportSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    filters: {
      chunkIds: { type: [String], default: [] },
      broadcastNames: { type: [String], default: [] },
      templateNames: { type: [String], default: [] },
      statuses: { type: [String], default: [] },
      categories: { type: [String], default: [] },
      fromDate: { type: String, default: "" },
      toDate: { type: String, default: "" },
      uploadedFrom: { type: String, default: "" },
      uploadedTo: { type: String, default: "" },
      phone: { type: String, default: "" },
      error: { type: String, default: "" },
      search: { type: String, default: "" },
    },
    lastRunAt: { type: Date, default: null },
    lastRunCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SavedReport", savedReportSchema);
