import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useCustomers } from "@/hooks/useCustomers";
import { Plus, TrendingUp, Users, Clock } from "lucide-react";

const Index = () => {
  const { summary, loading: analyticsLoading } = useAnalytics();
  const { customers, loading: customersLoading } = useCustomers();

  const recentCustomers = customers
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <Navigation />
        
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-2">
            <span>🥚</span>
            Hostel Egg Sales Tracker
          </h1>
          <p className="text-xl text-muted-foreground">
            Manage your egg sales and track payments efficiently
          </p>
        </div>

        {/* Quick Stats */}
        {!analyticsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eggs Sold Today</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalEggsSold}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <span className="text-lg">💰</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{summary.totalRevenue.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customers.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Amount Due</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${summary.totalDue > 0 ? 'text-destructive' : 'text-primary'}`}>
                  ₹{summary.totalDue.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Get started with common tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full" size="lg">
                <Link to="/add-sale" className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Record New Sale
                </Link>
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline">
                  <Link to="/customers">View Customers</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/analytics">Analytics</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Customers */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Customers</CardTitle>
              <CardDescription>
                Recently active customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customersLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
                  ))}
                </div>
              ) : recentCustomers.length > 0 ? (
                <div className="space-y-3">
                  {recentCustomers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.total_eggs} eggs • ₹{customer.total_spent.toFixed(2)}
                        </div>
                      </div>
                      {customer.total_due > 0 && (
                        <div className="text-sm text-destructive font-medium">
                          Due: ₹{customer.total_due.toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))}
                  <Button asChild variant="ghost" className="w-full">
                    <Link to="/customers">View All Customers</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No customers yet.</p>
                  <p className="text-sm">Record your first sale to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
