const axios = require('axios');

module.exports = (bot) => {
  const GITHUB_TOKEN = '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'; // Ganti token kamu
  const REPO_OWNER = 'fahrigifthub';
  const REPO_NAME = 'BocchiMD';
  const BRANCH = 'main';

  // Simpan cache daftar plugin
  let pluginListCache = [];

  // /listplugin
  bot.command('listplugin', async (ctx) => {
    try {
      const res = await axios.get(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/plugins`,
        {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      const files = res.data.filter((f) => f.name.endsWith('.js'));
      if (files.length === 0) return ctx.reply('📂 Tidak ada plugin di folder `plugins/`');

      pluginListCache = files;

      const list = files
        .map((f, i) => `${i + 1}. \`${f.name}\``)
        .join('\n');

      ctx.replyWithMarkdown(`📄 *Daftar Plugin:*\n${list}\n\nGunakan */delplugin <nomor>* untuk hapus.`);
    } catch (err) {
      console.error(err.response?.data || err.message);
      ctx.reply('❌ Gagal mengambil daftar plugin.');
    }
  });

  // /delplugin <nomor>
  bot.command('delplugin', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const index = parseInt(args[1]);

    if (isNaN(index) || index < 1 || index > pluginListCache.length) {
      return ctx.reply('⚠️ Format: /delplugin <nomor dari /listplugin>');
    }

    const target = pluginListCache[index - 1];
    const githubUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/plugins/${target.name}`;

    try {
      // Ambil SHA file
      const getFile = await axios.get(githubUrl, {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      await axios.delete(githubUrl, {
        data: {
          message: `Delete plugin ${target.name}`,
          sha: getFile.data.sha,
          branch: BRANCH,
        },
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      ctx.reply(`🗑️ Plugin *${target.name}* berhasil dihapus dari GitHub.`, {
        parse_mode: 'Markdown',
      });
    } catch (err) {
      console.error(err.response?.data || err.message);
      ctx.reply('❌ Gagal hapus plugin.');
    }
  });
};
