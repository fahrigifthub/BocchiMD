const { Telegraf, Markup } = require('telegraf');
const config = require('./config');
const fs = require('fs');
const path = require('path');
const bot = new Telegraf(config.botToken);
const todayFile = path.join(__dirname, './data/user_today.json');

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
  if (fs.existsSync(todayFile)) {
    data = JSON.parse(fs.readFileSync(todayFile));
  }

  if (data.date !== today) {
    data = { date: today, users: [] };
  }

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

const axios = require('axios'); // tambahin ini kalau belum
const CHECKER_API = 'http://fernine.idbothost.my.id:4002/api/check'; // ganti ke URL checker lu

async function checkJoinChannel(ctx) {
  try {
    const res = await axios.post(CHECKER_API, { user_id: ctx.from.id });
    return res.data.joined === true;
  } catch (err) {
    console.error('Error cek via API:', err.message);
    return false;
  }
}

bot.use(async (ctx, next) => {
  if (!ctx.from || ctx.from.is_bot || !ctx.chat) return next();

  // Bypass kalau pesan dari linked channel
  if (ctx.message?.sender_chat?.type === 'channel') return next();

  const chatType = ctx.chat.type;
  const joined = await checkJoinChannel(ctx);

  // Jika private
  if (chatType === 'private') {
    if (!joined) {
      const text = `
\`\`\`
Halo ${ctx.from.first_name}, kamu harus join channel kami dulu ya untuk pakai bot ini.
\`\`\`
      `;
      return ctx.replyWithPhoto('https://files.catbox.moe/kkl2ly.jpg', {
        caption: text,
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.url('Join Channel', `https://t.me/${config.FORCE_SUB_CHANNEL.replace(/^@/, '')}`)
        ])
      });
    }
    return next();
  }

  // Jika grup
  if (chatType === 'supergroup' || chatType === 'group') {
    if (!joined) {
      try {
        await ctx.restrictChatMember(ctx.from.id, {
          permissions: {
            can_send_messages: false,
            can_send_media_messages: false,
            can_send_other_messages: false,
            can_add_web_page_previews: false,
          },
          until_date: 0 // mute selamanya
        });

        await ctx.reply(
          `Halo ${ctx.from.first_name}, kamu belum join channel. Kamu di-mute dulu ya sampai kamu join.`,
          Markup.inlineKeyboard([
            [Markup.button.url('Join Channel', `https://t.me/${config.FORCE_SUB_CHANNEL.replace(/^@/, '')}`)],
            [Markup.button.callback('Unmute Saya', 'check_sub')]
          ])
        );
      } catch (err) {
        console.error('Gagal mute user:', err.response?.description || err);
      }
      return;
    }
    return next();
  }

  return next();
});

// Handler callback: Unmute setelah join
bot.action('check_sub', async (ctx) => {
  await ctx.answerCbQuery();
  const joined = await checkJoinChannel(ctx);

  if (!joined) {
    return ctx.editMessageText(
      `\`\`\`
Kamu belum join channel kami, silakan join dulu ya.
\`\`\``,
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          Markup.button.url('Join Channel', `https://t.me/${config.FORCE_SUB_CHANNEL.replace(/^@/, '')}`),
          Markup.button.callback('Cek Lagi', 'check_sub')
        ])
      }
    );
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
    await ctx.editMessageText('Kamu sudah berhasil unmute dan bisa kirim pesan sekarang.');
  } catch (err) {
    console.error('Gagal unmute user:', err.response?.description || err);
    await ctx.editMessageText('Gagal unmute. Pastikan bot punya izin admin penuh.');
  }
});


module.exports = (bot) => {
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

  bot.action('check_sub', async (ctx) => {
    const joined = await checkJoinChannel(ctx);
    if (!joined) return ctx.answerCbQuery('❌ Belum join!', { show_alert: true });
    return sendStartMenu(ctx);
  });

  bot.action(/.*/, async (ctx) => {
    const data = ctx.callbackQuery.data;
    const username = ctx.from.first_name || 'User';
    const uptime = getUptime();
    const totalToday = getUserTodayCount();
    const greeting = getGreeting();
    let newCaption = '', newButtons = [];

    if (data === 'maiinmenu') {
      return sendStartMenu(ctx);
    } else if (data === 'allmenu') {
      newCaption = `Haloo.. @${ctx.from.username || 'user'} 👋 
${greeting}

╭─────────────────╮
│                     Bocchi MD                     │
╰─────────────────╯
╭─────────────────╾
├─▢ Nama    : Bocchi
├─▢ Versi   : 1.0.0
├─▢ Author  : @VellzXyrine
├─▢ Runtime : ${uptime}
├─▢ UserToday : ${totalToday}
╰─────────────────╾
╭─────────────────╮
│                       List Menu                    │
╰─────────────────╯
╭──────────────────╾
│
│┌ Download    ┌ Tools
│├ Fun              ├ Group
│├ Ai                 ├ Search
│├ Stalk            ├ Cpanel
│├ Owner         ├ RPG
│└ Encrypt        └ Anime
│
╰──────────────────╾`;
      newButtons = [
        [
          { text: "ᴅᴏᴡɴʟᴏᴀᴅ", callback_data: "downloadmenu" },
          { text: "ᴛᴏᴏʟs", callback_data: "toolsmenu" }
        ],
        [
          { text: "ɢʀᴏᴜᴘ", callback_data: "groupmenu" },
          { text: "ᴀɪ", callback_data: "aimenu" }
        ],
        [
          { text: "allmenu", callback_data: "semuamenu" }
        ],
        [
          { text: "🔙 ʙᴀᴄᴋ", callback_data: "allmenu" }
        ]
      ];
    } else {
      const menus = {
        downloadmenu: '/ytmp3\n/ytmp4',
        toolsmenu: '/brat\n/play\n/tourl',
        groupmenu: '/add\n/kick',
        aimenu: '/gpt4o\n/deepseek',
        searchmenu: '/ytsearch\n/ttsearch',
        funmenu: '/asupan'
      };
      if (menus[data]) {
        newCaption = `\`\`\`
╭─〔 ${data.replace('menu', '').toUpperCase()} Menu 〕
╰────────────────╾
╭────────────────╾
│
├ ${menus[data].replace(/\n/g, '\n├ ')}\n│
╰────────────────╾
\`\`\``;
        newButtons = [[{ text: "🔙 ʙᴀᴄᴋ", callback_data: "allmenu" }]];
      }
    }

    try {
      await ctx.editMessageCaption(newCaption, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: newButtons }
      });
    } catch (err) {
      console.log('❌ Gagal edit caption:', err.message);
    }

    await ctx.answerCbQuery();
  });
};

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
bot.launch();
