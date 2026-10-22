(() => {
  const CORK_SRC = 'img/cork.jpg';
  const BW = 2400, BH = 1600, FR = 40, TW = BW + FR * 2, TH = BH + FR * 2;
  const KEY = 'sin-hunters-board-v1';
  const COLORS = [
    { n: 'Crimson', c: '#b3232c' }, { n: 'Black', c: '#1e1915' }, { n: 'Navy', c: '#27427c' },
    { n: 'Green', c: '#2e6a3a' }, { n: 'Ochre', c: '#c99520' }, { n: 'Bone', c: '#efe7d4' }
  ];
  const PINS = [['#e2646a', '#b3232c', '#5e0f14'], ['#f3dc9e', '#c8a25a', '#6d5226'], ['#6a625a', '#25201c', '#080606'], ['#ffffff', '#e4ddcc', '#9a9080']];
  const IMPRINTS = ['J. Ashford & Sons · Photographers', 'Marlowe Studio · Cabinet Portraits', 'H. Vane · Photographic Artist', 'Pell & Garrick · Est. 1871', 'The Lantern Studio · Instantaneous Process'];
  const TYPES = {
    note: { w: 290, ph: 'Write a note…' },
    card: { w: 340, ph: 'Witness, place, date…' },
    tg: { w: 360, ph: 'Type the message stop' },
    label: { w: 420, ph: 'Name the sin' },
    photo: { w: 280, ph: 'Add a caption' }
  };

  const $ = s => document.querySelector(s);
  const viewport = $('#viewport'), stage = $('#stage'), board = $('#board'), cork = $('#cork');
  const layer = $('#items'), svg = $('#strings'), strctl = $('#strctl'), hintEl = $('#hint');
  const uid = () => Math.random().toString(36).slice(2, 10);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const num = (v, d = 0) => (typeof v === 'number' && isFinite(v) ? v : d);

  let state = { items: [], strings: [] };
  let z = 1, sel = null, selStr = null, stringMode = false, src = null, curColor = COLORS[0].c;
  let drag = null, pan = null, editing = null;

  const byId = id => state.items.find(i => i.id === id);
  const elOf = id => layer.querySelector(`.item[data-id="${id}"]`);

  /* ---------- building items ---------- */
  function buildItem(it) {
    const el = document.createElement('div');
    el.className = 'item ' + it.type;
    el.dataset.id = it.id;
    if (it.type === 'tg') {
      const h = document.createElement('div'); h.className = 'tg-head'; h.textContent = 'Telegram';
      const s = document.createElement('div'); s.className = 'tg-sub'; s.textContent = 'Post Office Telegraphs · Received 1889';
      el.append(h, s);
    }
    if (it.type === 'photo') {
      const img = new Image(); img.alt = it.text || 'Photograph'; img.draggable = false; img.src = it.img;
      img.addEventListener('load', renderStrings);
      const im = document.createElement('div'); im.className = 'imprint'; im.textContent = it.imprint || IMPRINTS[0];
      el.append(img, im);
    }
    const t = document.createElement('div');
    t.className = 'txt'; t.dataset.ph = TYPES[it.type].ph; t.textContent = it.text || '';
    el.append(t);
    const ctl = document.createElement('div'); ctl.className = 'ctl';
    ctl.innerHTML = '<button type="button" data-act="edit">Write</button><button type="button" data-act="tilt">Tilt</button><button type="button" data-act="del" class="del">Remove</button>';
    const rs = document.createElement('div'); rs.className = 'rs'; rs.title = 'Drag to resize';
    el.append(ctl, rs);
    place(el, it);
    return el;
  }
  function place(el, it) {
    el.style.left = it.x + 'px'; el.style.top = it.y + 'px'; el.style.width = it.w + 'px';
    el.style.transform = `rotate(${it.rot}deg)`;
  }
  function renderAll() {
    layer.replaceChildren(...state.items.map(buildItem));
    markSel(); renderStrings();
  }
  function markSel() {
    for (const el of layer.children) {
      el.classList.toggle('sel', el.dataset.id === sel);
      el.classList.toggle('src', el.dataset.id === src);
    }
  }

  /* ---------- strings and pins ---------- */
  function pinPos(it) {
    const el = elOf(it.id), h = el ? el.offsetHeight : 150, r = it.rot * Math.PI / 180, d = -h / 2 + 13;
    return { x: it.x + it.w / 2 - d * Math.sin(r), y: it.y + h / 2 + d * Math.cos(r) };
  }
  function sagOf(a, b) {
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + Math.min(90, L * 0.07) };
  }
  function stringGeom() {
    const out = [];
    for (const s of state.strings) {
      const A = byId(s.a), B = byId(s.b);
      if (!A || !B) continue;
      const a = pinPos(A), b = pinPos(B);
      out.push({ s, a, b, c: sagOf(a, b) });
    }
    return out;
  }
  function renderStrings() {
    let defs = '<defs>';
    PINS.forEach((p, i) => { defs += `<radialGradient id="pin${i}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="${p[0]}"/><stop offset=".55" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[2]}"/></radialGradient>`; });
    defs += '</defs>';
    let body = '';
    const geo = stringGeom();
    for (const g of geo) {
      const d = `M${g.a.x.toFixed(1)} ${g.a.y.toFixed(1)} Q${g.c.x.toFixed(1)} ${g.c.y.toFixed(1)} ${g.b.x.toFixed(1)} ${g.b.y.toFixed(1)}`;
      body += `<path d="${d}" class="shade" transform="translate(2 4)"/><path d="${d}" class="yarn${g.s.id === selStr ? ' on' : ''}" stroke="${g.s.color}"/><path d="${d}" class="twist"/><path d="${d}" class="hit" data-sid="${g.s.id}"/>`;
    }
    for (const it of state.items) {
      const p = pinPos(it);
      body += `<g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})" pointer-events="none"><ellipse cx="3" cy="5" rx="7.5" ry="6" fill="rgba(25,10,0,.35)"/><circle r="7.5" fill="url(#pin${it.pin})"/><circle cx="-2.4" cy="-2.6" r="2.2" fill="rgba(255,255,255,.65)"/></g>`;
    }
    svg.innerHTML = defs + body;
    const g = geo.find(g => g.s.id === selStr);
    if (g) {
      strctl.hidden = false;
      strctl.style.left = (0.25 * g.a.x + 0.5 * g.c.x + 0.25 * g.b.x) + 'px';
      strctl.style.top = (0.25 * g.a.y + 0.5 * g.c.y + 0.25 * g.b.y) + 'px';
      for (const b of strctl.querySelectorAll('.sw')) b.setAttribute('aria-checked', String(b.dataset.c === g.s.color));
    } else strctl.hidden = true;
  }
  strctl.innerHTML = COLORS.map(c => `<button type="button" class="sw" role="radio" aria-label="${c.n}" data-c="${c.c}" style="background:${c.c}"></button>`).join('') + '<button type="button" class="del" data-act="cut">Cut string</button>';
  strctl.addEventListener('pointerdown', e => e.stopPropagation());
  strctl.addEventListener('click', e => {
    const s = state.strings.find(s => s.id === selStr); if (!s) return;
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.act === 'cut') { cutString(s.id); return; }
    s.color = b.dataset.c; save(); renderStrings();
  });
  svg.addEventListener('pointerdown', e => {
    const h = e.target.closest('.hit'); if (!h) return;
    e.stopPropagation();
    selStr = h.dataset.sid; sel = null; markSel(); renderStrings();
  });
  function cutString(id) {
    const snap = snapshot();
    state.strings = state.strings.filter(s => s.id !== id);
    selStr = null; save(); renderStrings();
    toast('String cut.', () => restore(snap));
  }

  /* ---------- selection, editing, connecting ---------- */
  function select(id) { sel = id; selStr = null; markSel(); renderStrings(); }
  function front(it) {
    const i = state.items.indexOf(it);
    if (i < state.items.length - 1) { state.items.splice(i, 1); state.items.push(it); layer.append(elOf(it.id)); }
  }
  function startEdit(it) {
    const el = elOf(it.id); if (!el) return;
    const t = el.querySelector('.txt');
    if (editing === t) return;
    t.contentEditable = 'plaintext-only';
    if (t.contentEditable !== 'plaintext-only') t.contentEditable = 'true';
    t.classList.add('editing'); editing = t;
    t.focus();
    const r = document.createRange(); r.selectNodeContents(t); r.collapse(false);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    const onKey = e => { if (e.key === 'Escape') t.blur(); e.stopPropagation(); };
    const done = () => {
      t.removeEventListener('blur', done); t.removeEventListener('input', renderStrings); t.removeEventListener('keydown', onKey);
      t.contentEditable = 'false'; t.removeAttribute('contenteditable'); t.classList.remove('editing');
      it.text = t.innerText.replace(/ /g, ' ').replace(/\n+$/, '');
      t.textContent = it.text;
      if (it.type === 'photo') el.querySelector('img').alt = it.text || 'Photograph';
      editing = null; save(); renderStrings();
    };
    t.addEventListener('blur', done);
    t.addEventListener('input', renderStrings);
    t.addEventListener('keydown', onKey);
  }
  function connectClick(it) {
    if (!src) { src = it.id; markSel(); hint('Now click the item to tie it to. Press Esc to stop.'); return; }
    if (src === it.id) { src = null; markSel(); hint(modeHint()); return; }
    const dup = state.strings.some(s => (s.a === src && s.b === it.id) || (s.a === it.id && s.b === src));
    if (dup) toast('Those two are already tied together.');
    else state.strings.push({ id: uid(), a: src, b: it.id, color: curColor });
    src = null; markSel(); save(); renderStrings(); hint(modeHint());
  }
  function setStringMode(on) {
    stringMode = on; src = null;
    $('#tie').setAttribute('aria-pressed', String(on));
    if (on) { sel = null; selStr = null; }
    markSel(); renderStrings(); hint(modeHint());
  }
  const modeHint = () => stringMode
    ? 'Tie string: click the first item, then the second. Pick a colour first if you like.'
    : 'Double-click a note to write on it. Drag to move. Press Tie string, then click two items to connect them.';
  function hint(t) { hintEl.textContent = t; }

  layer.addEventListener('pointerdown', e => {
    const el = e.target.closest('.item'); if (!el) return;
    const it = byId(el.dataset.id); if (!it) return;
    if (e.target.closest('.ctl')) { e.stopPropagation(); return; }
    if (e.target.closest('.txt.editing')) { e.stopPropagation(); return; }
    if (e.button !== undefined && e.button > 0) return;
    e.stopPropagation();
    if (stringMode) { connectClick(it); return; }
    if (editing) editing.blur();
    if (sel !== it.id) select(it.id);
    front(it);
    drag = { it, el, sx: e.clientX, sy: e.clientY, ox: it.x, oy: it.y, ow: it.w, mode: e.target.closest('.rs') ? 'size' : 'move', moved: false };
    el.setPointerCapture(e.pointerId);
    el.classList.add('drag');
  });
  window.addEventListener('pointermove', e => {
    if (pan) {
      viewport.scrollLeft = pan.sl - (e.clientX - pan.sx);
      viewport.scrollTop = pan.st - (e.clientY - pan.sy);
      return;
    }
    if (!drag) return;
    const dx = (e.clientX - drag.sx) / z, dy = (e.clientY - drag.sy) / z;
    if (!drag.moved && Math.hypot(dx, dy) < 2) return;
    drag.moved = true;
    const it = drag.it;
    if (drag.mode === 'move') {
      const h = drag.el.offsetHeight;
      it.x = Math.round(clamp(drag.ox + dx, 0, BW - it.w));
      it.y = Math.round(clamp(drag.oy + dy, 0, BH - h));
    } else {
      it.w = Math.round(clamp(drag.ow + dx, 140, 760));
      it.x = Math.min(it.x, BW - it.w);
    }
    place(drag.el, it); renderStrings();
  });
  const endDrag = () => {
    if (pan) { pan = null; viewport.classList.remove('panning'); }
    if (!drag) return;
    drag.el.classList.remove('drag');
    if (drag.moved) save();
    drag = null;
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  layer.addEventListener('dblclick', e => {
    const el = e.target.closest('.item'); if (!el || stringMode) return;
    const it = byId(el.dataset.id); if (it) startEdit(it);
  });
  layer.addEventListener('click', e => {
    const b = e.target.closest('.ctl button'); if (!b) return;
    const it = byId(b.closest('.item').dataset.id); if (!it) return;
    if (b.dataset.act === 'edit') startEdit(it);
    if (b.dataset.act === 'tilt') { it.rot = Math.round(rnd(-7, 7) * 10) / 10; place(elOf(it.id), it); renderStrings(); save(); }
    if (b.dataset.act === 'del') removeItem(it.id);
  });
  viewport.addEventListener('pointerdown', e => {
    if (e.target.closest('.item, #strctl')) return;
    if (editing) editing.blur();
    if (sel || selStr || src) { sel = null; selStr = null; src = null; markSel(); renderStrings(); if (stringMode) hint(modeHint()); }
    if (e.pointerType === 'mouse' && e.button === 0) {
      pan = { sx: e.clientX, sy: e.clientY, sl: viewport.scrollLeft, st: viewport.scrollTop };
      viewport.classList.add('panning');
    }
  });

  document.addEventListener('keydown', e => {
    const a = document.activeElement;
    if (a && (a.isContentEditable || /^(INPUT|TEXTAREA)$/.test(a.tagName))) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (sel) { e.preventDefault(); removeItem(sel); }
      else if (selStr) { e.preventDefault(); cutString(selStr); }
    }
    if (e.key === 'Escape') {
      if (stringMode) setStringMode(false);
      sel = null; selStr = null; src = null; markSel(); renderStrings();
    }
  });

  /* ---------- adding and removing ---------- */
  function centerPoint() {
    const r = cork.getBoundingClientRect(), v = viewport.getBoundingClientRect();
    return { x: (v.left + v.width / 2 - r.left) / z, y: (v.top + v.height / 2 - r.top) / z };
  }
  function addItem(type, opt = {}) {
    const c = opt.at || centerPoint();
    const w = opt.w || TYPES[type].w;
    const it = {
      id: uid(), type, w, text: opt.text || '',
      x: 0, y: 0,
      rot: opt.rot !== undefined ? opt.rot : Math.round(rnd(-5, 5) * 10) / 10,
      pin: opt.pin !== undefined ? opt.pin : Math.floor(Math.random() * PINS.length)
    };
    if (type === 'photo') { it.img = opt.img; it.imprint = IMPRINTS[Math.floor(Math.random() * IMPRINTS.length)]; }
    it.x = Math.round(clamp(opt.at && opt.exact ? c.x : c.x - w / 2 + rnd(-40, 40), 0, BW - w));
    it.y = Math.round(clamp(opt.at && opt.exact ? c.y : c.y - 90 + rnd(-40, 40), 0, BH - 180));
    state.items.push(it);
    layer.append(buildItem(it));
    if (!opt.quiet) {
      if (stringMode) setStringMode(false);
      select(it.id); save();
      if (type !== 'photo') startEdit(it);
    }
    return it;
  }
  function removeItem(id) {
    const snap = snapshot();
    state.items = state.items.filter(i => i.id !== id);
    state.strings = state.strings.filter(s => s.a !== id && s.b !== id);
    const el = elOf(id); if (el) el.remove();
    sel = null; save(); renderStrings();
    toast('Removed from the board.', () => restore(snap));
  }
  $('#addNote').onclick = () => addItem('note');
  $('#addCard').onclick = () => addItem('card');
  $('#addTg').onclick = () => addItem('tg');
  $('#addLabel').onclick = () => addItem('label');
  $('#addPhoto').onclick = () => $('#photoInput').click();
  $('#photoInput').addEventListener('change', e => { addPhotos([...e.target.files]); e.target.value = ''; });
  $('#tie').onclick = () => setStringMode(!stringMode);

  const sws = $('#swatches');
  sws.innerHTML = COLORS.map(c => `<button type="button" class="sw" role="radio" aria-label="${c.n} string" title="${c.n}" data-c="${c.c}" style="background:${c.c}" aria-checked="${c.c === curColor}"></button>`).join('');
  sws.addEventListener('click', e => {
    const b = e.target.closest('.sw'); if (!b) return;
    curColor = b.dataset.c;
    for (const x of sws.children) x.setAttribute('aria-checked', String(x === b));
    if (!stringMode) setStringMode(true);
  });

  /* ---------- the old-camera treatment ---------- */
  function ageImage(source, sw, sh) {
    const k = Math.min(1, 640 / Math.max(sw, sh));
    const w = Math.max(1, Math.round(sw * k)), h = Math.max(1, Math.round(sh * k));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    if ('filter' in x) x.filter = 'blur(0.7px)';
    x.drawImage(source, 0, 0, w, h);
    if ('filter' in x) x.filter = 'none';
    const d = x.getImageData(0, 0, w, h), p = d.data;
    const cx = w / 2 + rnd(-w * .07, w * .07), cy = h / 2 + rnd(-h * .07, h * .07), md = Math.hypot(w / 2, h / 2);
    const lo = [36, 23, 15], mid = [132, 94, 60], hi = [238, 223, 190];
    for (let i = 0, j = 0; i < p.length; i += 4, j++) {
      const px = j % w, py = (j / w) | 0;
      let l = (p[i] * .299 + p[i + 1] * .587 + p[i + 2] * .114) / 255;
      l = (l - .5) * 1.2 + .5;
      const dd = Math.hypot(px - cx, py - cy) / md;
      l *= 1 - .5 * Math.pow(dd, 2.4);
      l = .07 + l * .86 + (Math.random() - .5) * .1;
      l = l < 0 ? 0 : l > 1 ? 1 : l;
      let a, b, t;
      if (l < .5) { a = lo; b = mid; t = l / .5; } else { a = mid; b = hi; t = (l - .5) / .5; }
      p[i] = a[0] + (b[0] - a[0]) * t; p[i + 1] = a[1] + (b[1] - a[1]) * t; p[i + 2] = a[2] + (b[2] - a[2]) * t;
    }
    x.putImageData(d, 0, 0);
    for (let i = 0; i < 5; i++) {
      const gx = rnd(0, w), gy = rnd(0, h), gr = rnd(w * .1, w * .35);
      const g = x.createRadialGradient(gx, gy, 0, gx, gy, gr);
      g.addColorStop(0, Math.random() < .5 ? `rgba(250,235,200,${rnd(.05, .12)})` : `rgba(80,50,25,${rnd(.05, .12)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    }
    for (let i = 0; i < 80; i++) {
      x.fillStyle = Math.random() < .7 ? `rgba(245,235,210,${rnd(.25, .7)})` : `rgba(30,20,10,${rnd(.2, .5)})`;
      x.beginPath(); x.arc(rnd(0, w), rnd(0, h), rnd(.4, 1.6), 0, 7); x.fill();
    }
    for (let i = 0; i < 4; i++) {
      x.strokeStyle = `rgba(240,230,205,${rnd(.12, .3)})`; x.lineWidth = rnd(.4, 1);
      const sx = rnd(0, w), sy = rnd(0, h);
      x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx + rnd(-40, 40), sy + rnd(30, 90), sx + rnd(-60, 60), sy + rnd(80, 200)); x.stroke();
    }
    const eg = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .38, w / 2, h / 2, md);
    eg.addColorStop(0, 'rgba(0,0,0,0)'); eg.addColorStop(1, 'rgba(214,196,160,.3)');
    x.fillStyle = eg; x.fillRect(0, 0, w, h);
    return { url: c.toDataURL('image/jpeg', .85), w, h };
  }
  function addPhotos(files, at) {
    const imgs = files.filter(f => f.type.startsWith('image/'));
    imgs.forEach((f, n) => {
      const u = URL.createObjectURL(f), img = new Image();
      img.onload = () => {
        const r = ageImage(img, img.naturalWidth, img.naturalHeight);
        URL.revokeObjectURL(u);
        const pos = at ? { x: at.x + n * 30, y: at.y + n * 30 } : undefined;
        addItem('photo', { img: r.url, w: r.w >= r.h ? 300 : 230, at: pos });
      };
      img.onerror = () => { URL.revokeObjectURL(u); toast(`${f.name} could not be read. Try a JPEG or PNG.`); };
      img.src = u;
    });
  }
  document.addEventListener('paste', e => {
    if (document.activeElement && document.activeElement.isContentEditable) return;
    const files = [...(e.clipboardData ? e.clipboardData.files : [])];
    if (files.length) { e.preventDefault(); addPhotos(files); }
  });
  viewport.addEventListener('dragover', e => { e.preventDefault(); });
  viewport.addEventListener('drop', e => {
    e.preventDefault();
    const files = [...e.dataTransfer.files];
    const kase = files.find(f => /\.json$/i.test(f.name));
    if (kase) { openCase(kase); return; }
    const r = cork.getBoundingClientRect();
    addPhotos(files, { x: (e.clientX - r.left) / z, y: (e.clientY - r.top) / z });
  });

  /* ---------- zoom ---------- */
  // The board hangs in a room scene (SW x SH world px); zooming out far enough shows the whole room.
  const scene = $('#scene'), SW = scene.offsetWidth, SH = scene.offsetHeight;
  const roomZoom = () => Math.min((viewport.clientWidth - 32) / SW, (viewport.clientHeight - 32) / SH);
  let fitted = null;
  function setZoom(nz, keep = true) {
    fitted = null;
    nz = clamp(nz, roomZoom(), 2);
    const p = keep ? centerPoint() : null;
    z = nz;
    stage.style.width = SW * z + 'px'; stage.style.height = SH * z + 'px';
    scene.style.transform = `scale(${z})`;
    document.documentElement.style.setProperty('--iz', String(1 / z));
    $('#zoomFit').textContent = Math.round(z * 100) + '%';
    if (p) {
      const r = cork.getBoundingClientRect(), v = viewport.getBoundingClientRect();
      viewport.scrollLeft += r.left + p.x * z - (v.left + v.width / 2);
      viewport.scrollTop += r.top + p.y * z - (v.top + v.height / 2);
    }
    window.dispatchEvent(new CustomEvent('scenezoom', { detail: z }));
  }
  function centerOn(el) {
    const r = el.getBoundingClientRect(), v = viewport.getBoundingClientRect();
    viewport.scrollLeft += r.left + r.width / 2 - (v.left + v.width / 2);
    viewport.scrollTop += r.top + r.height / 2 - (v.top + v.height / 2);
  }
  const fit = () => { setZoom(Math.min((viewport.clientWidth - 32) / TW, (viewport.clientHeight - 32) / TH), false); centerOn(board); fitted = 'board'; };
  const fitRoom = () => { setZoom(roomZoom(), false); centerOn(scene); fitted = 'room'; };
  $('#zoomIn').onclick = () => setZoom(z * 1.2);
  $('#zoomOut').onclick = () => setZoom(z / 1.2);
  $('#zoomFit').onclick = fit;
  $('#zoomRoom').onclick = fitRoom;
  viewport.addEventListener('wheel', e => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault(); setZoom(z * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
  }, { passive: false });

  /* ---------- persistence ---------- */
  let saveT, warned = false;
  const serialize = () => JSON.stringify({ app: 'sin-hunters-board', v: 1, saved: new Date().toISOString(), items: state.items, strings: state.strings });
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      try { localStorage.setItem(KEY, serialize()); }
      catch (e) { if (!warned) { warned = true; toast('This board is too big to keep in the browser. Use Save file to keep a copy.'); } }
    }, 400);
  }
  const snapshot = () => JSON.parse(JSON.stringify(state));
  function restore(snap) { state = snap; sel = null; selStr = null; src = null; renderAll(); save(); }
  function validate(d) {
    if (!d || !Array.isArray(d.items)) throw new Error('not a board');
    const items = d.items.filter(t => t && TYPES[t.type]).map(t => {
      const w = clamp(num(t.w, TYPES[t.type].w), 120, 800);
      const it = {
        id: String(t.id || uid()).slice(0, 40), type: t.type, w,
        x: clamp(num(t.x), 0, BW - w), y: clamp(num(t.y), 0, BH - 60),
        rot: clamp(num(t.rot), -30, 30), text: String(t.text || '').slice(0, 6000),
        pin: clamp(Math.floor(num(t.pin)), 0, PINS.length - 1)
      };
      if (t.type === 'photo') {
        it.img = typeof t.img === 'string' && /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(t.img) ? t.img : '';
        it.imprint = String(t.imprint || IMPRINTS[0]).slice(0, 80);
      }
      return it;
    }).filter(t => t.type !== 'photo' || t.img);
    const ids = new Set(items.map(i => i.id));
    const strings = (Array.isArray(d.strings) ? d.strings : [])
      .filter(s => s && ids.has(s.a) && ids.has(s.b) && s.a !== s.b)
      .map(s => ({ id: String(s.id || uid()).slice(0, 40), a: s.a, b: s.b, color: /^#[0-9a-f]{6}$/i.test(s.color) ? s.color : COLORS[0].c }));
    return { items, strings };
  }

  /* ---------- PNG with the board tucked inside ---------- */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  function toB64(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }
  async function embedBoard(pngBlob, json) {
    const png = new Uint8Array(await pngBlob.arrayBuffer());
    const data = new TextEncoder().encode('sin-hunters-board\0' + toB64(new TextEncoder().encode(json)));
    const chunk = new Uint8Array(12 + data.length), dv = new DataView(chunk.buffer);
    dv.setUint32(0, data.length);
    chunk.set([116, 69, 88, 116], 4); chunk.set(data, 8);
    dv.setUint32(8 + data.length, crc32(chunk.subarray(4, 8 + data.length)));
    const iend = png.length - 12;
    return new Blob([png.subarray(0, iend), chunk, png.subarray(iend)], { type: 'image/png' });
  }
  function readBoardFromPng(buf) {
    const b = new Uint8Array(buf), dv = new DataView(buf);
    let o = 8;
    while (o + 8 <= b.length) {
      const len = dv.getUint32(o), type = String.fromCharCode(b[o + 4], b[o + 5], b[o + 6], b[o + 7]);
      if (type === 'tEXt') {
        const d = b.subarray(o + 8, o + 8 + len), z0 = d.indexOf(0);
        if (new TextDecoder().decode(d.subarray(0, z0)) === 'sin-hunters-board') {
          const bin = atob(new TextDecoder('latin1').decode(d.subarray(z0 + 1)));
          const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
          return JSON.parse(new TextDecoder().decode(u));
        }
      }
      if (type === 'IEND') break;
      o += 12 + len;
    }
    return null;
  }

  /* ---------- drawing the board to a canvas ---------- */
  let corkImg = null;
  const loadCork = () => corkImg ? Promise.resolve(corkImg) : new Promise((res, rej) => { const i = new Image(); i.onload = () => res(corkImg = i); i.onerror = rej; i.src = CORK_SRC; });
  function seeded(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function drawFrame(x) {
    const R = seeded(1889), F = FR;
    const sides = [
      { poly: [[0, 0], [TW, 0], [TW - F, F], [F, F]], h: true, g: [0, 0, 0, F], c: ['#eed59f', '#d9b878', '#c29b5c'] },
      { poly: [[F, TH - F], [TW - F, TH - F], [TW, TH], [0, TH]], h: true, g: [0, TH, 0, TH - F], c: ['#d2ad6f', '#dcbb7c', '#c49e5f'] },
      { poly: [[0, 0], [F, F], [F, TH - F], [0, TH]], h: false, g: [0, 0, F, 0], c: ['#ecd29b', '#d8b777', '#c19a5b'] },
      { poly: [[TW - F, F], [TW, 0], [TW, TH], [TW - F, TH - F]], h: false, g: [TW, 0, TW - F, 0], c: ['#d6b273', '#dcba7b', '#c39d5e'] }
    ];
    for (const s of sides) {
      x.save(); x.beginPath(); s.poly.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.clip();
      const g = x.createLinearGradient(...s.g); g.addColorStop(0, s.c[0]); g.addColorStop(.7, s.c[1]); g.addColorStop(1, s.c[2]);
      x.fillStyle = g; x.fillRect(0, 0, TW, TH);
      for (let i = 0; i < 70; i++) {
        const off = R() * F, light = R() < .35;
        x.strokeStyle = light ? `rgba(255,245,215,${.1 + R() * .15})` : `rgba(140,92,40,${.06 + R() * .16})`;
        x.lineWidth = .4 + R() * 1.4;
        x.beginPath();
        const len = s.h ? TW : TH, wob = 1 + R() * 2.5;
        for (let t = 0; t <= len; t += 40) {
          const o = off + Math.sin(t / (90 + R() * 30) + i) * wob;
          const px = s.h ? t : (s.g[0] === 0 ? o : TW - o), py = s.h ? (s.g[1] === 0 ? o : TH - o) : t;
          t ? x.lineTo(px, py) : x.moveTo(px, py);
        }
        x.stroke();
      }
      x.restore();
    }
    x.strokeStyle = 'rgba(90,60,25,.45)'; x.lineWidth = 1;
    [[0, 0, F, F], [TW, 0, TW - F, F], [0, TH, F, TH - F], [TW, TH, TW - F, TH - F]].forEach(l => { x.beginPath(); x.moveTo(l[0], l[1]); x.lineTo(l[2], l[3]); x.stroke(); });
    x.strokeStyle = '#6b4f2a'; x.strokeRect(.5, .5, TW - 1, TH - 1);
  }
  function drawCork(x) {
    x.fillStyle = x.createPattern(corkImg, 'repeat'); x.fillRect(0, 0, BW, BH);
    const edge = (x0, y0, x1, y1, rx, ry, rw, rh) => { const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(50,25,0,.5)'); g.addColorStop(1, 'rgba(50,25,0,0)'); x.fillStyle = g; x.fillRect(rx, ry, rw, rh); };
    edge(0, 0, 0, 22, 0, 0, BW, 22); edge(0, BH, 0, BH - 18, 0, BH - 18, BW, 18);
    edge(0, 0, 18, 0, 0, 0, 18, BH); edge(BW, 0, BW - 18, 0, BW - 18, 0, 18, BH);
  }
  function wrap(x, s, W) {
    const out = [];
    for (const para of s.split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const test = line ? line + ' ' + word : word;
        if (x.measureText(test).width <= W + .5) { line = test; continue; }
        if (line) out.push(line);
        if (x.measureText(word).width > W) {
          let part = '';
          for (const ch of word) { if (x.measureText(part + ch).width > W && part) { out.push(part); part = ch; } else part += ch; }
          line = part;
        } else line = word;
      }
      out.push(line);
    }
    return out;
  }
  function drawText(x, el) {
    const raw = el.textContent; if (!raw || !raw.trim()) return;
    const cs = getComputedStyle(el);
    const s = cs.textTransform === 'uppercase' ? raw.toUpperCase() : raw;
    x.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const fs = parseFloat(cs.fontSize), lh = parseFloat(cs.lineHeight) || fs * 1.25;
    if ('letterSpacing' in x) x.letterSpacing = (parseFloat(cs.letterSpacing) || 0) + 'px';
    x.fillStyle = cs.color; x.textBaseline = 'middle';
    const W = el.clientWidth, center = cs.textAlign === 'center';
    x.textAlign = center ? 'center' : 'left';
    const tx = el.offsetLeft + (center ? W / 2 : 0);
    wrap(x, s, W).forEach((l, i) => x.fillText(l, tx, el.offsetTop + i * lh + lh / 2));
    if ('letterSpacing' in x) x.letterSpacing = '0px';
    x.textAlign = 'left';
  }
  function stain(x, px, py, r, col) { const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2); }
  function drawItem(x, it) {
    const el = elOf(it.id); if (!el) return;
    const w = it.w, h = el.offsetHeight;
    x.save();
    x.translate(it.x + w / 2, it.y + h / 2); x.rotate(it.rot * Math.PI / 180); x.translate(-w / 2, -h / 2);
    x.shadowColor = 'rgba(30,15,0,.45)'; x.shadowBlur = 12; x.shadowOffsetX = 2; x.shadowOffsetY = 6;
    const bg = { note: '#e8d4a7', card: '#f2e8d0', tg: '#e6d29a', label: '#f0e4c4', photo: '#e3d0aa' }[it.type];
    x.fillStyle = bg; x.fillRect(0, 0, w, h);
    x.shadowColor = 'transparent';
    x.save(); x.beginPath(); x.rect(0, 0, w, h); x.clip();
    if (it.type === 'note') { stain(x, w * .82, h * .86, Math.max(w, h) * .38, 'rgba(140,90,30,.2)'); stain(x, w * .14, h * .18, Math.max(w, h) * .5, 'rgba(255,250,230,.5)'); }
    if (it.type === 'tg') stain(x, w * .9, h * .1, Math.max(w, h) * .4, 'rgba(150,110,40,.18)');
    if (it.type === 'photo') { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ebdbb9'); g.addColorStop(1, '#dbc69c'); x.fillStyle = g; x.fillRect(0, 0, w, h); }
    if (it.type === 'card') {
      x.fillStyle = 'rgba(90,130,180,.42)';
      for (let y = 71; y < h; y += 30) x.fillRect(0, y - 1, w, 1);
      x.fillStyle = 'rgba(190,60,50,.65)'; x.fillRect(0, 41, w, 1.5);
    }
    x.restore();
    if (it.type === 'tg') {
      drawText(x, el.querySelector('.tg-head'));
      const sub = el.querySelector('.tg-sub'); drawText(x, sub);
      x.fillStyle = 'rgba(60,40,20,.55)'; x.fillRect(sub.offsetLeft, sub.offsetTop + sub.offsetHeight - 1, sub.offsetWidth, 1);
    }
    if (it.type === 'photo') {
      const img = el.querySelector('img');
      if (img.complete && img.naturalWidth) x.drawImage(img, img.offsetLeft, img.offsetTop, img.offsetWidth, img.offsetHeight);
      x.strokeStyle = 'rgba(80,55,30,.6)'; x.lineWidth = 1; x.strokeRect(img.offsetLeft - .5, img.offsetTop - .5, img.offsetWidth + 1, img.offsetHeight + 1);
      drawText(x, el.querySelector('.imprint'));
    }
    drawText(x, el.querySelector('.txt'));
    x.restore();
  }
  function drawStringsAndPins(x) {
    const geo = stringGeom();
    x.lineCap = 'round';
    const path = g => { x.beginPath(); x.moveTo(g.a.x, g.a.y); x.quadraticCurveTo(g.c.x, g.c.y, g.b.x, g.b.y); };
    for (const g of geo) {
      x.save(); x.translate(2, 4); path(g); x.strokeStyle = 'rgba(25,10,0,.28)'; x.lineWidth = 3.5; x.stroke(); x.restore();
      path(g); x.strokeStyle = g.s.color; x.lineWidth = 3; x.stroke();
      x.setLineDash([2, 4]); path(g); x.strokeStyle = 'rgba(255,255,255,.28)'; x.lineWidth = 1.2; x.stroke(); x.setLineDash([]);
    }
    for (const it of state.items) {
      const p = pinPos(it), c = PINS[it.pin];
      x.fillStyle = 'rgba(25,10,0,.35)'; x.beginPath(); x.ellipse(p.x + 3, p.y + 5, 7.5, 6, 0, 0, 7); x.fill();
      const g = x.createRadialGradient(p.x - 2.6, p.y - 2.2, 0, p.x, p.y, 9.5);
      g.addColorStop(0, c[0]); g.addColorStop(.55, c[1]); g.addColorStop(1, c[2]);
      x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y, 7.5, 0, 7); x.fill();
      x.fillStyle = 'rgba(255,255,255,.65)'; x.beginPath(); x.arc(p.x - 2.4, p.y - 2.6, 2.2, 0, 7); x.fill();
    }
  }
  async function renderPng() {
    if (editing) editing.blur();
    await Promise.all(['600 31px "Caveat"', '20px "Special Elite"', '40px "IM Fell English"', 'italic 12px "IM Fell English"', '29px "IM Fell English SC"']
      .map(f => document.fonts.load(f).catch(() => null)));
    await loadCork();
    const c = document.createElement('canvas'); c.width = TW; c.height = TH;
    const x = c.getContext('2d');
    drawFrame(x);
    x.save(); x.translate(FR, FR);
    x.beginPath(); x.rect(0, 0, BW, BH); x.clip();
    drawCork(x);
    for (const it of state.items) drawItem(x, it);
    drawStringsAndPins(x);
    x.restore();
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    return embedBoard(blob, serialize());
  }

  /* ---------- saving files out ---------- */
  const stamp = () => new Date().toISOString().slice(0, 10);
  function offerFile(filename, blob) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast(`Saved ${filename}.`);
  }

  $('#exportPng').onclick = async () => {
    const b = $('#exportPng'); b.disabled = true; b.textContent = 'Developing…';
    try { offerFile(`sin-board-${stamp()}.png`, await renderPng()); }
    catch (e) {
      toast(location.protocol === 'file:'
        ? 'Browsers block picture export from a file opened on disk. Use the live site, or run a local server.'
        : 'The picture could not be made. Try again, or remove very large photographs.');
    }
    finally { b.disabled = false; b.textContent = 'Export PNG'; }
  };
  $('#saveFile').onclick = () => offerFile(`sin-board-${stamp()}.json`, new Blob([serialize()], { type: 'application/json' }));
  $('#openFile').onclick = () => $('#caseInput').click();
  $('#caseInput').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) openCase(f); });
  async function openCase(f) {
    try {
      let data;
      if (/\.png$/i.test(f.name) || f.type === 'image/png') {
        data = readBoardFromPng(await f.arrayBuffer());
        if (!data) { toast('That PNG has no board inside. Choose a PNG exported from this board, or a .json case file.'); return; }
      } else data = JSON.parse(await f.text());
      const next = validate(data), snap = snapshot();
      if (stringMode) setStringMode(false);
      restore(next);
      toast(`Opened ${f.name}.`, () => restore(snap));
    } catch (err) { toast('That file is not a board from this page. Choose a .json case file or an exported PNG.'); }
  }
  $('#clearBoard').onclick = () => {
    if (!state.items.length) return;
    const snap = snapshot();
    restore({ items: [], strings: [] });
    toast('Board cleared.', () => restore(snap));
  };

  let toastT;
  function toast(msg, undo) {
    const t = $('#toast'); t.replaceChildren();
    const s = document.createElement('span'); s.textContent = msg; t.append(s);
    if (undo) { const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Undo'; b.onclick = () => { undo(); t.hidden = true; }; t.append(b); }
    t.hidden = false; clearTimeout(toastT);
    toastT = setTimeout(() => { t.hidden = true; }, undo ? 7000 : 3500);
  }

  /* ---------- example case ---------- */
  function loadExample() {
    state = { items: [], strings: [] };
    const A = (type, x, y, w, text, rot, extra = {}) => addItem(type, Object.assign({ at: { x, y }, exact: true, w, text, rot, quiet: true }, extra));
    const label = A('label', 950, 110, 520, 'The Weeping Saint\nWhitby · October 1889', -1.2, { pin: 1 });
    const n1 = A('note', 1000, 420, 330, "Three bell-ringers gone from St. Mary's. All last seen after evensong. Each left his boots on the 199 steps.", 2.1, { pin: 0 });
    const card = A('card', 1530, 820, 370, 'WITNESS: Mrs. Ada Pryce\nHeard singing from the crypt at two in the morning. Swears it was her late husband.', -2.4, { pin: 1 });
    const tg = A('tg', 480, 640, 390, 'Arrived Whitby stop churchwarden lying stop ask him about the fire of 1871 stop — H.', 1.6, { pin: 3 });
    const n2 = A('note', 1040, 1060, 320, 'Is the sin feeding on grief?\nCheck parish burials since May.', -1.8, { pin: 0 });
    A('note', 110, 1320, 380, 'Example case. Press Clear board to start your own.', -2.5, { pin: 1 });
    const S = (a, b, c) => state.strings.push({ id: uid(), a: a.id, b: b.id, color: c });
    S(label, n1, '#b3232c'); S(n1, card, '#27427c'); S(tg, n1, '#1e1915');
    S(tg, n2, '#c99520'); S(card, n2, '#b3232c');
    renderAll();
  }

  /* ---------- start ---------- */
  let saved = null;
  try { const raw = localStorage.getItem(KEY); if (raw) saved = validate(JSON.parse(raw)); } catch (e) { saved = null; }
  setZoom(1, false);
  if (saved) { state = saved; renderAll(); } else loadExample();
  fit();
  document.fonts && document.fonts.ready.then(renderStrings);
  window.addEventListener('resize', () => { if (fitted === 'room') fitRoom(); else if (fitted) fit(); });
})();
