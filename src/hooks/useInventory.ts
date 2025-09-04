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

export interface InventorySummary {
  id: string;
  user_id: string;
  total_stock: number;
  available_stock: number;
  total_cost: number;
  average_purchase_price: number;
  created_at: string;
  updated_at: string;
}

export const useInventory = () => {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchInventorySummary = async () => {
    try {
      const { data, error } = await supabase
        .from("inventory_summary")
        .select("*")
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore 'not found' errors
      setInventorySummary(data || null);
    } catch (error: any) {
      console.log("No inventory summary found, will be created on first inventory addition");
      setInventorySummary(null);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      
      // Fetch both inventory records and summary in parallel
      const [inventoryResult, summaryResult] = await Promise.all([
        supabase
          .from("inventory")
          .select("*")
          .order("purchase_date", { ascending: false }),
        supabase
          .from("inventory_summary")
          .select("*")
          .single()
      ]);

      if (inventoryResult.error) throw inventoryResult.error;
      setInventory(inventoryResult.data || []);
      
      // Summary might not exist yet, that's okay
      if (summaryResult.data) {
        setInventorySummary(summaryResult.data);
      }
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
    // Use stored value from inventory_summary if available, fallback to calculation
    return inventorySummary?.total_stock ?? inventory.reduce((total, item) => total + item.eggs_in_stock, 0);
  };

  const getAveragePurchasePrice = () => {
    // Use stored value from inventory_summary if available, fallback to calculation
    if (inventorySummary?.average_purchase_price !== undefined) {
      return inventorySummary.average_purchase_price;
    }
    
    if (inventory.length === 0) return 0;
    const totalCost = inventory.reduce((total, item) => 
      total + (item.eggs_in_stock * item.purchase_price_per_egg), 0);
    const totalEggs = inventory.reduce((total, item) => total + item.eggs_in_stock, 0);
    return totalEggs > 0 ? totalCost / totalEggs : 0;
  };

  const getStockStatus = () => {
    // Use stored values from inventory_summary if available
    if (inventorySummary) {
      return {
        totalStock: inventorySummary.total_stock,
        totalSold: inventorySummary.total_stock - inventorySummary.available_stock,
        availableStock: inventorySummary.available_stock,
      };
    }
    
    // Fallback to calculation if no summary available
    const totalStock = inventory.reduce((total, item) => total + item.eggs_in_stock, 0);
    return {
      totalStock,
      totalSold: 0, // Can't calculate without sales data
      availableStock: totalStock,
    };
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return {
    inventory,
    inventorySummary,
    loading,
    submitting,
    fetchInventory,
    addInventory,
    getTotalStock,
    getAveragePurchasePrice,
    getStockStatus,
  };
};