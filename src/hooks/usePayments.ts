import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Payment {
  id: string;
  customer_id: string;
  payment_amount: number;
  payment_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const usePayments = (customerId?: string) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPayments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("payments")
        .select("*")
        .order("payment_date", { ascending: false });

      if (customerId) {
        query = query.eq("customer_id", customerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching payments",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addPayment = async (paymentData: {
    customer_id: string;
    payment_amount: number;
    notes?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("payments").insert([{
        ...paymentData,
        user_id: user.id,
      }]);

      if (error) throw error;

      toast({
        title: "Payment recorded successfully",
        description: `Payment of ₹${paymentData.payment_amount.toFixed(2)} has been recorded`,
      });

      await fetchPayments();
      
      // Refresh analytics and customers data after payment
      const { refreshAnalytics } = await import("@/hooks/useAnalytics");
      const { refreshCustomers } = await import("@/hooks/useCustomers");
      refreshAnalytics();
      refreshCustomers();
      
      return true;
    } catch (error: any) {
      toast({
        title: "Error recording payment",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [customerId]);

  return {
    payments,
    loading,
    fetchPayments,
    addPayment,
  };
};