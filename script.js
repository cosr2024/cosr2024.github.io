const CONFIG_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/time-countdown/main/config.json';

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

// Admin update
async function updateTargetTime() {
  const token = document.getElementById('admin-token').value;
  const newTime = new Date(document.getElementById('new-time').value);
  const status = document.getElementById('update-status');

  if (!token || !newTime) {
    status.textContent = "Please enter token and time.";
    return;
  }

  const body = {
    message: "Update target time",
    content: btoa(JSON.stringify({ target_time: newTime.toISOString() })),
  };

  const res = await fetch('https://api.github.com/repos/YOUR_USERNAME/time-countdown/contents/config.json', {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    status.textContent = "Updated successfully!";
  } else {
    status.textContent = "Failed to update.";
  }
}

document.getElementById('update-btn').addEventListener('click', updateTargetTime);

init();
