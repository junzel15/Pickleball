// Player customization: avatars, paddles, player name, and the Customize screen.
// Exposes window.PB for game.js.
(() => {
  'use strict';

  // =====================================================================
  //  Color helpers
  // =====================================================================
  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(rgb) {
    return '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  }
  function mix(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return rgbToHex(A.map((v, i) => v + (B[i] - v) * t));
  }
  // Memoized: the same few colours are shaded every frame
  const shadeCache = new Map();
  const shade = (c, amt) => {
    const key = c + (Math.round(amt * 100) / 100);
    let v = shadeCache.get(key);
    if (v === undefined) {
      v = amt >= 0 ? mix(c, '#ffffff', amt) : mix(c, '#000000', -amt);
      if (shadeCache.size > 2000) shadeCache.clear();
      shadeCache.set(key, v);
    }
    return v;
  };
  const rgbaCache = new Map();
  const rgba = (c, a) => {
    const key = c + '|' + a;
    let v = rgbaCache.get(key);
    if (v === undefined) {
      const [r, g, b] = hexToRgb(c);
      v = `rgba(${r},${g},${b},${a})`;
      if (rgbaCache.size > 2000) rgbaCache.clear();
      rgbaCache.set(key, v);
    }
    return v;
  };
  // Small deterministic random generator so patterns look the same every time
  function seeded(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return () => {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    };
  }

  // =====================================================================
  //  Avatar options
  // =====================================================================
  // Shoe colourways: upper, sole and an accent stripe
  const SHOES = {
    white: { upper: '#f4f5f7', sole: '#c9ced6', accent: '#2f80ed', n: 'Classic white' },
    black: { upper: '#1e2026', sole: '#f1f1f1', accent: '#d7f23b', n: 'Black' },
    neon:  { upper: '#d7f23b', sole: '#22262e', accent: '#1e2026', n: 'Neon' },
    blue:  { upper: '#2f6fd6', sole: '#f4f5f7', accent: '#ffffff', n: 'Royal blue' },
    red:   { upper: '#d23a3a', sole: '#f4f5f7', accent: '#1e2026', n: 'Red' },
    pink:  { upper: '#f2a7c3', sole: '#ffffff', accent: '#7b4bb3', n: 'Pink' },
  };
  const GUARD_COLORS = [
    { v: 'none', n: 'None' }, { v: '#1b1b1d', n: 'Black' }, { v: '#eef1f4', n: 'White' },
    { v: '#2f6fd6', n: 'Blue' }, { v: '#c0392b', n: 'Red' },
  ];

  const OPTIONS = {
    gender: [{ v: 'male', n: 'Male' }, { v: 'female', n: 'Female' }],
    skin: [
      { v: '#f4d6c4', n: 'Fair' }, { v: '#e9bf9f', n: 'Light' }, { v: '#d29d74', n: 'Medium' },
      { v: '#b07650', n: 'Tan' }, { v: '#87553a', n: 'Brown' }, { v: '#5a3826', n: 'Deep' },
    ],
    hair: [
      { v: 'short', n: 'Short' }, { v: 'buzz', n: 'Buzz' }, { v: 'curly', n: 'Curly' }, { v: 'ponytail', n: 'Ponytail' },
      { v: 'bun', n: 'Bun' }, { v: 'long', n: 'Long' }, { v: 'bald', n: 'Bald' },
    ],
    hairColor: [
      { v: '#1d1815', n: 'Black' }, { v: '#3b2a1f', n: 'Dark brown' }, { v: '#6b4a31', n: 'Brown' },
      { v: '#8e4527', n: 'Auburn' }, { v: '#c6a067', n: 'Blonde' }, { v: '#a9a5a0', n: 'Gray' },
    ],
    eyes: [
      { v: '#4a2e1d', n: 'Brown' }, { v: '#6d5a2b', n: 'Hazel' }, { v: '#3d6c93', n: 'Blue' }, { v: '#4e7a4a', n: 'Green' },
    ],
    facial: [
      { v: 'none', n: 'None' }, { v: 'stubble', n: 'Stubble' }, { v: 'mustache', n: 'Mustache' }, { v: 'beard', n: 'Beard' },
    ],
    headwear: [
      { v: 'none', n: 'None' }, { v: 'cap', n: 'Cap' }, { v: 'visor', n: 'Visor' }, { v: 'headband', n: 'Headband' },
    ],
    hatColor: [
      { v: '#1d4e89', n: 'Navy' }, { v: '#f2f2f0', n: 'White' }, { v: '#1b1b1b', n: 'Black' }, { v: '#c0392b', n: 'Red' },
      { v: '#2e8b57', n: 'Green' }, { v: '#e3b22b', n: 'Yellow' }, { v: '#7b4bb3', n: 'Purple' }, { v: '#e86a9a', n: 'Pink' },
    ],
    shirt: [
      { v: '#2f80ed', n: 'Blue' }, { v: '#1d4e89', n: 'Navy' }, { v: '#f5f5f2', n: 'White' }, { v: '#2b2b2e', n: 'Charcoal' },
      { v: '#d64545', n: 'Red' }, { v: '#f08a3c', n: 'Orange' }, { v: '#e8c547', n: 'Yellow' }, { v: '#3bb273', n: 'Green' },
      { v: '#2bb3a3', n: 'Teal' }, { v: '#8e5cc4', n: 'Purple' }, { v: '#e86a9a', n: 'Pink' }, { v: '#c7d93b', n: 'Lime' },
    ],
    shirtStyle: [
      { v: 'polo', n: 'Polo' }, { v: 'crew', n: 'T-shirt' }, { v: 'vneck', n: 'V-neck' },
      { v: 'tank', n: 'Tank top' }, { v: 'raglan', n: 'Raglan' },
    ],
    shirtAccent: [
      { v: '#f5f5f2', n: 'White' }, { v: '#1b1b1b', n: 'Black' }, { v: '#1d4e89', n: 'Navy' }, { v: '#d64545', n: 'Red' },
      { v: '#c7d93b', n: 'Lime' }, { v: '#f08a3c', n: 'Orange' }, { v: '#2bb3a3', n: 'Teal' }, { v: '#e86a9a', n: 'Pink' },
    ],
    shortsStyle: [
      { v: 'classic', n: 'Classic' }, { v: 'long', n: 'Long' }, { v: 'compression', n: 'Compression' }, { v: 'skort', n: 'Skort' },
    ],
    shortsColor: [
      { v: '#1f2a44', n: 'Navy' }, { v: '#1b1b1d', n: 'Black' }, { v: '#eceff3', n: 'White' }, { v: '#6b7280', n: 'Gray' },
      { v: '#b9a27a', n: 'Khaki' }, { v: '#a62b2b', n: 'Red' }, { v: '#2f6fd6', n: 'Blue' }, { v: '#d9779e', n: 'Pink' },
    ],
    shoes: Object.keys(SHOES).map((k) => ({ v: k, n: SHOES[k].n })),
    kneeGuard: GUARD_COLORS,
    elbowGuard: GUARD_COLORS,
  };
  const AVATAR_KEYS = Object.keys(OPTIONS);
  const DEFAULT_AVATAR = {
    gender: 'male',
    skin: '#d29d74', hair: 'short', hairColor: '#3b2a1f', eyes: '#4a2e1d',
    facial: 'none', headwear: 'cap', hatColor: '#1d4e89', shirt: '#2f80ed',
    shirtStyle: 'polo', shirtAccent: '#f5f5f2', shortsStyle: 'classic', shortsColor: '#1f2a44',
    shoes: 'white', kneeGuard: 'none', elbowGuard: 'none',
  };

  // =====================================================================
  //  Paddles — original designs (fictional brands)
  //  power / control are 1-10 and slightly change how shots play.
  // =====================================================================
  const PADDLES = [
    { id: 'vantage-carbon',   brand: 'VANTAGE',  model: 'Carbon Pro 16', shape: 'elongated', pattern: 'carbon',   c1: '#17191e', c2: '#2d3038', accent: '#e63946', edge: '#e63946', grip: '#1f1f22', power: 8, control: 7 },
    { id: 'tidal-wave',       brand: 'TIDAL',    model: 'Wave 14',       shape: 'standard',  pattern: 'wave',     c1: '#0b3d5c', c2: '#1fa2b8', accent: '#e8f7ff', edge: '#0b2a40', grip: '#0b2a40', power: 6, control: 8 },
    { id: 'ember-blaze',      brand: 'EMBER',    model: 'Blaze Wide',    shape: 'wide',      pattern: 'flame',    c1: '#24100a', c2: '#ff5a1f', accent: '#ffc23d', edge: '#160904', grip: '#3a1206', power: 9, control: 5 },
    { id: 'nova-pulse',       brand: 'NOVA',     model: 'Pulse',         shape: 'standard',  pattern: 'dots',     c1: '#2a1a4a', c2: '#5b2fa0', accent: '#b9f227', edge: '#160d29', grip: '#1a0f2e', power: 7, control: 7 },
    { id: 'summit-classic',   brand: 'SUMMIT',   model: 'Classic Wood',  shape: 'standard',  pattern: 'wood',     c1: '#cfa16a', c2: '#a87545', accent: '#6e4423', edge: '#5a371c', grip: '#4a2e18', power: 5, control: 6 },
    { id: 'apex-volt',        brand: 'APEX',     model: 'Volt Edge',     shape: 'elongated', pattern: 'split',    c1: '#f2d21b', c2: '#151515', accent: '#ffffff', edge: '#151515', grip: '#151515', power: 8, control: 6 },
    { id: 'glacier-frost',    brand: 'GLACIER',  model: 'Frost Geo',     shape: 'standard',  pattern: 'geo',      c1: '#eef6fb', c2: '#7cc3e8', accent: '#2b6f9e', edge: '#2b6f9e', grip: '#d5e3ec', power: 5, control: 9 },
    { id: 'ridge-camo',       brand: 'RIDGE',    model: 'Field Camo',    shape: 'wide',      pattern: 'camo',     c1: '#4b5a33', c2: '#2e3a1f', accent: '#8f9460', edge: '#1f2715', grip: '#2e3a1f', power: 7, control: 6 },
    { id: 'ruby-strike',      brand: 'RUBY',     model: 'Strike Gold',   shape: 'standard',  pattern: 'stripes',  c1: '#8f0f1b', c2: '#c21d2c', accent: '#e7c160', edge: '#e7c160', grip: '#3b0a0f', power: 8, control: 6 },
    { id: 'midnight-stealth', brand: 'MIDNIGHT', model: 'Stealth Raw',   shape: 'elongated', pattern: 'gradient', c1: '#0d0f14', c2: '#3a4150', accent: '#8892a6', edge: '#050505', grip: '#111111', power: 9, control: 6 },
    { id: 'coral-reef',       brand: 'CORAL',    model: 'Reef Lite',     shape: 'standard',  pattern: 'gradient', c1: '#ff7e79', c2: '#ffd1a6', accent: '#ffffff', edge: '#e05d57', grip: '#e05d57', power: 5, control: 9 },
    { id: 'orbit-pro',        brand: 'ORBIT',    model: 'Pro Ring',      shape: 'wide',      pattern: 'rings',    c1: '#0f2b46', c2: '#16507f', accent: '#ff9f1c', edge: '#ff9f1c', grip: '#0f2b46', power: 7, control: 8 },
  ];
  const DEFAULT_PADDLE = 'tidal-wave';
  const paddleById = (id) => PADDLES.find((p) => p.id === id) || PADDLES.find((p) => p.id === DEFAULT_PADDLE);
  const SHAPE_NAMES = { standard: 'Standard shape', elongated: 'Elongated (more reach)', wide: 'Wide-body (bigger sweet spot)' };

  // =====================================================================
  //  Bot players
  // =====================================================================
  const BOTS = {
    cpu1: {
      name: 'Bot Player 1', paddle: 'ember-blaze',
      avatar: { gender: 'male', skin: '#e9bf9f', hair: 'short', hairColor: '#3b2a1f', eyes: '#3d6c93', facial: 'stubble', headwear: 'none', hatColor: '#1b1b1b', shirt: '#d64545',
        shirtStyle: 'crew', shirtAccent: '#1b1b1b', shortsStyle: 'classic', shortsColor: '#1b1b1d', shoes: 'black', kneeGuard: 'none', elbowGuard: '#1b1b1d' },
    },
    cpu2: {
      name: 'Bot Player 2', paddle: 'apex-volt',
      avatar: { gender: 'female', skin: '#87553a', hair: 'ponytail', hairColor: '#1d1815', eyes: '#4a2e1d', facial: 'none', headwear: 'visor', hatColor: '#f2f2f0', shirt: '#f08a3c',
        shirtStyle: 'tank', shirtAccent: '#f5f5f2', shortsStyle: 'skort', shortsColor: '#eceff3', shoes: 'pink', kneeGuard: 'none', elbowGuard: 'none' },
    },
    mate: {
      name: 'Bot Player 3', paddle: 'glacier-frost',
      avatar: { gender: 'male', skin: '#d29d74', hair: 'curly', hairColor: '#1d1815', eyes: '#4a2e1d', facial: 'beard', headwear: 'headband', hatColor: '#f2f2f0', shirt: '#2bb3a3',
        shirtStyle: 'raglan', shirtAccent: '#f5f5f2', shortsStyle: 'long', shortsColor: '#1f2a44', shoes: 'neon', kneeGuard: '#1b1b1d', elbowGuard: 'none' },
    },
  };

  // =====================================================================
  //  Paddle drawing (long axis along +x, face centred on the origin)
  // =====================================================================
  const SHAPES = {
    standard:  { L: 1.0,  W: 0.8,  r: 0.3 },
    elongated: { L: 1.14, W: 0.68, r: 0.24 },
    wide:      { L: 0.94, W: 0.9,  r: 0.36 },
  };
  const HANDLE = { len: 0.44, w: 0.17 };

  function facePath(ctx, sh) {
    const { L, W, r } = sh;
    const x0 = -L / 2, x1 = L / 2, y0 = -W / 2, y1 = W / 2;
    const rb = r * 0.7; // throat corners are a little squarer than the tip
    ctx.beginPath();
    ctx.moveTo(x0 + rb, y0);
    ctx.lineTo(x1 - r, y0);
    ctx.quadraticCurveTo(x1, y0, x1, y0 + r);
    ctx.lineTo(x1, y1 - r);
    ctx.quadraticCurveTo(x1, y1, x1 - r, y1);
    ctx.lineTo(x0 + rb, y1);
    ctx.quadraticCurveTo(x0, y1, x0, y1 - rb);
    ctx.lineTo(x0, y0 + rb);
    ctx.quadraticCurveTo(x0, y0, x0 + rb, y0);
    ctx.closePath();
  }

  function paintPattern(ctx, p, sh) {
    const { L, W } = sh;
    const x0 = -L / 2 - 0.05, x1 = L / 2 + 0.05, y0 = -W / 2 - 0.05, y1 = W / 2 + 0.05;
    const w = x1 - x0, h = y1 - y0;
    const R = seeded(p.id);
    const lin = (a, b) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };

    switch (p.pattern) {
      case 'carbon': { // twill weave
        ctx.fillStyle = p.c1; ctx.fillRect(x0, y0, w, h);
        const s = 0.045;
        ctx.fillStyle = p.c2;
        for (let i = 0, x = x0; x < x1; x += s, i++) {
          for (let j = 0, y = y0; y < y1; y += s, j++) {
            if ((i + j) % 2) ctx.fillRect(x, y, s * 0.92, s * 0.46);
            else ctx.fillRect(x, y, s * 0.46, s * 0.92);
          }
        }
        ctx.fillStyle = p.accent;
        ctx.fillRect(x0 + 0.16, y0, 0.05, h);
        ctx.fillRect(x0 + 0.24, y0, 0.015, h);
        break;
      }
      case 'wave': {
        ctx.fillStyle = lin(p.c1, p.c2); ctx.fillRect(x0, y0, w, h);
        for (let k = 0; k < 3; k++) {
          ctx.strokeStyle = rgba(p.accent, 0.85 - k * 0.22);
          ctx.lineWidth = 0.055 - k * 0.013;
          ctx.beginPath();
          for (let x = x0; x <= x1; x += 0.02) {
            const y = -0.14 + k * 0.15 + Math.sin(x * 7 + k * 1.3) * 0.06;
            if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        break;
      }
      case 'flame': {
        ctx.fillStyle = p.c1; ctx.fillRect(x0, y0, w, h);
        const layer = (color, scale) => {
          const g = ctx.createLinearGradient(x0, 0, x1, 0);
          g.addColorStop(0, color); g.addColorStop(1, rgba(color, 0));
          ctx.fillStyle = g;
          for (let i = 0; i < 7; i++) {
            const y = y0 + (i + 0.5) * (h / 7);
            const tipX = x0 + (0.45 + R() * 0.45) * w * scale;
            const tipY = y + (R() - 0.5) * 0.16;
            ctx.beginPath();
            ctx.moveTo(x0, y - 0.075);
            ctx.bezierCurveTo(x0 + w * 0.25, y - 0.12, tipX - 0.15, tipY - 0.05, tipX, tipY);
            ctx.bezierCurveTo(tipX - 0.2, tipY + 0.06, x0 + w * 0.25, y + 0.12, x0, y + 0.075);
            ctx.closePath();
            ctx.fill();
          }
        };
        layer(p.c2, 1);
        layer(p.accent, 0.7);
        break;
      }
      case 'dots': { // halftone that grows toward the tip
        ctx.fillStyle = lin(p.c1, p.c2); ctx.fillRect(x0, y0, w, h);
        ctx.fillStyle = p.accent;
        for (let x = x0 + 0.04; x < x1; x += 0.075) {
          const rr = 0.004 + 0.028 * ((x - x0) / w);
          for (let y = y0 + 0.04; y < y1; y += 0.075) {
            ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
          }
        }
        break;
      }
      case 'wood': {
        ctx.fillStyle = lin(p.c1, p.c2); ctx.fillRect(x0, y0, w, h);
        ctx.lineWidth = 0.012;
        for (let i = 0; i < 16; i++) {
          const yy = y0 + i * (h / 15);
          ctx.strokeStyle = rgba(p.accent, 0.18 + R() * 0.3);
          ctx.beginPath();
          for (let x = x0; x <= x1; x += 0.03) {
            const y = yy + Math.sin(x * 4 + i * 0.7) * 0.02 + Math.sin(x * 11 + i) * 0.006;
            if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.strokeStyle = rgba(p.accent, 0.45);
        for (let k = 1; k <= 3; k++) {
          ctx.beginPath(); ctx.ellipse(0.18, 0.1, 0.03 * k, 0.015 * k, 0, 0, Math.PI * 2); ctx.stroke();
        }
        break;
      }
      case 'split': {
        ctx.fillStyle = p.c1; ctx.fillRect(x0, y0, w, h);
        ctx.fillStyle = p.c2;
        ctx.beginPath();
        ctx.moveTo(x0 + w * 0.32, y1); ctx.lineTo(x1 - w * 0.22, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = p.accent; ctx.lineWidth = 0.03;
        ctx.beginPath(); ctx.moveTo(x0 + w * 0.26, y1); ctx.lineTo(x1 - w * 0.28, y0); ctx.stroke();
        break;
      }
      case 'geo': {
        const cols = 6, rows = 5, cw = w / cols, ch = h / rows;
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const x = x0 + i * cw, y = y0 + j * ch;
            ctx.fillStyle = mix(p.c1, p.c2, R());
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cw, y); ctx.lineTo(x, y + ch); ctx.closePath(); ctx.fill();
            ctx.fillStyle = mix(p.c1, p.c2, R());
            ctx.beginPath(); ctx.moveTo(x + cw, y); ctx.lineTo(x + cw, y + ch); ctx.lineTo(x, y + ch); ctx.closePath(); ctx.fill();
          }
        }
        ctx.strokeStyle = rgba(p.accent, 0.3); ctx.lineWidth = 0.006;
        for (let i = 0; i <= cols; i++) { ctx.beginPath(); ctx.moveTo(x0 + i * cw, y0); ctx.lineTo(x0 + i * cw, y1); ctx.stroke(); }
        break;
      }
      case 'camo': {
        ctx.fillStyle = p.c1; ctx.fillRect(x0, y0, w, h);
        for (let i = 0; i < 22; i++) {
          ctx.fillStyle = i % 3 === 0 ? p.accent : p.c2;
          ctx.beginPath();
          ctx.ellipse(x0 + R() * w, y0 + R() * h, 0.05 + R() * 0.1, 0.03 + R() * 0.06, R() * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'stripes': {
        ctx.fillStyle = p.c1; ctx.fillRect(x0, y0, w, h);
        ctx.save();
        ctx.rotate(-0.6);
        for (let x = -1.2; x < 1.2; x += 0.2) {
          ctx.fillStyle = p.c2; ctx.fillRect(x, -1, 0.08, 2);
          ctx.fillStyle = p.accent; ctx.fillRect(x + 0.1, -1, 0.016, 2);
        }
        ctx.restore();
        break;
      }
      case 'rings': {
        const g = ctx.createRadialGradient(0.1, 0, 0.02, 0.1, 0, 0.7);
        g.addColorStop(0, p.c2); g.addColorStop(1, p.c1);
        ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);
        for (let k = 1; k <= 6; k++) {
          ctx.strokeStyle = rgba(p.accent, 0.9 - k * 0.12);
          ctx.lineWidth = 0.022 - k * 0.002;
          ctx.beginPath(); ctx.arc(0.1, 0, k * 0.075, 0, Math.PI * 2); ctx.stroke();
        }
        break;
      }
      default: { // gradient
        ctx.fillStyle = lin(p.c1, p.c2); ctx.fillRect(x0, y0, w, h);
        ctx.strokeStyle = rgba(p.accent, 0.6); ctx.lineWidth = 0.015;
        ctx.beginPath(); ctx.moveTo(x0, y0 + h * 0.8); ctx.lineTo(x1, y0 + h * 0.15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x0, y0 + h * 0.9); ctx.lineTo(x1, y0 + h * 0.25); ctx.stroke();
      }
    }

    // Surface sheen for a real, slightly glossy finish
    const sg = ctx.createLinearGradient(x0, y0, x1, y1);
    sg.addColorStop(0, 'rgba(255,255,255,0.22)');
    sg.addColorStop(0.45, 'rgba(255,255,255,0)');
    sg.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = sg;
    ctx.fillRect(x0, y0, w, h);
  }

  // Draws a paddle at the current origin. scale = pixels per unit (face ~1 unit long).
  function drawPaddle(ctx, p, scale, logo = true) {
    const sh = SHAPES[p.shape] || SHAPES.standard;
    ctx.save();
    ctx.scale(scale, scale);

    // Handle with grip wrap and butt cap
    const hx0 = -sh.L / 2 - HANDLE.len, hw = HANDLE.w;
    ctx.fillStyle = p.grip;
    ctx.beginPath();
    ctx.moveTo(hx0 + 0.04, -hw / 2);
    ctx.lineTo(-sh.L / 2 + 0.06, -hw / 2 * 0.85);
    ctx.lineTo(-sh.L / 2 + 0.06, hw / 2 * 0.85);
    ctx.lineTo(hx0 + 0.04, hw / 2);
    ctx.quadraticCurveTo(hx0, hw / 2, hx0, 0);
    ctx.quadraticCurveTo(hx0, -hw / 2, hx0 + 0.04, -hw / 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.13)';
    ctx.lineWidth = 0.014;
    for (let x = hx0 + 0.05; x < -sh.L / 2; x += 0.05) {
      ctx.beginPath(); ctx.moveTo(x, -hw / 2); ctx.lineTo(x + 0.04, hw / 2); ctx.stroke();
    }
    ctx.fillStyle = shade(p.grip, -0.35);
    ctx.beginPath(); ctx.ellipse(hx0 + 0.015, 0, 0.03, hw * 0.62, 0, 0, Math.PI * 2); ctx.fill();

    // Face
    ctx.save();
    facePath(ctx, sh);
    ctx.clip();
    paintPattern(ctx, p, sh);
    ctx.restore();

    // Edge guard
    facePath(ctx, sh);
    ctx.lineWidth = 0.045;
    ctx.strokeStyle = p.edge;
    ctx.stroke();
    ctx.restore();

    // Brand mark along the face
    if (logo && scale >= 50) {
      ctx.save();
      ctx.font = `900 ${Math.round(scale * 0.13)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = rgba(p.accent, 0.92);
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = scale * 0.02;
      ctx.fillText(p.brand, scale * 0.04, 0);
      ctx.restore();
    }
  }

  // Cached small images of each paddle for the court (drawn every frame)
  const spriteCache = new Map();
  function paddleSprite(id, scale) {
    const key = id + '@' + scale;
    if (spriteCache.has(key)) return spriteCache.get(key);
    const p = paddleById(id);
    const sh = SHAPES[p.shape] || SHAPES.standard;
    const k = 3; // render at 3x for crisp edges on high-DPI screens
    const pad = 0.06;
    const wU = sh.L + HANDLE.len + pad * 2, hU = sh.W + pad * 2;
    const c = document.createElement('canvas');
    c.width = Math.ceil(wU * scale * k);
    c.height = Math.ceil(hU * scale * k);
    const g = c.getContext('2d');
    const ox = (pad + HANDLE.len + sh.L / 2) * scale; // face centre from the left edge (display px)
    g.scale(k, k);
    g.translate(ox, (hU / 2) * scale);
    drawPaddle(g, p, scale, false);
    const sprite = { img: c, ox, w: wU * scale, h: hU * scale };
    spriteCache.set(key, sprite);
    return sprite;
  }

  // =====================================================================
  //  Avatar portrait (front view, natural 2D illustration)
  //  Drawn on a 200 x 220 design grid, scaled to fit.
  // =====================================================================
  function drawPortrait(ctx, a, W, H) {
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    ctx.scale(W / 200, H / 220);
    const skin = a.skin, hair = a.hairColor;
    const skinL = shade(skin, 0.14), skinD = shade(skin, -0.18), skinDD = shade(skin, -0.32);

    // Backdrop
    const bg = ctx.createRadialGradient(100, 80, 10, 100, 110, 160);
    bg.addColorStop(0, '#3b5a7a'); bg.addColorStop(1, '#16222f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 200, 220);

    // ---- Hair behind the head ----
    ctx.fillStyle = shade(hair, -0.12);
    if (a.hair === 'long') {
      ctx.beginPath();
      ctx.moveTo(58, 72);
      ctx.bezierCurveTo(46, 120, 44, 160, 52, 192);
      ctx.lineTo(148, 192);
      ctx.bezierCurveTo(156, 160, 154, 120, 142, 72);
      ctx.closePath();
      ctx.fill();
    } else if (a.hair === 'ponytail') {
      ctx.beginPath();
      ctx.moveTo(128, 70);
      ctx.bezierCurveTo(160, 84, 162, 130, 150, 168);
      ctx.bezierCurveTo(146, 150, 138, 112, 126, 92);
      ctx.closePath();
      ctx.fill();
    } else if (a.hair === 'bun' && a.headwear !== 'cap') {
      ctx.beginPath(); ctx.arc(100, 30, 17, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgba(shade(hair, -0.4), 0.5); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(100, 30, 11, 0.4, 2.6); ctx.stroke();
    }

    // ---- Torso & shirt (style, colour, trim; narrower shoulders for women) ----
    const fem = a.gender === 'female';
    const shirt = a.shirt, trim = a.shirtAccent || '#f5f5f2';
    const style = a.shirtStyle || 'polo';
    const sw = fem ? 0.84 : 1;
    const X = (x) => 100 + (x - 100) * sw;
    const torsoPath = () => {
      ctx.beginPath();
      ctx.moveTo(X(82), 146);
      ctx.bezierCurveTo(X(56), 150, X(30), 156, X(18), 176);
      ctx.bezierCurveTo(X(10), 190, X(8), 206, X(8), 220);
      ctx.lineTo(X(192), 220);
      ctx.bezierCurveTo(X(192), 206, X(190), 190, X(182), 176);
      ctx.bezierCurveTo(X(170), 156, X(144), 150, X(118), 146);
      ctx.closePath();
    };
    const vfill = (c) => { const g = ctx.createLinearGradient(0, 145, 0, 220); g.addColorStop(0, shade(c, 0.08)); g.addColorStop(1, shade(c, -0.22)); return g; };

    if (style === 'tank') {
      ctx.fillStyle = vfill(skin); // bare shoulders
      torsoPath(); ctx.fill();
      ctx.fillStyle = vfill(shirt);
      ctx.beginPath();
      ctx.moveTo(X(70), 147); ctx.lineTo(X(86), 147);
      ctx.quadraticCurveTo(100, 176, X(114), 147);
      ctx.lineTo(X(130), 147);
      ctx.quadraticCurveTo(X(134), 180, X(152), 192);
      ctx.lineTo(X(158), 220); ctx.lineTo(X(42), 220); ctx.lineTo(X(48), 192);
      ctx.quadraticCurveTo(X(66), 180, X(70), 147);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = trim; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X(86), 147); ctx.quadraticCurveTo(100, 176, X(114), 147); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X(70), 147); ctx.quadraticCurveTo(X(66), 180, X(48), 192); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X(130), 147); ctx.quadraticCurveTo(X(134), 180, X(152), 192); ctx.stroke();
    } else {
      ctx.fillStyle = vfill(shirt);
      torsoPath(); ctx.fill();
      if (style === 'raglan') { // contrasting sleeves with diagonal seams
        ctx.fillStyle = vfill(trim);
        for (const sgn of [-1, 1]) {
          const P = (x) => 100 + sgn * (100 - x) * -1 * sw;
          ctx.beginPath();
          ctx.moveTo(P(84), 147);
          ctx.bezierCurveTo(P(56), 150, P(30), 156, P(18), 176);
          ctx.bezierCurveTo(P(10), 190, P(8), 206, P(8), 220);
          ctx.lineTo(P(40), 220);
          ctx.lineTo(P(56), 194);
          ctx.closePath(); ctx.fill();
        }
      }
      // fabric folds
      ctx.strokeStyle = rgba(shade(shirt, -0.45), 0.25); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X(40), 196); ctx.quadraticCurveTo(X(52), 184, X(60), 170); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X(160), 196); ctx.quadraticCurveTo(X(148), 184, X(140), 170); ctx.stroke();
    }

    // ---- Neck ----
    const nW = fem ? 13 : 16;
    const ng = ctx.createLinearGradient(0, 124, 0, 160);
    ng.addColorStop(0, skinDD); ng.addColorStop(0.45, skinD); ng.addColorStop(1, skin);
    ctx.fillStyle = ng;
    ctx.beginPath();
    ctx.moveTo(100 - nW, 122); ctx.lineTo(100 - nW, 148);
    ctx.quadraticCurveTo(100, 172, 100 + nW, 148);
    ctx.lineTo(100 + nW, 122);
    ctx.closePath();
    ctx.fill();

    // ---- Neckline per shirt style ----
    if (style === 'polo') {
      ctx.fillStyle = trim;
      ctx.strokeStyle = rgba(shade(shirt, -0.5), 0.45); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(X(80), 144); ctx.lineTo(100, 166); ctx.lineTo(X(88), 170); ctx.lineTo(X(74), 152); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X(120), 144); ctx.lineTo(100, 166); ctx.lineTo(X(112), 170); ctx.lineTo(X(126), 152); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(100, 166); ctx.lineTo(100, 196); ctx.stroke();
      ctx.fillStyle = shade(shirt, 0.35);
      for (const y of [176, 188]) { ctx.beginPath(); ctx.arc(100, y, 1.8, 0, Math.PI * 2); ctx.fill(); }
    } else if (style === 'crew' || style === 'raglan') {
      ctx.fillStyle = vfill(style === 'raglan' ? shirt : shirt);
      ctx.beginPath(); ctx.moveTo(X(82), 146); ctx.quadraticCurveTo(100, 166, X(118), 146); ctx.lineTo(X(120), 152); ctx.lineTo(X(80), 152); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = skin;
      ctx.beginPath(); ctx.moveTo(100 - nW, 146); ctx.quadraticCurveTo(100, 160, 100 + nW, 146); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = trim; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(100 - nW - 2, 146); ctx.quadraticCurveTo(100, 162, 100 + nW + 2, 146); ctx.stroke();
    } else if (style === 'vneck') {
      ctx.strokeStyle = trim; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(100 - nW - 2, 146); ctx.lineTo(100, 170); ctx.lineTo(100 + nW + 2, 146); ctx.stroke();
    }

    // ---- Ears ----
    for (const s of [-1, 1]) {
      const ex = 100 + s * 38;
      ctx.fillStyle = skinD;
      ctx.beginPath(); ctx.ellipse(ex, 96, 6.5, 11, s * 0.15, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgba(skinDD, 0.7); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(ex + s * 0.5, 96, 3, 6.5, s * 0.15, -1.2, 1.6); ctx.stroke();
    }

    // ---- Face ----
    // A softer, narrower jaw and chin for female faces
    const J = fem ? 0.93 : 1;
    const jx = (x) => 100 + (x - 100) * J;
    const facePathFn = () => {
      ctx.beginPath();
      ctx.moveTo(100, 46);
      ctx.bezierCurveTo(126, 46, 138, 66, 137.5, 92);
      ctx.bezierCurveTo(137, 113, jx(128), 128, jx(113), fem ? 135 : 137);
      ctx.quadraticCurveTo(100, fem ? 141 : 144, jx(87), fem ? 135 : 137);
      ctx.bezierCurveTo(jx(72), 128, 63, 113, 62.5, 92);
      ctx.bezierCurveTo(62, 66, 74, 46, 100, 46);
      ctx.closePath();
    };
    const fg = ctx.createRadialGradient(92, 84, 8, 100, 96, 62);
    fg.addColorStop(0, skinL); fg.addColorStop(0.55, skin); fg.addColorStop(1, skinD);
    ctx.fillStyle = fg;
    facePathFn();
    ctx.fill();

    // cheek warmth
    for (const s of [-1, 1]) {
      const cg = ctx.createRadialGradient(100 + s * 22, 112, 1, 100 + s * 22, 112, 14);
      cg.addColorStop(0, `rgba(205,90,80,${fem ? 0.19 : 0.13})`); cg.addColorStop(1, 'rgba(205,90,80,0)');
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(100 + s * 22, 112, 14, 0, Math.PI * 2); ctx.fill();
    }

    // ---- Eyes ----
    for (const s of [-1, 1]) {
      const x = 100 + s * 16, y = 95;
      // socket shadow
      const sg = ctx.createRadialGradient(x, y - 2, 1, x, y - 2, 13);
      sg.addColorStop(0, rgba(skinDD, 0.18)); sg.addColorStop(1, rgba(skinDD, 0));
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(x, y - 2, 13, 0, Math.PI * 2); ctx.fill();
      // white
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x - 8, y + 0.5);
      ctx.quadraticCurveTo(x - 1, y - 6.2, x + 8, y);
      ctx.quadraticCurveTo(x + 1, y + 4.6, x - 8, y + 0.5);
      ctx.closePath();
      ctx.fillStyle = '#efeae4';
      ctx.fill();
      ctx.clip();
      // iris + pupil
      const ig = ctx.createRadialGradient(x, y - 0.5, 0.5, x, y - 0.5, 3.8);
      ig.addColorStop(0, shade(a.eyes, 0.25)); ig.addColorStop(1, shade(a.eyes, -0.35));
      ctx.fillStyle = ig;
      ctx.beginPath(); ctx.arc(x, y - 0.5, 3.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f0c0b';
      ctx.beginPath(); ctx.arc(x, y - 0.5, 1.7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(x + 1.2, y - 1.8, 0.9, 0, Math.PI * 2); ctx.fill();
      // upper-lid shadow on the eyeball
      ctx.fillStyle = 'rgba(60,35,25,0.18)';
      ctx.fillRect(x - 9, y - 7, 18, 3.4);
      ctx.restore();
      // lid line + crease (fuller lash line and a few lashes for female faces)
      ctx.strokeStyle = fem ? '#1f140e' : '#3a241a'; ctx.lineWidth = fem ? 2.2 : 1.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 8, y + 0.5); ctx.quadraticCurveTo(x - 1, y - 6.4, x + 8.2, y - 0.2); ctx.stroke();
      if (fem) {
        ctx.lineWidth = 1;
        const ox = x + s * 8;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath(); ctx.moveTo(ox - s * i * 1.6, y - 1.2 - i * 1.4); ctx.lineTo(ox + s * (2.4 - i * 0.6), y - 3.2 - i * 1.6); ctx.stroke();
        }
      }
      ctx.strokeStyle = rgba(skinDD, 0.55); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x - 6.5, y - 4.5); ctx.quadraticCurveTo(x, y - 9, x + 7, y - 4.2); ctx.stroke();
      // eyebrow (tapered)
      const browC = a.hair === 'bald' ? shade(hair, -0.1) : shade(hair, -0.05);
      ctx.fillStyle = browC;
      ctx.beginPath();
      const inner = x - s * 9, outer = x + s * 9.5;
      ctx.moveTo(inner, y - 10);
      ctx.quadraticCurveTo(x, fem ? y - 17 : y - 15.5, outer, y - 11.5);
      ctx.quadraticCurveTo(x, fem ? y - 15 : y - 13, inner, fem ? y - 8.8 : y - 7.8); // slimmer, higher arch
      ctx.closePath();
      ctx.fill();
    }

    // ---- Nose ----
    ctx.strokeStyle = rgba(skinDD, 0.45); ctx.lineWidth = 1.3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(96.5, 100); ctx.quadraticCurveTo(94, 110, 93.5, 116); ctx.stroke();
    const nh = ctx.createRadialGradient(100, 114, 0.5, 100, 114, 6);
    nh.addColorStop(0, rgba(skinL, 0.7)); nh.addColorStop(1, rgba(skinL, 0));
    ctx.fillStyle = nh; ctx.beginPath(); ctx.arc(100, 114, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rgba(skinDD, 0.55);
    ctx.beginPath(); ctx.ellipse(95.8, 119, 2.2, 1.2, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(104.2, 119, 2.2, 1.2, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgba(skinDD, 0.4); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(93, 117, 3.2, 1.6, 3.6); ctx.stroke();
    ctx.beginPath(); ctx.arc(107, 117, 3.2, -0.45, 1.55); ctx.stroke();

    // ---- Mouth ----
    const lip = fem ? mix(skin, '#b23a48', 0.58) : mix(skin, '#a8433f', 0.42);
    ctx.fillStyle = shade(lip, -0.08);
    ctx.beginPath();
    ctx.moveTo(90, 128.5);
    ctx.quadraticCurveTo(95, 125, 100, 126.6);
    ctx.quadraticCurveTo(105, 125, 110, 128.5);
    ctx.quadraticCurveTo(100, 129.8, 90, 128.5);
    ctx.fill();
    ctx.fillStyle = lip;
    ctx.beginPath();
    ctx.moveTo(91, 128.8);
    ctx.quadraticCurveTo(100, fem ? 137 : 135.5, 109, 128.8);
    ctx.quadraticCurveTo(100, 130.2, 91, 128.8);
    ctx.fill();
    ctx.strokeStyle = rgba(shade(lip, -0.5), 0.7); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(89.5, 128.3); ctx.quadraticCurveTo(100, 130.6, 110.5, 128.3); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.ellipse(100, 131.4, 4, 1, 0, 0, Math.PI * 2); ctx.fill();

    // ---- Facial hair ----
    if (a.facial !== 'none') {
      ctx.save();
      facePathFn();
      ctx.clip();
      if (a.facial === 'stubble') {
        // A soft five-o'clock shadow on the jaw, chin and upper lip only
        const shadowArea = () => {
          ctx.beginPath();
          ctx.moveTo(66, 112);
          ctx.bezierCurveTo(70, 130, 86, 146, 100, 146);
          ctx.bezierCurveTo(114, 146, 130, 130, 134, 112);
          ctx.quadraticCurveTo(124, 124, 112, 125);
          ctx.quadraticCurveTo(100, 121, 88, 125);
          ctx.quadraticCurveTo(76, 124, 66, 112);
          ctx.closePath();
        };
        const sg2 = ctx.createLinearGradient(0, 112, 0, 146);
        sg2.addColorStop(0, rgba(hair, 0.05)); sg2.addColorStop(1, rgba(hair, 0.28));
        ctx.fillStyle = sg2;
        shadowArea(); ctx.fill();
        ctx.fillStyle = rgba(hair, 0.16); // upper lip
        ctx.beginPath(); ctx.ellipse(100, 123.5, 10, 2.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.save();
        shadowArea(); ctx.clip();
        const R = seeded('stubble');
        ctx.fillStyle = rgba(shade(hair, -0.2), 0.32);
        for (let i = 0; i < 520; i++) ctx.fillRect(66 + R() * 68, 112 + R() * 34, 0.45, 0.45);
        ctx.restore();
      }
      if (a.facial === 'beard') {
        const bgd = ctx.createLinearGradient(0, 110, 0, 146);
        bgd.addColorStop(0, rgba(hair, 0.75)); bgd.addColorStop(1, rgba(shade(hair, -0.2), 0.95));
        ctx.fillStyle = bgd;
        ctx.beginPath();
        ctx.moveTo(63, 98); ctx.bezierCurveTo(64, 126, 82, 148, 100, 148);
        ctx.bezierCurveTo(118, 148, 136, 126, 137, 98);
        ctx.lineTo(133, 110); ctx.quadraticCurveTo(122, 124, 110, 132);
        ctx.quadraticCurveTo(100, 137, 90, 132); ctx.quadraticCurveTo(78, 124, 67, 110);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = rgba(shade(hair, 0.2), 0.25); ctx.lineWidth = 0.8;
        const R2 = seeded('beard');
        for (let i = 0; i < 70; i++) {
          const x = 68 + R2() * 64, y = 112 + R2() * 32;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (R2() - 0.5) * 2, y + 3); ctx.stroke();
        }
      }
      if (a.facial === 'mustache' || a.facial === 'beard') {
        ctx.fillStyle = shade(hair, -0.05);
        ctx.beginPath();
        ctx.moveTo(88, 128); ctx.quadraticCurveTo(92, 120.5, 100, 122.5);
        ctx.quadraticCurveTo(108, 120.5, 112, 128);
        ctx.quadraticCurveTo(106, 125, 100, 126); ctx.quadraticCurveTo(94, 125, 88, 128);
        ctx.fill();
      }
      ctx.restore();
      // redraw the lower lip over a beard so the mouth reads clearly
      if (a.facial === 'beard') {
        ctx.fillStyle = lip;
        ctx.beginPath(); ctx.moveTo(92, 129); ctx.quadraticCurveTo(100, 134.5, 108, 129); ctx.quadraticCurveTo(100, 130.2, 92, 129); ctx.fill();
      }
    }

    // ---- Hair (front) ----
    const capPath = (top = 34) => {
      ctx.beginPath();
      ctx.moveTo(60, 98);
      ctx.bezierCurveTo(55, 54, 78, top, 100, top);
      ctx.bezierCurveTo(122, top, 145, 54, 140, 98);
      ctx.bezierCurveTo(137, 80, 130, 66, 114, 61);
      ctx.quadraticCurveTo(100, 57, 86, 61);
      ctx.bezierCurveTo(70, 66, 63, 80, 60, 98);
      ctx.closePath();
    };
    const hairFill = () => {
      const hg = ctx.createLinearGradient(0, 30, 0, 100);
      hg.addColorStop(0, shade(hair, 0.18)); hg.addColorStop(0.5, hair); hg.addColorStop(1, shade(hair, -0.15));
      return hg;
    };
    const strands = (n, seed) => {
      const R = seeded(seed);
      ctx.strokeStyle = rgba(shade(hair, 0.3), 0.22); ctx.lineWidth = 0.9;
      for (let i = 0; i < n; i++) {
        const x = 68 + R() * 64;
        ctx.beginPath(); ctx.moveTo(x, 40 + R() * 6); ctx.quadraticCurveTo(x + (R() - 0.5) * 14, 52, x + (R() - 0.5) * 20, 62 + R() * 10); ctx.stroke();
      }
    };

    switch (a.hair) {
      case 'buzz':
        ctx.fillStyle = rgba(hair, 0.62);
        capPath(40); ctx.fill();
        break;
      case 'curly': {
        ctx.fillStyle = hairFill(); capPath(32); ctx.fill();
        const R = seeded('curls');
        for (let i = 0; i < 26; i++) {
          const t = i / 25;
          const ang = Math.PI * (1.05 + t * 0.9);
          const x = 100 + Math.cos(ang) * (40 + R() * 4), y = 76 + Math.sin(ang) * (42 + R() * 4);
          ctx.fillStyle = shade(hair, (R() - 0.5) * 0.25);
          ctx.beginPath(); ctx.arc(x, y, 6.5 + R() * 3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.strokeStyle = rgba(shade(hair, 0.35), 0.25); ctx.lineWidth = 1;
        for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.arc(70 + R() * 60, 40 + R() * 22, 3 + R() * 2, 0, 4); ctx.stroke(); }
        break;
      }
      case 'long':
        ctx.fillStyle = hairFill(); capPath(33); ctx.fill();
        // locks framing the face
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(100 + s * 40, 70);
          ctx.bezierCurveTo(100 + s * 46, 110, 100 + s * 44, 150, 100 + s * 50, 178);
          ctx.lineTo(100 + s * 36, 176);
          ctx.bezierCurveTo(100 + s * 38, 140, 100 + s * 40, 110, 100 + s * 34, 74);
          ctx.closePath(); ctx.fill();
        }
        strands(22, 'long');
        break;
      case 'bald': {
        ctx.fillStyle = rgba(hair, 0.45);
        for (const s of [-1, 1]) {
          ctx.beginPath(); ctx.ellipse(100 + s * 35, 86, 4.5, 13, s * 0.2, 0, Math.PI * 2); ctx.fill();
        }
        const sh = ctx.createRadialGradient(94, 58, 1, 94, 58, 16);
        sh.addColorStop(0, 'rgba(255,255,255,0.28)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(94, 58, 16, 0, Math.PI * 2); ctx.fill();
        break;
      }
      default: // short, ponytail, bun
        ctx.fillStyle = hairFill(); capPath(a.hair === 'short' ? 31 : 35); ctx.fill();
        strands(a.hair === 'short' ? 16 : 12, a.hair);
        if (a.hair === 'short') { // side part
          ctx.strokeStyle = rgba(shade(hair, -0.4), 0.5); ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.moveTo(84, 38); ctx.quadraticCurveTo(82, 50, 84, 60); ctx.stroke();
        }
    }

    // ---- Headwear ----
    const hat = a.hatColor;
    if (a.headwear === 'cap') {
      const cg = ctx.createLinearGradient(0, 24, 0, 84);
      cg.addColorStop(0, shade(hat, 0.15)); cg.addColorStop(1, shade(hat, -0.12));
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.moveTo(59, 82);
      ctx.bezierCurveTo(56, 40, 80, 24, 100, 24);
      ctx.bezierCurveTo(120, 24, 144, 40, 141, 82);
      ctx.quadraticCurveTo(100, 72, 59, 82);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba(shade(hat, -0.4), 0.45); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(100, 25); ctx.quadraticCurveTo(98, 52, 100, 75); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(100, 25); ctx.quadraticCurveTo(80, 44, 72, 79); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(100, 25); ctx.quadraticCurveTo(120, 44, 128, 79); ctx.stroke();
      ctx.fillStyle = shade(hat, -0.2);
      ctx.beginPath(); ctx.arc(100, 26, 3, 0, Math.PI * 2); ctx.fill();
      // brim seen from the front
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath(); ctx.ellipse(100, 86, 40, 6, 0, 0, Math.PI * 2); ctx.fill();
      const bg2 = ctx.createLinearGradient(0, 74, 0, 90);
      bg2.addColorStop(0, shade(hat, 0.05)); bg2.addColorStop(1, shade(hat, -0.3));
      ctx.fillStyle = bg2;
      ctx.beginPath();
      ctx.moveTo(56, 82); ctx.quadraticCurveTo(100, 70, 144, 82);
      ctx.quadraticCurveTo(100, 94, 56, 82);
      ctx.fill();
    } else if (a.headwear === 'visor') {
      ctx.fillStyle = hat;
      ctx.beginPath();
      ctx.moveTo(60, 74); ctx.quadraticCurveTo(100, 58, 140, 74);
      ctx.lineTo(140, 82); ctx.quadraticCurveTo(100, 67, 60, 82);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath(); ctx.ellipse(100, 86, 38, 5.5, 0, 0, Math.PI * 2); ctx.fill();
      const vg = ctx.createLinearGradient(0, 72, 0, 90);
      vg.addColorStop(0, shade(hat, 0.05)); vg.addColorStop(1, shade(hat, -0.3));
      ctx.fillStyle = vg;
      ctx.beginPath(); ctx.moveTo(58, 80); ctx.quadraticCurveTo(100, 69, 142, 80); ctx.quadraticCurveTo(100, 93, 58, 80); ctx.fill();
    } else if (a.headwear === 'headband') {
      ctx.fillStyle = hat;
      ctx.beginPath();
      ctx.moveTo(61, 70); ctx.quadraticCurveTo(100, 52, 139, 70);
      ctx.lineTo(139.5, 80); ctx.quadraticCurveTo(100, 62, 60.5, 80);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba(shade(hat, -0.35), 0.35); ctx.lineWidth = 0.8;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(62, 72 + i * 3); ctx.quadraticCurveTo(100, 55 + i * 3, 138, 72 + i * 3); ctx.stroke();
      }
    }

    ctx.restore();
  }

  // =====================================================================
  //  Full-body preview (front view) — shows the whole outfit
  //  Drawn on a 120 x 260 design grid.
  // =====================================================================
  function drawBodyPreview(ctx, a, paddle, W, H) {
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    ctx.scale(W / 120, H / 260);
    const fem = a.gender === 'female';
    const skin = a.skin, shirt = a.shirt, trim = a.shirtAccent || '#f5f5f2';
    const style = a.shirtStyle || 'polo', sStyle = a.shortsStyle || 'classic';
    const shoe = SHOES[a.shoes] || SHOES.white;
    const cx = 60;
    const shW = fem ? 20 : 25, waistW = fem ? 13 : 16, hipW = fem ? 18 : 16.5;
    const yNeck = 74, ySh = 84, yWaist = 138, yKnee = 196, yAnkle = 238;

    // backdrop + floor
    const bg = ctx.createLinearGradient(0, 0, 0, 260);
    bg.addColorStop(0, '#2a3c55'); bg.addColorStop(1, '#121b27');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 120, 260);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(cx, 246, 32, 6, 0, 0, Math.PI * 2); ctx.fill();

    const limb = (x0, y0, x1, y1, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };

    // ---- legs, knee guards, socks, shoes ----
    for (const side of [-1, 1]) {
      const hx = cx + side * 8, kx = cx + side * 10, fx = cx + side * 11;
      limb(hx, yWaist + 12, kx, yKnee, fem ? 10.5 : 11.5, shade(skin, -0.02));
      limb(kx, yKnee, fx, yAnkle - 6, fem ? 8 : 8.5, shade(skin, -0.08));
      if (a.kneeGuard && a.kneeGuard !== 'none') {
        ctx.fillStyle = a.kneeGuard;
        ctx.beginPath(); ctx.ellipse(kx, yKnee, 6.8, 8.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(kx - 5, yKnee - 4); ctx.lineTo(kx + 5, yKnee - 4); ctx.stroke();
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(fx - 4.5, yAnkle - 14, 9, 9);
      ctx.fillStyle = shoe.upper;
      ctx.beginPath(); ctx.ellipse(fx + side * 1.5, yAnkle - 2, 8.5, 5.5, 0, Math.PI, 0); ctx.lineTo(fx + side * 1.5 + 8.5, yAnkle + 2); ctx.lineTo(fx + side * 1.5 - 8.5, yAnkle + 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shoe.sole;
      ctx.fillRect(fx + side * 1.5 - 9, yAnkle + 1.5, 18, 3);
      ctx.strokeStyle = shoe.accent; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(fx + side * 1.5 - 5, yAnkle - 1); ctx.quadraticCurveTo(fx + side * 1.5, yAnkle - 4, fx + side * 1.5 + 5, yAnkle - 1); ctx.stroke();
    }

    // ---- shorts ----
    const sc = a.shortsColor || '#1f2a44';
    const sg = ctx.createLinearGradient(cx - hipW, 0, cx + hipW, 0);
    sg.addColorStop(0, shade(sc, 0.1)); sg.addColorStop(1, shade(sc, -0.2));
    ctx.fillStyle = sg;
    ctx.beginPath();
    if (sStyle === 'skort') {
      ctx.moveTo(cx - hipW, yWaist); ctx.lineTo(cx + hipW, yWaist);
      ctx.lineTo(cx + hipW + 8, yWaist + 36); ctx.quadraticCurveTo(cx, yWaist + 40, cx - hipW - 8, yWaist + 36);
    } else {
      const yEnd = sStyle === 'long' ? 188 : sStyle === 'compression' ? 162 : 172;
      const flare = sStyle === 'compression' ? -1.5 : sStyle === 'long' ? 0.5 : 2;
      ctx.moveTo(cx - hipW, yWaist); ctx.lineTo(cx + hipW, yWaist);
      ctx.lineTo(cx + hipW + flare + 1, yEnd); ctx.lineTo(cx + 1.5, yEnd);
      ctx.lineTo(cx, yWaist + 18);
      ctx.lineTo(cx - 1.5, yEnd); ctx.lineTo(cx - hipW - flare - 1, yEnd);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(sc, -0.25);
    ctx.fillRect(cx - hipW, yWaist - 1, hipW * 2, 5); // waistband

    // ---- arms (behind the torso edges) ----
    const armC = style === 'raglan' ? trim : shirt;
    const arm = (side, el, hd) => {
      const sx = cx + side * (shW - 3), sy = ySh + 5;
      limb(sx, sy, el[0], el[1], fem ? 7.5 : 8.5, shade(skin, -0.02));
      limb(el[0], el[1], hd[0], hd[1], fem ? 6.5 : 7.5, shade(skin, -0.07));
      if (a.elbowGuard && a.elbowGuard !== 'none') {
        ctx.fillStyle = a.elbowGuard;
        ctx.beginPath(); ctx.ellipse(el[0], el[1], 5.2, 6.5, 0, 0, Math.PI * 2); ctx.fill();
      }
      if (style !== 'tank') { // short sleeve with trim
        const k = 0.42, ex = sx + (el[0] - sx) * k, ey = sy + (el[1] - sy) * k;
        limb(sx, sy, ex, ey, fem ? 11 : 12.5, armC);
        if (style !== 'raglan') limb(ex - (el[0] - sx) * 0.05, ey - (el[1] - sy) * 0.05, ex, ey, fem ? 11 : 12.5, trim);
      }
      ctx.fillStyle = skin;
      ctx.beginPath(); ctx.ellipse(hd[0], hd[1] + 2, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
    };
    // paddle hand on the screen's left (their right hand)
    const pel = [cx - shW - 6, ySh + 30], phd = [cx - shW - 2, ySh + 52];
    arm(-1, pel, phd);
    arm(1, [cx + shW + 4, ySh + 30], [cx + shW + 2, ySh + 54]);
    if (paddle) {
      ctx.save();
      const ang = Math.atan2(0.95, -0.3); // pointing down and slightly out
      ctx.translate(phd[0] + Math.cos(ang) * 16, phd[1] + Math.sin(ang) * 16);
      ctx.rotate(ang);
      drawPaddle(ctx, paddle, 22, false);
      ctx.restore();
      ctx.fillStyle = skin;
      ctx.beginPath(); ctx.ellipse(phd[0], phd[1] + 2, 4.2, 5, 0, 0, Math.PI * 2); ctx.fill();
    }

    // ---- torso / shirt ----
    const tg = ctx.createLinearGradient(cx - shW, 0, cx + shW, 0);
    tg.addColorStop(0, shade(shirt, 0.12)); tg.addColorStop(1, shade(shirt, -0.22));
    if (style === 'tank') { // bare shoulders under the straps
      ctx.fillStyle = shade(skin, -0.02);
      ctx.beginPath(); ctx.ellipse(cx, ySh + 6, shW, 9, 0, Math.PI, 0); ctx.fill();
    }
    ctx.fillStyle = tg;
    ctx.beginPath();
    if (style === 'tank') {
      ctx.moveTo(cx - waistW - 1, yWaist + 2);
      ctx.lineTo(cx - shW + 5, ySh + 14);
      ctx.lineTo(cx - shW + 8, ySh);
      ctx.lineTo(cx - 6, ySh);
      ctx.quadraticCurveTo(cx, ySh + 12, cx + 6, ySh);
      ctx.lineTo(cx + shW - 8, ySh);
      ctx.lineTo(cx + shW - 5, ySh + 14);
      ctx.lineTo(cx + waistW + 1, yWaist + 2);
    } else {
      ctx.moveTo(cx - waistW, yWaist + 2);
      ctx.quadraticCurveTo(cx - shW + 2, ySh + 30, cx - shW, ySh + 8);
      ctx.quadraticCurveTo(cx - shW, ySh, cx - shW + 7, ySh - 1);
      ctx.lineTo(cx + shW - 7, ySh - 1);
      ctx.quadraticCurveTo(cx + shW, ySh, cx + shW, ySh + 8);
      ctx.quadraticCurveTo(cx + shW - 2, ySh + 30, cx + waistW, yWaist + 2);
    }
    ctx.closePath(); ctx.fill();
    if (style === 'raglan') { // contrasting sleeve panels from the collar
      ctx.fillStyle = trim;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + side * 6, ySh - 1);
        ctx.lineTo(cx + side * (shW - 7), ySh - 1);
        ctx.quadraticCurveTo(cx + side * shW, ySh, cx + side * shW, ySh + 8);
        ctx.lineTo(cx + side * (shW - 4), ySh + 20);
        ctx.closePath(); ctx.fill();
      }
    }
    // neck
    ctx.fillStyle = shade(skin, -0.1);
    ctx.fillRect(cx - (fem ? 4.5 : 5.5), yNeck - 4, fem ? 9 : 11, ySh - yNeck + 6);
    // neckline
    ctx.lineWidth = 2;
    ctx.strokeStyle = trim;
    if (style === 'polo') {
      ctx.fillStyle = trim;
      ctx.beginPath(); ctx.moveTo(cx - 8, ySh - 1); ctx.lineTo(cx, ySh + 8); ctx.lineTo(cx - 4, ySh + 10); ctx.lineTo(cx - 10, ySh + 3); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + 8, ySh - 1); ctx.lineTo(cx, ySh + 8); ctx.lineTo(cx + 4, ySh + 10); ctx.lineTo(cx + 10, ySh + 3); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba(shade(shirt, -0.5), 0.5); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, ySh + 8); ctx.lineTo(cx, ySh + 22); ctx.stroke();
    } else if (style === 'vneck') {
      ctx.fillStyle = shade(skin, -0.06);
      ctx.beginPath(); ctx.moveTo(cx - 6, ySh - 1); ctx.lineTo(cx, ySh + 10); ctx.lineTo(cx + 6, ySh - 1); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx - 7, ySh - 1); ctx.lineTo(cx, ySh + 11); ctx.lineTo(cx + 7, ySh - 1); ctx.stroke();
    } else if (style !== 'tank') {
      ctx.beginPath(); ctx.moveTo(cx - 7, ySh - 1); ctx.quadraticCurveTo(cx, ySh + 6, cx + 7, ySh - 1); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(cx - 6, ySh); ctx.quadraticCurveTo(cx, ySh + 12, cx + 6, ySh); ctx.stroke();
    }
    // head
    drawHeadBillboard(ctx, a, cx, yNeck - 14, 14.5, 'front', 0, false);
    ctx.restore();
  }

  // =====================================================================
  //  Head seen from above (for the court)
  //  fwd = -1 when facing up the screen, +1 when facing down.
  // =====================================================================
  function drawHeadTop(ctx, a, X, Y, S, fwd, phase = 0) {
    const skin = a.skin, hair = a.hairColor;
    const back = -fwd; // direction toward the back of the head

    // Long hair falls over the back of the shoulders
    if (a.hair === 'long') {
      ctx.fillStyle = shade(hair, -0.08);
      ctx.beginPath(); ctx.ellipse(X, Y + back * S * 0.42, S * 0.42, S * 0.36, 0, 0, Math.PI * 2); ctx.fill();
    }
    // Ponytail swings as they move
    if (a.hair === 'ponytail') {
      const sway = Math.sin(phase * 1.5) * S * 0.12;
      ctx.fillStyle = shade(hair, -0.05);
      ctx.beginPath();
      ctx.ellipse(X + sway, Y + back * S * 0.62, S * 0.14, S * 0.3, sway / S, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ears
    ctx.fillStyle = shade(skin, -0.12);
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(X + s * S * 0.4, Y + fwd * S * 0.02, S * 0.08, S * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    }

    // Head (skin) with soft light from the top-left
    const hg = ctx.createRadialGradient(X - S * 0.12, Y - S * 0.12, S * 0.05, X, Y, S * 0.45);
    hg.addColorStop(0, shade(skin, 0.12)); hg.addColorStop(1, shade(skin, -0.18));
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.arc(X, Y, S * 0.4, 0, Math.PI * 2); ctx.fill();

    // Hair from above (a hairline leaves a little forehead visible at the front)
    const hairG = ctx.createRadialGradient(X - S * 0.1, Y - S * 0.1, S * 0.03, X, Y, S * 0.46);
    hairG.addColorStop(0, shade(hair, 0.2)); hairG.addColorStop(1, shade(hair, -0.12));
    switch (a.hair) {
      case 'bald': {
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.beginPath(); ctx.ellipse(X - S * 0.1, Y - S * 0.1, S * 0.14, S * 0.09, -0.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = rgba(hair, 0.4);
        ctx.beginPath(); ctx.arc(X, Y + back * S * 0.1, S * 0.36, back > 0 ? 0.2 : Math.PI + 0.2, back > 0 ? Math.PI - 0.2 : -0.2); ctx.fill();
        break;
      }
      case 'buzz':
        ctx.fillStyle = rgba(hair, 0.72);
        ctx.beginPath(); ctx.arc(X, Y + back * S * 0.05, S * 0.37, 0, Math.PI * 2); ctx.fill();
        break;
      default: {
        ctx.fillStyle = hairG;
        ctx.beginPath(); ctx.arc(X, Y + back * S * 0.07, S * 0.41, 0, Math.PI * 2); ctx.fill();
        if (a.hair === 'curly') {
          ctx.fillStyle = shade(hair, -0.05);
          for (let i = 0; i < 10; i++) {
            const ang = (i / 10) * Math.PI * 2;
            ctx.beginPath(); ctx.arc(X + Math.cos(ang) * S * 0.36, Y + back * S * 0.07 + Math.sin(ang) * S * 0.36, S * 0.11, 0, Math.PI * 2); ctx.fill();
          }
        } else {
          ctx.strokeStyle = rgba(shade(hair, 0.35), 0.3); ctx.lineWidth = 1;
          for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(X + i * S * 0.08, Y + fwd * S * 0.25);
            ctx.quadraticCurveTo(X + i * S * 0.1, Y, X + i * S * 0.12, Y + back * S * 0.35);
            ctx.stroke();
          }
        }
        if (a.hair === 'bun' && a.headwear !== 'cap') {
          ctx.fillStyle = shade(hair, -0.1);
          ctx.beginPath(); ctx.arc(X, Y + back * S * 0.3, S * 0.17, 0, Math.PI * 2); ctx.fill();
        }
        if (a.hair === 'ponytail') {
          ctx.fillStyle = '#222';
          ctx.beginPath(); ctx.arc(X, Y + back * S * 0.4, S * 0.06, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    // Headwear
    const hat = a.hatColor;
    if (a.headwear === 'cap') {
      const cg = ctx.createRadialGradient(X - S * 0.1, Y - S * 0.1, S * 0.03, X, Y, S * 0.46);
      cg.addColorStop(0, shade(hat, 0.18)); cg.addColorStop(1, shade(hat, -0.18));
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(X, Y, S * 0.43, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgba(shade(hat, -0.45), 0.4); ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2 + 0.5;
        ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + Math.cos(ang) * S * 0.42, Y + Math.sin(ang) * S * 0.42); ctx.stroke();
      }
      ctx.fillStyle = shade(hat, -0.25);
      ctx.beginPath(); ctx.ellipse(X, Y + fwd * S * 0.46, S * 0.34, S * 0.19, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shade(hat, -0.35);
      ctx.beginPath(); ctx.arc(X, Y, S * 0.05, 0, Math.PI * 2); ctx.fill();
    } else if (a.headwear === 'visor') {
      ctx.strokeStyle = hat; ctx.lineWidth = S * 0.1;
      ctx.beginPath(); ctx.arc(X, Y, S * 0.39, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = shade(hat, -0.15);
      ctx.beginPath(); ctx.ellipse(X, Y + fwd * S * 0.48, S * 0.34, S * 0.19, 0, 0, Math.PI * 2); ctx.fill();
    } else if (a.headwear === 'headband') {
      ctx.strokeStyle = hat; ctx.lineWidth = S * 0.08;
      ctx.beginPath(); ctx.arc(X, Y, S * 0.38, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // =====================================================================
  //  Head for standing figures in the perspective view.
  //  view = 'back' (your team, facing the net) or 'front' (facing the camera).
  //  (X, Y) is the head centre, r its radius in pixels.
  // =====================================================================
  function drawHeadBillboard(ctx, a, X, Y, r, view, phase = 0, flat = false) {
    const skin = a.skin, hair = a.hairColor, hat = a.hatColor;
    const front = view === 'front';
    const hairGrad = () => {
      if (flat) return hair; // low-quality mode: solid colours are much cheaper
      const g = ctx.createLinearGradient(X - r, Y - r, X + r * 0.6, Y + r);
      g.addColorStop(0, shade(hair, 0.2)); g.addColorStop(1, shade(hair, -0.18));
      return g;
    };
    const ell = (x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2); };

    // Hair that hangs behind / below the head
    if (a.hair === 'long') {
      ctx.fillStyle = shade(hair, -0.1);
      ctx.beginPath();
      ctx.moveTo(X - r * 1.04, Y - r * 0.25);
      ctx.quadraticCurveTo(X - r * 1.25, Y + r * 1.5, X - r * 0.85, Y + r * 2.2);
      ctx.lineTo(X + r * 0.85, Y + r * 2.2);
      ctx.quadraticCurveTo(X + r * 1.25, Y + r * 1.5, X + r * 1.04, Y - r * 0.25);
      ctx.closePath();
      ctx.fill();
    }
    if (a.hair === 'ponytail') {
      const sway = Math.sin(phase * 1.5) * r * 0.25;
      ctx.fillStyle = shade(hair, -0.06);
      if (front) ell(X + r * 1.02 + sway * 0.3, Y + r * 0.55, r * 0.26, r * 0.7, -0.3);
      else ell(X + sway, Y + r * 1.3, r * 0.3, r * 0.85, (sway / r) * 0.5);
      ctx.fill();
    }

    // Ears
    ctx.fillStyle = shade(skin, -0.14);
    for (const s of [-1, 1]) { ell(X + s * r * 0.97, Y + r * 0.12, r * 0.17, r * 0.27); ctx.fill(); }

    // Head
    if (flat) ctx.fillStyle = skin;
    else {
      const hg = ctx.createRadialGradient(X - r * 0.3, Y - r * 0.3, r * 0.1, X, Y, r * 1.1);
      hg.addColorStop(0, shade(skin, 0.12)); hg.addColorStop(1, shade(skin, -0.2));
      ctx.fillStyle = hg;
    }
    ell(X, Y, r, r * 1.06);
    ctx.fill();

    // Face (front view only)
    if (front) {
      const eyeR = Math.max(0.55, r * 0.085);
      ctx.fillStyle = '#24170f';
      for (const s of [-1, 1]) { ell(X + s * r * 0.36, Y + r * 0.06, eyeR, eyeR * 1.1); ctx.fill(); }
      if (r > 5) {
        ctx.strokeStyle = shade(hair, -0.1);
        ctx.lineWidth = Math.max(0.7, r * 0.08);
        ctx.lineCap = 'round';
        for (const s of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(X + s * r * 0.2, Y - r * 0.16); ctx.quadraticCurveTo(X + s * r * 0.38, Y - r * 0.26, X + s * r * 0.56, Y - r * 0.14); ctx.stroke();
        }
        ctx.fillStyle = rgba(shade(skin, -0.35), 0.45);
        ell(X, Y + r * 0.36, r * 0.12, r * 0.07); ctx.fill();
      }
      if (a.facial === 'beard' || a.facial === 'stubble') {
        ctx.fillStyle = rgba(hair, a.facial === 'beard' ? 0.85 : 0.22);
        ctx.beginPath();
        ctx.moveTo(X - r * 0.92, Y + r * 0.15);
        ctx.quadraticCurveTo(X - r * 0.8, Y + r * 1.05, X, Y + r * 1.08);
        ctx.quadraticCurveTo(X + r * 0.8, Y + r * 1.05, X + r * 0.92, Y + r * 0.15);
        ctx.quadraticCurveTo(X + r * 0.5, Y + r * 0.5, X, Y + r * 0.46);
        ctx.quadraticCurveTo(X - r * 0.5, Y + r * 0.5, X - r * 0.92, Y + r * 0.15);
        ctx.fill();
      }
      if (a.facial === 'mustache' || a.facial === 'beard') {
        ctx.fillStyle = shade(hair, -0.05);
        ell(X, Y + r * 0.5, r * 0.26, r * 0.08); ctx.fill();
      }
      ctx.strokeStyle = mix(skin, '#7a2f2a', 0.55);
      ctx.lineWidth = Math.max(0.7, r * 0.07);
      ctx.beginPath(); ctx.moveTo(X - r * 0.17, Y + r * 0.64); ctx.quadraticCurveTo(X, Y + r * 0.7, X + r * 0.17, Y + r * 0.64); ctx.stroke();
    }

    // Hair on the head
    switch (a.hair) {
      case 'bald': {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ell(X - r * 0.3, Y - r * 0.45, r * 0.32, r * 0.2, -0.5); ctx.fill();
        ctx.fillStyle = rgba(hair, 0.45);
        if (!front) { ctx.beginPath(); ctx.arc(X, Y + r * 0.1, r * 0.98, 0.15, Math.PI - 0.15); ctx.fill(); }
        break;
      }
      case 'buzz':
        ctx.fillStyle = rgba(hair, 0.7);
        if (front) { ctx.beginPath(); ctx.arc(X, Y - r * 0.05, r * 1.0, Math.PI + 0.15, -0.15); ctx.closePath(); ctx.fill(); }
        else { ell(X, Y - r * 0.05, r * 1.0, r * 1.02); ctx.fill(); }
        break;
      default: {
        ctx.fillStyle = hairGrad();
        if (front) {
          // hair cap with a natural hairline
          ctx.beginPath();
          ctx.moveTo(X - r * 1.04, Y + r * 0.05);
          ctx.bezierCurveTo(X - r * 1.15, Y - r * 1.35, X + r * 1.15, Y - r * 1.35, X + r * 1.04, Y + r * 0.05);
          ctx.quadraticCurveTo(X + r * 0.85, Y - r * 0.45, X + r * 0.25, Y - r * 0.5);
          ctx.quadraticCurveTo(X - r * 0.35, Y - r * 0.55, X - r * 0.8, Y - r * 0.3);
          ctx.quadraticCurveTo(X - r * 0.95, Y - r * 0.15, X - r * 1.04, Y + r * 0.05);
          ctx.fill();
          if (a.hair === 'long') { // locks beside the face
            for (const s of [-1, 1]) { ell(X + s * r * 0.98, Y + r * 0.7, r * 0.22, r * 0.9); ctx.fill(); }
          }
        } else {
          // back of the head is all hair, with skin showing at the nape
          ell(X, Y - r * 0.06, r * 1.04, r * 1.04);
          ctx.fill();
          ctx.strokeStyle = rgba(shade(hair, 0.35), 0.25);
          ctx.lineWidth = Math.max(0.6, r * 0.06);
          for (let i = -2; i <= 2; i++) {
            ctx.beginPath(); ctx.moveTo(X + i * r * 0.18, Y - r * 0.9); ctx.quadraticCurveTo(X + i * r * 0.28, Y, X + i * r * 0.22, Y + r * 0.8); ctx.stroke();
          }
        }
        if (a.hair === 'curly') {
          ctx.fillStyle = shade(hair, -0.04);
          for (let i = 0; i < 9; i++) {
            const ang = Math.PI * (1.0 + i / 8);
            ell(X + Math.cos(ang) * r * 0.92, Y - r * 0.1 + Math.sin(ang) * r * 0.92, r * 0.3, r * 0.3); ctx.fill();
          }
        }
        if (a.hair === 'bun' && a.headwear !== 'cap') {
          ctx.fillStyle = shade(hair, -0.08);
          ell(X, Y - r * 1.05, r * 0.38, r * 0.34); ctx.fill();
        }
        if (a.hair === 'ponytail' && !front) {
          ctx.fillStyle = '#262626';
          ell(X, Y + r * 0.62, r * 0.16, r * 0.1); ctx.fill();
        }
      }
    }

    // Headwear
    if (a.headwear === 'cap') {
      if (flat) ctx.fillStyle = hat;
      else {
        const cg = ctx.createLinearGradient(X - r, Y - r * 1.2, X + r, Y);
        cg.addColorStop(0, shade(hat, 0.18)); cg.addColorStop(1, shade(hat, -0.2));
        ctx.fillStyle = cg;
      }
      ctx.beginPath();
      ctx.arc(X, Y - r * 0.08, r * 1.08, Math.PI + 0.05, -0.05);
      ctx.closePath();
      ctx.fill();
      if (front) {
        ctx.fillStyle = shade(hat, -0.3);
        ell(X, Y - r * 0.1, r * 1.12, r * 0.28); ctx.fill();
        ctx.fillStyle = shade(hat, -0.05);
        ell(X, Y - r * 0.16, r * 1.08, r * 0.2); ctx.fill();
      } else {
        ctx.fillStyle = rgba(skin, 0.0);
        ctx.strokeStyle = rgba(shade(hat, -0.45), 0.7);
        ctx.lineWidth = Math.max(0.6, r * 0.07);
        ctx.beginPath(); ctx.arc(X, Y - r * 0.05, r * 0.32, Math.PI + 0.2, -0.2); ctx.stroke(); // strap opening
      }
      ctx.fillStyle = shade(hat, -0.3);
      ell(X, Y - r * 1.12, r * 0.12, r * 0.09); ctx.fill();
    } else if (a.headwear === 'visor' || a.headwear === 'headband') {
      ctx.fillStyle = hat;
      ctx.beginPath();
      ctx.moveTo(X - r * 1.02, Y - r * 0.32);
      ctx.quadraticCurveTo(X, Y - r * 0.62, X + r * 1.02, Y - r * 0.32);
      ctx.lineTo(X + r * 1.0, Y - r * 0.08);
      ctx.quadraticCurveTo(X, Y - r * 0.36, X - r * 1.0, Y - r * 0.08);
      ctx.closePath();
      ctx.fill();
      if (a.headwear === 'visor' && front) {
        ctx.fillStyle = shade(hat, -0.25);
        ell(X, Y - r * 0.12, r * 1.08, r * 0.24); ctx.fill();
      }
    }
  }

  // =====================================================================
  //  Profile (saved in this browser)
  // =====================================================================
  const KEY = 'pickleball.profile.v1';
  const DEFAULT_NAME = 'Player';
  function cleanName(n) {
    if (typeof n !== 'string') return DEFAULT_NAME;
    const s = n.replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
    return s || DEFAULT_NAME;
  }
  function sanitizeAvatar(a) {
    const out = Object.assign({}, DEFAULT_AVATAR);
    if (a && typeof a === 'object') {
      for (const k of AVATAR_KEYS) if (OPTIONS[k].some((o) => o.v === a[k])) out[k] = a[k];
    }
    return out;
  }
  function loadProfile() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        return { name: cleanName(p.name), avatar: sanitizeAvatar(p.avatar), paddle: paddleById(p.paddle).id };
      }
    } catch (e) { /* storage unavailable */ }
    return { name: DEFAULT_NAME, avatar: Object.assign({}, DEFAULT_AVATAR), paddle: DEFAULT_PADDLE };
  }
  function saveProfile(p) {
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* private mode etc. */ }
  }

  let profile = loadProfile();
  const listeners = [];
  const clone = (p) => ({ name: p.name, avatar: Object.assign({}, p.avatar), paddle: p.paddle });

  // =====================================================================
  //  Customize screen
  // =====================================================================
  const $ = (id) => document.getElementById(id);
  let draft = clone(profile);
  let built = false;

  // panel: 'avatar' (Player tab) or 'outfit' (Outfit tab)
  const GROUPS = [
    { key: 'gender', label: 'Gender', type: 'chip', panel: 'avatar' },
    { key: 'skin', label: 'Skin tone', type: 'swatch', panel: 'avatar' },
    { key: 'hair', label: 'Hair style', type: 'chip', panel: 'avatar' },
    { key: 'hairColor', label: 'Hair color', type: 'swatch', panel: 'avatar' },
    { key: 'eyes', label: 'Eye color', type: 'swatch', panel: 'avatar' },
    { key: 'facial', label: 'Facial hair', type: 'chip', panel: 'avatar' },
    { key: 'headwear', label: 'Headwear', type: 'chip', panel: 'avatar' },
    { key: 'hatColor', label: 'Headwear color', type: 'swatch', panel: 'avatar' },
    { key: 'shirtStyle', label: 'T-shirt style', type: 'chip', panel: 'outfit' },
    { key: 'shirt', label: 'T-shirt color', type: 'swatch', panel: 'outfit' },
    { key: 'shirtAccent', label: 'Trim / sleeve color', type: 'swatch', panel: 'outfit' },
    { key: 'shortsStyle', label: 'Shorts style', type: 'chip', panel: 'outfit' },
    { key: 'shortsColor', label: 'Shorts color', type: 'swatch', panel: 'outfit' },
    { key: 'shoes', label: 'Shoes', type: 'shoe', panel: 'outfit' },
    { key: 'kneeGuard', label: 'Knee guards', type: 'guard', panel: 'outfit' },
    { key: 'elbowGuard', label: 'Elbow guards', type: 'guard', panel: 'outfit' },
  ];

  function hiDpi(canvas, w, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return g;
  }

  function drawPaddleUpright(canvas, p, w, h, scale) {
    const g = hiDpi(canvas, w, h);
    g.clearRect(0, 0, w, h);
    const sh = SHAPES[p.shape];
    const total = sh.L + HANDLE.len;
    g.translate(w / 2, h / 2 + (total / 2 - sh.L / 2) * scale * 0.5);
    g.rotate(-Math.PI / 2);
    g.shadowColor = 'rgba(0,0,0,0.4)';
    g.shadowBlur = 8;
    g.shadowOffsetY = 3;
    drawPaddle(g, p, scale, scale >= 50);
  }

  function renderPortrait() {
    const c = $('portrait');
    const g = hiDpi(c, 150, 165);
    drawPortrait(g, draft.avatar, 150, 165);
    const b = $('bodyPreview');
    if (b) drawBodyPreview(hiDpi(b, 120, 260), draft.avatar, paddleById(draft.paddle), 120, 260);
  }

  function renderPaddleFeature() {
    const p = paddleById(draft.paddle);
    drawPaddleUpright($('paddleBig'), p, 110, 190, 100);
    $('pdBrand').textContent = p.brand;
    $('pdModel').textContent = p.model;
    $('pdPower').style.width = p.power * 10 + '%';
    $('pdControl').style.width = p.control * 10 + '%';
    $('pdShape').textContent = SHAPE_NAMES[p.shape];
    document.querySelectorAll('#paddleGrid .pcard').forEach((b) => b.classList.toggle('active', b.dataset.id === p.id));
  }

  function renderSelections() {
    document.querySelectorAll('#settings [data-key]').forEach((b) => {
      b.classList.toggle('active', draft.avatar[b.dataset.key] === b.dataset.v);
    });
    // Facial hair only applies to male characters
    const fg = document.querySelector('#settings .opt-group[data-group="facial"]');
    if (fg) fg.hidden = draft.avatar.gender === 'female';
  }

  // Keep the look consistent when the gender changes
  function applyGender(g) {
    draft.avatar.gender = g;
    if (g === 'female') draft.avatar.facial = 'none';
  }

  function buildSettings() {
    if (built) return;
    built = true;

    // Avatar and outfit option groups
    for (const grp of GROUPS) {
      const wrap = $(grp.panel === 'outfit' ? 'outfitOptions' : 'avatarOptions');
      const box = document.createElement('div');
      box.className = 'opt-group';
      box.dataset.group = grp.key;
      const lab = document.createElement('div');
      lab.className = 'opt-label';
      lab.textContent = grp.label;
      box.appendChild(lab);
      const row = document.createElement('div');
      row.className = grp.type === 'swatch' || grp.type === 'shoe' ? 'swatches' : 'chips';
      for (const o of OPTIONS[grp.key]) {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.key = grp.key;
        b.dataset.v = o.v;
        b.title = o.n;
        b.setAttribute('aria-label', `${grp.label}: ${o.n}`);
        if (grp.type === 'swatch') { b.className = 'swatch'; b.style.background = o.v; }
        else if (grp.type === 'shoe') { // two-tone swatch: upper over sole
          const sh = SHOES[o.v];
          b.className = 'swatch shoe';
          b.style.background = `linear-gradient(${sh.upper} 0 62%, ${sh.accent} 62% 72%, ${sh.sole} 72%)`;
        } else if (grp.type === 'guard') {
          b.className = 'chip';
          b.textContent = o.n;
          if (o.v !== 'none') { const dot = document.createElement('i'); dot.className = 'chip-dot'; dot.style.background = o.v; b.prepend(dot); }
        } else { b.className = 'chip'; b.textContent = o.n; }
        b.addEventListener('click', () => {
          if (grp.key === 'gender') applyGender(o.v);
          else draft.avatar[grp.key] = o.v;
          renderSelections();
          renderPortrait();
        });
        row.appendChild(b);
      }
      box.appendChild(row);
      wrap.appendChild(box);
    }

    // Paddle cards
    const grid = $('paddleGrid');
    for (const p of PADDLES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pcard';
      b.dataset.id = p.id;
      b.setAttribute('aria-label', `${p.brand} ${p.model}`);
      const c = document.createElement('canvas');
      b.appendChild(c);
      const t = document.createElement('span');
      t.className = 'pc-name';
      t.innerHTML = '';
      const bb = document.createElement('b'); bb.textContent = p.brand;
      const mm = document.createElement('small'); mm.textContent = p.model;
      t.append(bb, mm);
      b.appendChild(t);
      b.addEventListener('click', () => { draft.paddle = p.id; renderPaddleFeature(); renderPortrait(); });
      grid.appendChild(b);
      drawPaddleUpright(c, p, 64, 104, 56);
    }

    // Tabs
    document.querySelectorAll('#settingsTabs button').forEach((t) => {
      t.addEventListener('click', () => {
        document.querySelectorAll('#settingsTabs button').forEach((x) => x.classList.toggle('active', x === t));
        document.querySelectorAll('#settings [data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== t.dataset.tab; });
      });
    });

    $('randomAvatar').addEventListener('click', () => {
      for (const k of AVATAR_KEYS) {
        const opts = OPTIONS[k];
        draft.avatar[k] = opts[(Math.random() * opts.length) | 0].v;
      }
      applyGender(draft.avatar.gender);
      // guards are optional gear: leave them off most of the time
      if (Math.random() < 0.6) draft.avatar.kneeGuard = 'none';
      if (Math.random() < 0.7) draft.avatar.elbowGuard = 'none';
      renderSelections();
      renderPortrait();
    });

    $('settingsDone').addEventListener('click', () => {
      draft.name = cleanName($('nameInput').value);
      profile = clone(draft);
      saveProfile(profile);
      listeners.forEach((fn) => fn(clone(profile)));
      closeSettings();
    });
    $('settingsClose').addEventListener('click', closeSettings);
    $('nameInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); $('settingsDone').click(); }
    });
  }

  function openSettings() {
    buildSettings();
    draft = clone(profile);
    $('nameInput').value = draft.name === DEFAULT_NAME ? '' : draft.name;
    $('nameInput').placeholder = DEFAULT_NAME;
    renderSelections();
    renderPortrait();
    renderPaddleFeature();
    $('settings').classList.remove('hidden');
  }
  function closeSettings() {
    $('settings').classList.add('hidden');
  }

  window.PB = {
    PADDLES, BOTS, OPTIONS,
    paddleById,
    paddleSprite,
    drawPaddle,
    drawPortrait,
    drawHeadTop,
    drawHeadBillboard,
    drawBodyPreview,
    SHOES,
    shade, rgba, mix,
    getProfile: () => clone(profile),
    onChange: (fn) => listeners.push(fn),
    openSettings,
    closeSettings,
    isOpen: () => !$('settings').classList.contains('hidden'),
  };
})();
