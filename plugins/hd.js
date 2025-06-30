const axios = require("axios");
const fetch = require("node-fetch");
const FormData = require("form-data");
const { fileTypeFromBuffer } = require("file-type");

module.exports = (bot) => {
  bot.command("hd", async (ctx) => {
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

      const finalUrl = cloudkuLink || catboxLink;
      if (!finalUrl) return ctx.reply("❌ Gagal upload ke semua layanan.");

      await ctx.reply("⏳ Mengirim ke remini...");
      const api = `https://api.kenshiro.cfd/api/tools/remini?url=${encodeURIComponent(finalUrl)}`;
      const res = await axios.get(api);
      const finalImage = res?.data?.data?.url;

      if (!finalImage) {
        return ctx.reply("❌ Gagal mendapatkan gambar HD.");
      }

      const imageRes = await axios.get(finalImage, { responseType: "arraybuffer" });
      const finalBuffer = Buffer.from(imageRes.data);

      await ctx.replyWithPhoto({ source: finalBuffer }, {
        caption: "✅ Gambar berhasil di-HD-kan!"
      });
    } catch (e) {
      console.error("HD Error:", e);
      return ctx.reply(`❌ Error: ${e.message || e}`);
    }
  });
};

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

async function cloudkuUpload(buffer) {
  const { ext, mime } = (await fileTypeFromBuffer(buffer)) || {
    ext: "bin",
    mime: "application/octet-stream",
  };
  const form = new FormData();
  form.append("file", buffer, {
    filename: `file.${ext}`,
    contentType: mime,
  });

  const res = await fetch("https://cloudku.vercel.app/upload", {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("Gagal upload ke Cloudku.");
  const json = await res.json();
  return json?.url;
}
