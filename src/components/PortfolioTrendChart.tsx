"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { PortfolioSnapshot } from "@/lib/types";

function formatTRY(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
}

function formatShortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}.${m}`;
}

interface Props {
  snapshots: PortfolioSnapshot[];
}

export default function PortfolioTrendChart({ snapshots }: Props) {
  if (snapshots.length < 2) {
    return (
      <p className="text-sm" style={{ color: "var(--shell-muted)" }}>
        Portföy değeri takibi bugün başladı — birkaç gün sonra burada gerçek bir trend grafiği görünecek.
      </p>
    );
  }

  const data = snapshots.map((s) => ({ date: formatShortDate(s.date), value: s.value }));
  const first = snapshots[0].value;
  const last = snapshots[snapshots.length - 1].value;
  const delta = last - first;

  return (
    <div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="portfolioTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Tooltip
            formatter={(value) => [formatTRY(Number(value)), "Değer"]}
            labelFormatter={(label) => label}
            contentStyle={{ borderRadius: 10, border: "1px solid var(--shell-border)", fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#16a34a"
            strokeWidth={3}
            fill="url(#portfolioTrendFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="mt-1 text-xs" style={{ color: "var(--shell-muted)" }}>
        {snapshots.length} günlük kayıt · {delta >= 0 ? "+" : ""}
        {formatTRY(delta)}
      </p>
    </div>
  );
}
