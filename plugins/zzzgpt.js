const fetch = require("node-fetch");
const { fileTypeFromBuffer } = require("file-type");

const userSessions = new Map();
const userStatus = new Map();

module.exports = (bot) => {
  // ✅ /gpt4o on/off
  bot.command("gpt4o", async (ctx) => {
    const input = ctx.message.text.split(" ")[1];
    const userId = ctx.from.id;

    if (!["on", "off"].includes(input)) {
      return ctx.reply("⚠️ Format salah:\n/gpt4o on atau /gpt4o off");
    }

    userStatus.set(userId, input === "on");
    return ctx.reply(`✅ GPT-4o telah *${input === "on" ? "diaktifkan" : "dimatikan"}*.`, {
      parse_mode: "Markdown"
    });
  });

  // ✅ /ai <teks> (bisa reply gambar juga)
  bot.command("gpt", async (ctx) => {
    const userId = ctx.from.id;
    const input = ctx.message.text.split(" ").slice(1).join(" ");
    const isOn = userStatus.get(userId);
    const reply = ctx.message.reply_to_message;

    if (!isOn) return ctx.reply("❌ Aktifkan dulu pakai /gpt4o on");
    if (!input && !reply) return ctx.reply("❌ Kirim teks atau balas gambar dengan caption pertanyaan.");

    const sessionId = getSessionId(userId);
    const style = "Jawab dengan gaya santai, anak Jaksel, singkat dan to the point.";

    let imageUrl = null;

    // 🖼️ Jika reply ke gambar
    if (reply?.photo) {
      const fileId = reply.photo[reply.photo.length - 1].file_id;
      const link = await ctx.telegram.getFileLink(fileId);
      imageUrl = link.href;
    }

    try {
      const url = new URL("https://fastrestapis.fasturl.link/aillm/gpt-4o-turbo");
      url.searchParams.append("ask", input || "jelaskan gambar ini");
      url.searchParams.append("sessionId", sessionId);
      url.searchParams.append("style", style);
      if (imageUrl) url.searchParams.append("imageUrl", imageUrl);

      const res = await fetch(url.href);
      const json = await res.json();

      if (json?.result) {
        return ctx.reply(`🧠 ${json.result}`);
      } else {
        return ctx.reply("❌ Gagal mengambil respon dari GPT-4o.");
      }
    } catch (err) {
      console.error("GPT4o Error:", err);
      return ctx.reply("❌ Error saat menghubungi server.");
    }
  });
};

function getSessionId(userId) {
  if (!userSessions.has(userId)) {
    userSessions.set(userId, `sess-${userId}-${Date.now()}`);
  }
  return userSessions.get(userId);
}