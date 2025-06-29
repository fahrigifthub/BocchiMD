const axios = require("axios");
const { default: fetch } = require("node-fetch");

module.exports = (bot) => {
  bot.command("ytmp3", async (ctx) => {
    const input = ctx.message.text.split(" ").slice(1).join(" ").trim();

    if (!input || !input.includes("youtube.com") && !input.includes("youtu.be")) {
      return ctx.reply("❌ Kirim link YouTube yang valid. Contoh: /ytmp3 https://youtube.com/watch?v=tzGmZKQIZZE");
    }

    try {
      const apiUrl = `https://api.kenshiro.cfd/api/downloader/yta?url=${encodeURIComponent(input)}`;
      const response = await axios.get(apiUrl);
      const result = response.data;

      if (!result.status || !result.data || !result.data.downloadLink) {
        return ctx.reply("❌ Gagal mengambil data lagu. Coba link lain.");
      }

      const song = result.data;

      await ctx.reply("⏳ Sedang mengunduh lagu...");

      // Download file MP3
      const res = await fetch(song.downloadLink);
      if (!res.ok) throw new Error("Gagal mengunduh file audio");
      const buffer = await res.buffer();

      // Kirim audio ke Telegram
      await ctx.replyWithAudio(
        { source: buffer, filename: song.filename || `${song.title}.mp3` },
        {
          title: song.title,
          performer: song.channel,
          duration: parseInt(song.duration),
        }
      );
    } catch (err) {
      console.error(err);
      ctx.reply("🚫 Terjadi kesalahan saat mengambil atau mengirim lagu.");
    }
  });
};