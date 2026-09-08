import { NextRequest, NextResponse } from "next/server";
import { createRequire } from "module";
import ExcelJS from "exceljs";
import { GoogleGenAI } from "@google/genai";
import { parseKnownBankStatement, ParsedStatementRow } from "@/lib/statementParser";
import { EXPENSE_CATEGORIES } from "@/lib/types";

const require = createRequire(import.meta.url);

// pdf-parse metin çıkaramadığında (ör. ekran görüntüsünden oluşturulmuş, seçilebilir
// metni olmayan PDF'ler) bu eşiğin altında kalır — bu durumda AI'nin görüntüyü
// doğrudan "görüp" işlemleri okuması istenir.
const MIN_TEXT_LENGTH_FOR_TEXT_MODE = 50;

// Ekstre işleme birkaç Gemini çağrısı zincirliyor; varsayılan 15sn'lik fonksiyon
// limiti retry'larla birlikte yetmiyor.
export const maxDuration = 60;

// Gemini 503 UNAVAILABLE / 429 döndürdüğünde bu genelde geçici bir yoğunluk ve
// birkaç saniyede düzeliyor. Kalıcı hatalarda (geçersiz key, bozuk istek) beklemeden çıkılır.
const RETRIABLE = /\b(429|503)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand/i;
const RETRY_DELAYS_MS = [1000, 2000, 4000];

// "-latest" alias'ı en yoğun kullanılan havuza yönleniyor; birincil model
// ısrarla 503 verirse ikinci, daha az yüklü modele düşülür.
const MODELS = ["gemini-flash-latest", "gemini-flash-lite-latest"];

class ModelBusyError extends Error {}

