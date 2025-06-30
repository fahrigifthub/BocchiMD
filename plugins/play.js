const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');

module.exports = (bot) => {
  bot.command('play', async (ctx) => {
    try {
      const query = ctx.message.text.split(' ').slice(1).join(' ');

      if (!query) {
        return ctx.reply('⚠️ Ketik judul lagu. Contoh: /play Akhir Tak Bahagia');
      }

      await ctx.reply(`🔍 Mencari lagu: *${query}* ...`, { parse_mode: 'Markdown' });

      // Search lagu
      const searchRes = await axios.get(`https://api-simplebot.vercel.app/search/spotify?apikey=free&q=${encodeURIComponent(query)}`);
      const results = searchRes.data.result;

      if (!results || results.length === 0) {
        return ctx.reply('❌ Lagu tidak ditemukan.');
      }

      const lagu = results[0];

      // Download lagu
      const dlRes = await axios.get(`https://api-simplebot.vercel.app/download/spotify?apikey=free&url=${encodeURIComponent(lagu.url)}`);
      const audioUrl = dlRes.data.result.url;

      const filename = `${lagu.title.replace(/[^\w\s]/gi, '')}.mp3`;
      const filePath = path.join(__dirname, filename);
      const writer = fs.createWriteStream(filePath);

      const response = await axios({
        url: audioUrl,
        method: 'GET',
        responseType: 'stream',
        httpsAgent: new https.Agent({ rejectUnauthorized: false })
      });

      response.data.pipe(writer);

      writer.on('finish', async () => {
        await ctx.replyWithAudio({ source: fs.createReadStream(filePath), filename }, {
          title: lagu.title,
          performer: lagu.artist
        });
        fs.unlinkSync(filePath); // Hapus file
      });

      writer.on('error', (err) => {
        console.error(err);
        ctx.reply('❌ Gagal unduh audio.');
      });

    } catch (err) {
      console.error(err);
      ctx.reply('❌ Terjadi error.');
    }
  });
};
