-- =====================================================
-- MIGRATION SCRIPT FOR LES DUNES E-COMMERCE
-- This updates existing database to remove subcategories
-- =====================================================

-- Step 1: Remove parent_id column from categories if it exists
-- =====================================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'parent_id'
    ) THEN
        ALTER TABLE categories DROP COLUMN parent_id;
    END IF;
END $$;

-- Step 2: Add new categories if they don't exist
-- =====================================================
INSERT INTO categories (name) 
SELECT * FROM (VALUES 
    ('Électronique'),
    ('Vêtements'),
    ('Meubles de Maison'),
    ('Accessoires'),
    ('Bijoux'),
    ('Livres'),
    ('Sports & Loisirs'),
    ('Beauté & Santé'),
    ('Jardin & Extérieur'),
    ('Cuisine & Maison')
) AS new_categories(name)
WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE categories.name = new_categories.name
);

-- Step 3: Create products table if it doesn't exist
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
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

-- Step 4: Create orders table if it doesn't exist
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_details JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  status VARCHAR(50) DEFAULT 'Nouvelle',
  form_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create order_items table if it doesn't exist
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create form_templates table if it doesn't exist
-- =====================================================
CREATE TABLE IF NOT EXISTS form_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create form_fields table if it doesn't exist
-- =====================================================
CREATE TABLE IF NOT EXISTS form_fields (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES form_templates(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  options JSONB,
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 8: Create indexes if they don't exist
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_category_id') THEN
        CREATE INDEX idx_products_category_id ON products(category_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_created_at') THEN
        CREATE INDEX idx_products_created_at ON products(created_at);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_price') THEN
        CREATE INDEX idx_products_price ON products(price);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_created_at') THEN
        CREATE INDEX idx_orders_created_at ON orders(created_at);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_status') THEN
        CREATE INDEX idx_orders_status ON orders(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_order_items_order_id') THEN
        CREATE INDEX idx_order_items_order_id ON order_items(order_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_order_items_product_id') THEN
        CREATE INDEX idx_order_items_product_id ON order_items(product_id);
    END IF;
END $$;

-- Step 9: Enable Row Level Security if not already enabled
-- =====================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;

-- Step 10: Drop existing policies if they exist and recreate
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Only authenticated users can modify categories" ON categories;
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Only authenticated users can modify products" ON products;
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Only authenticated users can view orders" ON orders;
DROP POLICY IF EXISTS "Only authenticated users can update orders" ON orders;
DROP POLICY IF EXISTS "Only authenticated users can delete orders" ON orders;
DROP POLICY IF EXISTS "Anyone can create order items" ON order_items;
DROP POLICY IF EXISTS "Only authenticated users can view order items" ON order_items;
DROP POLICY IF EXISTS "Only authenticated users can modify order items" ON order_items;
DROP POLICY IF EXISTS "Only authenticated users can access form templates" ON form_templates;
DROP POLICY IF EXISTS "Only authenticated users can access form fields" ON form_fields;

-- Create RLS Policies for Categories
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can modify categories" ON categories
  FOR ALL USING (auth.role() = 'authenticated');

-- Create RLS Policies for Products
CREATE POLICY "Anyone can view products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can modify products" ON products
  FOR ALL USING (auth.role() = 'authenticated');

-- Create RLS Policies for Orders
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Only authenticated users can view orders" ON orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update orders" ON orders
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete orders" ON orders
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS Policies for Order Items
CREATE POLICY "Anyone can create order items" ON order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Only authenticated users can view order items" ON order_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can modify order items" ON order_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Create RLS Policies for Form Templates & Fields
CREATE POLICY "Only authenticated users can access form templates" ON form_templates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can access form fields" ON form_fields
  FOR ALL USING (auth.role() = 'authenticated');

-- Step 11: Create update trigger function if it doesn't exist
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 12: Create triggers if they don't exist
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_categories_updated_at') THEN
        CREATE TRIGGER update_categories_updated_at 
          BEFORE UPDATE ON categories 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at') THEN
        CREATE TRIGGER update_products_updated_at 
          BEFORE UPDATE ON products 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at') THEN
        CREATE TRIGGER update_orders_updated_at 
          BEFORE UPDATE ON orders 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_form_templates_updated_at') THEN
        CREATE TRIGGER update_form_templates_updated_at 
          BEFORE UPDATE ON form_templates 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Step 13: Add sample products if none exist
-- =====================================================
INSERT INTO products (name, description, price, old_price, stock, category_id, image_urls) 
SELECT * FROM (VALUES 
    ('Veste Saharienne "Mirage"', 
     'La veste "Mirage" est une pièce d''exception. Son tissu technique résiste aux éléments tout en offrant un confort optimal.',
     189.99, 249.99, 50, 
     (SELECT id FROM categories WHERE name = 'Vêtements' LIMIT 1),
     ARRAY['https://placehold.co/600x600/1a1a1a/d4af37?text=Veste+1', 'https://placehold.co/600x600/1a1a1a/d4af37?text=Veste+2']
    ),
    ('Smartphone Pro X', 
     'Smartphone dernière génération avec toutes les fonctionnalités modernes. Écran AMOLED, triple caméra, 5G.',
     699.99, 899.99, 25, 
     (SELECT id FROM categories WHERE name = 'Électronique' LIMIT 1),
     ARRAY['https://placehold.co/400x400/DBEAFE/1E40AF?text=Smartphone']
    ),
    ('Canapé Confortable "Sahara"', 
     'Canapé élégant et confortable pour votre salon. Tissu premium et coussins moelleux.',
     499.99, 649.99, 10, 
     (SELECT id FROM categories WHERE name = 'Meubles de Maison' LIMIT 1),
     ARRAY['https://placehold.co/400x400/FEE2E2/B91C1C?text=Canape']
    ),
    ('Collier en Or "Dunes"', 
     'Bijou artisanal inspiré des dunes du désert. Or 18 carats.',
     299.99, NULL, 15, 
     (SELECT id FROM categories WHERE name = 'Bijoux' LIMIT 1),
     ARRAY['https://placehold.co/400x400/FEF3C7/92400E?text=Collier']
    )
) AS new_products(name, description, price, old_price, stock, category_id, image_urls)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE products.name = new_products.name);

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================

-- 🎉 Your database has been updated!
-- 
-- What was changed:
-- - Removed parent_id from categories (no more subcategories)
-- - Added new categories if they didn't exist
-- - Created all missing tables with IF NOT EXISTS
-- - Updated all policies and triggers
-- - Added sample products if none exist
--
-- Your React app should now work perfectly with the simplified category system!

SELECT 'Migration completed successfully! 🎉' AS status; 