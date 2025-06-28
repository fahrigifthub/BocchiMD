const { Markup } = require('telegraf');
const config = require('./config'); // token & FORCE_SUB_CHANNEL di sini
const { getUptime, getGreeting, getUserTodayCount, logUserToday } = require('../lib/functions'); // sesuaikan path

module.exports = (bot) => {
  bot.start(async (ctx) => {
    const joined = await checkJoinChannel(ctx);
    if (!joined) {
      return ctx.replyWithPhoto('https://files.catbox.moe/kkl2ly.jpg', {
        caption: `\`\`\`\nHalo ${ctx.from.first_name}, kamu harus join channel kami dulu ya untuk pakai bot ini.\n\`\`\``,
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.url('Join Channel', `https://t.me/${config.FORCE_SUB_CHANNEL.replace(/^@/, '')}`),
          Markup.button.callback('Cek Lagi', 'check_sub'),
        ])
      });
    }

    logUserToday(ctx.from.id);
    return sendMainMenu(ctx);
  });

  bot.action('check_sub', async (ctx) => {
    const joined = await checkJoinChannel(ctx);
    if (!joined) return ctx.answerCbQuery('❌ Belum join!', { show_alert: true });
    return sendMainMenu(ctx);
  });

  bot.action(/.+/, async (ctx) => {
    await handleCallback(ctx);
  });
};

async function sendMainMenu(ctx) {
  const username = ctx.from.first_name || 'User';
  const uptime = getUptime();
  const totalToday = getUserTodayCount();

  const caption = `\`\`\`Bocchi
╭───〔 Bocchi Multi - Device 〕──╾
│  ├─ Bot Name     : Bocchi
│  ├─ Type         : Plugins (Telegraf)
│  ├─ Author       : @VellzXyrine
│  └─ Version      : 2.0.0
│
┝────────〔 Info - Bot 〕──────╾
│  ├─ Status       : Aktif
│  ├─ Runtime      : ${uptime}
│  ├─ Pengguna     : ${username}
│  └─ User Hari Ini: ${totalToday}
╰────────────────────────────╾
Silakan pencet tombol di bawah untuk mulai:
\`\`\``;

  await ctx.replyWithVideo('https://files.catbox.moe/hgioyp.mp4', {
    caption,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: "ᴍᴇɴᴜ", callback_data: "allmenu" }],
        [{ text: "ᴏᴡɴᴇʀ", url: "https://t.me/VellzXyrine" }]
      ]
    }
  });
}

async function handleCallback(ctx) {
  const data = ctx.callbackQuery.data;
  const username = ctx.from.first_name || 'User';
  const uptime = getUptime();
  const totalToday = getUserTodayCount();
  const greeting = getGreeting();

  let caption = '';
  let buttons = [];

  // Contoh handler callback
  if (data === 'maiinmenu') {
    caption = `\`\`\`Bocchi
╭───〔 Bocchi Multi - Device 〕──╾
│  ├─ Bot Name     : Bocchi
│  ├─ Type         : Plugins (Telegraf)
│  ├─ Author       : @VellzXyrine
│  └─ Version      : 2.0.0
│
┝────────〔 Info - Bot 〕──────╾
│  ├─ Status       : Aktif
│  ├─ Runtime      : ${uptime}
│  ├─ Pengguna     : ${username}
│  └─ User Hari Ini: ${totalToday}
╰────────────────────────────╾
Silakan pencet tombol di bawah untuk mulai:
\`\`\``;

    buttons = [
      [{ text: "ᴍᴇɴᴜ", callback_data: "allmenu" }],
      [{ text: "ᴏᴡɴᴇʀ", url: "https://t.me/VellzXyrine" }]
    ];
  }

  // Tambahin handler `allmenu`, `toolsmenu`, dll sesuai yang lu tulis tadi...
  // Copy aja isinya sesuai struktur if-else

  try {
    await ctx.editMessageCaption(caption, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: buttons
      }
    });
  } catch (e) {
    console.log('❌ Gagal update:', e.message);
  }

  await ctx.answerCbQuery();
}

// Dummy function (lu bisa sesuaikan)
async function checkJoinChannel(ctx) {
  // implementasi pengecekan join channel pakai `getChatMember`
  return true;
}
