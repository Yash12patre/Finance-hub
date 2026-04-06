import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(210, 70%, 50%)", "hsl(150, 60%, 40%)", "hsl(30, 80%, 50%)", "hsl(270, 50%, 50%)"];

export default function Dashboard() {
  const { data: records = [] } = useQuery({
    queryKey: ["financial_records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_records")
        .select("*, categories(name)")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const totalIncome = records.filter((r) => r.type === "income").reduce((s, r) => s + Number(r.amount), 0);
  const totalExpense = records.filter((r) => r.type === "expense").reduce((s, r) => s + Number(r.amount), 0);
  const netBalance = totalIncome - totalExpense;

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  records.forEach((r) => {
    const name = (r.categories as any)?.name || "Unknown";
    categoryMap[name] = (categoryMap[name] || 0) + Number(r.amount);
  });
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  // Monthly trend
  const monthMap: Record<string, { income: number; expense: number }> = {};
  records.forEach((r) => {
    const month = r.date.substring(0, 7);
    if (!monthMap[month]) monthMap[month] = { income: 0, expense: 0 };
    monthMap[month][r.type] += Number(r.amount);
  });
  const monthlyData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  const recentRecords = records.slice(0, 5);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalIncome.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalExpense.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netBalance >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                ${netBalance.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{records.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="income" fill="hsl(150, 60%, 40%)" name="Income" />
                    <Bar dataKey="expense" fill="hsl(var(--destructive))" name="Expense" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRecords.map((r) => (
                <div key={r.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{r.description || (r.categories as any)?.name}</p>
                    <p className="text-sm text-muted-foreground">{r.date} · {(r.categories as any)?.name}</p>
                  </div>
                  <span className={`font-semibold ${r.type === "income" ? "text-emerald-600" : "text-destructive"}`}>
                    {r.type === "income" ? "+" : "-"}${Number(r.amount).toLocaleString()}
                  </span>
                </div>
              ))}
              {recentRecords.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No records yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
