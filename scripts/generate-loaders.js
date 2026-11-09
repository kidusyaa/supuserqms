const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');

const LOGO_PATH = path.join(__dirname, '..', 'public', 'images', 'logopro.png');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const logoData = fs.readFileSync(LOGO_PATH);
const srcPng = PNG.sync.read(logoData);
const srcW = srcPng.width;
const srcH = srcPng.height;

function sampleSrc(u, v) {
  if (u < 0 || u > 1 || v < 0 || v > 1) return [0, 0, 0, 0];
  const sx = u * (srcW - 1);
  const sy = v * (srcH - 1);
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = Math.min(srcW - 1, x0 + 1);
  const y1 = Math.min(srcH - 1, y0 + 1);
  const fx = sx - x0;
  const fy = sy - y0;

  const getPixel = (x, y) => {
    const idx = (y * srcW + x) * 4;
    return [srcPng.data[idx], srcPng.data[idx + 1], srcPng.data[idx + 2], srcPng.data[idx + 3]];
  };

  const p00 = getPixel(x0, y0);
  const p10 = getPixel(x1, y0);
  const p01 = getPixel(x0, y1);
  const p11 = getPixel(x1, y1);

  const r = (p00[0] * (1 - fx) + p10[0] * fx) * (1 - fy) + (p01[0] * (1 - fx) + p11[0] * fx) * fy;
  const g = (p00[1] * (1 - fx) + p10[1] * fx) * (1 - fy) + (p01[1] * (1 - fx) + p11[1] * fx) * fy;
  const b = (p00[2] * (1 - fx) + p10[2] * fx) * (1 - fy) + (p01[2] * (1 - fx) + p11[2] * fx) * fy;
  const a = (p00[3] * (1 - fx) + p10[3] * fx) * (1 - fy) + (p01[3] * (1 - fx) + p11[3] * fx) * fy;

  return [Math.round(r), Math.round(g), Math.round(b), Math.round(a)];
}

function blendPixel(rgba, idx, r, g, b, a, bgIsTransparent = true) {
  if (a <= 0) return;
  const da = rgba[idx + 3] / 255;
  const sa = a / 255;
  const outA = sa + da * (1 - sa);

  if (outA <= 0) return;

  const outR = Math.round((r * sa + rgba[idx] * da * (1 - sa)) / outA);
  const outG = Math.round((g * sa + rgba[idx + 1] * da * (1 - sa)) / outA);
  const outB = Math.round((b * sa + rgba[idx + 2] * da * (1 - sa)) / outA);

  rgba[idx] = outR;
  rgba[idx + 1] = outG;
  rgba[idx + 2] = outB;
  rgba[idx + 3] = Math.round(outA * 255);
}

function drawLogo(rgba, W, H, cx, cy, targetSize, angle = 0, alphaMul = 1, brightness = 0) {
  const halfTarget = targetSize / 2;
  const cosA = Math.cos(-angle);
  const sinA = Math.sin(-angle);

  const minX = Math.max(0, Math.floor(cx - targetSize * 0.8));
  const maxX = Math.min(W - 1, Math.ceil(cx + targetSize * 0.8));
  const minY = Math.max(0, Math.floor(cy - targetSize * 0.8));
  const maxY = Math.min(H - 1, Math.ceil(cy + targetSize * 0.8));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const rx = dx * cosA - dy * sinA;
      const ry = dx * sinA + dy * cosA;

      const u = (rx + halfTarget) / targetSize;
      const v = (ry + halfTarget) / targetSize;

      if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
        const [sr, sg, sb, sa] = sampleSrc(u, v);
        if (sa > 2) {
          const r = Math.min(255, Math.max(0, sr + brightness));
          const g = Math.min(255, Math.max(0, sg + brightness));
          const b = Math.min(255, Math.max(0, sb + brightness));
          const a = sa * alphaMul;
          const idx = (y * W + x) * 4;
          blendPixel(rgba, idx, r, g, b, a);
        }
      }
    }
  }
}

