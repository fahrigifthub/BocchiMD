const fetch = require("node-fetch");

const userSessions = new Map();  // Simpan session ID per user
const gptStatus = new Map();     // Simpan status on/off per user

module.exports = (bot) => {
  // Perintah toggle ON/OFF
  bot.command("gpt", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1);
    const userId = ctx.from.id;

    if (!args.length) {
      return ctx.reply("❌ Gunakan `/gpt on` atau `/gpt off`", { parse_mode: "Markdown" });
    }

    const mode = args[0].toLowerCase();
    if (mode === "on") {
      gptStatus.set(userId, true);
      return ctx.reply("✅ GPT mode *ON* untuk kamu.", { parse_mode: "Markdown" });
    }

    if (mode === "off") {
      gptStatus.set(userId, false);
      return ctx.reply("❌ GPT mode *OFF* untuk kamu.", { parse_mode: "Markdown" });
    }

    return ctx.reply("❌ Mode tidak dikenal. Gunakan `/gpt on` atau `/gpt off`", { parse_mode: "Markdown" });
  });

  // Balas pesan dari GPT → lanjut obrolan
  bot.on("message", async (ctx) => {
    const userId = ctx.from.id;
    if (!gptStatus.get(userId)) return; // GPT dimatikan

    const reply = ctx.message.reply_to_message;
    if (!reply || reply.from.id !== (await ctx.telegram.getMe()).id) return; // Harus reply pesan dari bot

    const text = ctx.message.text;
    if (!text) return;

    const sessionId = getSessionId(userId);

    await ctx.reply("⏳ GPT sedang mikir...");
    const response = await askGpt({ text, sessionId });

    return sendFormattedReply(ctx, response);
  });
};

// 🔁 Session generator
function getSessionId(userId) {
  if (!userSessions.has(userId)) {
    userSessions.set(userId, `sess-${userId}-${Date.now()}`);
  }
  return userSessions.get(userId);
}

// 🧠 Fungsi ke GPT API
async function askGpt({ text, sessionId }) {
  try {
    const style = "Jawab sebagai AI coding assistant, ringkas, santai, kasih kode bila perlu. Jangan terlalu formal.";
    const url = new URL("https://fastrestapis.fasturl.link/aillm/gpt-4o-turbo");

    url.searchParams.append("ask", text);
    url.searchParams.append("sessionId", sessionId);
    url.searchParams.append("style", style);

    const res = await fetch(url.href);
    const data = await res.json();
    return data?.result;
  } catch (e) {
    console.error("GPT Error:", e);
    return "❌ Error saat menghubungi API GPT.";
  }
}

// 🧾 Format jawaban ke Markdown
async function sendFormattedReply(ctx, result) {
  if (result?.trim()) {
    const reply = result.trim();

    if (!reply.includes("```")) {
      const wrapped = `\`\`\`javascript\n${reply}\n\`\`\``;
      return ctx.reply(wrapped.length > 4000 ? wrapped.slice(0, 4000) + "..." : wrapped, {
        parse_mode: "Markdown"
      });
    }

    return ctx.reply(reply.length > 4000 ? reply.slice(0, 4000) + "..." : reply, {
      parse_mode: "Markdown"
    });
  } else {
    return ctx.reply("❌ Gagal dapet balasan dari AI bre.");
  }
}
