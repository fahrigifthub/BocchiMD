
const axios = require('axios');
const { Markup } = require('telegraf');

const API_KEY = 'free';
const BASE_URL = 'https://api-simplebot.vercel.app';

const searchCache = {};

module.exports = (bot) => {
  bot.command('ytsearch', async (ctx) => {
    const query = ctx.message.text.split(' ').slice(1).join(' ');
    if (!query) return ctx.reply('Contoh: /ytsearch akhir tak bahagia');

    try {
      const res = await axios.get(`${BASE_URL}/search/youtube`, {
        params: { apikey: API_KEY, q: query }
      });

      const results = res.data.result;
      if (!results.length) return ctx.reply('Tidak ditemukan.');

      searchCache[ctx.chat.id] = { results, index: 0 };
      sendResult(ctx, ctx.chat.id);
    } catch (err) {
      console.error(err);
      ctx.reply('Gagal mencari video.');
    }
  });

  bot.action(/dlmp3:(.+)/, async (ctx) => {
    const videoId = ctx.match[1];
    const url = `https://youtube.com/watch?v=${videoId}`;

    try {
      const res = await axios.get(`${BASE_URL}/download/ytmp3`, {
        params: { apikey: API_KEY, url }
      });

      const mp3 = res.data.result;
      await ctx.replyWithAudio({ url: mp3.media }, {
        title: mp3.title,
        caption: `🎵 ${mp3.title}`
      });
    } catch (err) {
      console.error(err);
      ctx.reply('❌ Gagal ambil MP3.');
    }
  });

  bot.action(/dlmp4:(.+)/, async (ctx) => {
    const videoId = ctx.match[1];
    const url = `https://youtube.com/watch?v=${videoId}`;

    try {
      const res = await axios.get(`${BASE_URL}/download/ytmp4`, {
        params: { apikey: API_KEY, url }
      });

      const mp4 = res.data.result;
      await ctx.replyWithVideo({ url: mp4.media }, {
        caption: `🎬 ${mp4.title}`
      });
    } catch (err) {
      console.error(err);
      ctx.reply('❌ Gagal ambil MP4.');
    }
  });

  bot.action('next', async (ctx) => {
  const cache = searchCache[ctx.chat.id];
  if (!cache) return ctx.reply('Belum ada pencarian.');

  try {
    // Hapus pesan lama (thumbnail)
    await ctx.deleteMessage();

    // Pindah ke hasil berikutnya
    cache.index = (cache.index + 1) % cache.results.length;
    await sendResult(ctx, ctx.chat.id);
  } catch (err) {
    console.error('Gagal next:', err.message);
    ctx.reply('❌ Gagal lanjut ke berikutnya.');
  }
});


  async function sendResult(ctx, chatId) {
    const { results, index } = searchCache[chatId];
    const video = results[index];
    const videoId = video.videoId;

    const buttons = Markup.inlineKeyboard([
      [
        Markup.button.callback('🔊 Download MP3', `dlmp3:${videoId}`),
        Markup.button.callback('🎬 Download MP4', `dlmp4:${videoId}`)
      ],
      [Markup.button.callback('➡ Next', 'next')]
    ]);

    await ctx.replyWithPhoto(video.thumbnail, {
      caption: `🎬 <b>${video.title}</b>\n⏱️ ${video.timestamp}\n👁️ ${video.views.toLocaleString()} views\n<a href="${video.url}">🔗 Tonton di YouTube</a>`,
      parse_mode: 'HTML',
      ...buttons
    });
  }

  bot.command('ytmp3', async (ctx) => {
    const url = ctx.message.text.split(' ')[1];
    if (!url) return ctx.reply('Contoh: /ytmp3 https://youtube.com/watch?v=xxxx');

    try {
      const res = await axios.get(`${BASE_URL}/download/ytmp3`, {
        params: {
          apikey: API_KEY,
          url
        }
      });

      const data = res.data.result;
      await ctx.replyWithAudio({ url: data.media }, {
        title: data.title,
        caption: `🎵 ${data.title}`
      });
    } catch (err) {
      console.error(err.message);
      ctx.reply('Gagal download MP3-nya bro.');
    }
  });

  bot.command('ytmp4', async (ctx) => {
    const url = ctx.message.text.split(' ')[1];
    if (!url) return ctx.reply('Contoh: /ytmp4 https://youtube.com/watch?v=xxxx');

    try {
      const res = await axios.get(`${BASE_URL}/download/ytmp4`, {
        params: {
          apikey: API_KEY,
          url
        }
      });

      const data = res.data.result;
      await ctx.replyWithVideo({ url: data.media }, {
        caption: `🎬 ${data.title}`
      });
    } catch (err) {
      console.error(err.message);
      ctx.reply('Gagal download MP4-nya bro.');
    }
  });

};
