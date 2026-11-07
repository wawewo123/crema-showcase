// Hand-built SVG "photos" for the synthetic demo pins. Generated in code, so
// there are no downloaded/copyrighted images and they work fully offline.

const svg = (body: string) =>
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${body}</svg>`)

const grain = `<filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .2 0 0 0 0 .12 0 0 0 0 .07 0 0 0 .18 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>`

/** Top-down flat white with a rosetta on a wooden table */
export const flatWhite = svg(`<defs>${grain}
<linearGradient id="w" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#b9875b"/><stop offset="1" stop-color="#7a5236"/></linearGradient>
<radialGradient id="c" cx=".45" cy=".42"><stop offset="0" stop-color="#e9c595"/><stop offset=".7" stop-color="#c38b55"/><stop offset="1" stop-color="#8a5530"/></radialGradient>
<radialGradient id="s"><stop offset=".75" stop-color="#000" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>
<rect width="200" height="200" fill="url(#w)"/>
<g stroke="#6a452c" stroke-opacity=".35" fill="none"><path d="M0 40c60-8 140 6 200-4M0 92c70-10 120 8 200 0M0 150c50 6 130-10 200 2"/></g>
<rect width="200" height="200" filter="url(#n)"/>
<circle cx="104" cy="108" r="84" fill="url(#s)"/>
<circle cx="100" cy="100" r="78" fill="#f7f1e6"/><circle cx="100" cy="100" r="70" fill="#efe5d6"/>
<path d="M165 88c22-6 30 26 6 30" fill="none" stroke="#f7f1e6" stroke-width="11" stroke-linecap="round"/>
<circle cx="100" cy="100" r="54" fill="#fffaf1"/><circle cx="100" cy="100" r="47" fill="url(#c)"/>
<g fill="#fdf3e1"><path d="M100 64c-4 0-6 6-2 9-9 1-12 9-6 12-10 3-11 12-4 15-9 4-8 13 0 15-6 5-2 12 6 12h12c8 0 12-7 6-12 8-2 9-11 0-15 7-3 6-12-4-15 6-3 3-11-6-12 4-3 2-9-2-9z" opacity=".95"/></g>
<path d="M100 66v62" stroke="#c38b55" stroke-width="2" opacity=".6"/>
<ellipse cx="80" cy="80" rx="18" ry="8" fill="#fff" opacity=".12" transform="rotate(-30 80 80)"/>`)

/** Café storefront with striped awning */
export const storefront = (awning = '#c0603a', wall = '#2f4a43') =>
  svg(`<defs>${grain}<linearGradient id="sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#cfe0e4"/><stop offset="1" stop-color="#f3e6d2"/></linearGradient>
