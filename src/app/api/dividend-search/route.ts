import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker")?.trim().toUpperCase() ?? "";
  if (!ticker) {
    return NextResponse.json({ error: "Hisse kodu (ticker) belirtilmedi." }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "buraya_key_yapistir") {
    return NextResponse.json(
      { error: "GEMINI_API_KEY tanımlı değil. .env.local dosyasına geçerli API key'inizi ekleyin." },
      { status: 500 }
    );
  }

  const currentYear = new Date().getFullYear();

  const prompt = `
You are a financial research assistant specializing in stock dividends (BIST & Global markets).
Find published, announced, or official dividend payment (ex-dividend / ödeme tarihi) dates for stock symbol "${ticker}" for the year ${currentYear} (or ${currentYear + 1} if announced).

Respond ONLY with a raw JSON object (no markdown formatting, no code blocks) in the following format:
{
  "ticker": "${ticker}",
  "events": [
    {
      "date": "YYYY-MM-DD",
      "amountPerShare": 3.50,
      "title": "${ticker} Temettü Ödemesi (Hisse Başı 3.50 TL / USD)"
    }
  ],
  "found": true
}

If no official dividend dates have been published or announced for "${ticker}", return:
{
  "ticker": "${ticker}",
  "events": [],
  "found": false,
  "note": "İlan edilmiş resmi temettü tarihi bulunamadı."
}
`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
    });

    const rawText = (response.text ?? "").trim();
    // Clean code block ticks if model includes them
    const cleanedText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanedText);

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Temettü araştırması yapılırken bir hata oluştu." },
      { status: 500 }
    );
  }
}
