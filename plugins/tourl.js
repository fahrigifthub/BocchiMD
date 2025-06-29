const { Composer } = require("telegraf");
const FormData = require("form-data");
const { fileTypeFromBuffer } = require("file-type");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

module.exports = (bot) => {
  let enabled = true;
  const composer = new Composer();

  composer.command(["tourl", "upload"], async (ctx) => {
    if (!enabled) return;

    try {
      let mediaMessage = ctx.message.reply_to_message || ctx.message;

      let fileId;
      if (mediaMessage.photo) {
        fileId = mediaMessage.photo[mediaMessage.photo.length - 1].file_id;
      } else if (mediaMessage.document) {
        fileId = mediaMessage.document.file_id;
      } else if (mediaMessage.video) {
        fileId = mediaMessage.video.file_id;
      } else if (mediaMessage.audio) {
        fileId = mediaMessage.audio.file_id;
      } else if (mediaMessage.sticker) {
        fileId = mediaMessage.sticker.file_id;
      } else {
        return ctx.reply("❌ Balas atau kirim file dulu untuk di-upload ke URL.");
      }

      const fileLink = await ctx.telegram.getFileLink(fileId);
      const response = await fetch(fileLink.href);
      if (!response.ok) throw new Error("Gagal mengunduh file dari Telegram.");
      const buffer = await response.buffer();

      const cloudkuLink = await cloudkuUpload(buffer).catch(() => null);
      const catboxLink = await catboxUpload(buffer).catch(() => null);

      if (!cloudkuLink && !catboxLink) return ctx.reply("❌ Gagal upload ke semua layanan.");

      let caption = `╭─ 「 UPLOAD SUCCESS 」\n📂 Size: ${buffer.length} Byte\n${
        cloudkuLink ? `🌥 Cloudku: ${cloudkuLink}\n` : ""
      }${catboxLink ? `🐱 Catbox: ${catboxLink}` : ""}\n╰───────────────`;

      return ctx.reply(caption, { disable_web_page_preview: true });
    } catch (e) {
      return ctx.reply(`❌ Error: ${e.message || e}`);
    }
  });

  bot.use(composer.middleware());

  return {
    enable() {
      enabled = true;
      console.log("[PLUGIN] ToURL diaktifkan");
    },
    disable() {
      enabled = false;
      console.log("[PLUGIN] ToURL dinonaktifkan");
    },
  };
};

async function cloudkuUpload(buffer) {
  const { ext, mime } = (await fileTypeFromBuffer(buffer)) || {
    ext: "bin",
    mime: "application/octet-stream",
  };
  const form = new FormData();
  form.append("file", buffer, { filename: `file.${ext}`, contentType: mime });

  const res = await fetch("https://cloudkuimages.guru/upload.php", {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("Gagal menghubungi Cloudku Images.");
  const json = await res.json();
  if (json.status !== "success" || !json.result?.url)
    throw new Error("Gagal upload ke Cloudku Images.");
  return json.result.url;
}

async function catboxUpload(buffer) {
  const { ext, mime } = (await fileTypeFromBuffer(buffer)) || {
    ext: "bin",
    mime: "application/octet-stream",
  };
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", buffer, {
    filename: `file.${ext}`,
    contentType: mime,
  });

  const res = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("Gagal menghubungi Catbox.");
  return await res.text();
}