// 1. GENERATE SPINNER ORBIT (Flagship Loader)
function generateSpinnerOrbit(isDark = false) {
  const W = 220;
  const H = 220;
  const frames = 30;
  const delay = 40; // 25 fps
  const gif = GIFEncoder();

  const cx = W / 2;
  const cy = H / 2;
  const ringRadius = 88;
  const thickness = 7;
  const logoBaseSize = 100;

  for (let f = 0; f < frames; f++) {
    const t = f / frames;
    const rgba = new Uint8Array(W * H * 4);

    if (isDark) {
      for (let i = 0; i < rgba.length; i += 4) {
        rgba[i] = 13; rgba[i + 1] = 17; rgba[i + 2] = 23; rgba[i + 3] = 255;
      }
    }

    // Subtle gentle breath for the logo
    const breath = 1 + Math.sin(t * Math.PI * 2) * 0.04;
    drawLogo(rgba, W, H, cx, cy, logoBaseSize * breath);

    // Draw orbiting comet arc
    const spinAngle = t * Math.PI * 2;
    const arcLength = Math.PI * 1.35; // ~240 degrees arc

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.hypot(dx, dy);
        const distDiff = Math.abs(dist - ringRadius);

        if (distDiff < thickness / 2 + 1.2) {
          // Radial anti-aliasing
          const radAa = Math.max(0, Math.min(1, (thickness / 2 + 1.2 - distDiff) / 1.5));

          // Angle
          let angle = Math.atan2(dy, dx) - spinAngle;
          while (angle < 0) angle += Math.PI * 2;
          while (angle >= Math.PI * 2) angle -= Math.PI * 2;

          if (angle < arcLength) {
            // Gradient from head (1.0) to tail (0.0)
            const headProg = angle / arcLength;
            const cometAlpha = Math.pow(headProg, 2.0); // tail fades smoothly
            const totalAlpha = cometAlpha * radAa * 255;

            if (totalAlpha > 2) {
              // Orange gradient: head is bright yellow-orange #f7931e, tail is deep orange #f15a24
              const r = Math.round(247 + (255 - 247) * headProg);
              const g = Math.round(110 + (165 - 110) * headProg);
              const b = Math.round(30 + (50 - 30) * headProg);

              const idx = (y * W + x) * 4;
              blendPixel(rgba, idx, r, g, b, totalAlpha);
            }
          }
        }
      }
    }

    // Quantize & write frame
    const palette = quantize(rgba, 256, { format: 'rgba4444', oneBitAlpha: !isDark });
    const transparentIndex = isDark ? -1 : palette.findIndex(c => c[3] === 0);
    const index = applyPalette(rgba, palette, 'rgba4444');
    gif.writeFrame(index, W, H, {
      palette,
      delay,
      transparent: !isDark && transparentIndex !== -1,
      transparentIndex: !isDark && transparentIndex !== -1 ? transparentIndex : 0
    });
  }

  gif.finish();
  return gif.bytes();
}

