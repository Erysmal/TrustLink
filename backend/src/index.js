"use strict";

require("dotenv").config();

const express = require("express");
const helmet  = require("helmet");
const cors    = require("cors");

const { bot, startEventListener } = require("./bot/telegram");
const escrow = require("./services/escrow");

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Escrow REST API (used by web frontend) ───────────────────────────────────

// GET /api/deals/:id — get a single deal
app.get("/api/deals/:id", async (req, res) => {
  try {
    const deal = await escrow.getDeal(req.params.id);
    res.json({ success: true, deal });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/deals/count — total deals created
app.get("/api/deals/count", async (req, res) => {
  try {
    const count = await escrow.getDealCount();
    res.json({ success: true, count });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/deals/create
app.post("/api/deals/create", async (req, res) => {
  try {
    const { privateKey, buyer, amount, deadline, description } = req.body;
    if (!privateKey || !buyer || !amount || !deadline || !description) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }
    const result = await escrow.createDeal(
      privateKey, buyer, amount, deadline, description, "web"
    );
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/deals/fund
app.post("/api/deals/fund", async (req, res) => {
  try {
    const { privateKey, dealId } = req.body;
    if (!privateKey || dealId === undefined) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }
    const result = await escrow.fundDeal(privateKey, dealId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/deals/confirm
app.post("/api/deals/confirm", async (req, res) => {
  try {
    const { privateKey, dealId } = req.body;
    if (!privateKey || dealId === undefined) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }
    const result = await escrow.confirmDelivery(privateKey, dealId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/deals/dispute
app.post("/api/deals/dispute", async (req, res) => {
  try {
    const { privateKey, dealId } = req.body;
    if (!privateKey || dealId === undefined) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }
    const result = await escrow.raiseDispute(privateKey, dealId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ TrustLink API running on port ${PORT}`);
});

// ─── Start Telegram bot ───────────────────────────────────────────────────────
if (process.env.TELEGRAM_BOT_TOKEN) {
  bot.launch()
    .then(() => {
      console.log("✅ Telegram bot running");
      startEventListener(process.env.ADMIN_TELEGRAM_ID);
    })
    .catch((err) => console.error("Telegram bot failed to start:", err.message));

  // Graceful shutdown
  process.once("SIGINT",  () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
} else {
  console.warn("⚠️  TELEGRAM_BOT_TOKEN not set — bot not started");
}

