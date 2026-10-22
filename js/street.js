/* The street outside the room's windows: a London street at dusk in 1889,
   seen from the first floor across the road. Everything moves around a loop
   of L world units, so the view never cuts or restarts; each window shows a
   different stretch of the same street. */
(() => {
  const wins = [...document.querySelectorAll('#room .win')];
  const viewport = document.getElementById('viewport');
  if (!wins.length || !viewport) return;

  const L = 1800, H = 600, S = 2;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mod = (a, n) => ((a % n) + n) % n;
  const seeded = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const load = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

  /* ---------- the fixed scene ---------- */
  const LAMPS = [405, 810, 1210, 1605]; // on the party walls, clear of the shop signs
  const WIDTHS = [190, 215, 180, 225, 195, 205, 185, 210, 195];
  const SHOPS = [
    { name: 'J. HICKS', trade: 'IRONMONGER', goods: 'tools' },
    { name: 'A. MORLEY', trade: 'CHEMIST', goods: 'carboys' },
    { name: 'THE GEORGE', trade: 'ALES & STOUT', goods: 'pub' },
    { name: 'T. VANE', trade: 'PAWNBROKER', goods: 'pawn' },
    { name: 'COFFEE ROOMS', trade: 'OPEN TILL MIDNIGHT', goods: 'cafe' },
    { name: 'R. PELL', trade: 'BOOTMAKER', goods: 'boots' },
    { name: 'W. ASHFORD', trade: 'UNDERTAKER', goods: 'shut' },
    { name: 'BOOKS', trade: 'BOUGHT & SOLD', goods: 'books' },
    { name: 'E. GARRICK', trade: 'DRAPER', goods: 'cloth' }
  ];
  const FASCIA = ['#1e3326', '#3a1716', '#16161a', '#2a2238', '#1f2a33'];

  function buildings() {
    const r = seeded(1889), out = [];
    let x0 = 0;
    WIDTHS.forEach((w, i) => {
      const n = Math.max(2, Math.floor((w - 30) / 62)), wins = [];
      for (let row = 0; row < 2; row++) for (let k = 0; k < n; k++) {
        wins.push({ x: x0 + (w / n) * (k + .5) - 15, y: row ? 120 : 28, w: 30, h: row ? 58 : 64, lit: r() < .38, blind: r() * .5 });
      }
      out.push({
        x: x0, w, wins, shop: SHOPS[i], fascia: FASCIA[i % FASCIA.length],
        stucco: r() < .3, tint: `rgb(${200 + r() * 55 | 0},${170 + r() * 50 | 0},${150 + r() * 50 | 0})`,
        doorLeft: r() < .5
      });
      x0 += w;
    });
    return out;
  }

  function buildBackground(brick, cobbles) {
    const c = document.createElement('canvas'); c.width = L * S; c.height = H * S;
    const x = c.getContext('2d'); x.scale(S, S);
    const r = seeded(42), B = buildings();
    const pattern = (img, tileW) => {
      if (!img) return null;
      const p = x.createPattern(img, 'repeat');
      if (!p.setTransform) return null;
      const k = tileW / img.width; p.setTransform(new DOMMatrix().scale(k, k));
      return p;
    };

    /* pass 1: surfaces */
    const brickP = pattern(brick, L / 48);
    for (const b of B) {
      x.fillStyle = b.stucco ? '#a89b84' : (brickP || '#4b3a30');
      x.fillRect(b.x, 0, b.w, 214);
      if (!b.stucco) { x.globalCompositeOperation = 'multiply'; x.fillStyle = b.tint; x.fillRect(b.x, 0, b.w, 214); x.globalCompositeOperation = 'source-over'; }
      else for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(40,30,20,.06)'; x.fillRect(b.x, 12 + i * 32, b.w, 1.5); }
      for (const w of b.wins) {
        x.fillStyle = b.stucco ? '#8f8471' : '#968c7a'; x.fillRect(w.x - 5, w.y - 8, w.w + 10, 7);
        x.fillRect(w.x - 4, w.y + w.h, w.w + 8, 4);
        x.fillStyle = '#12161d'; x.fillRect(w.x, w.y, w.w, w.h);
      }
      x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(b.x, 0, 2, 330);
      x.fillStyle = '#8a8272'; x.fillRect(b.x, 200, b.w, 12);
      x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(b.x, 212, b.w, 4);
      x.fillStyle = '#211b17'; x.fillRect(b.x, 214, b.w, 116);
      x.fillStyle = b.fascia; x.fillRect(b.x + 10, 218, b.w - 20, 26);
      x.fillStyle = '#2b241f'; x.fillRect(b.x + 3, 214, 8, 116); x.fillRect(b.x + b.w - 11, 214, 8, 116);
      const doorX = b.doorLeft ? b.x + 16 : b.x + b.w - 52;
      b.door = { x: doorX, y: 252, w: 36, h: 78 };
      b.disp = { x: b.doorLeft ? b.x + 58 : b.x + 16, y: 252, w: b.w - 76, h: 60 };
      x.fillStyle = '#0d0b0a'; x.fillRect(doorX, 252, 36, 78);
      x.fillStyle = '#17120f'; x.fillRect(b.disp.x, b.disp.y, b.disp.w, b.disp.h);
      x.fillStyle = '#2a221c'; x.fillRect(b.disp.x, 314, b.disp.w, 16);
    }
    // far pavement, kerb, road, near kerb, near pavement
    x.fillStyle = '#4a4844'; x.fillRect(0, 330, L, 36);
    x.fillStyle = 'rgba(0,0,0,.35)';
    for (let px = 0; px < L; px += 30) { x.fillRect(px, 330, 1, 18); x.fillRect(px + 15, 348, 1, 18); }
    x.fillRect(0, 348, L, 1);
    x.fillStyle = '#7a756c'; x.fillRect(0, 366, L, 6);
    x.fillStyle = '#26231f'; x.fillRect(0, 372, L, 168);
    const cobP = pattern(cobbles, L / 16);
    if (cobP) { x.globalAlpha = .9; x.fillStyle = cobP; x.fillRect(0, 372, L, 168); x.globalAlpha = 1; }
    let g = x.createLinearGradient(0, 372, 0, 540);
    g.addColorStop(0, 'rgba(0,0,0,.45)'); g.addColorStop(.5, 'rgba(0,0,0,.1)'); g.addColorStop(1, 'rgba(0,0,0,.4)');
    x.fillStyle = g; x.fillRect(0, 372, L, 168);
    x.fillStyle = '#6f6a62'; x.fillRect(0, 540, L, 7);
    x.fillStyle = '#403e3a'; x.fillRect(0, 547, L, 53);
    x.fillStyle = 'rgba(0,0,0,.35)';
    for (let px = 0; px < L; px += 45) x.fillRect(px, 547, 1.5, 53);
    // lamp posts
    for (const lx of LAMPS) {
      x.fillStyle = '#14181a';
      x.fillRect(lx - 2.5, 248, 5, 120); x.fillRect(lx - 5, 352, 10, 16); x.fillRect(lx - 9, 238, 18, 3);
      x.fillRect(lx - 10, 236, 20, 2);
    }

    /* dusk: darken everything, then add the lit things on top */
    x.globalCompositeOperation = 'multiply';
    x.fillStyle = 'rgb(112,106,118)'; x.fillRect(0, 0, L, H);
    g = x.createLinearGradient(0, 0, 0, 330); g.addColorStop(0, 'rgb(120,120,135)'); g.addColorStop(1, 'rgb(255,255,255)');
    x.fillStyle = g; x.fillRect(0, 0, L, 330);
    x.globalCompositeOperation = 'source-over';

    /* pass 2: lights and lettering */
    for (const b of B) {
      for (const w of b.wins) {
        if (w.lit) {
          g = x.createLinearGradient(0, w.y, 0, w.y + w.h);
          g.addColorStop(0, '#f2c27a'); g.addColorStop(1, '#a8652a');
          x.fillStyle = g; x.fillRect(w.x, w.y, w.w, w.h);
          x.fillStyle = 'rgba(70,25,15,.75)'; x.fillRect(w.x, w.y, 6, w.h); x.fillRect(w.x + w.w - 6, w.y, 6, w.h);
          x.fillStyle = 'rgba(230,215,180,.85)'; x.fillRect(w.x, w.y, w.w, w.h * w.blind);
        } else {
          x.fillStyle = 'rgba(120,135,160,.12)'; x.fillRect(w.x + 3, w.y + 3, w.w * .4, w.h * .35);
        }
        x.fillStyle = '#211a14'; x.fillRect(w.x, w.y + w.h / 2 - 1.5, w.w, 3); x.fillRect(w.x + w.w / 2 - 1, w.y, 2, w.h);
      }
      const s = b.shop, d = b.disp;
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = '#d6ae5c';
      x.font = '600 12px "IM Fell English SC", Georgia, serif';
      const label = `${s.name} · ${s.trade}`;
      let fs = 12; while (x.measureText(label).width > b.w - 30 && fs > 7) { fs -= .5; x.font = `600 ${fs}px "IM Fell English SC", Georgia, serif`; }
      x.fillText(label, b.x + b.w / 2, 231.5);
      if (s.goods === 'shut') {
        x.fillStyle = '#1b1612'; x.fillRect(d.x, d.y, d.w, d.h);
        x.fillStyle = 'rgba(0,0,0,.5)'; for (let i = d.x + 9; i < d.x + d.w; i += 9) x.fillRect(i, d.y, 1.5, d.h);
        continue;
      }
      g = x.createLinearGradient(0, d.y, 0, d.y + d.h);
      g.addColorStop(0, s.goods === 'pub' ? '#e9b56a' : '#f3d08e'); g.addColorStop(1, '#a0602a');
      x.fillStyle = g; x.fillRect(d.x + 2, d.y + 2, d.w - 4, d.h - 4);
      goods(x, s.goods, d, r);
      x.fillStyle = '#17120f';
      for (let i = 1; i < 3; i++) x.fillRect(d.x + d.w * i / 3 - 1, d.y, 2, d.h);
      x.fillStyle = 'rgba(255,215,150,.5)'; x.fillRect(b.door.x + 6, b.door.y + 6, 24, 22);
      x.fillStyle = '#0d0b0a'; x.fillRect(b.door.x + 17, b.door.y + 6, 2, 22);
      if (s.goods === 'pawn') {
        x.fillStyle = '#14181a'; x.fillRect(b.door.x + 18, 206, 2, 14); x.fillRect(b.door.x + 10, 206, 18, 2);
        x.fillStyle = '#c99a3a';
        [[b.door.x + 12, 224], [b.door.x + 26, 224], [b.door.x + 19, 236]].forEach(p => { x.beginPath(); x.arc(p[0], p[1], 5, 0, 7); x.fill(); });
      }
      if (s.goods === 'pub') { x.fillStyle = '#ffd88a'; x.beginPath(); x.arc(b.door.x + 18, 208, 5, 0, 7); x.fill(); }
    }
    // the lamp lanterns themselves
    for (const lx of LAMPS) {
      x.fillStyle = '#fff0c4';
      x.beginPath(); x.moveTo(lx - 7, 218); x.lineTo(lx + 7, 218); x.lineTo(lx + 5, 236); x.lineTo(lx - 5, 236); x.fill();
      x.fillStyle = '#14181a'; x.beginPath(); x.moveTo(lx - 9, 218); x.lineTo(lx, 210); x.lineTo(lx + 9, 218); x.fill();
      x.fillRect(lx - .6, 218, 1.2, 18);
    }
    return c;
  }

  function goods(x, kind, d, r) {
    const base = d.y + d.h - 6;
    if (kind === 'carboys') {
      [['#c0392b', .28], ['#2f8f57', .72]].forEach(([c, f]) => {
        const cx = d.x + d.w * f;
        const g = x.createRadialGradient(cx, base - 22, 2, cx, base - 22, 18);
        g.addColorStop(0, '#fff3d0'); g.addColorStop(.4, c); g.addColorStop(1, 'rgba(0,0,0,.5)');
        x.fillStyle = g; x.beginPath(); x.arc(cx, base - 20, 15, 0, 7); x.fill();
        x.fillRect(cx - 3, base - 44, 6, 10);
      });
      return;
    }
    x.fillStyle = 'rgba(40,22,10,.75)';
    if (kind === 'pub') { x.fillStyle = 'rgba(255,240,210,.35)'; x.fillRect(d.x + 4, d.y + 4, d.w - 8, d.h * .55); x.fillStyle = 'rgba(40,22,10,.6)'; for (let i = 0; i < 4; i++) { const hx = d.x + 20 + i * (d.w - 40) / 3; x.beginPath(); x.arc(hx, base - 14, 6, 0, 7); x.fill(); x.fillRect(hx - 7, base - 8, 14, 8); } return; }
    for (let px = d.x + 8; px < d.x + d.w - 10; px += 12 + r() * 10) {
      const h = 8 + r() * 22;
      if (kind === 'boots') { x.fillRect(px, base - h, 6, h); x.fillRect(px, base - 5, 12, 5); }
      else if (kind === 'books') { x.fillRect(px, base - h, 4 + r() * 4, h); }
      else if (kind === 'cloth') { x.fillStyle = `rgba(${90 + r() * 80 | 0},${30 + r() * 40 | 0},${30 + r() * 30 | 0},.8)`; x.fillRect(px, d.y + 8, 9, d.h - 16); }
      else if (kind === 'cafe') { x.beginPath(); x.arc(px + 5, base - 4, 5, Math.PI, 0); x.fill(); }
      else { x.fillRect(px, base - h, 3, h); x.fillRect(px - 3, base - h, 9, 4); }
    }
  }

  function buildFog() {
    const c = document.createElement('canvas'); c.width = L / 2; c.height = H / 2;
    const x = c.getContext('2d'), r = seeded(7); x.scale(.5, .5);
    for (let i = 0; i < 70; i++) {
      const fx = r() * L, fy = 160 + r() * 440, fr = 40 + r() * 120;
      for (const off of [-L, 0, L]) {
        const g = x.createRadialGradient(fx + off, fy, 0, fx + off, fy, fr);
        g.addColorStop(0, 'rgba(170,175,185,.06)'); g.addColorStop(1, 'rgba(170,175,185,0)');
        x.fillStyle = g; x.fillRect(fx + off - fr, fy - fr, fr * 2, fr * 2);
      }
    }
    return c;
  }

  /* ---------- the people and traffic ---------- */
  const COATS = ['#1f1d22', '#2b2622', '#1d2430', '#33281f', '#262826', '#3a2d2a'];
  const DRESSES = ['#3b2430', '#25303a', '#3a3324', '#2a2a2e', '#4a2622', '#28352c'];
  function cast() {
    const r = seeded(99), pick = a => a[Math.floor(r() * a.length)];
    const peds = (n, y, s) => Array.from({ length: n }, () => {
      const k = r();
      const kind = k < .48 ? 'man' : k < .84 ? 'woman' : k < .92 ? 'boy' : 'constable';
      return {
        kind, x0: r() * L, y: y + r() * 5, dir: r() < .5 ? 1 : -1, v: 18 + r() * 14, p: r() * 7,
        s: s * (kind === 'boy' ? .74 : .92 + r() * .14),
        c1: kind === 'constable' ? '#141a2c' : kind === 'woman' ? pick(DRESSES) : pick(COATS),
        c2: pick(COATS), c3: '#141210', hat: pick(['top', 'top', 'bowler', 'bowler', 'cap']), cane: r() < .25
      };
    });
    return {
      far: peds(13, 360, .6),
      near: peds(8, 597, .95),
      lanes: [
        { y: 456, dir: 1, v: 56, s: .82, list: [['hansom', 40], ['omnibus', 640], ['growler', 1230]] },
        { y: 528, dir: -1, v: 63, s: .95, list: [['growler', 320], ['dray', 930], ['hansom', 1500]] }
      ]
    };
  }

  function person(x, a, t) {
    const ph = a.v * t / 9 + a.p, sw = Math.sin(ph);
    x.save();
    x.translate(0, -Math.abs(Math.cos(ph)) * 1.4);
    x.scale(a.s * a.dir, a.s);
    x.lineCap = 'round';
    x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(0, 0, 13, 3, 0, 0, 7); x.fill();
    if (a.kind === 'woman') {
      x.strokeStyle = a.c1; x.lineWidth = 4.5;
      x.beginPath(); x.moveTo(-4, -76); x.lineTo(-6 + sw * 4, -54); x.stroke();
      x.fillStyle = a.c1;
      x.beginPath(); x.moveTo(-7, -54); x.lineTo(7, -54);
      x.quadraticCurveTo(14 + sw * 2, -22, 17 + sw * 2.5, 0); x.lineTo(-15 + sw * 2.5, 0);
      x.quadraticCurveTo(-12 + sw * 2, -22, -7, -54); x.fill();
      x.beginPath(); x.moveTo(-8, -81); x.lineTo(8, -81); x.lineTo(6, -52); x.lineTo(-6, -52); x.fill();
      x.fillStyle = a.c2; x.beginPath(); x.moveTo(-10, -82); x.lineTo(10, -82); x.lineTo(1, -62); x.fill();
      x.strokeStyle = a.c1; x.beginPath(); x.moveTo(4, -76); x.lineTo(7 - sw * 4, -56); x.stroke();
      x.fillStyle = '#8b7060'; x.beginPath(); x.arc(1, -89, 6.5, 0, 7); x.fill();
      x.fillStyle = a.c2; x.beginPath(); x.arc(0, -91, 8, Math.PI * .85, Math.PI * 2.1); x.fill();
      x.fillRect(-9, -93, 6, 9);
    } else {
      const leg = a.kind === 'boy' ? 40 : 46, ang = sw * .45;
      x.strokeStyle = '#0e0d0c'; x.lineWidth = 6;
      x.beginPath(); x.moveTo(-1, -leg); x.lineTo(Math.sin(-ang) * leg, -leg + Math.cos(-ang) * leg); x.stroke();
      x.strokeStyle = a.c3;
      x.beginPath(); x.moveTo(1, -leg); x.lineTo(Math.sin(ang) * leg, -leg + Math.cos(ang) * leg); x.stroke();
      x.strokeStyle = a.c1; x.lineWidth = 5;
      x.beginPath(); x.moveTo(-2, -78); x.lineTo(-2 + sw * 11, -52); x.stroke();
      x.fillStyle = a.c1;
      x.beginPath(); x.moveTo(-9, -83); x.lineTo(9, -83); x.lineTo(12, a.kind === 'boy' ? -36 : -34); x.lineTo(-12, a.kind === 'boy' ? -36 : -34); x.fill();
      x.beginPath(); x.moveTo(2, -78); x.lineTo(2 - sw * 11, -52); x.stroke();
      if (a.cane && a.kind === 'man') { x.strokeStyle = '#0c0a09'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(2 - sw * 11, -52); x.lineTo(6 - sw * 14, 0); x.stroke(); }
      if (a.kind === 'boy') { x.fillStyle = '#d8d0bc'; x.fillRect(4, -66, 9, 12); }
      if (a.kind === 'constable') { x.fillStyle = '#c9a54a'; x.fillRect(-1, -76, 2, 2); x.fillRect(-1, -66, 2, 2); }
      x.fillStyle = '#8b7060'; x.beginPath(); x.arc(1, -89, 6.5, 0, 7); x.fill();
      x.fillStyle = '#0f0e0e';
      const hat = a.kind === 'boy' ? 'cap' : a.kind === 'constable' ? 'helmet' : a.hat;
      if (hat === 'top') { x.fillRect(-5, -109, 12, 15); x.fillRect(-9, -95, 20, 3); }
      else if (hat === 'bowler') { x.beginPath(); x.arc(1, -94, 7.5, Math.PI, 0); x.fill(); x.fillRect(-9, -95, 20, 2.5); }
      else if (hat === 'cap') { x.fillRect(-6, -98, 13, 6); x.fillRect(5, -94, 6, 2); }
      else { x.fillStyle = '#141a2c'; x.beginPath(); x.moveTo(-7, -93); x.quadraticCurveTo(-4, -114, 1, -114); x.quadraticCurveTo(6, -114, 9, -93); x.fill(); x.fillRect(-9, -94, 20, 2.5); x.fillStyle = '#c9a54a'; x.fillRect(0, -103, 2.5, 3); }
    }
    x.restore();
  }

  function horse(x, ph, col) {
    x.lineCap = 'round';
    x.strokeStyle = col; x.fillStyle = col; x.lineWidth = 4.5;
    [[16, 0], [11, Math.PI], [-17, Math.PI], [-22, 0]].forEach(([hx, o]) => {
      const a = Math.sin(ph + o) * .38;
      x.beginPath(); x.moveTo(hx, -32); x.lineTo(hx + Math.sin(a) * 32, -32 + Math.cos(a) * 32); x.stroke();
    });
    x.beginPath(); x.ellipse(-3, -40, 25, 11, 0, 0, 7); x.fill();
    x.beginPath(); x.moveTo(13, -47); x.lineTo(27, -71); x.lineTo(35, -66); x.lineTo(24, -37); x.fill();
    x.beginPath(); x.ellipse(37, -61, 9.5, 4.8, .9, 0, 7); x.fill();
    x.beginPath(); x.moveTo(28, -71); x.lineTo(30, -78); x.lineTo(32, -70); x.fill();
    x.lineWidth = 4; x.beginPath(); x.moveTo(-27, -45); x.quadraticCurveTo(-36, -36, -32, -20); x.stroke();
    x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(15, -50); x.lineTo(22, -38); x.stroke();
    x.beginPath(); x.moveTo(-10, -50); x.lineTo(-10, -30); x.stroke();
  }
  function wheel(x, cx, r, ang) {
    x.strokeStyle = '#17120e'; x.lineWidth = 2.6;
    x.beginPath(); x.arc(cx, -r, r, 0, 7); x.stroke();
    x.lineWidth = 1.1;
    for (let i = 0; i < 6; i++) { const a = ang + i * Math.PI / 6; x.beginPath(); x.moveTo(cx - Math.cos(a) * r, -r - Math.sin(a) * r); x.lineTo(cx + Math.cos(a) * r, -r + Math.sin(a) * r); x.stroke(); }
    x.fillStyle = '#17120e'; x.beginPath(); x.arc(cx, -r, 3, 0, 7); x.fill();
  }
  function driver(x, dx, dy) {
    x.fillStyle = '#1a1816'; x.fillRect(dx - 6, dy - 22, 12, 22);
    x.fillStyle = '#8b7060'; x.beginPath(); x.arc(dx, dy - 28, 5.5, 0, 7); x.fill();
    x.fillStyle = '#0f0e0e'; x.fillRect(dx - 4, dy - 44, 9, 12); x.fillRect(dx - 7, dy - 33, 15, 2.5);
  }
  function lantern(x, lx, ly) { x.fillStyle = '#ffd98e'; x.fillRect(lx - 2, ly - 3, 4, 6); }

  function vehicle(x, kind, d, t) {
    const ph = d / 7, ang = d / 20;
    x.lineCap = 'round';
    if (kind === 'omnibus') {
      x.save(); x.translate(6, -3); horse(x, ph + 1.3, '#3a2c22'); x.restore();
      horse(x, ph, '#2c2119');
      x.strokeStyle = '#1b1511'; x.lineWidth = 2; x.beginPath(); x.moveTo(-10, -38); x.lineTo(-60, -38); x.stroke();
      x.fillStyle = '#4a2a22'; x.fillRect(-190, -92, 130, 62);
      x.fillStyle = '#c9b98f'; x.fillRect(-190, -108, 130, 15);
      x.fillStyle = '#2a1a12'; x.font = '600 10px "IM Fell English SC", Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      const f = x.getTransform().a < 0 ? -1 : 1; // keep the lettering readable when the bus faces left
      x.save(); x.scale(f, 1); x.fillText('BANK · SHOREDITCH', -125 * f, -100); x.restore();
      x.fillStyle = '#e6be7a'; for (let i = 0; i < 5; i++) x.fillRect(-184 + i * 24, -86, 18, 22);
      x.fillStyle = '#141210'; for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(-180 + i * 22, -118, 5, 0, 7); x.fill(); x.fillRect(-186 + i * 22, -114, 12, 6); }
      driver(x, -56, -96);
      wheel(x, -166, 21, ang); wheel(x, -80, 16, ang * 1.3);
      lantern(x, -60, -60);
    } else if (kind === 'hansom') {
      horse(x, ph, '#1c1612');
      x.strokeStyle = '#1b1511'; x.lineWidth = 2; x.beginPath(); x.moveTo(12, -40); x.lineTo(-62, -40); x.stroke();
      x.fillStyle = '#1c1a17';
      x.beginPath(); x.moveTo(-92, -30); x.lineTo(-58, -30); x.lineTo(-52, -58); x.lineTo(-58, -88); x.lineTo(-94, -88); x.lineTo(-98, -44); x.fill();
      x.fillStyle = '#e1b36a'; x.fillRect(-88, -80, 18, 18);
      driver(x, -100, -90);
      wheel(x, -74, 27, ang);
      lantern(x, -54, -64);
    } else if (kind === 'growler') {
      horse(x, ph, '#3f3127');
      x.strokeStyle = '#1b1511'; x.lineWidth = 2; x.beginPath(); x.moveTo(12, -40); x.lineTo(-44, -40); x.stroke();
      x.fillStyle = '#2c2620'; x.fillRect(-122, -84, 78, 56);
      x.fillStyle = '#d6a964'; x.fillRect(-114, -78, 24, 20); x.fillRect(-82, -78, 24, 20);
      x.fillStyle = '#17120e'; x.fillRect(-124, -90, 82, 4);
      x.fillStyle = '#3a3128'; x.fillRect(-118, -98, 30, 8);
      driver(x, -40, -66);
      wheel(x, -106, 18, ang); wheel(x, -58, 14, ang * 1.3);
      lantern(x, -44, -60);
    } else {
      horse(x, ph, '#3c2c1f');
      x.strokeStyle = '#1b1511'; x.lineWidth = 2.4; x.beginPath(); x.moveTo(12, -40); x.lineTo(-48, -40); x.stroke();
      x.fillStyle = '#3d3022'; x.fillRect(-134, -44, 90, 8);
      for (let i = 0; i < 4; i++) { x.fillStyle = '#5a3d22'; x.beginPath(); x.ellipse(-122 + i * 22, -58, 10, 13, 0, 0, 7); x.fill(); x.fillStyle = '#1b130c'; x.fillRect(-132 + i * 22, -60, 20, 2); }
      driver(x, -50, -48);
      wheel(x, -110, 19, ang); wheel(x, -64, 19, ang);
    }
  }

  /* ---------- drawing a window's view ---------- */
  let bg = null, fog = null, people = null;
  function blit(x, img, sx, vw, alpha) {
    const sc = img.width / L; sx = mod(sx, L);
    const first = Math.min(vw, L - sx);
    x.globalAlpha = alpha;
    x.drawImage(img, sx * sc, 0, first * sc, img.height, 0, 0, first, H);
    if (first < vw) x.drawImage(img, 0, 0, (vw - first) * sc, img.height, first, 0, vw - first, H);
    x.globalAlpha = 1;
  }
  function screenX(wx, viewX, vw) {
    let dx = mod(wx - viewX, L);
    if (dx > L - 260) dx -= L;
    return dx > vw + 260 ? null : dx;
  }
  function drawView(w, t) {
    const c = w.canvas, x = c.getContext('2d');
    if (!c.width || !c.height) return;
    const k = c.height / H, vw = c.width / k, vx = w.viewX;
    x.setTransform(k, 0, 0, k, 0, 0);
    blit(x, bg, vx, vw, 1);
    x.globalCompositeOperation = 'lighter';
    LAMPS.forEach((lx, i) => {
      const sx = screenX(lx, vx, vw); if (sx === null) return;
      const f = .86 + .08 * Math.sin(t * 6.3 + i) + .06 * Math.sin(t * 15.1 + i * 2);
      let g = x.createRadialGradient(sx, 228, 0, sx, 228, 95);
      g.addColorStop(0, `rgba(255,200,120,${.42 * f})`); g.addColorStop(1, 'rgba(255,200,120,0)');
      x.fillStyle = g; x.fillRect(sx - 95, 133, 190, 190);
      g = x.createRadialGradient(sx, 362, 0, sx, 362, 70);
      g.addColorStop(0, `rgba(255,190,110,${.2 * f})`); g.addColorStop(1, 'rgba(255,190,110,0)');
      x.save(); x.translate(sx, 362); x.scale(1, .25); x.translate(-sx, -362); x.fillStyle = g; x.fillRect(sx - 70, 292, 140, 140); x.restore();
      g = x.createLinearGradient(0, 372, 0, 520);
      g.addColorStop(0, `rgba(255,190,110,${.16 * f})`); g.addColorStop(1, 'rgba(255,190,110,0)');
      x.fillStyle = g; x.fillRect(sx - 7, 372, 14, 148);
    });
    x.globalCompositeOperation = 'source-over';

    const at = (a, speedSign) => screenX(a.x0 + speedSign * a.v * t, vx, vw);
    for (const a of people.far) { const sx = at(a, a.dir); if (sx === null) continue; x.save(); x.translate(sx, a.y); person(x, a, t); x.restore(); }
    for (const lane of people.lanes) {
      for (const [kind, x0] of lane.list) {
        const d = lane.v * t, sx = screenX(x0 + lane.dir * d, vx, vw); if (sx === null) continue;
        x.save(); x.translate(sx, lane.y);
        x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(-60 * lane.dir * lane.s, 0, 95 * lane.s, 6, 0, 0, 7); x.fill();
        x.scale(lane.dir * lane.s, lane.s);
        vehicle(x, kind, d / lane.s, t);
        x.restore();
      }
    }
    for (const a of people.near) { const sx = at(a, a.dir); if (sx === null) continue; x.save(); x.translate(sx, a.y); person(x, a, t); x.restore(); }

    blit(x, fog, vx - t * 7, vw, .7);
    blit(x, fog, vx + 600 + t * 4, vw, .4);
    x.fillStyle = 'rgba(28,34,52,.16)'; x.fillRect(0, 0, vw, H);
  }

  /* ---------- sizing the windows to the zoom, drawing only the ones on screen ---------- */
  let zoom = 1;
  function resize() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    for (const v of views) {
      const op = v.canvas.parentElement;
      const k = Math.min(zoom * dpr, 1400 / op.clientHeight);
      v.canvas.width = Math.max(1, Math.round(op.clientWidth * k));
      v.canvas.height = Math.max(1, Math.round(op.clientHeight * k));
    }
  }
  function onScreen(el) {
    const r = el.getBoundingClientRect(), s = viewport.getBoundingClientRect();
    return r.right > s.left && r.left < s.right && r.bottom > s.top && r.top < s.bottom;
  }

  const views = wins.map((el, i) => ({ el, canvas: el.querySelector('canvas'), viewX: i ? 1010 : 130 }));
  let running = false, last = 0;
  const t0 = performance.now() / 1000 - 240;
  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (now - last < 33) return;
    last = now;
    const t = now / 1000 - t0;
    for (const v of views) if (onScreen(v.el)) drawView(v, t);
  }
  function refresh() {
    resize();
    if (!bg) return;
    if (reduce) { for (const v of views) drawView(v, 300); return; }
    if (!running) { running = true; requestAnimationFrame(frame); }
  }
  addEventListener('scenezoom', e => { zoom = e.detail; refresh(); });
  if (reduce) viewport.addEventListener('scroll', () => { if (bg) for (const v of views) drawView(v, 300); }, { passive: true });
  const scene = document.getElementById('scene');
  if (scene) zoom = scene.getBoundingClientRect().width / scene.offsetWidth || 1; // board.js zoomed before this script loaded
  refresh();
  Promise.all([load('img/room/brick.jpg'), load('img/room/cobbles.jpg'),
    document.fonts ? document.fonts.load('600 12px "IM Fell English SC"').catch(() => null) : null])
    .then(([brick, cobbles]) => {
      bg = buildBackground(brick, cobbles); fog = buildFog(); people = cast();
      refresh();
    });
})();