// 2. GENERATE PULSE & RIPPLE
function generatePulseRipple(isDark = false) {
  const W = 220;
  const H = 220;
  const frames = 30;
  const delay = 45;
  const gif = GIFEncoder();

  const cx = W / 2;
  const cy = H / 2;
  const logoBaseSize = 100;
  const maxRadius = 96;
  const minRadius = 52;

  for (let f = 0; f < frames; f++) {
    const t = f / frames;
    const rgba = new Uint8Array(W * H * 4);

    if (isDark) {
      for (let i = 0; i < rgba.length; i += 4) {
        rgba[i] = 13; rgba[i + 1] = 17; rgba[i + 2] = 23; rgba[i + 3] = 255;
      }
    }

    // 2 ripple waves spaced out
    const waves = [t, (t + 0.5) % 1.0];
    for (const wave of waves) {
      const radius = minRadius + wave * (maxRadius - minRadius);
      const waveAlpha = Math.pow(1 - wave, 1.4) * 0.75;
      const thickness = 3.5 + wave * 4.0;

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const dist = Math.hypot(x - cx, y - cy);
          const diff = Math.abs(dist - radius);
          if (diff < thickness / 2 + 1.2) {
            const aa = Math.max(0, Math.min(1, (thickness / 2 + 1.2 - diff) / 1.5));
            const a = aa * waveAlpha * 255;
            if (a > 2) {
              const idx = (y * W + x) * 4;
              blendPixel(rgba, idx, 247, 130, 30, a);
            }
          }
        }
      }
    }

    // Pulsing logo in center
    const pulse = 1 + Math.sin(t * Math.PI * 2) * 0.08;
    const glow = Math.sin(t * Math.PI * 2) * 25;
    drawLogo(rgba, W, H, cx, cy, logoBaseSize * pulse, 0, 1, glow);

    const palette = quantize(rgba, 256, { format: 'rgba4444', oneBitAlpha: !isDark });
    const transparentIndex = isDark ? -1 : palette.findIndex(c => c[3] === 0);
    const index = applyPalette(rgba, palette, 'rgba4444');
    gif.writeFrame(index, W, H, {
      palette,
      delay,
      transparent: !isDark && transparentIndex !== -1,
      transparentIndex: !isDark && transparentIndex !== -1 ? transparentIndex : 0
    });
  }

  gif.finish();
  return gif.bytes();
}

// 3. GENERATE SHIMMER / LIGHT SWEEP
function generateShimmer(isDark = false) {
  const W = 220;
  const H = 220;
  const frames = 30;
  const delay = 45;
  const gif = GIFEncoder();

  const cx = W / 2;
  const cy = H / 2;
  const logoBaseSize = 108;

  for (let f = 0; f < frames; f++) {
    const t = f / frames;
    const rgba = new Uint8Array(W * H * 4);

    if (isDark) {
      for (let i = 0; i < rgba.length; i += 4) {
        rgba[i] = 13; rgba[i + 1] = 17; rgba[i + 2] = 23; rgba[i + 3] = 255;
      }
    }

    // Floating vertical hover
    const floatY = cy + Math.sin(t * Math.PI * 2) * 4;
    drawLogo(rgba, W, H, cx, floatY, logoBaseSize);

    // Diagonal light beam across the logo
    // Sweep progress from -0.4 to 1.4
    const sweepProg = t * 1.8 - 0.4;
    const beamWidth = 0.22;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = (y * W + x) * 4;
        const currentAlpha = rgba[idx + 3];

        if (currentAlpha > 20) {
          // Normalized diagonal coordinate
          const diagPos = (x + y) / (W + H);
          const diff = Math.abs(diagPos - sweepProg);

          if (diff < beamWidth) {
            const intensity = Math.pow(Math.cos((diff / beamWidth) * (Math.PI / 2)), 2.5);
            const shine = intensity * 150;

            rgba[idx] = Math.min(255, rgba[idx] + shine);
            rgba[idx + 1] = Math.min(255, rgba[idx + 1] + shine * 0.95);
            rgba[idx + 2] = Math.min(255, rgba[idx + 2] + shine * 0.7);
          }
        }
      }
    }

    const palette = quantize(rgba, 256, { format: 'rgba4444', oneBitAlpha: !isDark });
    const transparentIndex = isDark ? -1 : palette.findIndex(c => c[3] === 0);
    const index = applyPalette(rgba, palette, 'rgba4444');
    gif.writeFrame(index, W, H, {
      palette,
      delay,
      transparent: !isDark && transparentIndex !== -1,
      transparentIndex: !isDark && transparentIndex !== -1 ? transparentIndex : 0
    });
  }

  gif.finish();
  return gif.bytes();
}

