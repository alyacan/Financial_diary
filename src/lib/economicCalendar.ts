export interface EconomicEvent {
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  title: string;
  source: string;
}

const TR_MONTHS: Record<string, string> = {
  Ocak: "01", Şubat: "02", Mart: "03", Nisan: "04", Mayıs: "05", Haziran: "06",
  Temmuz: "07", Ağustos: "08", Eylül: "09", Ekim: "10", Kasım: "11", Aralık: "12",
};

function parseTrDate(raw: string): string | null {
  const match = raw.trim().match(/^(\d{1,2})\s+(\S+)\s+(\d{4})$/);
  if (!match) return null;
  const [, day, monthName, year] = match;
  const month = TR_MONTHS[monthName];
  if (!month) return null;
  return `${year}-${month}-${day.padStart(2, "0")}`;
}

// Built-in official 2026 economic events schedule (0 API cost / 0 tokens)
export const OFFICIAL_STATIC_EVENTS: EconomicEvent[] = [
  // TCMB PPK 2026
  { date: "2026-01-22", time: "14:00", title: "TCMB PPK Faiz Kararı", source: "TCMB" },
  { date: "2026-02-19", time: "14:00", title: "TCMB PPK Faiz Kararı", source: "TCMB" },
  { date: "2026-03-19", time: "14:00", title: "TCMB PPK Faiz Kararı", source: "TCMB" },
  { date: "2026-04-23", time: "14:00", title: "TCMB PPK Faiz Kararı", source: "TCMB" },
  { date: "2026-05-21", time: "14:00", title: "TCMB PPK Faiz Kararı", source: "TCMB" },
  { date: "2026-06-25", time: "14:00", title: "TCMB PPK Faiz Kararı", source: "TCMB" },
  { date: "2026-07-23", time: "14:00", title: "TCMB PPK Faiz Kararı", source: "TCMB" },
  { date: "2026-08-20", time: "14:00", title: "TCMB PPK Faiz Kararı", source: "TCMB" },
  { date: "2026-09-24", time: "14:00", title: "TCMB PPK Faiz Kararı", source: "TCMB" },
  { date: "2026-10-22", time: "14:00", title: "TCMB PPK Faiz Kararı", source: "TCMB" },
  { date: "2026-11-19", time: "14:00", title: "TCMB PPK Faiz Kararı", source: "TCMB" },
  { date: "2026-12-24", time: "14:00", title: "TCMB PPK Faiz Kararı", source: "TCMB" },

  // FED FOMC 2026
  { date: "2026-01-28", time: "22:00", title: "FED FOMC Faiz Kararı & Açıklama", source: "FED" },
  { date: "2026-03-18", time: "22:00", title: "FED FOMC Faiz Kararı & Powell Açıklaması", source: "FED" },
  { date: "2026-05-06", time: "22:00", title: "FED FOMC Faiz Kararı", source: "FED" },
  { date: "2026-06-17", time: "22:00", title: "FED FOMC Faiz Kararı & Powell Açıklaması", source: "FED" },
  { date: "2026-07-29", time: "22:00", title: "FED FOMC Faiz Kararı", source: "FED" },
  { date: "2026-09-16", time: "22:00", title: "FED FOMC Faiz Kararı & Powell Açıklaması", source: "FED" },
  { date: "2026-11-04", time: "22:00", title: "FED FOMC Faiz Kararı", source: "FED" },
  { date: "2026-12-16", time: "22:00", title: "FED FOMC Faiz Kararı & Powell Açıklaması", source: "FED" },

  // TÜİK Enflasyon 2026 (Her ayın 3'ü)
  { date: "2026-01-05", time: "10:00", title: "TÜİK Aralık TÜFE Enflasyon Verisi", source: "TÜİK" },
  { date: "2026-02-03", time: "10:00", title: "TÜİK Ocak TÜFE Enflasyon Verisi", source: "TÜİK" },
  { date: "2026-03-03", time: "10:00", title: "TÜİK Şubat TÜFE Enflasyon Verisi", source: "TÜİK" },
  { date: "2026-04-03", time: "10:00", title: "TÜİK Mart TÜFE Enflasyon Verisi", source: "TÜİK" },
  { date: "2026-05-04", time: "10:00", title: "TÜİK Nisan TÜFE Enflasyon Verisi", source: "TÜİK" },
  { date: "2026-06-03", time: "10:00", title: "TÜİK Mayıs TÜFE Enflasyon Verisi", source: "TÜİK" },
  { date: "2026-07-03", time: "10:00", title: "TÜİK Haziran TÜFE Enflasyon Verisi", source: "TÜİK" },
  { date: "2026-08-03", time: "10:00", title: "TÜİK Temmuz TÜFE Enflasyon Verisi", source: "TÜİK" },
  { date: "2026-09-03", time: "10:00", title: "TÜİK Ağustos TÜFE Enflasyon Verisi", source: "TÜİK" },
  { date: "2026-10-05", time: "10:00", title: "TÜİK Eylül TÜFE Enflasyon Verisi", source: "TÜİK" },
  { date: "2026-11-03", time: "10:00", title: "TÜİK Ekim TÜFE Enflasyon Verisi", source: "TÜİK" },
  { date: "2026-12-03", time: "10:00", title: "TÜİK Kasım TÜFE Enflasyon Verisi", source: "TÜİK" },
];

export async function fetchTcmbPpkDates(): Promise<EconomicEvent[]> {
  try {
    const res = await fetch(
      "https://www.tcmb.gov.tr/wps/wcm/connect/tr/tcmb+tr/main+menu/duyurular/takvim",
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    const html = await res.text();
    const tableMatch = html.match(/<table[^>]*id="midTable"[^>]*>([\s\S]*?)<\/table>/);
    if (!tableMatch) return [];
    const bodyMatch = tableMatch[1].match(/<tbody>([\s\S]*?)<\/tbody>/);
    if (!bodyMatch) return [];

    const rows = bodyMatch[1].match(/<tr>([\s\S]*?)<\/tr>/g) ?? [];
    const events: EconomicEvent[] = [];
    for (const row of rows) {
      const firstCell = row.match(/<td[^>]*>([\s\S]*?)<\/td>/);
      if (!firstCell) continue;
      const iso = parseTrDate(firstCell[1].replace(/&nbsp;/g, "").trim());
      if (!iso) continue;
      events.push({ date: iso, time: "14:00", title: "TCMB PPK Faiz Kararı", source: "TCMB" });
    }
    return events;
  } catch {
    return [];
  }
}

export async function fetchForexFactoryEvents(): Promise<EconomicEvent[]> {
  try {
    const res = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json");
    const data: { title: string; country: string; date: string; impact: string }[] = await res.json();
    return data
      .filter((e) => (e.country === "USD" || e.country === "EUR") && (e.impact === "High" || e.impact === "Medium"))
      .map((e) => {
        const d = new Date(e.date);
        return {
          date: d.toISOString().slice(0, 10),
          time: d.toISOString().slice(11, 16),
          title: `${e.country} ${e.title}`,
          source: "FED/ECB",
        };
      });
  } catch {
    return [];
  }
}

export async function fetchEconomicEvents(): Promise<EconomicEvent[]> {
  const [tcmb, forex] = await Promise.all([fetchTcmbPpkDates(), fetchForexFactoryEvents()]);
  const combined = [...OFFICIAL_STATIC_EVENTS, ...tcmb, ...forex];

  // Unique events by date+title
  const seen = new Set<string>();
  const unique: EconomicEvent[] = [];

  for (const item of combined) {
    const key = `${item.date}|${item.title}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  return unique.sort((a, b) => a.date.localeCompare(b.date));
}
