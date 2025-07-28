import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

const RevenueChart = () => {
  const [selectedMetric, setSelectedMetric] = useState("payments");
  const [timeframe, setTimeframe] = useState("month");

  const metrics = [
    { id: "payments", label: "Payments", color: "#0ea5e9" },
    { id: "reconciled", label: "Reconciled", color: "#059669" },
    { id: "expenses", label: "Expenses", color: "#dc2626" },
    { id: "profit", label: "Profit", color: "#7c3aed" },
    { id: "projected", label: "Projected", color: "#f59e0b" },
  ];

  const timeframes = [
    { id: "month", label: "Month" },
    { id: "quarter", label: "Quarter" },
    { id: "year", label: "Year" },
  ];

  const data = [
    { month: "Jan", payments: 8400, reconciled: 7200, expenses: 2400, profit: 5000, projected: 9000 },
    { month: "Feb", payments: 9600, reconciled: 8800, expenses: 2800, profit: 6000, projected: 10200 },
    { month: "Mar", payments: 11200, reconciled: 10400, expenses: 3200, profit: 7200, projected: 11800 },
    { month: "Apr", payments: 10800, reconciled: 9600, expenses: 3000, profit: 6600, projected: 11400 },
    { month: "May", payments: 12800, reconciled: 11600, expenses: 3600, profit: 8000, projected: 13500 },
    { month: "Jun", payments: 13600, reconciled: 12800, expenses: 3800, profit: 9000, projected: 14200 },
    { month: "Jul", payments: 14400, reconciled: 13200, expenses: 4000, profit: 9200, projected: 15000 },
    { month: "Aug", payments: 13200, reconciled: 12000, expenses: 3600, profit: 8400, projected: 13800 },
    { month: "Sep", payments: 15600, reconciled: 14400, expenses: 4200, profit: 10200, projected: 16200 },
    { month: "Oct", payments: 16800, reconciled: 15600, expenses: 4600, profit: 11000, projected: 17400 },
    { month: "Nov", payments: 14800, reconciled: 13600, expenses: 4000, profit: 9600, projected: 15400 },
    { month: "Dec", payments: 12450, reconciled: 11200, expenses: 3500, profit: 7700, projected: 13000 },
  ];

  const selectedMetricData = metrics.find(m => m.id === selectedMetric);

  return (
    <Card className="shadow-card">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Financial Overview</CardTitle>
          <div className="flex gap-2">
            {timeframes.map((timeframe) => (
              <Button
                key={timeframe.id}
                variant={timeframe.id === "month" ? "default" : "outline"}
                size="sm"
              >
                {timeframe.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {metrics.map((metric) => (
            <Button
              key={metric.id}
              variant={selectedMetric === metric.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMetric(metric.id)}
              className="flex items-center gap-2"
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: metric.color }}
              />
              {metric.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis 
                dataKey="month" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value: any) => [`$${value.toLocaleString()}`, selectedMetricData?.label]}
              />
              <Bar 
                dataKey={selectedMetric} 
                fill={selectedMetricData?.color}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;