const { Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

// File penyimpanan user hari ini
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

module.exports = (bot) => {
  bot.start(async (ctx) => {
    logUserToday(ctx.from.id);
    return sendStartMenu(ctx);
  });

  bot.action('check_sub', async (ctx) => {
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

╭────────────╮
│           Bocchi MD                     │
╰────────────╯
╭────────────╾
├─▢ Nama    : Bocchi
├─▢ Versi   : 1.0.0
├─▢ Author  : @VellzXyrine
├─▢ Runtime : ${uptime}
├─▢ UserToday : ${totalToday}
╰────────────╾
╭────────────╮
│            List Menu                    │
╰────────────╯
╭────────────╾
│
│┌ Download    ┌ Tools
│└ Ai               └ Group               
│
╰───────────╾`;
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
    } else if (data === 'downloadmenu') {
    newCaption = `\`\`\`
╭────────────╮
│         Download Menu                │
╰────────────╯

╭────────────────╾
│
├ /ytmp3
├ /ytmp4
│
╰────────────────╾
\`\`\``;
    newButtons = [[{ text: "🔙 ʙᴀᴄᴋ", callback_data: "allmenu" }]];
  } else if (data === 'toolsmenu') {
    newCaption = `\`\`\`
╭────────────╮
│           Tools Menu                     │
╰────────────╯
╭────────────────╾
│
├ /brat
├ /play
├ /tourl
│
╰────────────────╾
\`\`\``;
    newButtons = [[{ text: "🔙 ʙᴀᴄᴋ", callback_data: "allmenu" }]];
  } else if (data === 'groupmenu') {
    newCaption = `\`\`\`
╭────────────╮
│           Group Menu                     │
╰────────────╯
╭────────────────╾
│
├ /add
├ /kick
│
╰────────────────╾
\`\`\``;
    newButtons = [[{ text: "🔙 ʙᴀᴄᴋ", callback_data: "allmenu" }]];
  } else if (data === 'aimenu') {
    newCaption = `\`\`\`
╭────────────╮
│           Ai Menu                     │
╰────────────╯
╭────────────────╾
│
├ /gpt4o
├ /deepseek
│
╰────────────────╾
\`\`\``;
    newButtons = [[{ text: "🔙 ʙᴀᴄᴋ", callback_data: "allmenu" }]];
  } else if (data === 'semuamenu') {
    newCaption = `\`\`\`
╭────────────╮
│           List Menu                     │
╰────────────╯
╭────────────────╾
│
├ /ytmp3
├ /ytmp4
├ /play
├ /brat
├ /tourl
├ /ai
├ /add
├ /kick
├ /
│
╰────────────────╾

\`\`\``;
    newButtons = [[{ text: "🔙 ʙᴀᴄᴋ", callback_data: "allmenu" }]];
  } else if (data === 'searchmenu') {
    newCaption = `\`\`\`
╭─〔 Search Menu 〕
╰────────────────╾
╭────────────────╾
│
├ /ytsearch
├ /ttsearch
│
╰────────────────╾
\`\`\``;
    newButtons = [[{ text: "🔙 ʙᴀᴄᴋ", callback_data: "allmenu" }]];
  } else if (data === 'panelmenu') {
    newCaption = `\`\`\`
╭─〔 Panel Menu 〕
╰────────────────╾
╭────────────────╾
│
├ /1gb user,idtele
│
╰────────────────╾
\`\`\``;
    newButtons = [[{ text: "🔙 ʙᴀᴄᴋ", callback_data: "allmenu" }]];
  }
    else if (data === 'ownermenu') {
    newCaption = `\`\`\`
╭─〔 Owner Menu 〕
╰────────────────╾
╭────────────────╾
│
├ /broadcast
├ /upch
│
╰────────────────╾
\`\`\``;
    newButtons = [[{ text: "🔙 ʙᴀᴄᴋ", callback_data: "allmenu" }]];
  }
else if (data === 'funmenu') {
    newCaption = `\`\`\`
╭─〔 Fun Menu 〕
╰────────────────╾
╭────────────────╾
│
├ /asupan 
│
╰────────────────╾
\`\`\``;
    newButtons = [[{ text: "🔙 ʙᴀᴄᴋ", callback_data: "allmenu" }]];
  } else if (data === 'rpgmenu') {
    newCaption = `\`\`\`
╭─〔 Rpg Menu 〕
╰────────────────╾
╭────────────────╾
│
├ /regis 
│
╰────────────────╾
\`\`\``;
    newButtons = [[{ text: "🔙 ʙᴀᴄᴋ", callback_data: "allmenu" }]];
  } else if (data === 'encmenu') {
    newCaption = `\`\`\`
╭─〔 Encrypt Menu 〕
╰────────────────╾
╭────────────────╾
│
├ /customenc
│
╰────────────────╾
\`\`\``;
    newButtons = [[{ text: "🔙 ʙᴀᴄᴋ", callback_data: "allmenu" }]];
  } else if (data === 'animemenu') {
    newCaption = `\`\`\`
╭─〔 Anime Menu 〕
╰────────────────╾
╭────────────────╾
│
├ /husbu
│
╰────────────────╾
\`\`\``;

    newButtons = [[{ text: "🔙 ʙᴀᴄᴋ", callback_data: "allmenu" }]];

  } else if (data === 'supportmenu') {
    newCaption = `\`\`\`
╭─〔 Support Owner 〕
╰────────────────╾
╭────────────────╾
│
├ /donate
│
╰────────────────╾
\`\`\``;
    newButtons = [[{ text: "🔙 ʙᴀᴄᴋ", callback_data: "allmenu" }]];
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
