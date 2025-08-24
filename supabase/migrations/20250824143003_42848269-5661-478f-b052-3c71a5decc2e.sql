-- Fix the customer totals calculation logic to be consistent
-- Drop existing triggers first
DROP TRIGGER IF EXISTS update_customer_totals_trigger ON public.sales;
DROP TRIGGER IF EXISTS update_customer_totals_on_payment_trigger ON public.payments;

-- Update the customer totals function to use consistent logic
CREATE OR REPLACE FUNCTION public.update_customer_totals()
RETURNS trigger
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
      total_paid = COALESCE((SELECT SUM(paid_amount) FROM public.sales WHERE customer_id = NEW.customer_id), 0) + 
                   COALESCE((SELECT SUM(payment_amount) FROM public.payments WHERE customer_id = NEW.customer_id), 0),
      total_due = COALESCE((SELECT SUM(total_amount) FROM public.sales WHERE customer_id = NEW.customer_id), 0) - 
                  (COALESCE((SELECT SUM(paid_amount) FROM public.sales WHERE customer_id = NEW.customer_id), 0) + 
                   COALESCE((SELECT SUM(payment_amount) FROM public.payments WHERE customer_id = NEW.customer_id), 0))
    WHERE id = NEW.customer_id;
  END IF;
  
  -- Handle deletes
  IF TG_OP = 'DELETE' THEN
    UPDATE public.customers
    SET 
      total_eggs = COALESCE((SELECT SUM(eggs) FROM public.sales WHERE customer_id = OLD.customer_id), 0),
      total_spent = COALESCE((SELECT SUM(total_amount) FROM public.sales WHERE customer_id = OLD.customer_id), 0),
      total_paid = COALESCE((SELECT SUM(paid_amount) FROM public.sales WHERE customer_id = OLD.customer_id), 0) + 
                   COALESCE((SELECT SUM(payment_amount) FROM public.payments WHERE customer_id = OLD.customer_id), 0),
      total_due = COALESCE((SELECT SUM(total_amount) FROM public.sales WHERE customer_id = OLD.customer_id), 0) - 
                  (COALESCE((SELECT SUM(paid_amount) FROM public.sales WHERE customer_id = OLD.customer_id), 0) + 
                   COALESCE((SELECT SUM(payment_amount) FROM public.payments WHERE customer_id = OLD.customer_id), 0))
    WHERE id = OLD.customer_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update the payment totals function to use the same consistent logic
CREATE OR REPLACE FUNCTION public.update_customer_totals_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update customer totals when payments change
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.customers
    SET 
      total_paid = COALESCE((SELECT SUM(paid_amount) FROM public.sales WHERE customer_id = NEW.customer_id), 0) + 
                   COALESCE((SELECT SUM(payment_amount) FROM public.payments WHERE customer_id = NEW.customer_id), 0),
      total_due = COALESCE((SELECT SUM(total_amount) FROM public.sales WHERE customer_id = NEW.customer_id), 0) - 
                  (COALESCE((SELECT SUM(paid_amount) FROM public.sales WHERE customer_id = NEW.customer_id), 0) + 
                   COALESCE((SELECT SUM(payment_amount) FROM public.payments WHERE customer_id = NEW.customer_id), 0))
    WHERE id = NEW.customer_id;
  END IF;
  
  -- Handle deletes
  IF TG_OP = 'DELETE' THEN
    UPDATE public.customers
    SET 
      total_paid = COALESCE((SELECT SUM(paid_amount) FROM public.sales WHERE customer_id = OLD.customer_id), 0) + 
                   COALESCE((SELECT SUM(payment_amount) FROM public.payments WHERE customer_id = OLD.customer_id), 0),
      total_due = COALESCE((SELECT SUM(total_amount) FROM public.sales WHERE customer_id = OLD.customer_id), 0) - 
                  (COALESCE((SELECT SUM(paid_amount) FROM public.sales WHERE customer_id = OLD.customer_id), 0) + 
                   COALESCE((SELECT SUM(payment_amount) FROM public.payments WHERE customer_id = OLD.customer_id), 0))
    WHERE id = OLD.customer_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recreate the triggers
CREATE TRIGGER update_customer_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.update_customer_totals();

CREATE TRIGGER update_customer_totals_on_payment_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_customer_totals_on_payment();

-- Recalculate all customer totals to fix any inconsistencies
UPDATE public.customers
SET 
  total_eggs = COALESCE((SELECT SUM(eggs) FROM public.sales WHERE customer_id = customers.id), 0),
  total_spent = COALESCE((SELECT SUM(total_amount) FROM public.sales WHERE customer_id = customers.id), 0),
  total_paid = COALESCE((SELECT SUM(paid_amount) FROM public.sales WHERE customer_id = customers.id), 0) + 
               COALESCE((SELECT SUM(payment_amount) FROM public.payments WHERE customer_id = customers.id), 0),
  total_due = COALESCE((SELECT SUM(total_amount) FROM public.sales WHERE customer_id = customers.id), 0) - 
              (COALESCE((SELECT SUM(paid_amount) FROM public.sales WHERE customer_id = customers.id), 0) + 
               COALESCE((SELECT SUM(payment_amount) FROM public.payments WHERE customer_id = customers.id), 0));