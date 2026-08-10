const mongoose = require("mongoose");

const chunkSchema = new mongoose.Schema(
  {
    chunkCode: { type: String, required: true, unique: true, index: true },
    chunkName: { type: String, required: true, trim: true },
    originalFileName: { type: String, default: "" },
    fileType: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },
    fileHash: { type: String, index: true },
    broadcastName: { type: String, default: "", trim: true, index: true },
    templateName: { type: String, default: "", trim: true, index: true },
    uploadDate: { type: Date, default: Date.now, index: true },
    reportDate: { type: Date, default: null },
    totalRows: { type: Number, default: 0 },
    importedRows: { type: Number, default: 0 },
    duplicateRows: { type: Number, default: 0 },
    invalidRows: { type: Number, default: 0 },
    failedImports: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Processing", "Completed", "Failed"],
      default: "Processing",
      index: true,
    },
    notes: { type: String, default: "" },
    columnMapping: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

chunkSchema.index({ broadcastName: 1, uploadDate: -1 });

module.exports = mongoose.model("Chunk", chunkSchema);
