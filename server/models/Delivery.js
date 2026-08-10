const mongoose = require("mongoose");

const STATUSES = ["Delivered", "Sent", "Read", "Replied", "Pending", "Failed", "Unknown"];

const deliverySchema = new mongoose.Schema(
  {
    chunkId: { type: mongoose.Schema.Types.ObjectId, ref: "Chunk", required: true, index: true },
    chunkName: { type: String, default: "" },
    chunkCode: { type: String, default: "" },

    broadcastName: { type: String, default: "", index: true },
    templateName: { type: String, default: "", index: true },

    sentTo: { type: String, default: "" },
    phoneNumber: { type: String, default: "", index: true },
    originalPhoneNumber: { type: String, default: "" },
    countryCode: { type: String, default: "" },

    category: { type: String, default: "NA" },
    error: { type: String, default: "" },
    status: { type: String, enum: STATUSES, default: "Unknown", index: true },

    deliveryDate: { type: String, default: "" },
    deliveryTime: { type: String, default: "" },
    deliveryDateTime: { type: Date, default: null, index: true },

    rowFingerprint: { type: String, index: true },
    isDuplicate: { type: Boolean, default: false },

    originalRow: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Delivery", deliverySchema);
module.exports.STATUSES = STATUSES;