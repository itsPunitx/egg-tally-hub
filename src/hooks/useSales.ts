import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Sale {
  id: string;
  customer_id: string;
  date: string;
  eggs: number;
  price_per_egg: number;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  created_at: string;
  updated_at: string;
  customers?: {
    name: string;
  };
}

export const useSales = (customerId?: string) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSales = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("sales")
        .select(`
          *,
          customers (
            name
          )
        `)
        .order("date", { ascending: false });

      if (customerId) {
        query = query.eq("customer_id", customerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching sales",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSale = async (saleData: {
    customer_id: string;
    eggs: number;
    price_per_egg: number;
    paid_amount: number;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const total_amount = saleData.eggs * saleData.price_per_egg;
      const due_amount = total_amount - saleData.paid_amount;

      const { error } = await supabase.from("sales").insert([{
        ...saleData,
        user_id: user.id,
        total_amount,
        due_amount,
      }]);

      if (error) throw error;

      toast({
        title: "Sale recorded successfully",
        description: `Added ${saleData.eggs} eggs for ₹${total_amount.toFixed(2)}`,
      });

      await fetchSales();
      return true;
    } catch (error: any) {
      toast({
        title: "Error recording sale",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchSales();
  }, [customerId]);

  return {
    sales,
    loading,
    fetchSales,
    addSale,
  };
};