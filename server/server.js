require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const app = require("./app");
const { connectDB } = require("./config/db");

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[server] Commun Broadcast Monitor API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("[server] Failed to start:", err.message);
    process.exit(1);
  }
}

start();

process.on("unhandledRejection", (reason) => {
  console.error("[server] Unhandled rejection:", reason);
});
