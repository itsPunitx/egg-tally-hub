import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomers } from "@/hooks/useCustomers";
import { useSales } from "@/hooks/useSales";
import { Loader2 } from "lucide-react";

const AddSale = () => {
  const navigate = useNavigate();
  const { customers, getOrCreateCustomer } = useCustomers();
  const { addSale } = useSales();

  const [formData, setFormData] = useState({
    customerName: "",
    eggs: "",
    pricePerEgg: "",
    paidAmount: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = formData.eggs && formData.pricePerEgg 
    ? (parseFloat(formData.eggs) * parseFloat(formData.pricePerEgg)).toFixed(2)
    : "0.00";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.eggs || !formData.pricePerEgg) {
      return;
    }

    setIsSubmitting(true);
    try {
      const customerId = await getOrCreateCustomer(formData.customerName.trim());
      if (!customerId) return;

      const success = await addSale({
        customer_id: customerId,
        eggs: parseInt(formData.eggs),
        price_per_egg: parseFloat(formData.pricePerEgg),
        paid_amount: parseFloat(formData.paidAmount) || 0,
      });

      if (success) {
        setFormData({
          customerName: "",
          eggs: "",
          pricePerEgg: "",
          paidAmount: "",
        });
        navigate("/");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-2xl mx-auto">
        <Navigation />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <span>🥚</span>
              Add New Sale
            </CardTitle>
            <CardDescription>
              Record a new egg sale transaction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  list="customers"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Enter customer name..."
                  required
                />
                <datalist id="customers">
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.name} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eggs">Number of Eggs</Label>
                  <Input
                    id="eggs"
                    type="number"
                    min="1"
                    value={formData.eggs}
                    onChange={(e) => setFormData({ ...formData, eggs: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricePerEgg">Price per Egg (₹)</Label>
                  <Input
                    id="pricePerEgg"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricePerEgg}
                    onChange={(e) => setFormData({ ...formData, pricePerEgg: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Total Amount</Label>
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  ₹{totalAmount}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paidAmount">Paid Amount (₹)</Label>
                <Input
                  id="paidAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalAmount}
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                  placeholder="0.00"
                />
                <p className="text-sm text-muted-foreground">
                  Leave empty if no payment made
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Record Sale
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="h-12"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddSale;