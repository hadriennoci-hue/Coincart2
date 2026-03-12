export const runtime = "edge";

const ALLOWED_HOSTS = new Set(["img.coincart.store"]);

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

const buildFallbackSvg = (seed: string) => {
  const hash = hashSeed(seed);
  const hueA = hash % 360;
  const hueB = (hash + 70) % 360;
  const label = escapeXml(seed.replace(/[-_]/g, " "));

  return `<?xml version="1.0" encoding="UTF-8"?>
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
  <text x="90" y="130" fill="rgba(255,255,255,0.86)" font-size="40" font-family="Segoe UI, Arial, sans-serif" font-weight="700">Coincart Image</text>
  <text x="90" y="910" fill="rgba(255,255,255,0.74)" font-size="34" font-family="Segoe UI, Arial, sans-serif">${label}</text>
</svg>`;
};

const fallbackResponse = (seed: string) =>
  new Response(buildFallbackSvg(seed), {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const targetRaw = url.searchParams.get("url");
  const seed = (url.searchParams.get("seed") || "coincart-image").slice(0, 80);

  if (!targetRaw) return fallbackResponse(seed);

  let target: URL;
  try {
    target = new URL(targetRaw);
  } catch {
    return fallbackResponse(seed);
  }

  if (!["http:", "https:"].includes(target.protocol)) return fallbackResponse(seed);
  if (!ALLOWED_HOSTS.has(target.hostname)) return fallbackResponse(seed);

  try {
    const upstream = await fetch(target.toString(), {
      headers: { Accept: "image/*,*/*;q=0.8" },
      cache: "force-cache",
    });
    if (!upstream.ok) return fallbackResponse(seed);

    const contentType = upstream.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) return fallbackResponse(seed);

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=14400",
      },
    });
  } catch {
    return fallbackResponse(seed);
  }
}

