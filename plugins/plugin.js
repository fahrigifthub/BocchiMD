const fs = require('fs');
const path = require('path');
const https = require('https');

module.exports = (bot) => {
  bot.command('addplugin', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const customName = args[1];

    const reply = ctx.message.reply_to_message;
    if (!reply || (!reply.text && !reply.document)) {
      return ctx.reply('💡 Balas pesan teks *kode plugin* atau *file JS* plugin', { parse_mode: 'Markdown' });
    }

    if (!customName || !customName.endsWith('.js')) {
      return ctx.reply('❌ Format: /addplugin <namafile.js>');
    }

    let content;

    if (reply.text) {
      content = reply.text;
    } else if (reply.document && reply.document.file_name.endsWith('.js')) {
      const link = await ctx.telegram.getFileLink(reply.document.file_id);
      content = await fetchFile(link.href);
    } else {
      return ctx.reply('❌ File bukan format `.js`');
    }

    const token = await fetchTokenFromPastebin('https://pastebin.com/raw/f89HTmnk');
    const res = await uploadToGithub(token, 'fahrigifthub/BocchiMD', 'plugins/' + customName, content);

    if (res.success) {
      ctx.reply(`✅ Plugin *${customName}* berhasil diupload ke GitHub!`, { parse_mode: 'Markdown' });
    } else {
      ctx.reply(`❌ Gagal upload: ${res.error}`);
    }
  });
};

function fetchTokenFromPastebin(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(data.trim()));
    }).on('error', reject);
  });
}

function fetchFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function uploadToGithub(token, repo, path, content) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${repo}/contents/${path}`,
      method: 'PUT',
      headers: {
        'User-Agent': 'Node.js',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    };

    const body = JSON.stringify({
      message: `add: ${path}`,
      content: Buffer.from(content).toString('base64'),
      branch: 'main'
    });

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (d) => raw += d);
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          resolve({ success: true });
        } else {
          const json = JSON.parse(raw);
          resolve({ success: false, error: json.message || 'Unknown error' });
        }
      });
    });

    req.on('error', (e) => resolve({ success: false, error: e.message }));
    req.write(body);
    req.end();
  });
}
