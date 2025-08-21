import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Customer {
  id: string;
  name: string;
  total_eggs: number;
  total_spent: number;
  total_paid: number;
  total_due: number;
  created_at: string;
  updated_at: string;
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching customers",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getOrCreateCustomer = async (name: string): Promise<string | null> => {
    try {
      // First try to find existing customer
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("name", name.trim())
        .single();

      if (existing) {
        return existing.id;
      }

      // Create new customer if not found
      const { data, error } = await supabase
        .from("customers")
        .insert([{ name: name.trim() }])
        .select("id")
        .single();

      if (error) throw error;
      
      // Refresh customers list
      await fetchCustomers();
      
      return data.id;
    } catch (error: any) {
      toast({
        title: "Error with customer",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return {
    customers,
    loading,
    fetchCustomers,
    getOrCreateCustomer,
  };
};