import { GoogleGenerativeAI } from '@google/generative-ai'
import type { SearchCriteria, NeighborhoodScore } from '@/types'
import neighborhoodsData from '@/data/neighborhoods.json'

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash' })
console.log('Gemini key loaded:', !!process.env.GEMINI_API_KEY)                                               

const EXTRACT_CRITERIA_PROMPT = `Ti si asistent za pretragu stanova u Zagrebu. Korisnik opisuje gdje želi živjeti.
Izvuci strukturirane kriterije iz opisa.

Odgovori SAMO u JSON formatu, bez markdown blokova, bez komentara:
{
  "hasChild": boolean,
  "hasInfant": boolean,
  "noCar": boolean,
  "needsQuiet": boolean,
  "workLocation": string | null,
  "maxCommuteMinutes": number | null,
  "needsPharmacy": boolean,
  "needsHealthCenter": boolean,
  "prefersBike": boolean,
  "isStudent": boolean,
  "isElderly": boolean,
  "hasDog": boolean,
  "prefersGreen": boolean,
  "budgetRange": "low" | "mid" | "high" | null,
  "rawQuery": string
}

Pravila mapiranja:
- "bez auta" / "nemam auto" / "javnim prijevozom" / "tramvajem" / "pješice" → noCar: true
- "obitelj s djetetom" / "djeca" / "mlada obitelj" / "dobra škola" → hasChild: true
- "beba" / "novorođenče" / "dijete do 3" / "dojenje" / "jasli" → hasInfant: true
- "tiho" / "miran" / "bez buke" / "mirno mjesto" / "tišina" → needsQuiet: true
- "zeleno" / "parkovi" / "priroda" / "šuma" / "zelenilo" → prefersGreen: true
- "student" / "faks" / "fakultet" / "studentski dom" → isStudent: true
- "biciklom" / "bicikl" / "staze" / "cycling" → prefersBike: true
- "umirovljenik" / "penzioner" / "starija osoba" / "mirovina" → isElderly: true
- "pas" / "kućni ljubimac" / "šetnja psa" → hasDog: true
- "ljekarna" / "lijek" / "apoteka" → needsPharmacy: true
- "liječnik" / "zdravstveni centar" / "dom zdravlja" → needsHealthCenter: true
- "jeftino" / "povoljno" / "pristupačno" / "skromno" / "ne trebam luksuz" → budgetRange: "low"
- "srednji budžet" / "normalno" → budgetRange: "mid"
- "luksuzno" / "ekskluzivno" / "premium" / "skupo nije problem" → budgetRange: "high"
- "radi u" / "posao u" / "uredima" / "trebam biti blizu" [lokacija] → workLocation: "[samo naziv ulice ili kvarta, bez 'Zagreb']"
- "za X minuta do" / "max X minuta" → maxCommuteMinutes: X

Napomena za workLocation: izvuci SAMO naziv mjesta/ulice, BEZ dodavanja "Zagreb" na kraj.

Korisnikov upit: `

const NARRATIVE_PROMPT = `Ti si lokalni stručnjak za Zagreb koji savjetuje ljude gdje živjeti. Poznaješ svaki kvart, svaki tramvaj, svaki park.

Korisnikov upit: "{query}"

Što korisnik konkretno traži: {criteriaDescription}

Top 3 preporučena kvarta s detaljima:
{neighborhoods}

Napiši osobnu preporuku na HRVATSKOM (2-4 rečenice, flowing tekst):
- U prvoj rečenici direktno adresirj korisnikov zahtjev i imenuj top kvart
- Navedi konkretan razlog zašto je to dobar izbor — koristi stvarne nazive iz "highlights" (npr. "tram 14", "Park Maksimir", "tržnica Trešnjevka", "Bundek")
- Ako korisnik traži mir/tišinu, a top kvart ima aktivnih radova, kratko upozori (jedna rečenica)
- Završi kontrastom između #1 i #2 kvarta (npr. "Trešnjevka-Jug je pristupačnija, dok Črnomerec nudi više zelenila")
- Budi konkretan i iskreno koristan — ne generički

Samo tekst, bez markdown, bez liste, bez naslova.`

function describeCriteria(criteria: SearchCriteria): string {
  const parts: string[] = []
  if (criteria.hasInfant) parts.push('ima bebu (prioritet: vrtić s mjestima)')
  else if (criteria.hasChild) parts.push('ima dijete (prioritet: vrtić/škola, park)')
  if (criteria.noCar) parts.push('nema auto — treba javni prijevoz')
  if (criteria.needsQuiet) parts.push('treba mir i tišinu')
  if (criteria.prefersGreen) parts.push('voli zelenilo i parkove')
  if (criteria.hasDog) parts.push('ima psa (treba parke i šetnice)')
  if (criteria.prefersBike) parts.push('vozi bicikl (treba staze)')
  if (criteria.isStudent) parts.push('student (blizina fakulteta, niže cijene)')
  if (criteria.isElderly) parts.push('starija osoba (pristupačnost, tišina)')
  if (criteria.needsPharmacy) parts.push('treba ljekarnu u blizini mjesta rada')
  if (criteria.workLocation) {
    const commute = criteria.maxCommuteMinutes ? ` (max ${criteria.maxCommuteMinutes} min)` : ''
    parts.push(`radi u: ${criteria.workLocation}${commute}`)
  }
  if (criteria.budgetRange === 'low') parts.push('ograničen budžet')
  else if (criteria.budgetRange === 'high') parts.push('visoki budžet — može premium lokaciju')
  return parts.length > 0 ? parts.join('; ') : 'nema posebnih zahtjeva'
}