// callModel her model için ayrı ayrı retry/backoff denenir; hepsi tükenirse
// ModelBusyError fırlatılır. Kalıcı (retriable olmayan) hatalarda hemen çıkılır.
async function withRetry<T>(callModel: (model: string) => Promise<T>): Promise<T> {
  for (let modelIndex = 0; modelIndex < MODELS.length; modelIndex++) {
    const model = MODELS[modelIndex];
    for (let attempt = 0; ; attempt++) {
      try {
        return await callModel(model);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (!RETRIABLE.test(message)) throw err;
        if (attempt >= RETRY_DELAYS_MS.length) break; // bu modelde pes edildi, sıradaki modele geç
        // eş zamanlı parçaların aynı anda yeniden denemesini önlemek için jitter
        const delay = RETRY_DELAYS_MS[attempt] + Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw new ModelBusyError("Google AI servisi şu anda yoğun. Birkaç dakika sonra tekrar dene.");
}

const EXTRACTION_INSTRUCTIONS = `Sadece GERÇEK HARCAMA (para çıkışı, üçüncü tarafa yapılan ödeme/satın alma) işlemlerini listele.
Şunları KESİNLİKLE HARİÇ TUT:
- Hesaba gelen para (gelen EFT/havale, maaş, iade, tahsilat)
- Hesaplar arası transfer/aktarım (örn. "HESAPTAN AKTARIM", "Vadeli Hesaba Para Yatırma", "Hesap Açılış")
- Banka tarafından yapılan faiz/komisyon tahsilatı işlemleri (senin harcaman değil)
Sadece market, restoran, fatura ödemesi, ATM'den nakit çekme gibi gerçek üçüncü taraf harcamalarını dahil et.
ÖNEMLİ: Bazı hesap türlerinde (kredi kartı) harcamalar pozitif, bazılarında (vadesiz/mevduat hesabı) negatif
tutarla gösterilir — hangi işlemin gerçek bir harcama olduğuna bağlamdan (işlem açıklamasından) karar ver,
sadece işaretin pozitif/negatif olmasına güvenme.

Her harcama için:
- date: YYYY-MM-DD formatında (kaynaktaki tarih formatı ne olursa olsun)
- description: işlem açıklaması (kısa, orijinal dile sadık)
- amount: pozitif sayı (TL), ondalık ayracı nokta olacak şekilde normalize et

Sadece şu şekilde bir JSON dizisi döndür, başka hiçbir açıklama ekleme:
[{"date": "2024-01-15", "description": "...", "amount": 123.45}, ...]
Hiç harcama bulamazsan boş dizi [] döndür.`;

function parseGeminiRows(text: string | undefined): ParsedStatementRow[] {
  const parsed = JSON.parse(text ?? "[]");
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((r) => r && typeof r.date === "string" && typeof r.description === "string" && typeof r.amount === "number")
    .map((r) => ({ date: r.date, description: r.description, amount: r.amount }));
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

  return parseGeminiRows(response.text);
}

async function extractViaGeminiText(statementText: string, apiKey: string): Promise<ParsedStatementRow[]> {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Aşağıda bir banka/kredi kartı hesap ekstresinden çıkarılmış ham metin var (format tanınamadı, sütun hizalaması bozulmuş olabilir). ${EXTRACTION_INSTRUCTIONS}

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

  return parseGeminiRows(response.text);
}

// .csv exceljs'in xlsx yükleyicisiyle okunamaz; zaten düz metin olduğu için doğrudan çözülüyor.
async function excelToText(buffer: Buffer, isCsv: boolean): Promise<string> {
  if (isCsv) return buffer.toString("utf-8");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const lines: string[] = [];
  workbook.eachSheet((sheet) => {
    sheet.eachRow((row) => {
      const cells = (row.values as (string | number | Date | null)[]).slice(1);
      lines.push(cells.map((c) => (c == null ? "" : String(c))).join("\t"));
    });
  });
  return lines.join("\n");
}

const CATEGORIZE_CHUNK_SIZE = 20;

// Ekstre uzun olunca modelin pozisyonel hizalaması (satır sırasına göre kategori
// döndürmesi) bozulabiliyor. Tek büyük istekte bu, TÜM işlemleri "Diğer"e düşürüyordu
// (uzunluk uyuşmazlığında hepsi fallback'e giriyordu). Bunun yerine açıklamaları küçük
// parçalara bölüp her parçayı bağımsız kategorize ediyoruz; bir parça bozulursa yalnızca
// o parçadaki işlemler "Diğer" olur, geri kalanlar etkilenmez.
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
    const parsed = JSON.parse(response.text ?? "[]");
    if (Array.isArray(parsed) && parsed.length === descriptions.length) return parsed;
  } catch {
    // düşer, aşağıda "Diğer" ile doldurulur
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
  // exceljs yalnızca .xlsx okur; eski binary .xls desteklenmiyor.
  const isCsv = /\.csv$/i.test(file.name) || file.type === "text/csv";
  const isExcel = isCsv || /\.xlsx$/i.test(file.name) ||
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  let text: string;
  try {
    if (isExcel) {
      text = await excelToText(buffer, isCsv);
    } else {
      const pdfParse = require("pdf-parse/lib/pdf-parse.js");
      const result = await pdfParse(buffer);
      text = result.text;
    }
  } catch {
    text = ""; // metin çıkarılamadıysa görüntü tabanlı PDF olabilir, aşağıda AI ile denenir
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
      bankLabel = isExcel ? "AI ile Excel/CSV dosyasından okundu" : "AI ile metinden okundu (banka formatı tanınmadı)";
      formatWarning = isExcel
        ? "İşlemler AI ile Excel/CSV dosyasından çıkarıldı. Tutarları ve tarihleri mutlaka kontrol et."
        : "Bu bankanın formatı tanınmadı, işlemler AI ile metinden çıkarıldı. Tutarları ve tarihleri mutlaka kontrol et.";
    } else if (isExcel) {
      throw new Error("Dosyada okunabilir veri bulunamadı.");
    } else {
      rows = await extractViaGeminiVision(buffer, apiKey);
      bankLabel = "AI ile görüntüden okundu";
      formatWarning = "Bu PDF'te seçilebilir metin yoktu (muhtemelen ekran görüntüsü), işlemler AI ile görüntüden okundu. Tutarları ve tarihleri mutlaka kontrol et.";
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
    return NextResponse.json({ error: "Ekstrede tanınabilir işlem bulunamadı." }, { status: 400 });
  }

  try {
    const categories = await categorize(rows.map((r) => r.description), apiKey);
    const categorized = rows.map((r, i) => ({ ...r, category: categories[i] ?? "Diğer" }));
    return NextResponse.json({ rows: categorized, bankLabel, warning: formatWarning });
  } catch {
    // AI kategorizasyonu başarısız olsa bile ayrıştırılan işlemleri "Diğer" ile dönebiliriz.
    const categorized = rows.map((r) => ({ ...r, category: "Diğer" }));
    const warning = [formatWarning, "AI kategorizasyon başarısız oldu, tümü 'Diğer' olarak işaretlendi."]
      .filter(Boolean)
      .join(" ");
    return NextResponse.json({ rows: categorized, bankLabel, warning });
  }
}
