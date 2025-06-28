const { Markup } = require('telegraf');
const config = require('./config');
const fs = require('fs');
const path = require('path');

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

async function checkJoinChannel(ctx) {
  try {
    const res = await ctx.telegram.getChatMember(config.FORCE_SUB_CHANNEL, ctx.from.id);
    return ['member', 'creator', 'administrator'].includes(res.status);
  } catch {
    return false;
  }
}

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
      newCaption = `\`\`\`
Haloo.. @${ctx.from.username || 'user'} 👋 
${greeting}

╭─────〔 Info Bot 〕
╰────────────────╾
╭────────────────╾
├─▢ Nama    : Bocchi
├─▢ Versi   : 2.0.0
├─▢ Author  : @VellzXyrine
├─▢ Runtime : ${uptime}
├─▢ UserToday: ${totalToday}
╰────────────────────────╾

╭─────〔 List Menu 〕─────╮
╰───────────────────╯
╭────────────────────────╾
│
│┌ Download    ┌ Tools
│├ Fun         ├ Group
│├ Ai          ├ Search
│├ Stalk       ├ Cpanel
│├ Owner       ├ RPG
│└ Encrypt     └ Anime
│
╰────────────────────────╾
\`\`\``;
      newButtons = [
        [
          { text: "ᴅᴏᴡɴʟᴏᴀᴅ", callback_data: "downloadmenu" },
          { text: "ᴛᴏᴏʟs", callback_data: "toolsmenu" },
          { text: "sᴛᴀʟᴋ", callback_data: "stalkmenu" }
        ],
        [
          { text: "ɢʀᴏᴜᴘ", callback_data: "groupmenu" },
          { text: "ᴀɪ", callback_data: "aimenu" },
          { text: "sᴇᴀʀᴄʜ", callback_data: "searchmenu" }
        ],
        [
          { text: "ᴄᴘᴀɴᴇʟ", callback_data: "panelmenu" },
          { text: "ᴏᴡɴᴇʀ", callback_data: "ownermenu" },
          { text: "ғᴜɴ", callback_data: "funmenu" }
        ],
        [
          { text: "ʀᴘɢ", callback_data: "rpgmenu" },
          { text: "ᴇɴᴄ", callback_data: "encmenu" },
          { text: "ᴀɴɪᴍᴇ", callback_data: "animemenu" }
        ],
        [
          { text: "sᴜᴘᴘᴏʀᴛ", callback_data: "supportmenu" }
        ],
        [
          { text: "🔙 ʙᴀᴄᴋ", callback_data: "maiinmenu" }
        ]
      ];
    } else {
      const menus = {
        downloadmenu: '/ytmp3\n/ytmp4',
        toolsmenu: '/brat\n/play\n/tourl',
        groupmenu: '/add\n/kick',
        aimenu: '/gpt4o\n/deepseek',
        stalkmenu: '/instagramstalk\n/tiktokstalk',
        searchmenu: '/ytsearch\n/ttsearch',
        panelmenu: '/1gb user,idtele',
        ownermenu: '/broadcast\n/upch',
        funmenu: '/asupan',
        rpgmenu: '/regis',
        encmenu: '/customenc',
        animemenu: '/husbu',
        supportmenu: '/donate'
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
