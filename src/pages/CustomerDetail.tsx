import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCustomers, Customer } from "@/hooks/useCustomers";
import { useSales } from "@/hooks/useSales";
import { usePayments } from "@/hooks/usePayments";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, fetchCustomers } = useCustomers();
  const { sales, loading } = useSales(id);
  const { payments, addPayment, submitting: paymentSubmitting } = usePayments(id);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const { toast } = useToast();

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

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customer || !id || paymentSubmitting) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    // Prevent payment exceeding due amount
    if (amount > customer.total_due) {
      toast({
        title: "Payment exceeds due amount",
        description: `Payment cannot exceed ₹${customer.total_due.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    const success = await addPayment({
      customer_id: id,
      payment_amount: amount,
      notes: paymentNotes || undefined,
    });

    if (success) {
      setPaymentAmount("");
      setPaymentNotes("");
      setIsPaymentDialogOpen(false);
      // Refresh customer data after a brief delay to allow DB triggers to complete
      setTimeout(async () => {
        await fetchCustomers();
        const { data } = await supabase
          .from("customers")
          .select("*")
          .eq("id", id)
          .single();
        if (data) {
          setCustomer(data);
        }
      }, 500);
    }
  };

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
                    <div className="text-2xl font-bold">₹{customer.total_spent.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Total Spent</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">₹{customer.total_paid.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Total Paid</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className={`text-2xl font-bold ${customer.total_due > 0 ? 'text-destructive' : 'text-green-600'}`}>
                      ₹{customer.total_due.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">Amount Due</div>
                  </div>
                </div>

                {customer.total_due > 0 && (
                  <div className="mt-4 flex justify-end">
                    <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <CreditCard className="h-4 w-4" />
                          Make Payment
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Record Payment</DialogTitle>
                          <DialogDescription>
                            Record a payment against {customer.name}'s outstanding dues of ₹{customer.total_due.toFixed(2)}
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handlePayment} className="space-y-4">
                          <div>
                            <Label htmlFor="paymentAmount" className="text-foreground">Payment Amount (₹)</Label>
                            <Input
                              id="paymentAmount"
                              type="number"
                              step="0.01"
                              min="0.01"
                              max={customer.total_due}
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              placeholder="Enter payment amount"
                              required
                              className="text-foreground placeholder:text-muted-foreground"
                            />
                          </div>
                          <div>
                            <Label htmlFor="paymentNotes" className="text-foreground">Notes (optional)</Label>
                            <Input
                              id="paymentNotes"
                              value={paymentNotes}
                              onChange={(e) => setPaymentNotes(e.target.value)}
                              placeholder="Add payment notes"
                              className="text-foreground placeholder:text-muted-foreground"
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={paymentSubmitting}>
                              {paymentSubmitting ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Processing...
                                </>
                              ) : (
                                "Record Payment"
                              )}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All sales transactions and payments for this customer</CardDescription>
              </CardHeader>
              <CardContent>
                {sales.length === 0 && payments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions found for this customer.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Type/Eggs</TableHead>
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
                              ₹{sale.price_per_egg.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              ₹{sale.total_amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              ₹{sale.paid_amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={sale.due_amount > 0 ? "text-destructive" : ""}>
                                ₹{sale.due_amount.toFixed(2)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                        {payments.map((payment) => (
                          <TableRow key={`payment-${payment.id}`} className="bg-green-50 dark:bg-green-900/20">
                            <TableCell>
                              {new Date(payment.payment_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                              Payment
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
                            <TableCell className="text-right">-</TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                              ₹{payment.payment_amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
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