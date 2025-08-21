import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from "recharts";

const Analytics = () => {
  const { summary, customerStats, dailySales, loading } = useAnalytics();

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <Navigation />
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <Navigation />
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <span>📈</span>
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your egg sales performance and customer insights
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Eggs Sold</CardTitle>
              <span className="text-2xl">🥚</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalEggsSold.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <span className="text-2xl">💰</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
              <span className="text-2xl">✅</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${summary.totalCollected.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Amount Due</CardTitle>
              <span className="text-2xl">⏳</span>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.totalDue > 0 ? 'text-destructive' : 'text-green-600'}`}>
                ${summary.totalDue.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Stats Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top Customers by Eggs Purchased</CardTitle>
              <CardDescription>Customers with the highest egg purchases</CardDescription>
            </CardHeader>
            <CardContent>
              {customerStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={customerStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total_eggs" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No customer data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Sales Trend</CardTitle>
              <CardDescription>Eggs sold and revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              {dailySales.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailySales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis yAxisId="eggs" orientation="left" />
                    <YAxis yAxisId="revenue" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line 
                      yAxisId="eggs"
                      type="monotone" 
                      dataKey="eggs" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Eggs Sold"
                    />
                    <Line 
                      yAxisId="revenue"
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      name="Revenue ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No sales data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;