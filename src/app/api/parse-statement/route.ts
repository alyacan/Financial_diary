import { NextRequest, NextResponse } from "next/server";
import { createRequire } from "module";
import * as XLSX from "xlsx";
import { GoogleGenAI } from "@google/genai";
import { parseKnownBankStatement, ParsedStatementRow } from "@/lib/statementParser";
import { EXPENSE_CATEGORIES } from "@/lib/types";

const require = createRequire(import.meta.url);

const MIN_TEXT_LENGTH_FOR_TEXT_MODE = 50;
export const maxDuration = 60;

const RETRIABLE = /\b(429|503)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand/i;
const RETRY_DELAYS_MS = [1000, 2000, 4000];

const MODELS = ["gemini-flash-lite-latest", "gemini-flash-latest"];

class ModelBusyError extends Error {}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callModel(
  model: string,
  fn: (model: string) => Promise<{ text?: string | null }>
): Promise<{ text?: string | null }> {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await fn(model);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isLastAttempt = attempt === RETRY_DELAYS_MS.length;
      if (RETRIABLE.test(msg) && !isLastAttempt) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      throw err;
    }
  }
  throw new Error("Beklenmeyen retry akışı.");
}

async function withRetry(
  fn: (model: string) => Promise<{ text?: string | null }>
): Promise<{ text?: string | null }> {
  let lastError: unknown = null;
  for (const model of MODELS) {
    try {
      return await callModel(model, fn);
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (RETRIABLE.test(msg)) {
        continue;
      }
      throw err;
    }
  }
  const msg = lastError instanceof Error ? lastError.message : String(lastError);
  throw new ModelBusyError(
    `Gemini şu anda yoğun ve yanıt veremedi (${msg}). Lütfen birkaç saniye sonra tekrar dene.`
  );
}

const EXTRACTION_INSTRUCTIONS = `
Bu ekstreden YALNIZCA kullanıcının yaptığı harcamaları (pozitif tutarlı harcama satırlarını) çıkar.
Ödeme/aktarım satırlarını DAHİL ETME: "Ödeme - Teşekkür Ederiz", "Maaş", "Havale", "EFT", "Virman", negatif tutarlar, faiz vb. hariç tut.
Yalnızca para çıkışı olan gerçek harcamaları listele.

Tarih formatı: YYYY-MM-DD
Tutar: Yalnızca pozitif sayı (ondalık için nokta kullan, örn. 123.45)
Açıklama: İşlemin adı/mağazası (örn. "MIGROS", "NETFLIX")

Yalnızca şu şemaya uyan bir JSON dizisi döndür:
[
  { "date": "YYYY-MM-DD", "description": "İşlem açıklaması", "amount": 123.45 }
]
Markdown bloğu veya açıklama ekleme, yalnızca geçerli JSON dizi döndür.
`;

function parseGeminiRows(text: string | undefined): ParsedStatementRow[] {
  if (!text) return [];
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((r) => r && r.date && r.description && r.amount != null)
      .map((r) => {
        let amt = typeof r.amount === "number" ? r.amount : parseFloat(String(r.amount).replace(/[^0-9.-]+/g, ""));
        let dateStr = String(r.date).trim();
        // Convert DD.MM.YYYY or DD/MM/YYYY to YYYY-MM-DD if needed
        if (/^\d{2}[./-]\d{2}[./-]\d{4}$/.test(dateStr)) {
          const parts = dateStr.split(/[./-]/);
          dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return {
          date: dateStr,
          description: String(r.description).trim(),
          amount: amt,
        };
      })
      .filter((r) => !isNaN(r.amount) && r.amount > 0);
  } catch {
    return [];
  }
}

async function extractViaGeminiVision(buffer: Buffer, apiKey: string): Promise<ParsedStatementRow[]> {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Bu bir banka/kredi kartı hesap ekstresi görüntüsüdür. ${EXTRACTION_INSTRUCTIONS}`;

  const response = await withRetry((model) =>
    ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [{ inlineData: { mimeType: "application/pdf", data: buffer.toString("base64") } }, { text: prompt }],
        },
      ],
      config: { responseMimeType: "application/json" },
    })
  );

  return parseGeminiRows(response.text ?? "");
}

async function extractViaGeminiText(statementText: string, apiKey: string): Promise<ParsedStatementRow[]> {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Aşağıda bir banka/kredi kartı hesap ekstresinden çıkarılmış ham metin var. ${EXTRACTION_INSTRUCTIONS}

Ham metin:
"""
${statementText}
"""`;

  const response = await withRetry((model) =>
    ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    })
  );

  return parseGeminiRows(response.text ?? "");
}

// Robust Excel & CSV Parser (supports .xlsx, .xls, HTML table .xls, CSV)
function excelToText(buffer: Buffer, isCsv: boolean): string {
  if (isCsv) {
    try {
      return buffer.toString("utf-8");
    } catch {
      return buffer.toString("latin1");
    }
  }

  // First try XLSX (SheetJS) which handles both binary .xls, .xlsx, and HTML tables
  try {
    const workbook = XLSX.read(buffer, { type: "buffer", raw: false, cellDates: true });
    const lines: string[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      const csv = XLSX.utils.sheet_to_csv(sheet, { FS: "\t" });
      if (csv && csv.trim()) {
        lines.push(csv.trim());
      }
    }
    if (lines.length > 0) {
      return lines.join("\n");
    }
  } catch (err) {
    console.warn("XLSX read failed, trying text decoding:", err);
  }

  // Fallback: check if it's an HTML table saved with .xls/.xlsx extension
  const asText = buffer.toString("utf-8");
  if (/<(table|html|tr|td)/i.test(asText)) {
    return asText
      .replace(/<tr[^>]*>/gi, "\n")
      .replace(/<td[^>]*>/gi, "\t")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\t+/g, "\t")
      .trim();
  }

  return asText;
}

