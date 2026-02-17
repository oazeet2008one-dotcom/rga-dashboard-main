import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatCompactNumber } from '@/lib/formatters';
import { format } from 'date-fns';

interface PipelineChartProps {
  data: Array<{
    date: string;
    leads: number;
    value: number;
  }>;
}

export function PipelineChart({ data }: PipelineChartProps) {
  const formattedData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      displayDate: format(new Date(d.date), 'MMM dd'),
    }));
  }, [data]);

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Lead Pipeline & Value Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={formattedData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <XAxis
                dataKey="displayDate"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                dy={10}
              />
              <YAxis
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatCompactNumber(v)}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatCompactNumber(v)}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '12px',
                }}
                formatter={(value: number, name: string) => [
                  name === 'value' ? formatCurrency(value) : value,
                  name.charAt(0).toUpperCase() + name.slice(1),
                ]}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="value"
                name="Pipeline Value"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="leads"
                name="New Leads"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
