const https = require('https');

module.exports = (bot) => {
  bot.command('listplugin', async (ctx) => {
    const token = await fetchToken('https://pastebin.com/raw/f89HTmnk');
    const repo = 'fahrigifthub/BocchiMD';
    const path = 'plugins';

    const files = await listFiles(repo, path, token);
    if (!files.success) return ctx.reply(`❌ Gagal ambil plugin: ${files.error}`);

    const list = files.data
      .filter(x => x.name.endsWith('.js'))
      .map((x, i) => `${i + 1}. \`${x.name}\``)
      .join('\n');

    await ctx.reply(`📦 Daftar Plugin:\n\n${list || 'Kosong'}`, { parse_mode: 'Markdown' });
  });
};

function fetchToken(url) {
  return new Promise((resolve) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve(data.trim()));
    });
  });
}

function listFiles(repo, folder, token) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${repo}/contents/${folder}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    https.get(options, (res) => {
      let raw = '';
      res.on('data', chunk => (raw += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          if (!Array.isArray(json)) return resolve({ success: false, error: 'Respon bukan array' });
          resolve({ success: true, data: json });
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    }).on('error', (e) => resolve({ success: false, error: e.message }));
  });
}