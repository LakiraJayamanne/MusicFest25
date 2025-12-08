// Dynamic theming based on the current track/artist playing through AudioManager.
(function() {
  const root = document.documentElement;
  const coverCache = new Map();
  let fadeLayers = [];
  let activeLayer = 0;
  const DEFAULT_THEME = {
    accent: '#ff6bd6',
    accentStrong: '#ff2f92',
    surface: '#0a0012',
    surfaceStrong: '#1a0129',
    cover: '',
    dim: 'rgba(5, 3, 11, 0.25)',
    bgOpacity: 0.32
  };

  const THEMES = {
    Travis: {
      accent: '#ff8a5f',
      accentStrong: '#ffa45c',
      surface: '#0d0a10',
      surfaceStrong: '#201221',
      cover: 'images/Travis.jpeg',
      dim: 'rgba(6, 2, 4, 0.26)',
      bgOpacity: 0.32
    },
    Carti: {
      accent: '#ff3150',
      accentStrong: '#ff6a3d',
      surface: '#120607',
      surfaceStrong: '#240e10',
      cover: 'images/Carti.jpeg',
      dim: 'rgba(10, 3, 3, 0.24)',
      bgOpacity: 0.32
    },
    Ken: {
      accent: '#a980ff',
      accentStrong: '#7e5cff',
      surface: '#0d0a15',
      surfaceStrong: '#1b1230',
      cover: 'images/Ken.jpeg',
      dim: 'rgba(6, 4, 13, 0.24)',
      bgOpacity: 0.32
    },
    Yeat: {
      accent: '#6bffb5',
      accentStrong: '#22f1d0',
      surface: '#04120d',
      surfaceStrong: '#0c231b',
      cover: 'images/Yeat.jpg',
      dim: 'rgba(2, 12, 8, 0.26)',
      bgOpacity: 0.32
    },
    Uzi: {
      accent: '#ff7be5',
      accentStrong: '#c44bff',
      surface: '#0c0614',
      surfaceStrong: '#190c26',
      cover: 'images/Uzi.jpeg',
      dim: 'rgba(8, 3, 12, 0.24)',
      bgOpacity: 0.32
    },
    Ye: {
      accent: '#ffb347',
      accentStrong: '#ff902c',
      surface: '#120b03',
      surfaceStrong: '#24150c',
      cover: 'images/Kanye.jpeg',
      dim: 'rgba(12, 6, 2, 0.24)',
      bgOpacity: 0.32
    },
    Kanye: {
      accent: '#ffb347',
      accentStrong: '#ff902c',
      surface: '#120b03',
      surfaceStrong: '#24150c',
      cover: 'images/Kanye.jpeg',
      dim: 'rgba(12, 6, 2, 0.24)',
      bgOpacity: 0.32
    },
    Donny: {
      accent: '#ff7f5f',
      accentStrong: '#ff5f7a',
      surface: '#0f0a0c',
      surfaceStrong: '#1f1115',
      cover: 'images/Donny.jpeg',
      dim: 'rgba(10, 6, 6, 0.24)',
      bgOpacity: 0.32
    },
    Lone: {
      accent: '#4fd8ff',
      accentStrong: '#8aa4ff',
      surface: '#031017',
      surfaceStrong: '#0c1e26',
      cover: 'images/Lone.jpeg',
      dim: 'rgba(2, 12, 15, 0.24)',
      bgOpacity: 0.32
    },
    TravisScott: { // safety alias
      accent: '#ff8a5f',
      accentStrong: '#ffa45c',
      surface: '#0d0a10',
      surfaceStrong: '#201221',
      cover: 'images/Travis.jpeg',
      dim: 'rgba(6, 2, 4, 0.26)',
      bgOpacity: 0.32
    }
  };

  const clamp = (val, min, max) => Math.min(max, Math.max(min, val));
  const toOpacity = (v) => clamp(typeof v === 'number' ? v : DEFAULT_THEME.bgOpacity, 0, 0.55);

  const ensureFadeLayers = () => {
    if (fadeLayers.length) return fadeLayers;
    const container = document.createElement('div');
    container.id = 'bg-fade';
    const layerA = document.createElement('div');
    const layerB = document.createElement('div');
    layerA.className = 'bg-fade__layer is-active';
    layerB.className = 'bg-fade__layer';
    container.appendChild(layerA);
    container.appendChild(layerB);
    document.body.prepend(container);
    document.body.dataset.bgFade = '1';
    fadeLayers = [layerA, layerB];
    return fadeLayers;
  };

  const setFadeBackground = (url, opacityValue) => {
    const layers = ensureFadeLayers();
    const targetOpacity = toOpacity(opacityValue);

    if (!layers[0].dataset.ready) {
      layers[0].style.backgroundImage = url ? `url("${url}")` : 'none';
      layers[0].style.opacity = `${targetOpacity}`;
      layers[0].dataset.ready = '1';
      activeLayer = 0;
      return;
    }

    const next = layers[1 - activeLayer];
    const current = layers[activeLayer];

    next.style.backgroundImage = url ? `url("${url}")` : 'none';
    next.style.opacity = '0';

    requestAnimationFrame(() => {
      next.classList.add('is-active');
      next.style.opacity = `${targetOpacity}`;
      current.style.opacity = '0';
      current.classList.remove('is-active');
      activeLayer = 1 - activeLayer;
    });
  };

  const getManager = () => {
    if (window.parent && window.parent !== window && window.parent.AudioManager) return window.parent.AudioManager;
    if (window.AudioManager) return window.AudioManager;
    return null;
  };

  const readSyncSafe = (bytes, offset) => (
    (bytes[offset] << 21) |
    (bytes[offset + 1] << 14) |
    (bytes[offset + 2] << 7) |
    (bytes[offset + 3])
  );

  const readUInt32 = (bytes, offset) => (
    ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | (bytes[offset + 3])) >>> 0
  );

  const findTerminator = (bytes, start, encoding) => {
    if (encoding === 1 || encoding === 2) {
      for (let i = start; i + 1 < bytes.length; i += 1) {
        if (bytes[i] === 0 && bytes[i + 1] === 0) return { index: i, length: 2 };
      }
    } else {
      for (let i = start; i < bytes.length; i += 1) {
        if (bytes[i] === 0) return { index: i, length: 1 };
      }
    }
    return null;
  };

  const extractApicUrl = (frameBytes) => {
    if (!frameBytes || !frameBytes.length) return null;
    const encoding = frameBytes[0];
    let offset = 1;

    const mimeEnd = frameBytes.indexOf(0, offset);
    if (mimeEnd === -1) return null;
    const mime = new TextDecoder('latin1').decode(frameBytes.subarray(offset, mimeEnd)) || 'image/jpeg';
    offset = mimeEnd + 1;

    // picture type (skip)
    offset += 1;

    const terminator = findTerminator(frameBytes, offset, encoding);
    if (!terminator) return null;
    offset = terminator.index + terminator.length;

    const imageData = frameBytes.subarray(offset);
    if (!imageData.length) return null;

    const blob = new Blob([imageData], { type: mime });
    return URL.createObjectURL(blob);
  };

  const parseCoverFromBuffer = (buffer) => {
    if (!buffer) return null;
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 10) return null;
    if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return null; // "ID3"

    const version = bytes[3];
    const flags = bytes[5];
    const tagSize = readSyncSafe(bytes, 6);

    let offset = 10;
    const limit = 10 + tagSize;

    // skip extended header if present
    if (flags & 0x40) {
      const extSize = version === 4 ? readSyncSafe(bytes, offset) : readUInt32(bytes, offset);
      offset += 4 + extSize;
    }

    while (offset + 10 <= limit && offset + 10 <= bytes.length) {
      const frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
      const frameSize = version === 4 ? readSyncSafe(bytes, offset + 4) : readUInt32(bytes, offset + 4);
      if (!frameId.trim() || frameSize <= 0) break;

      const frameStart = offset + 10;
      const frameEnd = frameStart + frameSize;
      if (frameEnd > bytes.length) break;

      if (frameId === 'APIC') {
        const url = extractApicUrl(bytes.subarray(frameStart, frameEnd));
        if (url) return url;
      }

      offset = frameEnd;
    }

    return null;
  };

  const fetchCover = (src) => {
    if (!src) return Promise.resolve(null);
    if (coverCache.has(src)) return coverCache.get(src);

    const promise = (async () => {
      try {
        const resp = await fetch(src);
        if (!resp.ok) return null;
        const buffer = await resp.arrayBuffer();
        return parseCoverFromBuffer(buffer);
      } catch (e) {
        return null;
      }
    })();

    coverCache.set(src, promise);
    return promise;
  };

  const normalizeDim = (dim) => {
    if (!dim) return DEFAULT_THEME.dim;
    const match = /rgba?\(([^)]+)\)/.exec(dim);
    if (!match) return dim;
    const parts = match[1].split(',').map(part => part.trim());
    if (parts.length < 3) return dim;
    const alpha = parts[3] !== undefined ? parseFloat(parts[3]) : 1;
    const capped = clamp(Number.isFinite(alpha) ? alpha : 1, 0, 0.55);
    return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${capped})`;
  };

  const applyTheme = (palette = DEFAULT_THEME) => {
    const p = { ...DEFAULT_THEME, ...palette };
    const bgOpacity = toOpacity(p.bgOpacity);
    root.style.setProperty('--theme-bg-image', p.cover ? `url("${p.cover}")` : 'none');
    root.style.setProperty('--theme-bg-color', p.surface || DEFAULT_THEME.surface);
    root.style.setProperty('--theme-bg-opacity', `${bgOpacity}`);
    root.style.setProperty('--theme-dim', normalizeDim(p.dim || DEFAULT_THEME.dim));
    root.style.setProperty('--theme-surface', p.surface);
    root.style.setProperty('--theme-surface-strong', p.surfaceStrong);
    root.style.setProperty('--theme-card', 'rgba(255,255,255,0.06)');
    root.style.setProperty('--theme-card-strong', 'rgba(255,255,255,0.12)');
    root.style.setProperty('--theme-accent', p.accent);
    root.style.setProperty('--theme-accent-strong', p.accentStrong || p.accent);
    setFadeBackground(p.cover, bgOpacity);
  };

  const selectTheme = (meta) => {
    if (!meta) return DEFAULT_THEME;
    const key = meta.artistKey || '';
    const normalized = key.toLowerCase();
    if (THEMES[key]) return THEMES[key];
    // allow friendly names or folder keys
    const match = Object.entries(THEMES).find(([artist]) => artist.toLowerCase() === normalized);
    return match ? match[1] : DEFAULT_THEME;
  };

  let lastCover = '';

  const handleTrack = (meta) => {
    const palette = selectTheme(meta);
    const currentCover = lastCover || palette.cover || '';
    applyTheme({ ...palette, cover: currentCover });
    const src = meta?.src;
    if (src) {
      fetchCover(src).then((coverUrl) => {
        const nextCover = coverUrl || palette.cover || lastCover || '';
        lastCover = nextCover;
        applyTheme({ ...palette, cover: nextCover });
      });
    } else {
      lastCover = palette.cover || lastCover;
    }
  };

  const init = () => {
    try {
      const mgr = getManager();
      try { mgr?.init?.(); } catch (e) {}
      if (mgr?.onTrackChange) {
        mgr.onTrackChange(handleTrack);
      }
      const current = mgr?.getCurrentTrack?.();
      handleTrack(current);
    } catch (e) {}
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
