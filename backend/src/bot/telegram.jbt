"use strict";

const { Telegraf, Markup, session } = require("telegraf");
const escrow = require("../services/escrow");
require("dotenv").config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// ─── Session middleware (stores per-user state) ────────────────────────────────
bot.use(session({ defaultSession: () => ({ step: null, dealData: {} }) }));

// ─── /start ───────────────────────────────────────────────────────────────────
bot.start((ctx) => {
  ctx.reply(
    `👋 Welcome to *TrustLink* — secure escrow for Telegram traders.\n\n` +
    `What would you like to do?`,
    {
      parse_mode: "Markdown",
      ...Markup.keyboard([
        ["🛍 Create Deal", "💰 Fund Deal"],
        ["✅ Confirm Delivery", "⚠️ Raise Dispute"],
        ["🔍 Check Deal", "❓ Help"],
      ]).resize(),
    }
  );
});

// ─── /help ────────────────────────────────────────────────────────────────────
bot.help((ctx) => {
  ctx.reply(
    `*TrustLink Commands*\n\n` +
    `🛍 *Create Deal* — Seller creates an escrow deal\n` +
    `💰 *Fund Deal* — Buyer deposits USDC into escrow\n` +
    `✅ *Confirm Delivery* — Buyer releases funds to seller\n` +
    `⚠️ Raise Dispute* — Raise a dispute for owner review\n` +
    `🔍 *Check Deal* — View deal status and details\n\n` +
    `_All funds are held on Arbitrum until delivery is confirmed._`,
    { parse_mode: "Markdown" }
  );
});

// ─── CREATE DEAL ──────────────────────────────────────────────────────────────
bot.hears("🛍 Create Deal", (ctx) => {
  ctx.session.step = "create_buyer";
  ctx.session.dealData = {};
  ctx.reply("Enter the *buyer's wallet address*:", { parse_mode: "Markdown" });
});

// ─── FUND DEAL ────────────────────────────────────────────────────────────────
bot.hears("💰 Fund Deal", (ctx) => {
  ctx.session.step = "fund_dealId";
  ctx.reply("Enter the *Deal ID* to fund:", { parse_mode: "Markdown" });
});

// ─── CONFIRM DELIVERY ─────────────────────────────────────────────────────────
bot.hears("✅ Confirm Delivery", (ctx) => {
  ctx.session.step = "confirm_dealId";
  ctx.reply("Enter the *Deal ID* to confirm delivery:", { parse_mode: "Markdown" });
});

// ─── RAISE DISPUTE ────────────────────────────────────────────────────────────
bot.hears("⚠️ Raise Dispute", (ctx) => {
  ctx.session.step = "dispute_dealId";
  ctx.reply("Enter the *Deal ID* to raise a dispute:", { parse_mode: "Markdown" });
});

// ─── CHECK DEAL ───────────────────────────────────────────────────────────────
bot.hears("🔍 Check Deal", (ctx) => {
  ctx.session.step = "check_dealId";
  ctx.reply("Enter the *Deal ID* to check:", { parse_mode: "Markdown" });
});

