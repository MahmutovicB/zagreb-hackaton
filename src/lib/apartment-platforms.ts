/**
 * Croatian real estate platforms — verified URL patterns.
 *
 * Research findings:
 *  - nekretnine.hr: /najam-stambene-nekretnine/zagreb/{slug}/   ✓ confirmed ~2,478 results
 *  - crozilla.com:  /en/to_rent-apartments/{slug}               ✓ confirmed ~1,664 results
 *  - oglasnik.hr:   /stanovi-najam                              ✓ confirmed, no per-district URL
 *  - njuskalo.hr:   /iznajmljivanje-stanova/zagreb              ✓ base works; district slugs unverifiable (bot-blocked)
 */

export interface PlatformLink {
  id: string
  name: string
  tagline: string
  color: string
  bgColor: string
  logo: string
  url: string
  scope: 'neighborhood' | 'zagreb' // whether link is scoped to the specific neighborhood
  type: 'rent' | 'sale' | 'both'
}

export interface NeighborhoodSearchParams {
  nameCroatian: string  // "Trešnjevka-Jug"
  id: string            // "tresnjevka-jug" — matches neighborhoods.json id
  lat: number
  lng: number
}

// ---------------------------------------------------------------------------
// Nekretnine.hr slug map
// Pattern: https://www.nekretnine.hr/najam-stambene-nekretnine/zagreb/{slug}/
// Confirmed neighborhood slugs (lowercase, diacritics stripped, hyphenated).
// ---------------------------------------------------------------------------
const NEKRETNINE_SLUGS: Record<string, string> = {
  'donji-grad':        'donji-grad',
  'gornji-grad':       'gornji-grad-medvescak',
  'trnje':             'trnje',
  'maksimir':          'maksimir',
  'pescenica-zitnjak': 'pescenica-zitnjak',
  'novi-zagreb-istok': 'novi-zagreb-istok',
  'novi-zagreb-zapad': 'novi-zagreb-zapad',
  'tresnjevka-sjever': 'tresnjevka-sjever',
  'tresnjevka-jug':    'tresnjevka-jug',
  'crnomerec':         'crnomerec',
  'gornja-dubrava':    'gornja-dubrava',
  'donja-dubrava':     'donja-dubrava',
  'stenjevec':         'stenjevec',
  'podsused-vrapce':   'podsused-vrapce',
  'podsljeme':         'podsljeme',
  'sesvete':           'sesvete',
  'brezovica':         'brezovica',
}

// ---------------------------------------------------------------------------
// Crozilla.com slug map
// Pattern: https://www.crozilla.com/en/to_rent-apartments/{slug}
// Confirmed working slugs from research. Falls back to /zagreb for unknowns.
// ---------------------------------------------------------------------------
const CROZILLA_SLUGS: Record<string, string> = {
  'donji-grad':        'donji-grad',
  'gornji-grad':       'gornji-grad-medvescak',
  'trnje':             'trnje',
  'maksimir':          'maksimir',
  'pescenica-zitnjak': 'pescenica-zitnjak',
  'novi-zagreb-istok': 'novi-zagreb-istok',
  'novi-zagreb-zapad': 'novi-zagreb-zapad',
  'tresnjevka-sjever': 'tresnjevka-sjever',
  'tresnjevka-jug':    'tresnjevka-jug',
  'crnomerec':         'crnomerec',
  'gornja-dubrava':    'gornja-dubrava',
  'donja-dubrava':     'donja-dubrava',
  'stenjevec':         'stenjevec',
  'podsused-vrapce':   'podsused-vrapce',
  'podsljeme':         'podsljeme',
  'sesvete':           'sesvete',
  'brezovica':         'brezovica',
}

// ---------------------------------------------------------------------------
// Build short-term rental links (Booking.com, Airbnb) for a given neighborhood
// ---------------------------------------------------------------------------
export function buildShortTermLinks(params: NeighborhoodSearchParams): PlatformLink[] {
  const { nameCroatian, lat, lng } = params
  const bookingQuery = encodeURIComponent(`${nameCroatian}, Zagreb, Croatia`)

  return [
    {
      id: 'booking',
      name: 'Booking.com',
      tagline: `Apartmani — ${nameCroatian}`,
      color: '#003580',
      bgColor: 'rgba(0,53,128,0.12)',
      logo: '🏨',
      // nflt=ht_id%3D201 filters for apartments only
      url: `https://www.booking.com/searchresults.html?ss=${bookingQuery}&nflt=ht_id%3D201`,
      scope: 'neighborhood',
      type: 'both',
    },
    {
      id: 'airbnb',
      name: 'Airbnb',
      tagline: `Kratki najam — ${nameCroatian}`,
      color: '#FF5A5F',
      bgColor: 'rgba(255,90,95,0.10)',
      logo: '🏡',
      // Bounding box centred on neighborhood centroid (~1.2km radius)
      url: `https://www.airbnb.com/s/homes?ne_lat=${(lat + 0.012).toFixed(6)}&ne_lng=${(lng + 0.018).toFixed(6)}&sw_lat=${(lat - 0.012).toFixed(6)}&sw_lng=${(lng - 0.018).toFixed(6)}&zoom_level=14`,
      scope: 'neighborhood',
      type: 'both',
    },
  ]
}

