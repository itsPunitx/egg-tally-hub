-- Create inventory summary table to store derived values
CREATE TABLE public.inventory_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_stock INTEGER NOT NULL DEFAULT 0,
  available_stock INTEGER NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  average_purchase_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.inventory_summary ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own inventory summary" 
ON public.inventory_summary 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own inventory summary" 
ON public.inventory_summary 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_inventory_summary_updated_at
BEFORE UPDATE ON public.inventory_summary
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate and update inventory summary
CREATE OR REPLACE FUNCTION public.update_inventory_summary(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_stock INTEGER;
  v_total_cost NUMERIC;
  v_average_price NUMERIC;
  v_total_sold INTEGER;
  v_available_stock INTEGER;
BEGIN
  -- Calculate total stock and cost from inventory
  SELECT 
    COALESCE(SUM(eggs_in_stock), 0),
    COALESCE(SUM(eggs_in_stock * purchase_price_per_egg), 0)
  INTO v_total_stock, v_total_cost
  FROM public.inventory 
  WHERE user_id = p_user_id;
  
  -- Calculate average purchase price
  v_average_price := CASE 
    WHEN v_total_stock > 0 THEN v_total_cost / v_total_stock 
    ELSE 0 
  END;
  
  -- Calculate total sold from sales
  SELECT COALESCE(SUM(eggs), 0)
  INTO v_total_sold
  FROM public.sales 
  WHERE user_id = p_user_id;
  
  -- Calculate available stock
  v_available_stock := GREATEST(0, v_total_stock - v_total_sold);
  
  -- Insert or update inventory summary
  INSERT INTO public.inventory_summary (
    user_id, 
    total_stock, 
    available_stock, 
    total_cost, 
    average_purchase_price
  ) VALUES (
    p_user_id,
    v_total_stock,
    v_available_stock,
    v_total_cost,
    v_average_price
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_stock = EXCLUDED.total_stock,
    available_stock = EXCLUDED.available_stock,
    total_cost = EXCLUDED.total_cost,
    average_purchase_price = EXCLUDED.average_purchase_price,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger function for inventory changes
CREATE OR REPLACE FUNCTION public.handle_inventory_summary_update()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.update_inventory_summary(NEW.user_id);
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    PERFORM public.update_inventory_summary(OLD.user_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger function for sales changes affecting inventory
CREATE OR REPLACE FUNCTION public.handle_inventory_summary_on_sales()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.update_inventory_summary(NEW.user_id);
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    PERFORM public.update_inventory_summary(OLD.user_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers on inventory table
CREATE TRIGGER inventory_summary_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.handle_inventory_summary_update();

-- Create triggers on sales table
CREATE TRIGGER inventory_summary_sales_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.handle_inventory_summary_on_sales();

-- Initialize inventory summary for existing users
INSERT INTO public.inventory_summary (user_id, total_stock, available_stock, total_cost, average_purchase_price)
SELECT DISTINCT 
  i.user_id,
  0, 0, 0, 0
FROM public.inventory i
ON CONFLICT (user_id) DO NOTHING;

-- Update all existing inventory summaries
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT DISTINCT user_id FROM public.inventory LOOP
    PERFORM public.update_inventory_summary(user_record.user_id);
  END LOOP;
END;
$$;