// ─── Message handler (multi-step flows) ───────────────────────────────────────
bot.on("text", async (ctx) => {
  const text = ctx.message.text.trim();
  const step = ctx.session.step;
  const data = ctx.session.dealData;

  if (!step) return; // not in a flow

  try {
    // ── CREATE DEAL FLOW ──────────────────────────────────────────────────────
    if (step === "create_buyer") {
      if (!isAddress(text)) return ctx.reply("❌ Invalid wallet address. Try again:");
      data.buyer = text;
      ctx.session.step = "create_amount";
      return ctx.reply("Enter the *USDC amount* (e.g. 10.5):", { parse_mode: "Markdown" });
    }

    if (step === "create_amount") {
      const amount = parseFloat(text);
      if (isNaN(amount) || amount <= 0) return ctx.reply("❌ Invalid amount. Enter a positive number:");
      data.amount = text;
      ctx.session.step = "create_deadline";
      return ctx.reply(
        "Enter the *delivery deadline*.\nFormat: `YYYY-MM-DD` (e.g. 2026-07-30)",
        { parse_mode: "Markdown" }
      );
    }

    if (step === "create_deadline") {
      const ts = Date.parse(text);
      if (isNaN(ts) || ts <= Date.now()) {
        return ctx.reply("❌ Invalid or past date. Use format YYYY-MM-DD:");
      }
      data.deadline = Math.floor(ts / 1000);
      ctx.session.step = "create_description";
      return ctx.reply("Enter a *description* of the item or service:", { parse_mode: "Markdown" });
    }

    if (step === "create_description") {
      data.description = text;
      ctx.session.step = "create_key";
      return ctx.reply(
        "⚠️ Enter your *wallet private key* to sign the transaction.\n\n" +
        "_Your key is used only to sign this transaction and is never stored._",
        { parse_mode: "Markdown" }
      );
    }

    if (step === "create_key") {
      ctx.session.step = null;
      const privateKey = text;

      // Delete the message containing the private key immediately
      await ctx.deleteMessage(ctx.message.message_id).catch(() => {});

      await ctx.reply("⏳ Creating deal on Arbitrum...");

      const result = await escrow.createDeal(
        privateKey,
        data.buyer,
        data.amount,
        data.deadline,
        data.description,
        "telegram"
      );

      return ctx.reply(
        `✅ *Deal Created!*\n\n` +
        `🆔 Deal ID: \`${result.dealId}\`\n` +
        `👤 Buyer: \`${data.buyer}\`\n` +
        `💵 Amount: $${data.amount} USDC\n` +
        `📦 Item: ${data.description}\n\n` +
        `_Share Deal ID \`${result.dealId}\` with the buyer so they can fund it._\n\n` +
        `🔗 Tx: \`${result.txHash}\``,
        { parse_mode: "Markdown" }
      );
    }

    // ── FUND DEAL FLOW ────────────────────────────────────────────────────────
    if (step === "fund_dealId") {
      const dealId = parseInt(text);
      if (isNaN(dealId)) return ctx.reply("❌ Invalid Deal ID:");
      data.dealId = dealId;
      ctx.session.step = "fund_key";

      // Show deal details before asking for key
      const deal = await escrow.getDeal(dealId);
      return ctx.reply(
        `📋 *Deal #${dealId}*\n\n` +
        `📦 ${deal.description}\n` +
        `💵 Amount: $${deal.amount} USDC\n` +
        `👤 Seller: \`${deal.seller}\`\n` +
        `📅 Deadline: ${deal.deliveryDeadline}\n` +
        `📊 Status: ${deal.status}\n\n` +
        `Enter your *wallet private key* to fund this deal:`,
        { parse_mode: "Markdown" }
      );
    }

    if (step === "fund_key") {
      ctx.session.step = null;
      await ctx.deleteMessage(ctx.message.message_id).catch(() => {});
      await ctx.reply("⏳ Approving USDC and funding deal...");

      const result = await escrow.fundDeal(text, data.dealId);

      return ctx.reply(
        `✅ *Deal #${data.dealId} Funded!*\n\n` +
        `Funds are now held in escrow on Arbitrum.\n` +
        `Confirm delivery once you receive the item.\n\n` +
        `🔗 Tx: \`${result.txHash}\``,
        { parse_mode: "Markdown" }
      );
    }

    // ── CONFIRM DELIVERY FLOW ─────────────────────────────────────────────────
    if (step === "confirm_dealId") {
      const dealId = parseInt(text);
      if (isNaN(dealId)) return ctx.reply("❌ Invalid Deal ID:");
      data.dealId = dealId;
      ctx.session.step = "confirm_key";
      return ctx.reply(
        `⚠️ Confirming delivery will *release funds to the seller immediately*.\n\n` +
        `Enter your *wallet private key* to confirm:`,
        { parse_mode: "Markdown" }
      );
    }

    if (step === "confirm_key") {
      ctx.session.step = null;
      await ctx.deleteMessage(ctx.message.message_id).catch(() => {});
      await ctx.reply("⏳ Confirming delivery...");

      const result = await escrow.confirmDelivery(text, data.dealId);

      return ctx.reply(
        `✅ *Delivery Confirmed for Deal #${data.dealId}!*\n\n` +
        `Funds have been released to the seller.\n\n` +
        `🔗 Tx: \`${result.txHash}\``,
        { parse_mode: "Markdown" }
      );
    }

    // ── RAISE DISPUTE FLOW ────────────────────────────────────────────────────
    if (step === "dispute_dealId") {
      const dealId = parseInt(text);
      if (isNaN(dealId)) return ctx.reply("❌ Invalid Deal ID:");
      data.dealId = dealId;
      ctx.session.step = "dispute_key";
      return ctx.reply(
        `Enter your *wallet private key* to raise a dispute on Deal #${dealId}:`,
        { parse_mode: "Markdown" }
      );
    }

    if (step === "dispute_key") {
      ctx.session.step = null;
      await ctx.deleteMessage(ctx.message.message_id).catch(() => {});
      await ctx.reply("⏳ Raising dispute...");

      const result = await escrow.raiseDispute(text, data.dealId);

      return ctx.reply(
        `⚠️ *Dispute Raised for Deal #${data.dealId}*\n\n` +
        `The TrustLink team will review and resolve this dispute.\n` +
        `Funds are frozen until resolution.\n\n` +
        `🔗 Tx: \`${result.txHash}\``,
        { parse_mode: "Markdown" }
      );
    }

    // ── CHECK DEAL FLOW ───────────────────────────────────────────────────────
    if (step === "check_dealId") {
      ctx.session.step = null;
      const dealId = parseInt(text);
      if (isNaN(dealId)) return ctx.reply("❌ Invalid Deal ID:");

      const deal = await escrow.getDeal(dealId);

      const statusEmoji = {
        Created: "🟡",
        Funded: "🔵",
        Completed: "✅",
        Disputed: "🔴",
        Resolved: "⚪",
      };

      return ctx.reply(
        `📋 *Deal #${dealId}*\n\n` +
        `${statusEmoji[deal.status] || "❓"} Status: *${deal.status}*\n` +
        `📦 Item: ${deal.description}\n` +
        `💵 Amount: $${deal.amount} USDC\n` +
        `💸 Fee: $${deal.fee} USDC\n` +
        `👤 Seller: \`${deal.seller}\`\n` +
        `🛒 Buyer: \`${deal.buyer}\`\n` +
        `📅 Deadline: ${deal.deliveryDeadline}\n` +
        `⏱ Auto-release: ${deal.autoReleaseAt}\n` +
        `📡 Channel: ${deal.channel}`,
        { parse_mode: "Markdown" }
      );
    }
  } catch (err) {
    ctx.session.step = null;
    console.error("Bot error:", err);
    ctx.reply(`❌ Error: ${err.message || "Something went wrong. Please try again."}`);
  }
});

