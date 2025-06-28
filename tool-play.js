const axios = require("axios");
const { default: fetch } = require("node-fetch");

module.exports = (bot) => {
  bot.command("play", async (ctx) => {
    const query = ctx.message.text.split(" ").slice(1).join(" ");

    if (!query) {
      return ctx.reply("❌ Harap masukkan judul lagu. Contoh: /play Akhir tak bahagia");
    }

    try {
      const url = `https://api.kenshiro.cfd/api/downloader/play?q=${encodeURIComponent(query)}`;
      const res = await axios.get(url);
      const data = res.data;

      if (!data.status || !data.data || !data.data.downloadLink) {
        return ctx.reply("❌ Gagal mengambil data. Coba judul lain.");
      }

      const song = data.data;

      ctx.reply("⏳ Sedang mengunduh lagu...");

      const response = await fetch(song.downloadLink);

      if (!response.ok) throw new Error("Gagal unduh file MP3");

      const audioBuffer = await response.buffer();

      await ctx.replyWithAudio(
        { source: audioBuffer, filename: song.filename || `${song.title}.mp3` },
        {
          title: song.title,
          performer: song.channel,
          duration: parseInt(song.duration),
        }
      );

    } catch (err) {
      console.error(err);
      ctx.reply("🚫 Gagal mengambil atau mengirim lagu. Coba lagi nanti.");
    }
  });
};