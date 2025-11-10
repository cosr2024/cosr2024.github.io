// Log entries manager
(function(){
  const STORAGE_KEY = 'log:entries';
  const entriesEl = document.getElementById('entries');
  const newEntryEl = document.getElementById('new-entry');
  const newSubmit = document.getElementById('new-submit');

  let entries = [];

  function formatDateHeader(iso) {
    const d = new Date(iso);
    const opts = { day: '2-digit', month: 'long', year: 'numeric' };
    // e.g., 09 November 2025
    return d.toLocaleDateString('en-GB', opts);
  }

  function saveEntries() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch(e){ console.error(e); }
  }

  function renderEntries() {
    if (!entriesEl) return;
    // sort reverse-chronological
    entries.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
    entriesEl.innerHTML = '';
    entries.forEach(entry => {
      const wrapper = document.createElement('div');
      wrapper.className = 'log-entry';

      const header = document.createElement('h3');
      header.className = 'log-date';
      header.textContent = formatDateHeader(entry.createdAt);
      wrapper.appendChild(header);

      const content = document.createElement('div');
      content.className = 'log-content';
      const raw = (window.marked && marked.parse) ? marked.parse(entry.content) : entry.content.replace(/\n/g,'<br>');
      const clean = (window.DOMPurify && DOMPurify.sanitize) ? DOMPurify.sanitize(raw) : raw;
      content.innerHTML = clean;
      wrapper.appendChild(content);

      const btns = document.createElement('div');
      btns.className = 'entry-buttons';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn';
      editBtn.textContent = 'Edit';
      btns.appendChild(editBtn);

      const delBtn = document.createElement('button');
      delBtn.className = 'btn';
      delBtn.style.marginLeft = '8px';
      delBtn.textContent = 'Delete';
      btns.appendChild(delBtn);

      wrapper.appendChild(btns);

      // Edit flow
      editBtn.addEventListener('click', ()=>{
        // replace content with textarea + save/cancel
        const ta = document.createElement('textarea');
        ta.className = 'entry-edit';
        ta.value = entry.content;
        content.style.display = 'none';
        wrapper.insertBefore(ta, btns);
        editBtn.style.display = 'none';

        const save = document.createElement('button');
        save.className = 'btn'; save.textContent = 'Save';
        const cancel = document.createElement('button'); cancel.className='btn'; cancel.textContent='Cancel'; cancel.style.marginLeft='8px';
        btns.appendChild(save); btns.appendChild(cancel);

        save.addEventListener('click', ()=>{
          entry.content = ta.value;
          saveEntries();
          renderEntries();
        });

        cancel.addEventListener('click', ()=>{
          renderEntries();
        });
      });

      delBtn.addEventListener('click', ()=>{
        if (!confirm('Delete this entry?')) return;
        entries = entries.filter(e=> e.id !== entry.id);
        saveEntries();
        renderEntries();
      });

      entriesEl.appendChild(wrapper);
    });
  }

  async function loadEntries() {
    const isDev = (window.APP && window.APP.DEV_MODE === true);

    // Prefer a human-editable content.md (similar to the Journal workflow).
    // Priority:
    // - If not DEV: try the public raw GitHub main/log/content.md
    // - If DEV: try local /log/content.md
    // If content.md exists, attempt to parse into entries (JSON or markdown sections). If not, fall back
    // to entries.json (previous behavior), then localStorage.
    async function tryLoadContentMd(url) {
      try {
        const r = await fetch(url);
        if (!r.ok) return null;
        const txt = await r.text();
        return txt;
      } catch (err) {
        return null;
      }
    }

    let mdText = null;
    if (!isDev) {
      const remoteMdUrl = 'https://raw.githubusercontent.com/cosr2024/cosr2024.github.io/main/log/content.md?t=' + Date.now();
      mdText = await tryLoadContentMd(remoteMdUrl);
    } else {
      mdText = await tryLoadContentMd('content.md?t=' + Date.now());
    }

    if (mdText) {
      // Attempt to interpret content.md. It can be either a JSON array or one markdown file containing
      // multiple entries separated by a '---' line. We also try to detect a leading date header per entry
      // like '09 November 2025' (optionally preceded by markdown header '#').
      const trimmed = mdText.trim();
      if (trimmed.startsWith('[')) {
        try {
          const data = JSON.parse(trimmed);
          if (Array.isArray(data)) { entries = data; return; }
        } catch (e) {
          console.debug('log: content.md JSON parse failed', e);
        }
      }

      // Split on markdown horizontal rule '---' on its own line
      const chunks = mdText.split(/^---\s*$/m).map(c=>c.trim()).filter(Boolean);
      if (chunks.length) {
        const parsed = chunks.map((chunk, idx) => {
          // try to extract a leading date line like '# 09 November 2025' or '09 November 2025'
          const lines = chunk.split(/\r?\n/);
          let createdAt = new Date().toISOString();
          let firstLine = lines[0].trim();
          const dateMatch = firstLine.match(/^#{0,6}\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4})$/);
          let contentLines = lines;
          if (dateMatch) {
            const dateStr = dateMatch[1];
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate)) createdAt = parsedDate.toISOString();
            contentLines = lines.slice(1);
          }
          return {
            id: (Date.now() + idx).toString(),
            createdAt,
            content: contentLines.join('\n').trim()
          };
        });
        entries = parsed;
        return;
      }
    }

    // If content.md wasn't found or parsed, fall back to entries.json like before
    if (!isDev) {
      // try remote entries.json
      try {
        const url = 'https://raw.githubusercontent.com/cosr2024/cosr2024.github.io/main/log/entries.json?t=' + Date.now();
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) { entries = data; return; }
        }
      } catch (err) { console.debug('log: remote load failed', err); }
    } else {
      // dev: try local entries.json
      try {
        const res = await fetch('entries.json?t=' + Date.now());
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) { entries = data; return; }
        }
      } catch (err) { console.debug('log: local entries.json not available', err); }
    }

    // fallback to localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) { entries = JSON.parse(saved); return; }
    } catch(e) { console.error('log: load from storage failed', e); }

    // start empty
    entries = [];
  }

  newSubmit.addEventListener('click', ()=>{
    const text = (newEntryEl && newEntryEl.value) ? newEntryEl.value.trim() : '';
    if (!text) return;
    const entry = { id: Date.now().toString(), createdAt: new Date().toISOString(), content: text };
    entries.push(entry);
    saveEntries();
    newEntryEl.value = '';
    renderEntries();
  });

  // init
  (async function(){
    await loadEntries();
    renderEntries();
  })();

})();