const CATEGORIZE_CHUNK_SIZE = 20;

async function categorizeChunk(descriptions: string[], apiKey: string): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Aşağıdaki banka/kredi kartı ekstresi işlem açıklamalarının her birini şu kategorilerden birine ata: ${EXPENSE_CATEGORIES.join(", ")}.
Türkçe mağaza/marka isimlerini yorumla (örn. "BIM", "ÇAĞDAŞ MARKET" -> Market; "TRENDYOL YEMEK", kafe/restoran isimleri -> Yemek; "TT MOBIL" gibi operatör isimleri -> Faturalar; "WATSONS" gibi kişisel bakım -> Sağlık).
Emin olmadığında "Diğer" kullan.

İşlemler:
${descriptions.map((d, i) => `${i + 1}. ${d}`).join("\n")}

Yalnızca ${descriptions.length} elemanlı bir JSON dizisi döndür, sırası yukarıdaki listeyle birebir aynı olsun. Örnek: ["Market", "Yemek", ...]`;

  const response = await withRetry((model) =>
    ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    })
  );

  try {
    let cleaned = (response.text ?? "").trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length === descriptions.length) return parsed;
  } catch {
    // fallback to Diğer
  }
  return descriptions.map(() => "Diğer");
}

async function categorize(descriptions: string[], apiKey: string): Promise<string[]> {
  const chunks: string[][] = [];
  for (let i = 0; i < descriptions.length; i += CATEGORIZE_CHUNK_SIZE) {
    chunks.push(descriptions.slice(i, i + CATEGORIZE_CHUNK_SIZE));
  }
  const results = await Promise.all(chunks.map((chunk) => categorizeChunk(chunk, apiKey)));
  return results.flat();
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "buraya_key_yapistir") {
    return NextResponse.json(
      { error: "GEMINI_API_KEY tanımlı değil." },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Support .xlsx, .xls, .csv, and standard excel/csv mime types
  const fileName = file.name.toLowerCase();
  const isCsv = /\.csv$/i.test(fileName) || file.type === "text/csv";
  const isExcel = isCsv || /\.xlsx?$/i.test(fileName) ||
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "application/vnd.ms-excel";

  let text: string;
  try {
    if (isExcel) {
      text = excelToText(buffer, isCsv);
    } else {
      const pdfParse = require("pdf-parse/lib/pdf-parse.js");
      const result = await pdfParse(buffer);
      text = result.text;
    }
  } catch (parseErr) {
    console.error("Text extraction failed:", parseErr);
    text = "";
  }

  let rows: ParsedStatementRow[];
  let bankLabel: string;
  let formatWarning: string | undefined;

  const knownBank = !isExcel ? parseKnownBankStatement(text) : null;

  try {
    if (knownBank) {
      rows = knownBank.rows;
      bankLabel = knownBank.bankLabel;
    } else if (text.trim().length >= MIN_TEXT_LENGTH_FOR_TEXT_MODE) {
      rows = await extractViaGeminiText(text, apiKey);
      bankLabel = isExcel ? "Excel / CSV dosyasından ayrıştırıldı" : "PDF metninden ayrıştırıldı";
      formatWarning = isExcel
        ? "İşlemler Excel dosyasından çıkarıldı. Tutarları ve kategorileri kontrol edebilirsiniz."
        : "İşlemler PDF metninden çıkarıldı. Tutarları ve tarihleri kontrol edebilirsiniz.";
    } else if (isExcel) {
      throw new Error("Excel dosyasında okunabilir işlem tablosu bulunamadı.");
    } else {
      rows = await extractViaGeminiVision(buffer, apiKey);
      bankLabel = "Görsel olarak analiz edildi";
      formatWarning = "Bu PDF'te seçilebilir metin olmadığı için görüntü analizi ile okundu.";
    }
  } catch (err) {
    if (err instanceof ModelBusyError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Ekstre işlenemedi: " + (err instanceof Error ? err.message : "bilinmeyen hata") },
      { status: 400 }
    );
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "Ekstrede tanınabilir harcama işlemi bulunamadı." }, { status: 400 });
  }

  try {
    const categories = await categorize(rows.map((r) => r.description), apiKey);
    const categorized = rows.map((r, i) => ({ ...r, category: categories[i] ?? "Diğer" }));
    return NextResponse.json({ rows: categorized, bankLabel, warning: formatWarning });
  } catch {
    const categorized = rows.map((r) => ({ ...r, category: "Diğer" }));
    const warning = [formatWarning, "Kategorizasyon otomatik yapılamadı, tüm işlemler 'Diğer' olarak işaretlendi."]
      .filter(Boolean)
      .join(" ");
    return NextResponse.json({ rows: categorized, bankLabel, warning });
  }
}