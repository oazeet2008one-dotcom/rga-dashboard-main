import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Percent, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/formatters';

interface EcommerceKPIProps {
  summary: {
    totalRevenue: number;
    revenueTrend: number;
    totalOrders: number;
    ordersTrend: number;
    averageOrderValue: number;
    aovTrend: number;
    conversionRate: number;
    crTrend: number;
  };
}

export function EcommerceKPIs({ summary }: EcommerceKPIProps) {
  const kpis = [
    {
      title: 'Total Revenue',
      value: formatCurrency(summary.totalRevenue),
      trend: summary.revenueTrend,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Total Orders',
      value: formatNumber(summary.totalOrders),
      trend: summary.ordersTrend,
      icon: <ShoppingCart className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Avg. Order Value',
      value: formatCurrency(summary.averageOrderValue),
      trend: summary.aovTrend,
      icon: <Percent className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Conversion Rate',
      value: `${summary.conversionRate.toFixed(2)}%`,
      trend: summary.crTrend,
      icon: <UserCheck className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            {kpi.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {kpi.trend > 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span className={kpi.trend > 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(kpi.trend).toFixed(2)}%
              </span>
              <span className="ml-1 text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
