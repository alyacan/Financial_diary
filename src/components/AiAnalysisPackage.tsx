"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { ArchivedPeriod, Transaction } from "@/lib/types";
import {
  ANALYSIS_TYPES,
  AI_ROLES,
  DETAIL_LEVELS,
  buildExpenseAnalysisPrompt,
} from "@/lib/expenseAnalysisPrompt";
import { buildPeriodDocx } from "@/lib/periodDocx";

interface Props {
  period: ArchivedPeriod;
  allPeriods: ArchivedPeriod[];
  periodTransactions: Transaction[];
}

export default function AiAnalysisPackage({ period, allPeriods, periodTransactions }: Props) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [analysisType, setAnalysisType] = useState<string>(ANALYSIS_TYPES[0]);
  const [role, setRole] = useState<string>(AI_ROLES[0]);
  const [detailLevel, setDetailLevel] = useState<string>(DETAIL_LEVELS[1]);
  const [focus, setFocus] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatingDocx, setGeneratingDocx] = useState(false);

  function handleGeneratePrompt() {
    const prompt = buildExpenseAnalysisPrompt(
      { analysisType, role, detailLevel, focus },
      period,
      allPeriods,
      periodTransactions
    );
    setGeneratedPrompt(prompt);
    setCopied(false);
    setWizardOpen(false);
  }

  async function handleCopyPrompt() {
    if (!generatedPrompt) return;
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownloadDocx() {
    setGeneratingDocx(true);
    try {
      const blob = await buildPeriodDocx(period, allPeriods, periodTransactions, generatedPrompt ?? undefined);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finansal-donem-raporu-${period.startDate}_${period.endDate}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setGeneratingDocx(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-3xl p-6 shadow-xs" style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Icon name="bot" className="h-6 w-6" />
          <h2 className="font-bold text-zinc-900 dark:text-zinc-100">AI Analiz & Prompt Sihirbazı</h2>
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold" style={{ background: "var(--shell-gold-bg)", color: "var(--shell-gold)" }}>
            PROMPT ENGINE
          </span>
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Bu döneme özel harcama ve yatırım verilerini yapay zekâya (ChatGPT, Claude, Gemini) aktarabileceğin hazır analiz promptu ve Word (.docx) raporu oluşturabilirsin.
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => setWizardOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:opacity-90" style={{ background: "var(--shell-accent)" }}
        >
          <Icon name="sparkles" />
          <span>{wizardOpen ? "Sihirbazı Kapat" : "AI Promptu Oluştur"}</span>
        </button>
        <button
          onClick={handleDownloadDocx}
          disabled={generatingDocx}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-2xs hover:opacity-90 disabled:opacity-50" style={{ background: "var(--shell-card-solid)", border: "1px solid var(--shell-border)", color: "var(--shell-muted-2)" }}
        >
          <Icon name="file" />
          <span>{generatingDocx ? "Oluşturuluyor..." : "Word (.docx) Rapor İndir"}</span>
        </button>
      </div>

      {wizardOpen && (
        <div className="flex flex-col gap-3.5 rounded-2xl p-5 shadow-2xs" style={{ background: "var(--shell-card-solid)", border: "1px solid var(--shell-border)" }}>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Nasıl bir analiz istiyorsun?
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              className="rounded-xl border border-zinc-300 bg-zinc-50 p-2 text-xs transition-colors dark:border-zinc-700 dark:bg-zinc-950"
            >
              {ANALYSIS_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Yapay zekâ hangi rolde analiz yapsın?
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-xl border border-zinc-300 bg-zinc-50 p-2 text-xs transition-colors dark:border-zinc-700 dark:bg-zinc-950"
            >
              {AI_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Analiz detay seviyesi
            <select
              value={detailLevel}
              onChange={(e) => setDetailLevel(e.target.value)}
              className="rounded-xl border border-zinc-300 bg-zinc-50 p-2 text-xs transition-colors dark:border-zinc-700 dark:bg-zinc-950"
            >
              {DETAIL_LEVELS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Özellikle odaklanmasını istediğin konu (opsiyonel)
            <textarea
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              rows={2}
              placeholder="Örn: Bu ay neden fazla harcama yaptığımı bul. / Tasarruf edebileceğim alanları göster."
              className="rounded-xl border border-zinc-300 bg-zinc-50 p-2 text-xs transition-colors dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>

          <button
            onClick={handleGeneratePrompt}
            className="self-start rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700"
          >
            <Icon name="send" /> Promptu Hazırla
          </button>
        </div>
      )}

      {generatedPrompt && (
        <div className="flex flex-col gap-2 rounded-xl border border-indigo-200 bg-white p-3.5 shadow-2xs dark:border-indigo-900/50 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200"><Icon name="check-circle" /> Hazırlanan AI Promptu</span>
            <button
              onClick={handleCopyPrompt}
              className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300"
            >
              {copied ? <><Icon name="check" /> Kopyalandı</> : <><Icon name="copy" /> Kopyala</>}
            </button>
          </div>
          <textarea
            readOnly
            value={generatedPrompt}
            className="min-h-36 w-full rounded-lg border border-zinc-200 bg-zinc-900 p-2.5 font-mono text-[11px] text-zinc-100 dark:border-zinc-800"
          />
        </div>
      )}
    </section>
  );
}
