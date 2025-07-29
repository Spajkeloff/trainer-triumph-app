import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { financeService } from "@/services/financeService";

const FinancialGraphs = () => {
  const [selectedMetric, setSelectedMetric] = useState("payments");
  const [timeframe, setTimeframe] = useState("monthly");
  const [realTimeData, setRealTimeData] = useState<any>(null);

  // Historical data from your business (July 2024 - July 2025)
  const historicalData = [
    { month: "JUL 2024", payments: 3500, reconciled: 3200, expenses: 800, profit: 2700, projected: 3000 },
    { month: "AUG 2024", payments: 6500, reconciled: 6200, expenses: 1200, profit: 5300, projected: 6000 },
    { month: "SEP 2024", payments: 13950, reconciled: 13500, expenses: 2100, profit: 11850, projected: 12000 },
    { month: "OCT 2024", payments: 18700, reconciled: 18200, expenses: 2800, profit: 15900, projected: 17000 },
    { month: "NOV 2024", payments: 11230, reconciled: 10800, expenses: 1800, profit: 9430, projected: 11000 },
    { month: "DEC 2024", payments: 18700, reconciled: 18200, expenses: 2500, profit: 16200, projected: 18000 },
    { month: "JAN 2025", payments: 21150, reconciled: 20500, expenses: 3000, profit: 18150, projected: 20000 },
    { month: "FEB 2025", payments: 27650, reconciled: 26800, expenses: 3500, profit: 24150, projected: 26000 },
    { month: "MAR 2025", payments: 34750, reconciled: 33900, expenses: 4200, profit: 30550, projected: 33000 },
    { month: "APR 2025", payments: 11220, reconciled: 10800, expenses: 2200, profit: 9020, projected: 12000 },
    { month: "MAY 2025", payments: 12700, reconciled: 12200, expenses: 2300, profit: 10400, projected: 13000 },
    { month: "JUN 2025", payments: 26640, reconciled: 25800, expenses: 3800, profit: 22840, projected: 25000 },
    { month: "JUL 2025", payments: 26640, reconciled: 25800, expenses: 3800, profit: 22840, projected: 25000 }
  ];

  // Real-time data calculation (from August 2025 onwards)
  const [chartData, setChartData] = useState(historicalData);

  useEffect(() => {
    const fetchRealTimeData = async () => {
      try {
        const stats = await financeService.getFinancialStats();
        setRealTimeData(stats);
        
        // Check if we're past August 2025 to start showing real-time data
        const currentDate = new Date();
        const isAfterAugust2025 = currentDate > new Date('2025-08-01');
        
        if (isAfterAugust2025) {
          // TODO: Implement logic to append real-time monthly data
          // For now, we'll keep using historical data
          setChartData(historicalData);
        }
      } catch (error) {
        console.error('Error fetching real-time financial data:', error);
      }
    };

    fetchRealTimeData();
  }, []);

  const metrics = [
    { id: "payments", label: "Payments", color: "#3b82f6" },
    { id: "reconciled", label: "Reconciled", color: "#10b981" },
    { id: "expenses", label: "Expenses", color: "#f59e0b" },
    { id: "profit", label: "Profit", color: "#8b5cf6" },
    { id: "projected", label: "Projected", color: "#06b6d4" }
  ];

  const timeframes = [
    { id: "monthly", label: "Monthly" },
    { id: "quarterly", label: "Quarterly" },
    { id: "yearly", label: "Yearly" }
  ];

  const selectedMetricData = metrics.find(m => m.id === selectedMetric);
  const maxValue = Math.max(...chartData.map(d => d[selectedMetric as keyof typeof d] as number));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-primary font-semibold">
            AED {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-xl font-bold">Financial Graphs</CardTitle>
          <div className="flex items-center gap-4">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeframes.map((tf) => (
                  <SelectItem key={tf.id} value={tf.id}>
                    {tf.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Metric Tabs */}
        <div className="flex flex-wrap gap-1 pt-4">
          {metrics.map((metric) => (
            <Button
              key={metric.id}
              variant={selectedMetric === metric.id ? "default" : "ghost"}
              onClick={() => setSelectedMetric(metric.id)}
              className={`h-auto px-4 py-2 ${
                selectedMetric === metric.id 
                  ? 'bg-primary text-primary-foreground border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {metric.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={(value) => `DH${(value / 1000).toFixed(0)}K`}
                domain={[0, maxValue * 1.1]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey={selectedMetric}
                fill={selectedMetricData?.color || "#3b82f6"}
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary Information */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              Historical data (Jul 2024 - Jun 2025) | Real-time data starts from Aug 2025
            </span>
            <span className="font-medium">
              Total {selectedMetricData?.label}: AED {chartData.reduce((sum, item) => sum + (item[selectedMetric as keyof typeof item] as number), 0).toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialGraphs;
