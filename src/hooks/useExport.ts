import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";

export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportCustomers = async () => {
    try {
      setIsExporting(true);
      
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");

      if (error) throw error;

      const csvData = data?.map(customer => ({
        Name: customer.name,
        "Total Eggs": customer.total_eggs,
        "Total Spent": customer.total_spent,
        "Total Paid": customer.total_paid,
        "Amount Due": customer.total_due,
        "Created Date": new Date(customer.created_at).toLocaleDateString(),
      })) || [];

      const csv = Papa.unparse(csvData);
      downloadFile(csv, "customers.csv", "text/csv");
      
      toast({
        title: "Export successful",
        description: "Customer data has been exported to CSV",
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportSales = async () => {
    try {
      setIsExporting(true);
      
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          customers (
            name
          )
        `)
        .order("date", { ascending: false });

      if (error) throw error;

      const csvData = data?.map(sale => ({
        Date: sale.date,
        Customer: sale.customers?.name || "Unknown",
        Eggs: sale.eggs,
        "Price per Egg": sale.price_per_egg,
        "Total Amount": sale.total_amount,
        "Paid Amount": sale.paid_amount,
        "Due Amount": sale.due_amount,
        "Created At": new Date(sale.created_at).toLocaleDateString(),
      })) || [];

      const csv = Papa.unparse(csvData);
      downloadFile(csv, "sales.csv", "text/csv");
      
      toast({
        title: "Export successful",
        description: "Sales data has been exported to CSV",
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    isExporting,
    exportCustomers,
    exportSales,
  };
};