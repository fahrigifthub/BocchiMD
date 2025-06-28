const { Telegraf, Markup } = require('telegraf');
const bot = new Telegraf('7704243997:AAGX5okHesgLEzU0BzJ_bWKSRGzps6RNfc4'); 
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

const axios = require('axios'); // tambahin ini kalau belum
const CHECKER_API = 'http://fernine.idbothost.my.id:4002/api/check'; // ganti ke URL checker lu

async function checkJoinChannel(ctx) {
  try {
    const member = await bot.telegram.getChatMember(config.FORCE_SUB_CHANNEL, ctx.from.id);
    return ['member', 'administrator', 'creator'].includes(member.status);
  } catch (err) {
    console.error('❌ Gagal cek join channel:', err.message);
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
          Markup.button.url('Join Channel', `https://t.me/FernineInformation`)
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
            [Markup.button.url('Join Channel', `https://t.me/FernineInformation`)],
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
          Markup.button.url('Join Channel', `https://t.me/FernineInformation`),
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
          Markup.button.url('Join Channel', `https://t.me/FernineInformation`),
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
╭─〔 Download Menu 〕
╰────────────────╾
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
╭─〔 Tools Menu 〕
╰────────────────╾
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
╭─〔 Group Menu 〕
╰────────────────╾
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
╭─〔 AI Menu 〕
╰────────────────╾
╭────────────────╾
│
├ /gpt4o
├ /deepseek
│
╰────────────────╾
\`\`\``;
    newButtons = [[{ text: "🔙 ʙᴀᴄᴋ", callback_data: "allmenu" }]];
  } else if (data === 'stalkmenu') {
    newCaption = `\`\`\`
╭─〔 Stalk Menu 〕
╰────────────────╾
╭────────────────╾
│
├ /instagramstalk
├ /tiktokstalk
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
