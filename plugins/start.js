const { Markup } = require('telegraf');
const config = require('./config'); // token & FORCE_SUB_CHANNEL di sini
const { getUptime, getGreeting, getUserTodayCount, logUserToday } = require('./lib/function'); // sesuaikan path

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
        [{ text: "ᴄᴘᴀɴᴇʟ", callback_data: "panelmenu" },
      { text: "ᴏᴡɴᴇʀ", callback_data: "ownermenu" },
      { text: "ғᴜɴ", callback_data: "funmenu" }],
      [{ text: "ʀᴘɢ", callback_data: "rpgmenu" },
      { text: "ᴇɴᴄ", callback_data: "encmenu" },
      { text: "ᴀɴɪᴍᴇ", callback_data: "animemenu" } ],
      [{ text: "sᴜᴘᴘᴏʀᴛ", callback_data: "supportmenu" }],
      [{ text: "🔙 ʙᴀᴄᴋ", callback_data: "maiinmenu" }]
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