// ---------------------------------------------------------------------------
// Build all platform links for a given neighborhood
// ---------------------------------------------------------------------------
export function buildPlatformLinks(params: NeighborhoodSearchParams): PlatformLink[] {
  const { id, nameCroatian, lat, lng } = params

  const nekretnineSlug = NEKRETNINE_SLUGS[id]
  const crozillaSlug = CROZILLA_SLUGS[id]

  return [
    // ── NJUŠKALO ────────────────────────────────────────────────────────────
    // District-level URLs are bot-blocked and unverifiable; use Zagreb base.
    // Adding the neighborhood name as a query keeps intent visible in the URL.
    {
      id: 'njuskalo-rent',
      name: 'Njuškalo',
      tagline: 'Najveći oglasnik — najam stanova',
      color: '#e85d24',
      bgColor: 'rgba(232,93,36,0.10)',
      logo: '🦊',
      url: `https://www.njuskalo.hr/iznajmljivanje-stanova/zagreb`,
      scope: 'zagreb',
      type: 'rent',
    },
    {
      id: 'njuskalo-sale',
      name: 'Njuškalo — Prodaja',
      tagline: 'Kupnja stanova — Zagreb',
      color: '#e85d24',
      bgColor: 'rgba(232,93,36,0.07)',
      logo: '🦊',
      url: `https://www.njuskalo.hr/prodaja-stanova/zagreb`,
      scope: 'zagreb',
      type: 'sale',
    },

    // ── NEKRETNINE.HR ────────────────────────────────────────────────────────
    // Confirmed pattern: /najam-stambene-nekretnine/zagreb/{slug}/
    {
      id: 'nekretnine-rent',
      name: 'Nekretnine.hr',
      tagline: nekretnineSlug
        ? `Stanovi na najam — ${nameCroatian}`
        : 'Stanovi na najam — Zagreb',
      color: '#1a73e8',
      bgColor: 'rgba(26,115,232,0.10)',
      logo: '🏠',
      url: nekretnineSlug
        ? `https://www.nekretnine.hr/najam-stambene-nekretnine/zagreb/${nekretnineSlug}/`
        : `https://www.nekretnine.hr/najam-stambene-nekretnine/zagreb/`,
      scope: nekretnineSlug ? 'neighborhood' : 'zagreb',
      type: 'rent',
    },
    {
      id: 'nekretnine-sale',
      name: 'Nekretnine.hr — Prodaja',
      tagline: nekretnineSlug
        ? `Kupnja stanova — ${nameCroatian}`
        : 'Kupnja stanova — Zagreb',
      color: '#1a73e8',
      bgColor: 'rgba(26,115,232,0.07)',
      logo: '🏠',
      url: nekretnineSlug
        ? `https://www.nekretnine.hr/prodaja-stambene-nekretnine/zagreb/${nekretnineSlug}/`
        : `https://www.nekretnine.hr/prodaja-stambene-nekretnine/zagreb/`,
      scope: nekretnineSlug ? 'neighborhood' : 'zagreb',
      type: 'sale',
    },

    // ── CROZILLA.COM ─────────────────────────────────────────────────────────
    // Confirmed pattern: /en/to_rent-apartments/{slug}
    {
      id: 'crozilla-rent',
      name: 'Crozilla',
      tagline: crozillaSlug
        ? `Rent apartments — ${nameCroatian}`
        : 'Rent apartments — Zagreb',
      color: '#00a651',
      bgColor: 'rgba(0,166,81,0.10)',
      logo: '🌿',
      url: crozillaSlug
        ? `https://www.crozilla.com/en/to_rent-apartments/${crozillaSlug}`
        : `https://www.crozilla.com/en/to_rent-apartments/zagreb`,
      scope: crozillaSlug ? 'neighborhood' : 'zagreb',
      type: 'rent',
    },
    {
      id: 'crozilla-sale',
      name: 'Crozilla — Sale',
      tagline: crozillaSlug
        ? `Buy apartments — ${nameCroatian}`
        : 'Buy apartments — Zagreb',
      color: '#00a651',
      bgColor: 'rgba(0,166,81,0.07)',
      logo: '🌿',
      url: crozillaSlug
        ? `https://www.crozilla.com/en/for_sale-apartments/${crozillaSlug}`
        : `https://www.crozilla.com/en/for_sale-apartments/zagreb`,
      scope: crozillaSlug ? 'neighborhood' : 'zagreb',
      type: 'sale',
    },

    // ── OGLASNIK.HR ──────────────────────────────────────────────────────────
    // Confirmed: /stanovi-najam works. No per-district URL exists.
    {
      id: 'oglasnik',
      name: 'Oglasnik.hr',
      tagline: 'Stanovi i sobe na najam — Zagreb',
      color: '#f5a623',
      bgColor: 'rgba(245,166,35,0.10)',
      logo: '📋',
      url: `https://oglasnik.hr/stanovi-najam`,
      scope: 'zagreb',
      type: 'rent',
    },

    // ── GOOGLE MAPS ──────────────────────────────────────────────────────────
    // Always works. Opens a map search centred on the neighborhood.
    {
      id: 'google-maps',
      name: 'Google Maps',
      tagline: `Stanovi u blizini — ${nameCroatian}`,
      color: '#4285f4',
      bgColor: 'rgba(66,133,244,0.10)',
      logo: '📍',
      url: `https://www.google.com/maps/search/stanovi+najam+${encodeURIComponent(nameCroatian)}+Zagreb/@${lat},${lng},15z`,
      scope: 'neighborhood',
      type: 'both',
    },
  ]
}
