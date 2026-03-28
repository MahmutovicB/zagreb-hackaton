/** Accurate Zagreb tram stop positions — key stops across all 17 lines */
export interface ZetStop {
  id: string
  name: string
  lat: number
  lng: number
  lines: string[]
  terminal?: boolean
}

export const ZET_TRAM_STOPS: ZetStop[] = [
  // ── Core city centre ────────────────────────────────────────
  { id: 'jelacic',    name: 'Trg bana Jelačića',  lat: 45.8130, lng: 15.9774, lines: ['1','2','6','11','12','13','14','17'] },
  { id: 'zrinjevac',  name: 'Zrinjevac',           lat: 45.8095, lng: 15.9773, lines: ['2','3','4','5','7','9','14'] },
  { id: 'kolodvor',   name: 'Glavni kolodvor',     lat: 45.8044, lng: 15.9753, lines: ['2','4','9'] },
  { id: 'frankopan',  name: 'Frankopanska',        lat: 45.8130, lng: 15.9700, lines: ['1','6','11','12'] },
  { id: 'draskoviceva',name:'Draškovićeva',         lat: 45.8138, lng: 15.9843, lines: ['3','5','7','8','13'] },
  { id: 'savisce',    name: 'Savišće',             lat: 45.8162, lng: 15.9905, lines: ['4','7','9'] },

  // ── West ────────────────────────────────────────────────────
  { id: 'savska',     name: 'Savska cesta',        lat: 45.8068, lng: 15.9590, lines: ['2','3','5','14'] },
  { id: 'britanskitrg',name:'Britanski trg',       lat: 45.8179, lng: 15.9641, lines: ['2','5','6'] },
  { id: 'ilica',      name: 'Ilica / Tratinska',   lat: 45.8101, lng: 15.9558, lines: ['3','12'] },
  { id: 'crnomerec',  name: 'Črnomerec',           lat: 45.8220, lng: 15.9193, lines: ['2','6','11','12'], terminal: true },
  { id: 'sopot',      name: 'Sopot',               lat: 45.8209, lng: 15.8889, lines: ['4','6'], terminal: true },
  { id: 'spansko',    name: 'Špansko',             lat: 45.8195, lng: 15.8752, lines: ['7'], terminal: true },

  // ── South ───────────────────────────────────────────────────
  { id: 'savskimost', name: 'Savski most',         lat: 45.7899, lng: 15.9558, lines: ['2','3','14'], terminal: true },
  { id: 'remetinec',  name: 'Remetinec',           lat: 45.7821, lng: 15.9502, lines: ['3'], terminal: true },
  { id: 'trnjanska',  name: 'Trnjanska / Bundek',  lat: 45.7988, lng: 15.9968, lines: ['4','9'] },

  // ── East ────────────────────────────────────────────────────
  { id: 'kvaternikov',name: 'Kvaternikov trg',     lat: 45.8063, lng: 16.0197, lines: ['3','5','7','11','13'] },
  { id: 'heinzelova', name: 'Heinzelova',          lat: 45.8148, lng: 16.0050, lines: ['4','7','9'] },
  { id: 'maksimir',   name: 'Maksimir',            lat: 45.8175, lng: 16.0277, lines: ['11','12'] },
  { id: 'borongaj',   name: 'Borongaj',            lat: 45.8152, lng: 16.0452, lines: ['1','9','17'], terminal: true },
  { id: 'dubec',      name: 'Dubec',               lat: 45.8261, lng: 16.1097, lines: ['7','12'], terminal: true },

  // ── North ───────────────────────────────────────────────────
  { id: 'mihaljevac', name: 'Mihaljevac',          lat: 45.8540, lng: 15.9840, lines: ['8','14'], terminal: true },
]
