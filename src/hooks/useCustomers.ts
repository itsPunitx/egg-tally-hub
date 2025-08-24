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

// Create a global refresh function that can be called from other components
let globalRefreshCustomers: (() => Promise<void>) | null = null;

export const refreshCustomers = () => {
  if (globalRefreshCustomers) {
    return globalRefreshCustomers();
  }
};

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // First try to find existing customer for this user
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("name", name.trim())
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        return existing.id;
      }

      // Create new customer if not found
      const { data, error } = await supabase
        .from("customers")
        .insert([{ name: name.trim(), user_id: user.id }])
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
    // Set global refresh function
    globalRefreshCustomers = fetchCustomers;
    
    // Cleanup
    return () => {
      globalRefreshCustomers = null;
    };
  }, []);

  return {
    customers,
    loading,
    fetchCustomers,
    getOrCreateCustomer,
  };
};