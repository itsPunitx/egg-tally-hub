import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInventory } from "@/hooks/useInventory";
import { Loader2, Package, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Inventory = () => {
  const { inventory, loading, addInventory, getTotalStock, getAveragePurchasePrice } = useInventory();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    eggs_in_stock: "",
    purchase_price_per_egg: "",
    purchase_date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addInventory({
      eggs_in_stock: parseInt(formData.eggs_in_stock),
      purchase_price_per_egg: parseFloat(formData.purchase_price_per_egg),
      purchase_date: formData.purchase_date,
    });

    if (success) {
      setFormData({
        eggs_in_stock: "",
        purchase_price_per_egg: "",
        purchase_date: new Date().toISOString().split('T')[0],
      });
      setIsDialogOpen(false);
    }
  };

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

  const totalStock = getTotalStock();
  const avgPurchasePrice = getAveragePurchasePrice();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <Navigation />
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Inventory Management
          </h1>
          <p className="text-muted-foreground">
            Track your egg stock and purchase costs
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
              <span className="text-2xl">🥚</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStock.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">eggs in stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Purchase Price</CardTitle>
              <span className="text-2xl">💰</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{avgPurchasePrice.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">per egg</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
              <span className="text-2xl">📊</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(totalStock * avgPurchasePrice).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">total cost</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Stock Button */}
        <div className="mb-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Stock
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Stock</DialogTitle>
                <DialogDescription>
                  Add eggs to your inventory with purchase details
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="eggs">Number of Eggs</Label>
                  <Input
                    id="eggs"
                    type="number"
                    value={formData.eggs_in_stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, eggs_in_stock: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Purchase Price per Egg (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.purchase_price_per_egg}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchase_price_per_egg: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Purchase Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Add to Inventory
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Records</CardTitle>
            <CardDescription>Your inventory purchase history</CardDescription>
          </CardHeader>
          <CardContent>
            {inventory.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No inventory records yet</p>
                <p className="text-sm text-muted-foreground">Add your first stock purchase to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Eggs</TableHead>
                    <TableHead>Price per Egg</TableHead>
                    <TableHead>Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{new Date(item.purchase_date).toLocaleDateString()}</TableCell>
                      <TableCell>{item.eggs_in_stock.toLocaleString()}</TableCell>
                      <TableCell>₹{item.purchase_price_per_egg.toFixed(2)}</TableCell>
                      <TableCell>₹{(item.eggs_in_stock * item.purchase_price_per_egg).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Inventory;