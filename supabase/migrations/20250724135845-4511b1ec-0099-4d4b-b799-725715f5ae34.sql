-- Create table to store saved schedules
CREATE TABLE public.saved_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_schedules ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (since this is for API access)
CREATE POLICY "Allow public read access to schedules" 
ON public.saved_schedules 
FOR SELECT 
USING (true);

-- Create policy for public write access (to save schedules)
CREATE POLICY "Allow public write access to schedules" 
ON public.saved_schedules 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_schedules_updated_at
BEFORE UPDATE ON public.saved_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();