// Read DEV_MODE from central config (window.APP.DEV_MODE). Keep this file free of its own DEV_MODE declaration.
let CONFIG_URL = ""; 

// Allow switching the config URL depending on the central DEV_MODE flag.
if (window.APP && window.APP.DEV_MODE === true) {
  CONFIG_URL = 'config.json'
} else {
  CONFIG_URL = 'https://raw.githubusercontent.com/cosr2024/cosr2024.github.io/main/config.json';
}

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

  const ms = diff;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  document.getElementById('countdown').textContent =
    `${days} days ${hours}h ${minutes}m ${seconds}s`;
}

async function init() {
  const targetTime = await fetchTargetTime();
  
  document.getElementById('target-time').textContent =
    "Next Session: " + targetTime.toLocaleString();
  
  setInterval(() => {
    document.getElementById('current-time').textContent =
      "Currently: " + new Date().toLocaleString();
    updateCountdown(targetTime);
  }, 1000);
}

async function displayQuote() {
  // Fetch quotes.txt, pick a random non-empty line, and display it under the countdown.
  // This is intentionally lightweight and tolerant of lines like "/* Lines ... omitted */".
  try {
    const res = await fetch('quotes.txt?t=' + Date.now());
    if (!res.ok) throw new Error('Failed to fetch quotes.txt: ' + res.status);
    const text = await res.text();
    const lines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('/*') && !l.startsWith('*') && !/omitted/.test(l));

    if (!lines.length) return;
    const quote = lines[Math.floor(Math.random() * lines.length)];
    const el = document.getElementById('quote');
    if (el) el.textContent = '“' + quote + '”';
  } catch (err) {
    // Don't break the page if quotes fail to load; log for debugging.
    console.error('displayQuote error:', err);
  }
}

init();
// Show a visible banner when in DEV_MODE and wire the New Quote button.
if (window.APP && window.APP.DEV_MODE === true) {
  const banner = document.getElementById('dev-banner');
  if (banner) {
    banner.style.display = 'block';
    // push content down so banner doesn't overlap
    document.body.style.paddingTop = '48px';
  }
}

// Wire the "New Quote" button and display an initial quote.
const newQuoteBtn = document.getElementById('new-quote-btn');
if (newQuoteBtn) newQuoteBtn.addEventListener('click', displayQuote);
displayQuote();