const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const { isConnected } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const chunkRoutes = require("./routes/chunkRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const broadcastRoutes = require("./routes/broadcastRoutes");
const reportRoutes = require("./routes/reportRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.set("trust proxy", 1);

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = clientUrl.split(",").map((o) => o.trim()).filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests. Please slow down." },
  })
);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    data: { server: "up", database: isConnected() ? "connected" : "disconnected" },
  });
});

app.use("/api/chunks", chunkRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/broadcasts", broadcastRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
