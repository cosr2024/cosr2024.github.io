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

    async function tryFetchJson(url) {
      try {
        const r = await fetch(url);
        if (!r.ok) return null;
        return await r.json();
      } catch (e) { return null; }
    }

    async function tryFetchText(url) {
      try {
        const r = await fetch(url);
        if (!r.ok) return null;
        return await r.text();
      } catch (e) { return null; }
    }

    // Load index.json listing filenames from log/entries/
    let index = null;
    if (isDev) {
      index = await tryFetchJson('entries/index.json?t=' + Date.now());
    } else {
      const idxUrl = 'https://raw.githubusercontent.com/cosr2024/cosr2024.github.io/main/log/entries/index.json?t=' + Date.now();
      index = await tryFetchJson(idxUrl);
    }

    if (!Array.isArray(index) || index.length === 0) {
      alert('No log entries found. Please contact the site owner or enable DEV_MODE to load local entries.');
      entries = [];
      return;
    }

    const loaded = [];
    for (const name of index) {
      let txt = null;
      if (isDev) {
        txt = await tryFetchText('entries/' + name + '?t=' + Date.now());
      } else {
        const raw = 'https://raw.githubusercontent.com/cosr2024/cosr2024.github.io/main/log/entries/' + encodeURIComponent(name) + '?t=' + Date.now();
        txt = await tryFetchText(raw);
      }
      if (txt !== null) {
        const base = name.replace(/\.[^/.]+$/, '');
        const created = new Date(base);
        loaded.push({ id: name, createdAt: isNaN(created) ? new Date().toISOString() : created.toISOString(), content: txt.trim() });
      }
    }

    if (!loaded.length) {
      alert('No log entries could be loaded from the listed files.');
      entries = [];
      return;
    }

    loaded.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
    entries = loaded;
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
