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
import { sessionService } from "@/services/sessionService";
import { supabase } from "@/integrations/supabase/client";

const FinancialGraphs = () => {
  const [selectedMetric, setSelectedMetric] = useState("payments");
  const [timeframe, setTimeframe] = useState("monthly");
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Historical data based on real business data (Aug 2024 - Jul 2025)
  const getHistoricalData = () => [
    { month: "AUG 2024", payments: 6500, reconciled: 0, expenses: 0, profit: 6500 },
    { month: "SEP 2024", payments: 13950, reconciled: 0, expenses: 0, profit: 13950 },
    { month: "OCT 2024", payments: 20000, reconciled: 0, expenses: 0, profit: 20000 },
    { month: "NOV 2024", payments: 11230, reconciled: 0, expenses: 0, profit: 11230 },
    { month: "DEC 2024", payments: 18700, reconciled: 0, expenses: 0, profit: 18700 },
    { month: "JAN 2025", payments: 21150, reconciled: 0, expenses: 0, profit: 21150 },
    { month: "FEB 2025", payments: 27650, reconciled: 0, expenses: 0, profit: 27650 },
    { month: "MAR 2025", payments: 34750, reconciled: 0, expenses: 0, profit: 34750 },
    { month: "APR 2025", payments: 22000, reconciled: 0, expenses: 0, profit: 22000 },
    { month: "MAY 2025", payments: 11220, reconciled: 0, expenses: 0, profit: 11220 },
    { month: "JUN 2025", payments: 12700, reconciled: 0, expenses: 0, profit: 12700 },
    { month: "JUL 2025", payments: 26640, reconciled: 0, expenses: 0, profit: 26640 }
  ];

  // Fetch real-time monthly data from database
  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      
      // Get current date
      const currentDate = new Date();
      const isAfterAugust2025 = currentDate >= new Date('2025-08-01');
      
      if (isAfterAugust2025) {
        // Fetch real-time data from database for Aug 2025 onwards
        const [payments, expenses, sessions] = await Promise.all([
          supabase.from('payments').select('amount, payment_date').eq('status', 'completed'),
          supabase.from('expenses').select('amount, expense_date').eq('status', 'completed'),
          supabase.from('sessions').select('date, status').eq('status', 'completed')
        ]);

        // Group data by month
        const monthlyData = new Map();

        // Process historical data first
        getHistoricalData().forEach(item => {
          monthlyData.set(item.month, item);
        });

        // Process real payments data
        if (payments.data) {
          payments.data.forEach(payment => {
            const date = new Date(payment.payment_date);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
            
            if (!monthlyData.has(monthKey)) {
              monthlyData.set(monthKey, { month: monthKey, payments: 0, reconciled: 0, expenses: 0, profit: 0 });
            }
            
            const existing = monthlyData.get(monthKey);
            existing.payments += Number(payment.amount);
          });
        }

        // Process real expenses data
        if (expenses.data) {
          expenses.data.forEach(expense => {
            const date = new Date(expense.expense_date);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
            
            if (!monthlyData.has(monthKey)) {
              monthlyData.set(monthKey, { month: monthKey, payments: 0, reconciled: 0, expenses: 0, profit: 0 });
            }
            
            const existing = monthlyData.get(monthKey);
            existing.expenses += Number(expense.amount);
          });
        }

        // Process completed sessions for reconciled count
        if (sessions.data) {
          sessions.data.forEach(session => {
            const date = new Date(session.date);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
            
            if (!monthlyData.has(monthKey)) {
              monthlyData.set(monthKey, { month: monthKey, payments: 0, reconciled: 0, expenses: 0, profit: 0 });
            }
            
            const existing = monthlyData.get(monthKey);
            existing.reconciled += 1;
          });
        }

        // Calculate profit for all entries
        Array.from(monthlyData.values()).forEach(item => {
          item.profit = item.payments - item.expenses;
        });

        // Sort by date
        const sortedData = Array.from(monthlyData.values()).sort((a, b) => {
          const dateA = new Date(a.month.split(' ')[1] + '-' + a.month.split(' ')[0] + '-01');
          const dateB = new Date(b.month.split(' ')[1] + '-' + b.month.split(' ')[0] + '-01');
          return dateA.getTime() - dateB.getTime();
        });

        setChartData(sortedData);
      } else {
        // Use historical data with real expenses calculation
        const [expenses, sessions] = await Promise.all([
          supabase.from('expenses').select('amount, expense_date').eq('status', 'completed'),
          supabase.from('sessions').select('date, status').eq('status', 'completed')
        ]);

        const historicalData = getHistoricalData();
        
        // Add real expenses and sessions to historical data
        if (expenses.data || sessions.data) {
          const monthlyData = new Map();
          
          historicalData.forEach(item => {
            monthlyData.set(item.month, { ...item });
          });

          // Process real expenses for historical months
          if (expenses.data) {
            expenses.data.forEach(expense => {
              const date = new Date(expense.expense_date);
              const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
              
              if (monthlyData.has(monthKey)) {
                const existing = monthlyData.get(monthKey);
                existing.expenses += Number(expense.amount);
                existing.profit = existing.payments - existing.expenses;
              }
            });
          }

          // Process completed sessions for reconciled count
          if (sessions.data) {
            sessions.data.forEach(session => {
              const date = new Date(session.date);
              const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
              
              if (monthlyData.has(monthKey)) {
                const existing = monthlyData.get(monthKey);
                existing.reconciled += 1;
              }
            });
          }

          setChartData(Array.from(monthlyData.values()));
        } else {
          setChartData(historicalData);
        }
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
      // Fallback to historical data
      setChartData(getHistoricalData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyData();
  }, []);

  const metrics = [
    { id: "payments", label: "Payments", color: "#3b82f6" },
    { id: "reconciled", label: "Reconciled Sessions", color: "#10b981" },
    { id: "expenses", label: "Expenses", color: "#f59e0b" },
    { id: "profit", label: "Profit", color: "#8b5cf6" }
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
      const value = payload[0].value;
      const isReconciledSessions = selectedMetric === 'reconciled';
      
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-primary font-semibold">
            {isReconciledSessions 
              ? `${value} sessions` 
              : `AED ${value.toLocaleString()}`
            }
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
        {loading ? (
          <div className="h-80 w-full flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading financial data...</div>
          </div>
        ) : (
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
                  tickFormatter={(value) => 
                    selectedMetric === 'reconciled' 
                      ? `${value}` 
                      : `DH${(value / 1000).toFixed(0)}K`
                  }
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
        )}
        
        {/* Summary Information */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              Historical data (Aug 2024 - Jul 2025) | Real-time data starts from Aug 2025
            </span>
            <span className="font-medium">
              Total {selectedMetricData?.label}: {
                selectedMetric === 'reconciled' 
                  ? `${chartData.reduce((sum, item) => sum + (item[selectedMetric as keyof typeof item] as number), 0)} sessions`
                  : `AED ${chartData.reduce((sum, item) => sum + (item[selectedMetric as keyof typeof item] as number), 0).toLocaleString()}`
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialGraphs;
