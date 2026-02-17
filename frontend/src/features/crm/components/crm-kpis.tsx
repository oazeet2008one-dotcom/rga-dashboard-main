import { TrendingUp, TrendingDown, Users, Target, MousePointer, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/formatters';

interface CrmKPIProps {
  summary: {
    totalLeads: number;
    leadsTrend: number;
    qualifiedLeads: number;
    qualifiedTrend: number;
    conversionRate: number;
    costPerLead: number;
    cplTrend: number;
    pipelineValue: number;
    pipelineTrend: number;
  };
}

export function CrmKPIs({ summary }: CrmKPIProps) {
  const kpis = [
    {
      title: 'Total Leads',
      value: formatNumber(summary.totalLeads),
      trend: summary.leadsTrend,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Qualified Leads',
      value: formatNumber(summary.qualifiedLeads),
      trend: summary.qualifiedTrend,
      icon: <Target className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Cost per Lead',
      value: formatCurrency(summary.costPerLead),
      trend: summary.cplTrend,
      icon: <MousePointer className="h-4 w-4 text-muted-foreground" />,
      reverseTrend: true, // Lower CPL is better
    },
    {
      title: 'Pipeline Value',
      value: formatCurrency(summary.pipelineValue),
      trend: summary.pipelineTrend,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const isPositive = kpi.reverseTrend ? kpi.trend < 0 : kpi.trend > 0;
        const trendColor = isPositive ? 'text-green-500' : 'text-red-500';

        return (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {kpi.trend > 0 ? (
                  <TrendingUp className={`mr-1 h-3 w-3 ${trendColor}`} />
                ) : (
                  <TrendingDown className={`mr-1 h-3 w-3 ${trendColor}`} />
                )}
                <span className={trendColor}>
                  {Math.abs(kpi.trend).toFixed(2)}%
                </span>
                <span className="ml-1 text-muted-foreground">vs last period</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
