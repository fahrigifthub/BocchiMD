const todayFile = path.join(__dirname, './data/user_today.json');

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}
function getGreeting() {
  const hours = new Date().getHours();
  if (hours >= 0 && hours < 12) {
    return "Selamat Pagi.. 🌆";
  } else if (hours >= 12 && hours < 18) {
    return "Selamat Sore..🌇";
  } else {
    return "Selamat Malam..🌌";
  }
}
function getUptime() {
  const seconds = process.uptime();
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}
function ensureTodayFile() {
  const today = getTodayDate();
  if (!fs.existsSync(todayFile)) {
    fs.writeFileSync(todayFile, JSON.stringify({ date: today, users: [] }, null, 2));
  }

  const data = JSON.parse(fs.readFileSync(todayFile));

  if (data.date !== today) {
    fs.writeFileSync(todayFile, JSON.stringify({ date: today, users: [] }, null, 2));
    return { date: today, users: [] };
  }

  return data;
}

function logUserToday(userId) {
  const data = ensureTodayFile();
  if (!data.users.includes(userId)) {
    data.users.push(userId);
    fs.writeFileSync(todayFile, JSON.stringify(data, null, 2));
  }
}

function getUserTodayCount() {
  const data = ensureTodayFile();
  return data.users.length;
}
