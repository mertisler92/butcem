import { ParsedRFQResult, ParsedRFQItem } from "@/types";
import { addDays, format } from "date-fns";

const TURKISH_MONTHS: { [key: string]: number } = {
  ocak: 0,
  şubat: 1,
  subat: 1,
  mart: 2,
  nisan: 3,
  mayıs: 4,
  mayis: 4,
  haziran: 5,
  temmuz: 6,
  ağustos: 7,
  agustos: 7,
  eylül: 8,
  eylul: 8,
  ekim: 9,
  kasım: 10,
  kasim: 10,
  aralık: 11,
  aralik: 11,
};

const COMMON_CATEGORIES: { [key: string]: string } = {
  sandalye: "etkinlik-organizasyon",
  koltuk: "etkinlik-organizasyon",
  masa: "etkinlik-organizasyon",
  bistro: "etkinlik-organizasyon",
  çadır: "etkinlik-organizasyon",
  cadir: "etkinlik-organizasyon",
  bariyer: "etkinlik-organizasyon",
  sahne: "etkinlik-organizasyon",
  ses: "etkinlik-organizasyon",
  ışık: "etkinlik-organizasyon",
  isik: "etkinlik-organizasyon",
  tv: "fuar-stand",
  televizyon: "fuar-stand",
  ekran: "fuar-stand",
  monitör: "fuar-stand",
  monitor: "fuar-stand",
  stand: "fuar-stand",
  buzdolabı: "fuar-stand",
  buzdolabi: "fuar-stand",
  fritöz: "endustriyel-mutfak",
  fritoz: "endustriyel-mutfak",
  ızgara: "endustriyel-mutfak",
  izgara: "endustriyel-mutfak",
  ocak: "endustriyel-mutfak",
  laptop: "teknoloji",
  bilgisayar: "teknoloji",
  tablet: "teknoloji",
  projektör: "teknoloji",
  projeksiyon: "teknoloji",
  yazıcı: "teknoloji",
  jeneratör: "teknik-operasyon",
  jenerator: "teknik-operasyon",
  fan: "teknik-operasyon",
  ısıtıcı: "teknik-operasyon",
  isitici: "teknik-operasyon",
};

/**
 * Parses freeform natural language text into a structured B2B RFQ
 */