// ─── Utility ──────────────────────────────────────────────────────────────────
function isAddress(str) {
  return /^0x[0-9a-fA-F]{40}$/.test(str);
}

// ─── Event notifications ──────────────────────────────────────────────────────
// Call this after bot.launch() to start listening for on-chain events
function startEventListener(notifyUserId) {
  escrow.listenForEvents((eventName, data) => {
    if (!notifyUserId) return;

    let message = "";
    switch (eventName) {
      case "DealCreated":
        message = `🆕 New deal #${data.dealId} created for $${data.amount} USDC`;
        break;
      case "DealFunded":
        message = `💰 Deal #${data.dealId} funded — $${data.amount} USDC in escrow`;
        break;
      case "DeliveryConfirmed":
        message = `✅ Deal #${data.dealId} completed — $${data.sellerAmount} released to seller`;
        break;
      case "DealAutoReleased":
        message = `⏱ Deal #${data.dealId} auto-released — $${data.sellerAmount} sent to seller`;
        break;
      case "DisputeRaised":
        message = `⚠️ Dispute raised on Deal #${data.dealId} by ${data.raisedBy}`;
        break;
      case "DisputeResolved":
        message = `⚖️ Deal #${data.dealId} dispute resolved`;
        break;
    }

    if (message) {
      bot.telegram.sendMessage(notifyUserId, message).catch(console.error);
    }
  });
}

module.exports = { bot, startEventListener };

