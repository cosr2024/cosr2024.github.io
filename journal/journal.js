// Simple journal editor: toggles between edit and view, parses markdown with marked
// and sanitizes output with DOMPurify. Saves to localStorage on submit and
// attempts to load /journal/content.md if available.

(function(){
  const STORAGE_KEY = 'journal:content';
  const editorEl = document.getElementById('editor');
  const viewerEl = document.getElementById('viewer');
  const modeToggle = document.getElementById('mode-toggle');
  const submitBtn = document.getElementById('submit-btn');
  const statusEl = document.getElementById('journal-status');
  const editorWrapper = document.getElementById('editor-wrapper');

  let current = '';
  let mode = 'view'; // 'view' or 'edit'

  function setStatus(msg, timeout=2500) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    if (timeout > 0) setTimeout(()=> { if (statusEl.textContent === msg) statusEl.textContent = ''; }, timeout);
  }

  async function loadInitial() {
    // Load priority:
    // - If DEV_MODE === false -> try public raw GitHub URL (main/journal/content.md)
    // - If DEV_MODE === true  -> try local /journal/content.md
    // - Fallback to localStorage
    // - Fallback to placeholder
    const isDev = (window.APP && window.APP.DEV_MODE === true);

    if (!isDev) {
      // production: try raw.githubusercontent.com
      try {
        const url = 'https://raw.githubusercontent.com/cosr2024/cosr2024.github.io/main/journal/content.md?t=' + Date.now();
        const res = await fetch(url);
        if (res.ok) {
          current = await res.text();
          return;
        }
      } catch (err) {
        console.debug('journal: failed to fetch remote content.md', err);
      }
    } else {
      // dev mode: prefer local file if present
      try {
        const res = await fetch('content.md?t=' + Date.now());
        if (res.ok) {
          current = await res.text();
          return;
        }
      } catch (err) {
        console.debug('journal: local content.md not available', err);
      }
    }

    // localStorage fallback
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      current = saved;
      return;
    }

    current = '# My Journal\n\nStart writing here.';
  }

  function renderViewer(text) {
    if (!viewerEl) return;
    try {
      const raw = (window.marked && marked.parse) ? marked.parse(text) : (text.replace(/\n/g,'<br>'));
      const clean = (window.DOMPurify && DOMPurify.sanitize) ? DOMPurify.sanitize(raw) : raw;
      viewerEl.innerHTML = clean;
    } catch (err) {
      viewerEl.textContent = text;
    }
  }

  function enterEdit() {
    mode = 'edit';
    if (editorWrapper) editorWrapper.style.display = 'block';
    if (submitBtn) submitBtn.style.display = 'inline-block';
    if (modeToggle) modeToggle.textContent = 'View';
    if (editorEl) editorEl.value = current;
    // focus editor
    if (editorEl) editorEl.focus();
  }

  function enterView() {
    mode = 'view';
    if (editorWrapper) editorWrapper.style.display = 'none';
    if (submitBtn) submitBtn.style.display = 'none';
    if (modeToggle) modeToggle.textContent = 'Edit';
    renderViewer(current);
  }

  modeToggle.addEventListener('click', () => {
    if (mode === 'view') enterEdit(); else enterView();
  });

  submitBtn.addEventListener('click', () => {
    if (!editorEl) return;
    const newText = editorEl.value;
    current = newText;
    localStorage.setItem(STORAGE_KEY, current);
    setStatus('Saved locally');
    enterView();
  });

  // Initialize
  (async function init(){
    await loadInitial();
    renderViewer(current);
    // start in view mode
    enterView();
  })();

})();
