"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PositionSummary } from "@/lib/calculations";
import { ASSET_LABELS } from "@/lib/types";

const ASSET_COLORS: Record<string, string> = {
  gold: "#f59e0b",
  crypto: "#3b82f6",
  forex: "#0284c7",
  fund: "#8b5cf6",
  stock: "#10b981",
  bank: "#06b6d4",
  time_deposit: "#6366f1",
  deposit: "#14b8a6",
  cash: "#64748b",
};

function formatTRY(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
}

interface Props {
  positions: PositionSummary[];
}

export default function AssetDistributionDonut({ positions }: Props) {
  const byType = new Map<string, number>();
  for (const p of positions) {
    if (!p.priceAvailable || p.currentValue <= 0) continue;
    byType.set(p.assetType, (byType.get(p.assetType) ?? 0) + p.currentValue);
  }
  const total = Array.from(byType.values()).reduce((sum, v) => sum + v, 0);

  if (total <= 0) {
    return (
      <p className="text-sm" style={{ color: "var(--shell-muted)" }}>
        Fiyatı bilinen bir pozisyon olduğunda dağılım burada görünecek.
      </p>
    );
  }

  const data = Array.from(byType.entries())
    .map(([assetType, value]) => ({
      assetType,
      label: ASSET_LABELS[assetType] ?? assetType,
      value,
      percent: (value / total) * 100,
      color: ASSET_COLORS[assetType] ?? "oklch(0.6 0.02 60)",
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col items-center gap-4">
      <ResponsiveContainer width={132} height={132}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={66}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.assetType} fill={d.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatTRY(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex w-full flex-col gap-1.5 text-xs">
        {data.map((d) => (
          <div key={d.assetType} className="flex justify-between">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ background: d.color }} />
              {d.label}
            </span>
            <span className="font-semibold">%{Math.round(d.percent)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
