import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface ForecastDataPoint {
  year: string;
  demand: number;
  growthRate?: string;
}

const defaultData: ForecastDataPoint[] = [
  { year: '2024', demand: 4000 },
  { year: '2025', demand: 5500 },
  { year: '2026', demand: 7500 },
  { year: '2027', demand: 9200 },
  { year: '2028', demand: 12000 },
];

interface FiveYearForecastChartProps {
  data?: ForecastDataPoint[];
}

export default function FiveYearForecastChart({ data = defaultData }: FiveYearForecastChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="demandGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2b36" />
          <XAxis dataKey="year" stroke="#7a8b99" tick={{ fill: '#7a8b99', fontSize: 12 }} />
          <YAxis stroke="#7a8b99" tick={{ fill: '#7a8b99', fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111a22',
              borderColor: '#1e2b36',
              borderRadius: '8px',
              color: '#dce7f0',
              fontFamily: 'monospace',
            }}
            formatter={(value: any) => [`${Number(value || 0).toLocaleString()} openings`, 'Market Demand']}
          />
          <Area
            type="monotone"
            dataKey="demand"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#demandGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
