const encodeSvg = (svg: string) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

export const buildImageFallback = (seed?: string | null) => {
  const safeSeed = (seed || "Coincart").trim().slice(0, 48);
  const label = safeSeed.length > 0 ? safeSeed : "Coincart";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='750' viewBox='0 0 1200 750'>
  <defs>
    <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
      <stop offset='0%' stop-color='%2310182A'/>
      <stop offset='100%' stop-color='%23273652'/>
    </linearGradient>
  </defs>
  <rect width='1200' height='750' fill='url(%23g)'/>
  <circle cx='980' cy='140' r='220' fill='rgba(255,255,255,0.08)'/>
  <circle cx='220' cy='650' r='260' fill='rgba(255,255,255,0.06)'/>
  <text x='600' y='360' text-anchor='middle' fill='white' font-size='46' font-family='Arial,sans-serif' opacity='0.92'>Image unavailable</text>
  <text x='600' y='420' text-anchor='middle' fill='white' font-size='28' font-family='Arial,sans-serif' opacity='0.8'>${label}</text>
</svg>`;
  return encodeSvg(svg);
};
