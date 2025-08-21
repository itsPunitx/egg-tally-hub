import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCustomers, Customer } from "@/hooks/useCustomers";
import { useSales } from "@/hooks/useSales";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers } = useCustomers();
  const { sales, loading } = useSales(id);
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const foundCustomer = customers.find(c => c.id === id);
    if (foundCustomer) {
      setCustomer(foundCustomer);
    } else if (id && customers.length > 0) {
      // If customer not found in the list, try fetching directly
      const fetchCustomer = async () => {
        const { data } = await supabase
          .from("customers")
          .select("*")
          .eq("id", id)
          .single();
        if (data) {
          setCustomer(data);
        }
      };
      fetchCustomer();
    }
  }, [id, customers]);

  if (!id) {
    navigate("/customers");
    return null;
  }

  if (!customer && customers.length > 0) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Navigation />
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Customer not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
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
      <div className="max-w-4xl mx-auto">
        <Navigation />
        
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/customers")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Customers
          </Button>
        </div>

        {customer && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>👤</span>
                  {customer.name}
                </CardTitle>
                <CardDescription>Customer transaction summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{customer.total_eggs}</div>
                    <div className="text-sm text-muted-foreground">Total Eggs</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">${customer.total_spent.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Total Spent</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">${customer.total_paid.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Total Paid</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className={`text-2xl font-bold ${customer.total_due > 0 ? 'text-destructive' : 'text-green-600'}`}>
                      ${customer.total_due.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">Amount Due</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All sales transactions for this customer</CardDescription>
              </CardHeader>
              <CardContent>
                {sales.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions found for this customer.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Eggs</TableHead>
                          <TableHead className="text-right">Price/Egg</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Paid</TableHead>
                          <TableHead className="text-right">Due</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sales.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell>
                              {new Date(sale.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {sale.eggs}
                            </TableCell>
                            <TableCell className="text-right">
                              ${sale.price_per_egg.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              ${sale.total_amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              ${sale.paid_amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={sale.due_amount > 0 ? "text-destructive" : ""}>
                                ${sale.due_amount.toFixed(2)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerDetail;