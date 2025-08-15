-- Complete Database Setup for Kamkunji Admin Dashboard
-- Run this in your Supabase SQL Editor

-- 1. Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  images TEXT[], -- Array of image URLs
  specifications JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_approved BOOLEAN DEFAULT false,
  seller_id UUID REFERENCES auth.users(id)
);

-- 2. Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES auth.users(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  shipping_address TEXT,
  pickup_location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);

-- 4. Create item_submissions table
CREATE TABLE IF NOT EXISTS item_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  condition VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  seller_id UUID REFERENCES auth.users(id),
  seller_name VARCHAR(255) NOT NULL,
  seller_email VARCHAR(255) NOT NULL,
  seller_phone VARCHAR(50),
  images TEXT[], -- Array of image URLs
  location VARCHAR(255),
  specifications JSONB,
  status VARCHAR(50) DEFAULT 'pending_review',
  admin_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES admin_users(user_id)
);

-- 5. Create users table (extended user information)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Kenya',
  is_seller BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create shipping_rates table
CREATE TABLE IF NOT EXISTS shipping_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location VARCHAR(255) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  delivery_time VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create pickup_points table
CREATE TABLE IF NOT EXISTS pickup_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  hours VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create admin_activity_log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(user_id),
  action VARCHAR(255) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data
INSERT INTO shipping_rates (location, rate, delivery_time) VALUES
  ('Nairobi', 500.00, '1-2 business days'),
  ('Mombasa', 800.00, '2-3 business days'),
  ('Kisumu', 600.00, '2-3 business days'),
  ('Nakuru', 550.00, '1-2 business days'),
  ('Eldoret', 700.00, '2-3 business days')
ON CONFLICT DO NOTHING;

INSERT INTO pickup_points (name, address, city, phone, hours) VALUES
  ('Westlands Mall', 'Westlands, Nairobi', 'Nairobi', '+254700123456', 'Mon-Sat: 9AM-8PM, Sun: 10AM-6PM'),
  ('Two Rivers Mall', 'Ruiru, Nairobi', 'Nairobi', '+254700123457', 'Mon-Sat: 9AM-8PM, Sun: 10AM-6PM'),
  ('Sarit Centre', 'Westlands, Nairobi', 'Nairobi', '+254700123458', 'Mon-Sat: 9AM-8PM, Sun: 10AM-6PM')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_item_submissions_status ON item_submissions(status);
CREATE INDEX IF NOT EXISTS idx_item_submissions_seller_id ON item_submissions(seller_id);

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin access
-- Products
CREATE POLICY "Admins can view all products" ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert products" ON products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update products" ON products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete products" ON products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Orders
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Item Submissions
CREATE POLICY "Admins can view all submissions" ON item_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update submissions" ON item_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- User Profiles
CREATE POLICY "Admins can view all user profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update user profiles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Other tables follow similar pattern...
CREATE POLICY "Admins can view all records" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can view all records" ON shipping_rates FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can view all records" ON pickup_points FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can view all records" ON admin_activity_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(NEW.id::text, 6, '0');
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
