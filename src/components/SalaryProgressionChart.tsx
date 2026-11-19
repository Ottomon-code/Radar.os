import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface SalaryDataPoint {
  name: string;
  salary: number;
  percentile?: number;
}

const defaultData: SalaryDataPoint[] = [
  { name: 'Now', salary: 85000 },
  { name: '+1yr', salary: 95000 },
  { name: '+2yr', salary: 110000 },
  { name: '+3yr', salary: 125000 },
  { name: '+4yr', salary: 145000 },
  { name: '+5yr', salary: 165000 },
];

interface SalaryProgressionChartProps {
  data?: SalaryDataPoint[];
}

export default function SalaryProgressionChart({ data = defaultData }: SalaryProgressionChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2b36" />
          <XAxis dataKey="name" stroke="#7a8b99" tick={{ fill: '#7a8b99', fontSize: 12 }} />
          <YAxis
            stroke="#7a8b99"
            tick={{ fill: '#7a8b99', fontSize: 12 }}
            tickFormatter={(val: number) => `$${Math.round(val / 1000)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111a22',
              borderColor: '#1e2b36',
              borderRadius: '8px',
              color: '#dce7f0',
              fontFamily: 'monospace',
            }}
            formatter={(value: any) => [`$${Number(value || 0).toLocaleString()}`, 'Target Comp']}
          />
          <Line
            type="monotone"
            dataKey="salary"
            stroke="#22d3a5"
            strokeWidth={3}
            dot={{ fill: '#22d3a5', r: 4 }}
            activeDot={{ r: 6, fill: '#3b82f6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