// 4. GENERATE 3D FLIP / BOUNCE
function generateFlipSpin(isDark = false) {
  const W = 220;
  const H = 220;
  const frames = 30;
  const delay = 45;
  const gif = GIFEncoder();

  const cx = W / 2;
  const cy = H / 2;
  const logoBaseSize = 104;

  for (let f = 0; f < frames; f++) {
    const t = f / frames;
    const rgba = new Uint8Array(W * H * 4);

    if (isDark) {
      for (let i = 0; i < rgba.length; i += 4) {
        rgba[i] = 13; rgba[i + 1] = 17; rgba[i + 2] = 23; rgba[i + 3] = 255;
      }
    }

    // Scale horizontal to simulate 3D coin flip
    const flipScaleX = Math.cos(t * Math.PI * 2);
    const bounceY = cy - Math.abs(Math.sin(t * Math.PI * 2)) * 10;
    const targetW = logoBaseSize * Math.abs(flipScaleX);
    const targetH = logoBaseSize;

    // Draw horizontal squash/stretch
    const halfW = targetW / 2;
    const halfH = targetH / 2;
    const minX = Math.max(0, Math.floor(cx - halfW - 1));
    const maxX = Math.min(W - 1, Math.ceil(cx + halfW + 1));
    const minY = Math.max(0, Math.floor(bounceY - halfH - 1));
    const maxY = Math.min(H - 1, Math.ceil(bounceY + halfH + 1));

    if (targetW > 4) {
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const dx = x - cx;
          const dy = y - bounceY;
          const u = (dx + halfW) / targetW;
          const v = (dy + halfH) / targetH;

          if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
            const actualU = flipScaleX >= 0 ? u : 1 - u;
            const [sr, sg, sb, sa] = sampleSrc(actualU, v);
            if (sa > 5) {
              const idx = (y * W + x) * 4;
              blendPixel(rgba, idx, sr, sg, sb, sa);
            }
          }
        }
      }
    }

    const palette = quantize(rgba, 256, { format: 'rgba4444', oneBitAlpha: !isDark });
    const transparentIndex = isDark ? -1 : palette.findIndex(c => c[3] === 0);
    const index = applyPalette(rgba, palette, 'rgba4444');
    gif.writeFrame(index, W, H, {
      palette,
      delay,
      transparent: !isDark && transparentIndex !== -1,
      transparentIndex: !isDark && transparentIndex !== -1 ? transparentIndex : 0
    });
  }

  gif.finish();
  return gif.bytes();
}

console.log('Generating loading GIFs...');

console.log('1. Generating logo-spinner.gif (orbit arc)...');
const spinnerBytes = generateSpinnerOrbit(false);
fs.writeFileSync(path.join(OUTPUT_DIR, 'logo-spinner.gif'), spinnerBytes);
fs.writeFileSync(path.join(OUTPUT_DIR, 'logo-loader.gif'), spinnerBytes); // Flagship default

console.log('2. Generating logo-pulse.gif (breathing ripple)...');
const pulseBytes = generatePulseRipple(false);
fs.writeFileSync(path.join(OUTPUT_DIR, 'logo-pulse.gif'), pulseBytes);

console.log('3. Generating logo-shimmer.gif (light sweep)...');
const shimmerBytes = generateShimmer(false);
fs.writeFileSync(path.join(OUTPUT_DIR, 'logo-shimmer.gif'), shimmerBytes);

console.log('4. Generating logo-flip.gif (3D flip bounce)...');
const flipBytes = generateFlipSpin(false);
fs.writeFileSync(path.join(OUTPUT_DIR, 'logo-flip.gif'), flipBytes);

console.log('5. Generating dark-mode versions...');
fs.writeFileSync(path.join(OUTPUT_DIR, 'logo-spinner-dark.gif'), generateSpinnerOrbit(true));
fs.writeFileSync(path.join(OUTPUT_DIR, 'logo-pulse-dark.gif'), generatePulseRipple(true));

console.log('All GIF files generated successfully!');
