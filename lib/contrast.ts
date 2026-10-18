export type RGB = [number, number, number];

export function readRGB(input: string): RGB | null {
  const text = input.trim().toLowerCase();
  if (text === "transparent") return null;
  const alphaMatch = text.match(/^rgba\([^)]*,\s*(0(?:\.\d+)?|1(?:\.0+)?)\s*\)$/);
  if (alphaMatch && Number(alphaMatch[1]) !== 1) return null;
  const hex = text.match(/^#([a-f0-9]{6})$/);
  if (hex) return [0, 2, 4].map(i => parseInt(hex[1].slice(i, i + 2), 16)) as RGB;
  const rgb = text.match(/^rgba?\(\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)/);
  if (!rgb) return null;
  if (text.startsWith("rgba(") && /,\s*0(?:\.0+)?\s*\)$/.test(text)) return null;
  return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])].map(n => Math.min(255, Math.max(0, n))) as RGB;
}

export function toHex(rgb: RGB): string {
  return "#" + rgb.map(n => Math.round(n).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function luminance(rgb: RGB): number {
  const channels = rgb.map(v => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function contrast(a: RGB, b: RGB): number {
  const first = luminance(a), second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export function findAccessibleColor(changing: RGB, fixed: RGB, threshold: number): RGB | null {
  if (contrast(changing, fixed) >= threshold) return changing;
  let best: { color: RGB; distance: number } | null = null;
  for (const target of [0, 255]) {
    for (let step = 1; step <= 100; step++) {
      const t = step / 100;
      const rgb = changing.map(c => Math.round(c * (1 - t) + target * t)) as RGB;
      if (contrast(rgb, fixed) >= threshold) {
        const distance = rgb.reduce((sum, c, index) => sum + (c - changing[index]) ** 2, 0);
        if (!best || distance < best.distance) best = { color: rgb, distance };
        break;
      }
    }
  }
  return best?.color ?? null;
}
