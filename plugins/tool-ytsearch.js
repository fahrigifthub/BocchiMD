const axios = require("axios");
const { default: fetch } = require("node-fetch");

module.exports = (bot) => {
  // Command: /ytsearch <query>
  bot.command('ytsearch', async (ctx) => {
    const text = ctx.message.text.split(" ").slice(1).join(" ");
    if (!text) return ctx.reply("Masukkan query pencarian!");

    ctx.reply("🔍 Sedang mencari...");
    try {
      const res = await axios.get(`https://api.diioffc.web.id/api/search/ytplay?query=${encodeURIComponent(text)}`);
      const result = res.data.result;
      const caption = `🎵 *Title:* ${result.title}\n📜 *Description:* ${result.description}\n👀 *Views:* ${result.views}`;

      ctx.replyWithMarkdown(caption, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🎵 Download MP3", callback_data: `ytmp3 ${result.url}` }],
            [{ text: "📹 Download MP4", callback_data: `ytmp4 ${result.url}` }]
          ]
        }
      });
    } catch (err) {
      console.error(err);
      ctx.reply("❌ Terjadi kesalahan saat mencari.");
    }
  });

  // Callback: ytmp3
  bot.action(/^ytmp3 (.+)$/, async (ctx) => {
    const url = ctx.match[1];
    await ctx.answerCbQuery();
    await ctx.reply("🔊 Mengunduh MP3...");

    try {
      const res = await axios.get(`https://api.kenshiro.cfd/api/downloader/yta`, {
        params: { url },
        headers: { accept: "application/json" }
      });

      const data = res.data?.data;
      if (!data?.downloadLink) return ctx.reply("❌ Gagal mengunduh audio.");

      const fetchRes = await fetch(data.downloadLink);
      if (!fetchRes.ok) throw new Error("Gagal unduh file MP3");
      const buffer = await fetchRes.buffer();

      await ctx.replyWithAudio(
        { source: buffer, filename: data.filename || `${data.title}.mp3` },
        {
          title: data.title,
          performer: data.channel,
          duration: parseInt(data.duration),
        }
      );
    } catch (err) {
      console.error(err);
      ctx.reply("❌ Gagal mengunduh audio.");
    }
  });

  // Callback: ytmp4
  bot.action(/^ytmp4 (.+)$/, async (ctx) => {
    const url = ctx.match[1];
    await ctx.answerCbQuery();
    await ctx.reply("📥 Mengunduh video MP4...");

    try {
      const res = await axios.get(`https://api.kenshiro.cfd/api/downloader/ytv`, {
        params: { url },
        headers: { accept: "application/json" }
      });

      const data = res.data?.data;
      if (!data?.downloadLink) return ctx.reply("❌ Gagal mengunduh video.");

      const fetchRes = await fetch(data.downloadLink);
      if (!fetchRes.ok) throw new Error("Gagal unduh file MP4");
      const buffer = await fetchRes.buffer();

      await ctx.replyWithVideo(
        { source: buffer, filename: data.filename || `${data.title}.mp4` },
        {
          caption: `✅ Download selesai!\n🎬 ${data.title}`,
          duration: parseInt(data.duration)
        }
      );
    } catch (err) {
      console.error(err);
      ctx.reply("❌ Terjadi kesalahan saat mengunduh video.");
    }
  });
};