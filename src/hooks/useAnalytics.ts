import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AnalyticsSummary {
  totalEggsSold: number;
  totalRevenue: number;
  totalCollected: number;
  totalDue: number;
}

export interface CustomerStats {
  name: string;
  total_eggs: number;
  total_spent: number;
}

export interface DailySales {
  date: string;
  eggs: number;
  revenue: number;
}

export const useAnalytics = () => {
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalEggsSold: 0,
    totalRevenue: 0,
    totalCollected: 0,
    totalDue: 0,
  });
  const [customerStats, setCustomerStats] = useState<CustomerStats[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch summary stats
      const { data: summaryData, error: summaryError } = await supabase
        .from("sales")
        .select("eggs, total_amount, paid_amount, due_amount");

      if (summaryError) throw summaryError;

      const totalEggsSold = summaryData?.reduce((sum, sale) => sum + sale.eggs, 0) || 0;
      const totalRevenue = summaryData?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
      const totalCollected = summaryData?.reduce((sum, sale) => sum + sale.paid_amount, 0) || 0;
      const totalDue = summaryData?.reduce((sum, sale) => sum + sale.due_amount, 0) || 0;

      setSummary({
        totalEggsSold,
        totalRevenue,
        totalCollected,
        totalDue,
      });

      // Fetch customer stats
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("name, total_eggs, total_spent")
        .order("total_eggs", { ascending: false })
        .limit(10);

      if (customerError) throw customerError;
      setCustomerStats(customerData || []);

      // Fetch daily sales data
      const { data: dailyData, error: dailyError } = await supabase
        .from("sales")
        .select("date, eggs, total_amount")
        .order("date", { ascending: true });

      if (dailyError) throw dailyError;

      // Group by date
      const groupedData = dailyData?.reduce((acc, sale) => {
        const date = sale.date;
        if (!acc[date]) {
          acc[date] = { date, eggs: 0, revenue: 0 };
        }
        acc[date].eggs += sale.eggs;
        acc[date].revenue += sale.total_amount;
        return acc;
      }, {} as Record<string, DailySales>);

      setDailySales(Object.values(groupedData || {}));
    } catch (error: any) {
      toast({
        title: "Error fetching analytics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return {
    summary,
    customerStats,
    dailySales,
    loading,
    fetchAnalytics,
  };
};