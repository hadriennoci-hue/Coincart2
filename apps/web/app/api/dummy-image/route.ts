export const runtime = "edge";

const hashSeed = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const escapeXml = (input: string) =>
  input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export async function GET(request: Request) {
  const url = new URL(request.url);
  const seed = (url.searchParams.get("seed") || "coincart").slice(0, 80);
  const hash = hashSeed(seed);
  const hueA = hash % 360;
  const hueB = (hash + 70) % 360;
  const label = escapeXml(seed.replace(/[-_]/g, " "));

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hueA}, 55%, 28%)" />
      <stop offset="100%" stop-color="hsl(${hueB}, 62%, 20%)" />
    </linearGradient>
    <radialGradient id="glow" cx="80%" cy="20%" r="60%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.25)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0)" />
    </radialGradient>
  </defs>
  <rect width="1600" height="1000" fill="url(#bg)" />
  <rect width="1600" height="1000" fill="url(#glow)" />
  <g fill="none" stroke="rgba(255,255,255,0.18)">
    <rect x="52" y="52" width="1496" height="896" rx="22" />
    <path d="M90 840 L1510 840" />
    <path d="M90 160 L1510 160" />
  </g>
  <text x="90" y="130" fill="rgba(255,255,255,0.86)" font-size="40" font-family="Segoe UI, Arial, sans-serif" font-weight="700">Coincart Demo Image</text>
  <text x="90" y="910" fill="rgba(255,255,255,0.74)" font-size="34" font-family="Segoe UI, Arial, sans-serif">${label}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

