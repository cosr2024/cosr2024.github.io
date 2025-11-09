const CONFIG_URL = 'https://raw.githubusercontent.com/cosr2024/cosr2024.github.io/main/config.json';

async function fetchTargetTime() {
  const res = await fetch(CONFIG_URL + '?t=' + Date.now());
  const data = await res.json();
  return new Date(data.target_time);
}

function updateCountdown(targetTime) {
  const now = new Date();
  const diff = targetTime - now;

  if (diff <= 0) {
    document.getElementById('countdown').textContent = "Time reached!";
    return;
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  document.getElementById('countdown').textContent =
    `${hours}h ${minutes}m ${seconds}s`;
}

async function init() {
  const targetTime = await fetchTargetTime();
  document.getElementById('target-time').textContent =
    "Target: " + targetTime.toLocaleString();

  setInterval(() => {
    document.getElementById('current-time').textContent =
      "Now: " + new Date().toLocaleString();
    updateCountdown(targetTime);
  }, 1000);
}

init();
