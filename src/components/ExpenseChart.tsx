"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Expense } from "@/lib/types";

function formatCompactTRY(value: number): string {
  return `${Math.round(value).toLocaleString("tr-TR")} ₺`;
}

function formatTRY(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

// Harmonious warm terracotta / amber / sage palette
const PALETTE = [
  "oklch(0.55 0.12 35)",
  "oklch(0.62 0.11 50)",
  "oklch(0.68 0.10 70)",
  "oklch(0.58 0.10 145)",
  "oklch(0.52 0.08 180)",
  "oklch(0.50 0.10 240)",
  "oklch(0.55 0.12 320)",
];

interface Props {
  expenses: Expense[];
}

export default function ExpenseChart({ expenses }: Props) {
  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
  }
  const data = Array.from(byCategory.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-xs text-zinc-500">Henüz harcama eklenmedi.</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const chartHeight = Math.max(data.length * 44, 160);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 65, left: 8, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke="var(--shell-border)" strokeDasharray="3 3" opacity={0.5} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tickLine={false}
            axisLine={{ stroke: "var(--shell-border)" }}
            tick={{ fill: "var(--foreground)", fontSize: 11, fontWeight: 600 }}
          />
          <Tooltip
            cursor={{ fill: "oklch(0.5 0.02 50 / 0.08)" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                const percent = ((item.value / total) * 100).toFixed(1);
                return (
                  <div
                    className="rounded-xl p-2.5 text-xs shadow-lg"
                    style={{
                      background: "var(--shell-card-solid)",
                      border: "1px solid var(--shell-border)",
                      color: "var(--foreground)",
                    }}
                  >
                    <div className="font-bold">{item.name}</div>
                    <div className="mt-1 font-mono font-extrabold text-sm" style={{ color: "var(--shell-accent-strong)" }}>
                      {formatTRY(item.value)}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">Toplamın %{percent}&apos;i</div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="value" barSize={22} radius={[0, 8, 8, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              formatter={(value) => formatCompactTRY(Number(value))}
              fill="var(--foreground)"
              fontSize={11}
              fontWeight={700}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}