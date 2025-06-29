const axios = require("axios");
const { default: fetch } = require("node-fetch");

module.exports = (bot) => {
  bot.command("ytmp4", async (ctx) => {
    const input = ctx.message.text.split(" ").slice(1).join(" ").trim();

    if (!input || (!input.includes("youtube.com") && !input.includes("youtu.be"))) {
      return ctx.reply("❌ Kirim link YouTube yang valid. Contoh: /ytmp4 https://youtube.com/watch?v=tzGmZKQIZZE");
    }

    try {
      const apiUrl = `https://api.kenshiro.cfd/api/downloader/ytv?url=${encodeURIComponent(input)}`;
      const response = await axios.get(apiUrl);
      const result = response.data;

      if (!result.status || !result.data || !result.data.downloadLink) {
        return ctx.reply("❌ Gagal mengambil data video. Coba link lain.");
      }

      const video = result.data;

      await ctx.reply("⏳ Sedang mengunduh video...");

      // Unduh file MP4 dari downloadLink
      const res = await fetch(video.downloadLink);
      if (!res.ok) throw new Error("Gagal mengunduh file video");
      const buffer = await res.buffer();

      // Kirim video ke Telegram
      await ctx.replyWithVideo(
        { source: buffer, filename: video.filename || `${video.title}.mp4` },
        {
          caption: `🎬 *${video.title}*\n📺 Channel: ${video.channel}\n📅 Rilis: ${video.publish}\n⏱️ Durasi: ${video.fduration}\n👁️ Views: ${video.views}`,
          parse_mode: "Markdown"
        }
      );
    } catch (err) {
      console.error(err);
      ctx.reply("🚫 Terjadi kesalahan saat mengambil atau mengirim video.");
    }
  });
};