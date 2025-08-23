-- Create payments table to track payments against existing customer dues
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  payment_amount NUMERIC NOT NULL CHECK (payment_amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
CREATE POLICY "Users can manage their own payments" 
ON public.payments 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update customer totals when payments are made
CREATE OR REPLACE FUNCTION public.update_customer_totals_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update customer totals when payments change
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.customers
    SET 
      total_paid = COALESCE((SELECT SUM(paid_amount) FROM public.sales WHERE customer_id = NEW.customer_id), 0) + COALESCE((SELECT SUM(payment_amount) FROM public.payments WHERE customer_id = NEW.customer_id), 0),
      total_due = COALESCE((SELECT SUM(total_amount) FROM public.sales WHERE customer_id = NEW.customer_id), 0) - (COALESCE((SELECT SUM(paid_amount) FROM public.sales WHERE customer_id = NEW.customer_id), 0) + COALESCE((SELECT SUM(payment_amount) FROM public.payments WHERE customer_id = NEW.customer_id), 0))
    WHERE id = NEW.customer_id;
  END IF;
  
  -- Handle deletes
  IF TG_OP = 'DELETE' THEN
    UPDATE public.customers
    SET 
      total_paid = COALESCE((SELECT SUM(paid_amount) FROM public.sales WHERE customer_id = OLD.customer_id), 0) + COALESCE((SELECT SUM(payment_amount) FROM public.payments WHERE customer_id = OLD.customer_id), 0),
      total_due = COALESCE((SELECT SUM(total_amount) FROM public.sales WHERE customer_id = OLD.customer_id), 0) - (COALESCE((SELECT SUM(paid_amount) FROM public.sales WHERE customer_id = OLD.customer_id), 0) + COALESCE((SELECT SUM(payment_amount) FROM public.payments WHERE customer_id = OLD.customer_id), 0))
    WHERE id = OLD.customer_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger for payment updates
CREATE TRIGGER update_customer_on_payment
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_customer_totals_on_payment();