-- Fix security warnings: Update functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_customer_totals()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update customer totals when sales change
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.customers
    SET 
      total_eggs = COALESCE((SELECT SUM(eggs) FROM public.sales WHERE customer_id = NEW.customer_id), 0),
      total_spent = COALESCE((SELECT SUM(total_amount) FROM public.sales WHERE customer_id = NEW.customer_id), 0),
      total_paid = COALESCE((SELECT SUM(paid_amount) FROM public.sales WHERE customer_id = NEW.customer_id), 0),
      total_due = COALESCE((SELECT SUM(due_amount) FROM public.sales WHERE customer_id = NEW.customer_id), 0)
    WHERE id = NEW.customer_id;
  END IF;
  
  -- Handle deletes
  IF TG_OP = 'DELETE' THEN
    UPDATE public.customers
    SET 
      total_eggs = COALESCE((SELECT SUM(eggs) FROM public.sales WHERE customer_id = OLD.customer_id), 0),
      total_spent = COALESCE((SELECT SUM(total_amount) FROM public.sales WHERE customer_id = OLD.customer_id), 0),
      total_paid = COALESCE((SELECT SUM(paid_amount) FROM public.sales WHERE customer_id = OLD.customer_id), 0),
      total_due = COALESCE((SELECT SUM(due_amount) FROM public.sales WHERE customer_id = OLD.customer_id), 0)
    WHERE id = OLD.customer_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;