<linearGradient id="glow" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffd99a"/><stop offset="1" stop-color="#e2a55c"/></linearGradient></defs>
<rect width="200" height="200" fill="url(#sky)"/>
<rect x="18" y="30" width="164" height="170" fill="${wall}"/>
<rect x="18" y="30" width="164" height="22" fill="#000" opacity=".15"/>
<text x="100" y="46" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="#f7f1e6" letter-spacing="3">COFFEE</text>
<g>${Array.from({ length: 8 }, (_, i) => `<path d="M${22 + i * 20} 58h20l-4 26h-12z" fill="${i % 2 ? '#fffaf1' : awning}"/>`).join('')}</g>
<path d="M22 84${Array.from({ length: 8 }, () => `q10 9 20 0`).join('')}" fill="${awning}" opacity=".9"/>
<rect x="30" y="98" width="82" height="70" rx="3" fill="url(#glow)"/>
<g stroke="${wall}" stroke-width="4"><path d="M71 98v70M30 133h82"/></g>
<g fill="#7a4a2a" opacity=".55"><circle cx="50" cy="150" r="7"/><rect x="44" y="156" width="12" height="12"/><circle cx="92" cy="146" r="6"/><rect x="87" y="151" width="10" height="17"/></g>
<rect x="124" y="98" width="46" height="102" rx="2" fill="#1d2e2a"/><rect x="130" y="104" width="34" height="44" fill="url(#glow)" opacity=".8"/>
<circle cx="158" cy="160" r="2.5" fill="#d9a86c"/>
<rect x="0" y="186" width="200" height="14" fill="#9a8f84"/>
<g transform="translate(36 168)"><rect width="34" height="24" fill="#2b1a12"/><text x="17" y="15" text-anchor="middle" font-family="Georgia,serif" font-size="8" fill="#f7f1e6">FLAT</text></g>
<rect width="200" height="200" filter="url(#n)"/>`)

/** V60 pour-over on a light counter */
export const pourOver = svg(`<defs>${grain}<linearGradient id="bg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e8ddcc"/><stop offset="1" stop-color="#d4c2a6"/></linearGradient>
<linearGradient id="gl" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity=".15"/><stop offset="1" stop-color="#fff" stop-opacity=".45"/></linearGradient>
<linearGradient id="br" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#9a4e22"/><stop offset="1" stop-color="#4a2210"/></linearGradient></defs>
<rect width="200" height="200" fill="url(#bg)"/><rect y="150" width="200" height="50" fill="#b99a74"/><rect y="150" width="200" height="4" fill="#a3855f"/>
<ellipse cx="100" cy="186" rx="52" ry="7" fill="#000" opacity=".15"/>
<path d="M62 118h76l-8 66H70z" fill="url(#br)"/><path d="M58 112h84l-10 74H68z" fill="url(#gl)" stroke="#fff" stroke-opacity=".6"/>
<path d="M140 128c18 0 20 34 0 34" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="5"/>
<path d="M50 56h100l-34 50H84z" fill="#fffaf1"/><path d="M50 56h100l-4 6H54z" fill="#e4d8c4"/>
<rect x="76" y="104" width="48" height="10" rx="2" fill="#f1e6d4"/>
<path d="M66 60h68l-28 40h-12z" fill="#f4ecdf"/>
<path d="M100 10c0 20-2 34 0 52" stroke="#a8673a" stroke-width="3" stroke-linecap="round" opacity=".8"/>
<path d="M120 14c-22 0-40 4-56 22" stroke="#cfc6bb" stroke-width="8" stroke-linecap="round" fill="none"/>
<rect width="200" height="200" filter="url(#n)"/>`)

/** Cortado in a Gibraltar glass, side view */
export const cortado = svg(`<defs>${grain}<linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#2f3b3a"/><stop offset="1" stop-color="#1b2221"/></linearGradient>
<linearGradient id="cf" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f3e4cc"/><stop offset=".35" stop-color="#d9a86c"/><stop offset=".6" stop-color="#8b4f27"/><stop offset="1" stop-color="#3a1d0e"/></linearGradient></defs>
<rect width="200" height="200" fill="url(#bg)"/>
<circle cx="150" cy="40" r="60" fill="#ffd99a" opacity=".12"/>
<rect y="150" width="200" height="50" fill="#6b4a33"/><rect y="150" width="200" height="3" fill="#8a6446"/>
<ellipse cx="100" cy="166" rx="44" ry="7" fill="#000" opacity=".35"/>
<path d="M64 70h72l-6 92H70z" fill="url(#cf)"/>
<g stroke="#fff" stroke-opacity=".35" stroke-width="2" fill="none"><path d="M66 100h68M67 112h66M68 124h64M68 136h63"/></g>
<path d="M62 66h76l-7 98H69z" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>
<ellipse cx="100" cy="70" rx="36" ry="5" fill="#fbf1e2"/>
<path d="M74 80l3 72" stroke="#fff" stroke-opacity=".45" stroke-width="4" stroke-linecap="round"/>
<rect width="200" height="200" filter="url(#n)"/>`)

/** Espresso cup and a pastry on a marble bar */
export const espresso = svg(`<defs>${grain}<linearGradient id="m" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#f4f1ec"/><stop offset="1" stop-color="#d9d3ca"/></linearGradient>
<radialGradient id="cr" cx=".4" cy=".4"><stop offset="0" stop-color="#e2b27a"/><stop offset="1" stop-color="#7a4321"/></radialGradient>
<linearGradient id="pa" x1="0" x2="1"><stop offset="0" stop-color="#e7b46a"/><stop offset="1" stop-color="#b06e2c"/></linearGradient></defs>
<rect width="200" height="200" fill="url(#m)"/>
<g stroke="#b9b0a4" stroke-opacity=".5" fill="none"><path d="M-10 60c40 10 60-20 120 10s70 0 100 20M20 200c20-40 70-30 90-80"/></g>
<ellipse cx="78" cy="118" rx="58" ry="52" fill="#000" opacity=".1"/>
<circle cx="72" cy="108" r="54" fill="#2b1a12"/><circle cx="72" cy="108" r="46" fill="#3a2418"/>
<circle cx="72" cy="108" r="34" fill="#fffaf1"/><circle cx="72" cy="108" r="27" fill="url(#cr)"/>
<path d="M110 82c16-8 26 10 12 18" fill="none" stroke="#2b1a12" stroke-width="8" stroke-linecap="round"/>
<g transform="translate(150 150) rotate(-25)"><path d="M-40 0c10-26 70-26 80 0c-10 14-70 14-80 0z" fill="url(#pa)"/>
<g stroke="#8d541f" stroke-width="3" opacity=".6" fill="none"><path d="M-20-12c4 8 4 16 0 22M0-16c3 10 3 20 0 28M20-12c-4 8-4 16 0 22"/></g></g>
<rect x="128" y="22" width="8" height="54" rx="4" fill="#c7bfb3" transform="rotate(30 132 49)"/>
<rect width="200" height="200" filter="url(#n)"/>`)
