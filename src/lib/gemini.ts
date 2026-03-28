import { GoogleGenerativeAI } from '@google/generative-ai'
import type { SearchCriteria, NeighborhoodScore } from '@/types'

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash' })

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

Primjeri mapiranja:
- "bez auta" → noCar: true
- "obitelj s djetetom" → hasChild: true
- "beba" / "infant" / "dijete do 3 godine" → hasInfant: true
- "tiho" / "miran" → needsQuiet: true
- "zeleno" / "parkovi" → prefersGreen: true
- "student" → isStudent: true
- "biciklom" → prefersBike: true
- "umirovljenik" / "starija osoba" → isElderly: true
- "pas" / "kućni ljubimac" → hasDog: true
- "jeftino" / "povoljno" → budgetRange: "low"
- "luksuzno" / "skupo" → budgetRange: "high"
- posao u [kvart/adresa] → workLocation: "[adresa], Zagreb"

Korisnikov upit: `

const NARRATIVE_PROMPT = `Ti si lokalni vodič po Zagrebu koji savjetuje ljude gdje živjeti.

Korisnikov upit: {query}

Top 3 preporučena kvarta (sortirano po bodovima):
{neighborhoods}

Napiši preporuku na hrvatskom jeziku. Budi konkretan, srdačan i koristan.
- 2-3 rečenice zašto su ovi kvartovi dobri za ovog korisnika
- Spominji stvarne ulice, tramvajske linije (npr. tram 14, tram 6), parkove, vrtne tržnice
- Ako postoje aktivni komunalni radovi u top kvartu, upozori korisnika (ali nenametljivo)
- Završi pozitivno

Format: samo tekst, bez liste, bez markdown.`

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
  topNeighborhoods: NeighborhoodScore[]
): Promise<string> {
  try {
    const top3 = topNeighborhoods.slice(0, 3).map(n => ({
      name: n.nameCroatian,
      score: n.score,
      activeWorks: n.activeWorksCount,
      kindergartenSpots: n.kindergartenSpotsCount,
      transitDistance: n.nearestZetMeters,
      commute: n.commuteMinutes,
    }))

    const prompt = NARRATIVE_PROMPT
      .replace('{query}', query)
      .replace('{neighborhoods}', JSON.stringify(top3, null, 2))

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
    })
    return result.response.text()
  } catch {
    const top = topNeighborhoods[0]
    return `Na temelju vašeg upita, ${top?.nameCroatian ?? 'Zagreb'} se čini kao odličan izbor. Kvart nudi dobru kombinaciju pristupačnosti i kvalitete života.`
  }
}

export async function generateNarrativeStream(
  query: string,
  topNeighborhoods: NeighborhoodScore[]
): Promise<ReadableStream<Uint8Array>> {
  const top3 = topNeighborhoods.slice(0, 3).map(n => ({
    name: n.nameCroatian,
    score: n.score,
    activeWorks: n.activeWorksCount,
    kindergartenSpots: n.kindergartenSpotsCount,
    transitDistance: n.nearestZetMeters,
  }))

  const prompt = NARRATIVE_PROMPT
    .replace('{query}', query)
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