export async function extractCriteria(query: string): Promise<SearchCriteria> {
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: EXTRACT_CRITERIA_PROMPT + query }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      }
    })
    const text = result.response.text()
    return JSON.parse(text) as SearchCriteria
  } catch {
    // Fallback with basic parsing
    return {
      hasChild: /dijete|djeca|beba|child|kid/i.test(query),
      hasInfant: /beba|infant|dojenče/i.test(query),
      noCar: /bez auta|no car|javni prijevoz/i.test(query),
      needsQuiet: /tiho|miran|quiet|peaceful/i.test(query),
      workLocation: null,
      maxCommuteMinutes: null,
      needsPharmacy: /ljekarna|pharmacy/i.test(query),
      needsHealthCenter: /liječnik|zdravstvo|health/i.test(query),
      prefersBike: /bicikl|bike|cycling/i.test(query),
      isStudent: /student/i.test(query),
      isElderly: /umirovljenik|stariji|elderly/i.test(query),
      hasDog: /pas|dog|kućni ljubimac/i.test(query),
      prefersGreen: /zelenilo|park|priroda|green/i.test(query),
      budgetRange: /jeftino|povoljno|cheap/i.test(query) ? 'low' : /skupo|luxury/i.test(query) ? 'high' : 'mid',
      rawQuery: query,
    }
  }
}

export async function generateNarrative(
  query: string,
  topNeighborhoods: NeighborhoodScore[],
  criteria?: SearchCriteria
): Promise<string> {
  try {
    const top3 = topNeighborhoods.slice(0, 3).map((n, i) => {
      const meta = (neighborhoodsData as Array<{ id: string; character: string; description: string; highlights: string[] }>)
        .find(nb => nb.id === n.id)
      return {
        rank: i + 1,
        name: n.nameCroatian,
        score: n.score,
        character: meta?.character ?? '',
        description: meta?.description ?? '',
        highlights: meta?.highlights ?? [],
        activeWorks: n.activeWorksCount,
        kindergartenSpots: n.kindergartenSpotsCount,
        nearestZetMeters: n.nearestZetMeters,
        commuteMinutes: n.commuteMinutes ?? null,
        topReasons: n.scoreBreakdown
          .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
          .slice(0, 4)
          .map(r => `${r.value > 0 ? '+' : ''}${r.value}: ${r.reason}`),
      }
    })

    const prompt = NARRATIVE_PROMPT
      .replace('{query}', query)
      .replace('{criteriaDescription}', criteria ? describeCriteria(criteria) : query)
      .replace('{neighborhoods}', JSON.stringify(top3, null, 2))

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 400 }
    })
    return result.response.text()
  } catch {
    const top = topNeighborhoods[0]
    return `Na temelju vašeg upita, ${top?.nameCroatian ?? 'Zagreb'} se čini kao odličan izbor. Kvart nudi dobru kombinaciju pristupačnosti i kvalitete života.`
  }
}

export async function generateNarrativeStream(
  query: string,
  topNeighborhoods: NeighborhoodScore[],
  criteria?: SearchCriteria
): Promise<ReadableStream<Uint8Array>> {
  const top3 = topNeighborhoods.slice(0, 3).map((n, i) => {
    const meta = (neighborhoodsData as Array<{ id: string; character: string; description: string; highlights: string[] }>)
      .find(nb => nb.id === n.id)
    return {
      rank: i + 1,
      name: n.nameCroatian,
      score: n.score,
      character: meta?.character ?? '',
      description: meta?.description ?? '',
      highlights: meta?.highlights ?? [],
      activeWorks: n.activeWorksCount,
      kindergartenSpots: n.kindergartenSpotsCount,
      nearestZetMeters: n.nearestZetMeters,
      topReasons: n.scoreBreakdown
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
        .slice(0, 4)
        .map(r => `${r.value > 0 ? '+' : ''}${r.value}: ${r.reason}`),
    }
  })

  const prompt = NARRATIVE_PROMPT
    .replace('{query}', query)
    .replace('{criteriaDescription}', criteria ? describeCriteria(criteria) : query)
    .replace('{neighborhoods}', JSON.stringify(top3, null, 2))

  const streamResult = await model.generateContentStream({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
  })

  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      for await (const chunk of streamResult.stream) {
        const text = chunk.text()
        if (text) controller.enqueue(encoder.encode(text))
      }
      controller.close()
    }
  })
}
