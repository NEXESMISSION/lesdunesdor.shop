-- =====================================================
-- COMPLETE SUPABASE SQL SETUP FOR LES DUNES E-COMMERCE
-- =====================================================

-- Step 1: Create Categories Table (simplified - no subcategories)
-- =====================================================
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create Products Table
-- =====================================================
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  old_price DECIMAL(10,2) CHECK (old_price >= 0),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  delivery_price DECIMAL(10,2) DEFAULT 7.00 CHECK (delivery_price >= 0),
  image_urls TEXT[] DEFAULT '{}',
  form_template_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create Orders Table
-- =====================================================
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_details JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  status VARCHAR(50) DEFAULT 'Nouvelle',
  form_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create Order Items Table
-- =====================================================
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create Form Templates Table (for future custom forms)
-- =====================================================
CREATE TABLE form_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create Form Fields Table (for future custom forms)
-- =====================================================
CREATE TABLE form_fields (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES form_templates(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  options JSONB,
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Add Indexes for Better Performance
-- =====================================================
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Step 8: Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS Policies for Categories
-- =====================================================
-- Anyone can view categories
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

-- Only authenticated users can modify categories
CREATE POLICY "Only authenticated users can modify categories" ON categories
  FOR ALL USING (auth.role() = 'authenticated');

-- Step 10: Create RLS Policies for Products
-- =====================================================
-- Anyone can view products
CREATE POLICY "Anyone can view products" ON products
  FOR SELECT USING (true);

-- Only authenticated users can modify products
CREATE POLICY "Only authenticated users can modify products" ON products
  FOR ALL USING (auth.role() = 'authenticated');

-- Step 11: Create RLS Policies for Orders
-- =====================================================
-- Anyone can create orders (customers placing orders)
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (true);

-- Only authenticated users can view orders
CREATE POLICY "Only authenticated users can view orders" ON orders
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only authenticated users can update orders
CREATE POLICY "Only authenticated users can update orders" ON orders
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Only authenticated users can delete orders
CREATE POLICY "Only authenticated users can delete orders" ON orders
  FOR DELETE USING (auth.role() = 'authenticated');

-- Step 12: Create RLS Policies for Order Items
-- =====================================================
-- Anyone can create order items (part of order process)
CREATE POLICY "Anyone can create order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- Only authenticated users can view order items
CREATE POLICY "Only authenticated users can view order items" ON order_items
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only authenticated users can modify order items
CREATE POLICY "Only authenticated users can modify order items" ON order_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Step 13: Create RLS Policies for Form Templates & Fields
-- =====================================================
-- Only authenticated users can access form templates
CREATE POLICY "Only authenticated users can access form templates" ON form_templates
  FOR ALL USING (auth.role() = 'authenticated');

-- Only authenticated users can access form fields
CREATE POLICY "Only authenticated users can access form fields" ON form_fields
  FOR ALL USING (auth.role() = 'authenticated');

-- Step 14: Create Functions for Updated_At Timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 15: Create Triggers for Auto-updating Timestamps
-- =====================================================
CREATE TRIGGER update_categories_updated_at 
  BEFORE UPDATE ON categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_templates_updated_at 
  BEFORE UPDATE ON form_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 16: Insert Sample Categories (simplified - no subcategories)
-- =====================================================
INSERT INTO categories (name) VALUES 
('Électronique'),
('Vêtements'),
('Meubles de Maison'),
('Accessoires'),
('Bijoux'),
('Livres'),
('Sports & Loisirs'),
('Beauté & Santé'),
('Jardin & Extérieur'),
('Cuisine & Maison');

-- Step 17: Insert Sample Products (Optional - for testing)
-- =====================================================
INSERT INTO products (name, description, price, old_price, stock, category_id, image_urls) VALUES
('Veste Saharienne "Mirage"', 
 'La veste "Mirage" est une pièce d''exception. Son tissu technique résiste aux éléments tout en offrant un confort optimal. Les finitions en laiton brossé et la doublure en satin ajoutent une touche de raffinement discrète.',
 189.99, 249.99, 50, 
 (SELECT id FROM categories WHERE name = 'Vêtements'),
 ARRAY['https://placehold.co/600x600/1a1a1a/d4af37?text=Veste+1', 'https://placehold.co/600x600/1a1a1a/d4af37?text=Veste+2']
),

('Smartphone Pro X', 
 'Smartphone dernière génération avec toutes les fonctionnalités modernes. Écran AMOLED, triple caméra, 5G.',
 699.99, 899.99, 25, 
 (SELECT id FROM categories WHERE name = 'Électronique'),
 ARRAY['https://placehold.co/400x400/DBEAFE/1E40AF?text=Smartphone']
),

('Canapé Confortable "Sahara"', 
 'Canapé élégant et confortable pour votre salon. Tissu premium et coussins moelleux.',
 499.99, 649.99, 10, 
 (SELECT id FROM categories WHERE name = 'Meubles de Maison'),
 ARRAY['https://placehold.co/400x400/FEE2E2/B91C1C?text=Canape']
),

('Collier en Or "Dunes"', 
 'Bijou artisanal inspiré des dunes du désert. Or 18 carats.',
 299.99, NULL, 15, 
 (SELECT id FROM categories WHERE name = 'Bijoux'),
 ARRAY['https://placehold.co/400x400/FEF3C7/92400E?text=Collier']
);

-- Step 18: Enable Realtime for Products Table
-- =====================================================
-- Go to your Supabase Dashboard > Database > Replication
-- Enable realtime for the 'products' table

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

-- 🎉 Your database is now ready!
-- 
-- Next steps:
-- 1. Run this SQL in your Supabase SQL editor
-- 2. Go to Authentication > Users to create your admin account
-- 3. Enable realtime for products table in Dashboard > Database > Replication
-- 4. Your React app will now work with real data!
--
-- Test your setup:
-- - Visit your React app homepage (should show products if any)
-- - Try placing an order (should work for anyone)
-- - Login to admin with your Supabase auth account
-- - Access the admin dashboard to manage products

-- Optional: View all data
-- SELECT * FROM categories;
-- SELECT * FROM products;
-- SELECT * FROM orders;
-- SELECT * FROM order_items; 