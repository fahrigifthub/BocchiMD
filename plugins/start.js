const { Markup } = require('telegraf');
const bot = new Telegraf('7704243997:AAGX5okHesgLEzU0BzJ_bWKSRGzps6RNfc4');
const config = require('../config'); // asumsi config.js ada di root
const fs = require('fs');
const path = require('path');

const todayFile = path.join(__dirname, '../data/user_today.json');

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}
function getUptime() {
  const seconds = process.uptime();
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}
function logUserToday(id) {
  const today = getTodayDate();
  let data = { date: today, users: [] };
  if (fs.existsSync(todayFile)) data = JSON.parse(fs.readFileSync(todayFile));
  if (data.date !== today) data = { date: today, users: [] };
  if (!data.users.includes(id)) {
    data.users.push(id);
    fs.writeFileSync(todayFile, JSON.stringify(data, null, 2));
  }
}
function getUserTodayCount() {
  if (!fs.existsSync(todayFile)) return 0;
  const data = JSON.parse(fs.readFileSync(todayFile));
  return data.date === getTodayDate() ? data.users.length : 0;
}
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Selamat Pagi.. 🌅';
  if (hour < 18) return 'Selamat Sore.. 🌇';
  return 'Selamat Malam.. 🌌';
}

async function checkJoinChannel(ctx) {
  try {
    const member = await ctx.telegram.getChatMember(config.FORCE_SUB_CHANNEL, ctx.from.id);
    return ['member', 'administrator', 'creator'].includes(member.status);
  } catch (err) {
    console.error('❌ Gagal cek join channel:', err.message);
    return false;
  }
}

module.exports = (bot) => {
  // Middleware private
  bot.use(async (ctx, next) => {
    if (ctx.chat?.type !== 'private') return next();
    const joined = await checkJoinChannel(ctx);
    if (!joined) {
      return ctx.replyWithPhoto('https://files.catbox.moe/kkl2ly.jpg', {
        caption: `\`\`\`\nHalo ${ctx.from.first_name}, kamu harus join channel kami dulu ya untuk pakai bot ini.\n\`\`\``,
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.url('Join Channel', `https://t.me/${config.FORCE_SUB_CHANNEL.replace(/^@/, '')}`)
        ])
      });
    }
    return next();
  });

  // Middleware group
  bot.use(async (ctx, next) => {
    if (!['group', 'supergroup'].includes(ctx.chat?.type)) return next();
    const joined = await checkJoinChannel(ctx);
    if (joined) return next();

    try {
      const user = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
      if (['administrator', 'creator'].includes(user.status)) return next();

      await ctx.restrictChatMember(ctx.from.id, {
        permissions: {
          can_send_messages: false,
          can_send_media_messages: false,
          can_send_polls: false,
          can_send_other_messages: false,
          can_add_web_page_previews: false,
          can_change_info: false,
          can_invite_users: false,
          can_pin_messages: false
        },
        until_date: 0
      });

      await ctx.reply(
        `Halo ${ctx.from.first_name}, kamu belum join channel. Kamu di-mute dulu ya sampai kamu join.`,
        Markup.inlineKeyboard([
          [Markup.button.url('Join Channel', `https://t.me/${config.FORCE_SUB_CHANNEL.replace(/^@/, '')}`)],
          [Markup.button.callback('Unmute Saya', 'check_sub')]
        ])
      );
    } catch (err) {
      console.error('Gagal mute user:', err.response?.description || err.message || err);
    }
  });

  // Handler Unmute
  bot.action('check_sub', async (ctx) => {
    await ctx.answerCbQuery();
    const joined = await checkJoinChannel(ctx);
    if (!joined) {
      return ctx.editMessageText(`\`\`\`\nKamu belum join channel kami, silakan join dulu ya.\n\`\`\``, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          Markup.button.url('Join Channel', `https://t.me/${config.FORCE_SUB_CHANNEL.replace(/^@/, '')}`),
          Markup.button.callback('Cek Lagi', 'check_sub')
        ])
      });
    }

    try {
      await ctx.restrictChatMember(ctx.from.id, {
        permissions: {
          can_send_messages: true,
          can_send_media_messages: true,
          can_send_other_messages: true,
          can_add_web_page_previews: true,
        }
      });
      await ctx.editMessageText('✅ Kamu sudah berhasil unmute dan bisa kirim pesan sekarang.');
    } catch (err) {
      console.error('Gagal unmute user:', err.response?.description || err);
      await ctx.editMessageText('Gagal unmute. Pastikan bot punya izin admin penuh.');
    }
  });

  // Start
  bot.start(async (ctx) => {
    const joined = await checkJoinChannel(ctx);
    if (!joined) {
      return ctx.replyWithPhoto('https://files.catbox.moe/kkl2ly.jpg', {
        caption: `\`\`\`\nHalo ${ctx.from.first_name}, kamu harus join channel kami dulu ya untuk pakai bot ini.\n\`\`\``,
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.url('Join Channel', `https://t.me/${config.FORCE_SUB_CHANNEL.replace(/^@/, '')}`),
          Markup.button.callback('Cek Lagi', 'check_sub')
        ])
      });
    }

    logUserToday(ctx.from.id);
    return sendStartMenu(ctx);
  });

  // Callback untuk menu
  bot.action(/.*/, async (ctx) => {
    // bisa ditambahkan seperti di contoh kamu sebelumnya
  });
};

// Start menu
async function sendStartMenu(ctx) {
  const name = ctx.from.first_name || 'User';
  const uptime = getUptime();
  const total = getUserTodayCount();
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
│  ├─ Pengguna     : ${name}
│  └─ User Hari Ini: ${total}
╰────────────────────────────╾
Silakan pencet tombol di bawah untuk mulai:
\`\`\``;

  await ctx.replyWithVideo('https://files.catbox.moe/hgioyp.mp4', {
    caption,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'ᴍᴇɴᴜ', callback_data: 'allmenu' }],
        [{ text: 'ᴏᴡɴᴇʀ', url: 'https://t.me/VellzXyrine' }]
      ]
    }
  });
}
