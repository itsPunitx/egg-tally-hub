import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Inventory {
  id: string;
  user_id: string;
  eggs_in_stock: number;
  purchase_price_per_egg: number;
  purchase_date: string;
  created_at: string;
  updated_at: string;
}

export const useInventory = () => {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("purchase_date", { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching inventory",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addInventory = async (inventoryData: {
    eggs_in_stock: number;
    purchase_price_per_egg: number;
    purchase_date?: string;
  }) => {
    if (submitting) return false; // Prevent double submissions
    
    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Validate inputs
      if (inventoryData.eggs_in_stock <= 0) {
        throw new Error("Eggs in stock must be greater than 0");
      }
      if (inventoryData.purchase_price_per_egg <= 0) {
        throw new Error("Purchase price must be greater than 0");
      }

      const { error } = await supabase.from("inventory").insert([{
        ...inventoryData,
        user_id: user.id,
        purchase_date: inventoryData.purchase_date || new Date().toISOString().split('T')[0],
      }]);

      if (error) throw error;

      toast({
        title: "Inventory added successfully",
        description: `Added ${inventoryData.eggs_in_stock} eggs to inventory`,
      });

      await fetchInventory();
      return true;
    } catch (error: any) {
      toast({
        title: "Error adding inventory",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const getTotalStock = () => {
    return inventory.reduce((total, item) => total + item.eggs_in_stock, 0);
  };

  const getAveragePurchasePrice = () => {
    if (inventory.length === 0) return 0;
    const totalCost = inventory.reduce((total, item) => 
      total + (item.eggs_in_stock * item.purchase_price_per_egg), 0);
    const totalEggs = getTotalStock();
    return totalEggs > 0 ? totalCost / totalEggs : 0;
  };

  const getStockStatus = async () => {
    try {
      const { data: salesData } = await supabase
        .from("sales")
        .select("eggs");
      
      const totalStock = getTotalStock();
      const totalSold = salesData?.reduce((sum, sale) => sum + sale.eggs, 0) || 0;
      const availableStock = Math.max(0, totalStock - totalSold);
      
      return {
        totalStock,
        totalSold,
        availableStock,
      };
    } catch (error) {
      return {
        totalStock: getTotalStock(),
        totalSold: 0,
        availableStock: getTotalStock(),
      };
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return {
    inventory,
    loading,
    submitting,
    fetchInventory,
    addInventory,
    getTotalStock,
    getAveragePurchasePrice,
    getStockStatus,
  };
};