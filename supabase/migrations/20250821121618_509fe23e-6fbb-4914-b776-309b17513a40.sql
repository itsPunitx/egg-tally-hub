-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  total_eggs INTEGER NOT NULL DEFAULT 0,
  total_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_due DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  eggs INTEGER NOT NULL CHECK (eggs > 0),
  price_per_egg DECIMAL(8,2) NOT NULL CHECK (price_per_egg > 0),
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  due_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all operations for now - will add auth later)
CREATE POLICY "Allow all operations on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update customer totals
CREATE OR REPLACE FUNCTION public.update_customer_totals()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update customer totals
CREATE TRIGGER update_customer_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_totals();