export async function parseNaturalLanguageRFQ(prompt: string): Promise<ParsedRFQResult> {
  // If OpenAI API key is configured, use OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are an expert B2B rental marketplace RFQ parser for the Turkish market. Parse the user request into JSON format:
{
  "title": "Short descriptive title in Turkish",
  "city": "Standardized Turkish City name (e.g. İstanbul, Ankara, İzmir, Antalya)",
  "address": "Specific venue/district if mentioned (e.g. İstanbul Fuar Merkezi, Maslak)",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "deliveryNeeded": boolean,
  "setupNeeded": boolean,
  "notes": "Any extra notes",
  "items": [
    {
      "productName": "Normalized Turkish equipment name",
      "quantity": number,
      "categorySlug": "slug of category"
    }
  ]
}`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        return {
          ...parsed,
          confidence: 0.95,
        };
      }
    } catch (e) {
      console.warn("OpenAI API call failed, falling back to local NLP parser:", e);
    }
  }

  // Fallback Rule-Based Turkish NLP Extractor
  return parseWithLocalNLP(prompt);
}

export function parseWithLocalNLP(prompt: string): ParsedRFQResult {
  const lower = prompt.toLowerCase();
  const currentYear = new Date().getFullYear();

  // 1. Extract City & Location
  let city = "İstanbul";
  let address = "";

  const knownCities = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya", "Kocaeli", "Gaziantep"];
  for (const c of knownCities) {
    if (lower.includes(c.toLowerCase()) || lower.includes(c.toLowerCase().replace("i", "ı"))) {
      city = c;
      break;
    }
  }

  if (lower.includes("fuar merkezi") || lower.includes("ifm")) {
    address = "İstanbul Fuar Merkezi (İFM)";
  } else if (lower.includes("tüyap") || lower.includes("tuyap")) {
    address = "TÜYAP Fuar ve Kongre Merkezi";
  } else if (lower.includes("lütfi kırdar") || lower.includes("lutfi kirdar")) {
    address = "Lütfi Kırdar Uluslararası Kongre ve Sergi Sarayı";
  } else if (lower.includes("maslak")) {
    address = "Maslak / Sarıyer";
  } else if (lower.includes("kadıköy") || lower.includes("kadikoy")) {
    address = "Kadıköy";
  }

  // 2. Extract Dates (e.g. "18-20 Kasım", "15-17 Ekim", "10-12 Ekim")
  let startDate = format(addDays(new Date(), 7), "yyyy-MM-dd");
  let endDate = format(addDays(new Date(), 9), "yyyy-MM-dd");

  const dateRangeRegex = /(\d{1,2})\s*[-–/]\s*(\d{1,2})\s+([a-zçğıöşü]+)/i;
  const match = lower.match(dateRangeRegex);

  if (match) {
    const startDay = parseInt(match[1], 10);
    const endDay = parseInt(match[2], 10);
    const monthName = match[3].toLowerCase();

    if (TURKISH_MONTHS[monthName] !== undefined) {
      const monthIdx = TURKISH_MONTHS[monthName];
      const sDate = new Date(currentYear, monthIdx, startDay);
      const eDate = new Date(currentYear, monthIdx, endDay);
      startDate = format(sDate, "yyyy-MM-dd");
      endDate = format(eDate, "yyyy-MM-dd");
    }
  }

  // 3. Extract Items & Quantities
  // Pattern matches: "1.000 sandalye", "100 masa", "20 televizyon", "10 adet buzdolabı", "5x fritöz"
  const itemRegex = /(\d+[\.,]?\d*)\s*(?:adet|tane|parça|x)?\s+([a-zçğıöşüA-ZÇĞİÖŞÜ\s0-9]+?)(?:,|ve|\.|\n|$)/gi;
  const items: ParsedRFQItem[] = [];

  // Keywords cleaning helper
  const cleanItemName = (raw: string): string => {
    let cleaned = raw
      .replace(/\b(ihtiyacımız var|lazım|istiyoruz|gerekiyor|etkinlik|stand|için|kurulumlu|teslimatlı)\b/gi, "")
      .trim();
    return cleaned;
  };

  // Direct regex scans
  const potentialMatches = prompt.matchAll(/(\d[\d\.\,]*)\s*(?:adet|tane|parça|x)?\s+([a-zçğıöşü]+(?:\s+[a-zçğıöşü]+)?)/gi);
  for (const m of potentialMatches) {
    const rawQty = m[1].replace(/\./g, "").replace(",", ".");
    const qty = parseInt(rawQty, 10);
    const rawName = cleanItemName(m[2]);

    if (qty > 0 && rawName.length >= 2 && !Object.keys(TURKISH_MONTHS).includes(rawName.toLowerCase())) {
      // Find category slug
      let categorySlug = "etkinlik-organizasyon";
      for (const [key, slug] of Object.entries(COMMON_CATEGORIES)) {
        if (rawName.toLowerCase().includes(key)) {
          categorySlug = slug;
          break;
        }
      }

      // Standardize title casing
      const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

      items.push({
        productName: formattedName,
        quantity: qty,
        categorySlug,
      });
    }
  }

  // Deduplicate items
  const uniqueItems = items.filter(
    (item, index, self) =>
      index === self.findIndex((t) => t.productName.toLowerCase() === item.productName.toLowerCase())
  );

  // If no items detected, add placeholder
  if (uniqueItems.length === 0) {
    uniqueItems.push({
      productName: "Etkinlik Ekipman Paketi",
      quantity: 1,
      categorySlug: "etkinlik-organizasyon",
    });
  }

  const deliveryNeeded = lower.includes("teslim") || lower.includes("nakliye") || !lower.includes("kendimiz alacağız");
  const setupNeeded = lower.includes("kurulum") || lower.includes("montaj");

  const title = `${city} ${address ? "- " + address + " " : ""}Ekipman Kiralama Talebi`;

  return {
    title,
    city,
    address,
    startDate,
    endDate,
    deliveryNeeded,
    setupNeeded,
    notes: prompt,
    items: uniqueItems,
    confidence: 0.85,
  };
}
