-- =====================================================
-- SIMPLE FIX MIGRATION FOR LES DUNES E-COMMERCE
-- This fixes database issues and removes constraint problems
-- =====================================================

-- Step 1: Drop any problematic unique constraints
DO $$ 
BEGIN
    -- Drop unique constraint on category names if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'categories' AND constraint_name = 'categories_name_key'
    ) THEN
        ALTER TABLE categories DROP CONSTRAINT categories_name_key;
    END IF;
END $$;

-- Step 2: Clean up any duplicate categories
DELETE FROM categories a USING categories b 
WHERE a.id > b.id 
AND a.name = b.name 
AND COALESCE(a.parent_id, 0) = COALESCE(b.parent_id, 0);

-- Step 3: Ensure parent_id column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'parent_id'
    ) THEN
        ALTER TABLE categories ADD COLUMN parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Step 4: Clear existing categories and start fresh
TRUNCATE categories CASCADE;

-- Step 5: Insert main categories (parent_id = NULL)
INSERT INTO categories (name, parent_id) VALUES 
('Électronique', NULL),
('Vêtements', NULL),
('Meubles de Maison', NULL),
('Accessoires', NULL),
('Bijoux', NULL),
('Livres', NULL),
('Sports & Loisirs', NULL),
('Beauté & Santé', NULL),
('Jardin & Extérieur', NULL),
('Cuisine & Maison', NULL);

-- Step 6: Insert subcategories for Électronique
INSERT INTO categories (name, parent_id) 
SELECT subcategory_name, parent_cat.id 
FROM (VALUES 
    ('Smartphones'),
    ('Ordinateurs Portables'),
    ('Casques Audio'),
    ('Tablettes'),
    ('Montres Connectées'),
    ('Appareils Photo')
) AS subcats(subcategory_name)
CROSS JOIN (SELECT id FROM categories WHERE name = 'Électronique' AND parent_id IS NULL) AS parent_cat;

-- Step 7: Insert subcategories for Vêtements
INSERT INTO categories (name, parent_id) 
SELECT subcategory_name, parent_cat.id 
FROM (VALUES 
    ('T-shirts'),
    ('Pantalons'),
    ('Vestes'),
    ('Robes'),
    ('Chaussures'),
    ('Accessoires Mode')
) AS subcats(subcategory_name)
CROSS JOIN (SELECT id FROM categories WHERE name = 'Vêtements' AND parent_id IS NULL) AS parent_cat;

-- Step 8: Insert subcategories for Meubles de Maison
INSERT INTO categories (name, parent_id) 
SELECT subcategory_name, parent_cat.id 
FROM (VALUES 
    ('Canapés'),
    ('Tables'),
    ('Chaises'),
    ('Lits'),
    ('Armoires'),
    ('Étagères')
) AS subcats(subcategory_name)
CROSS JOIN (SELECT id FROM categories WHERE name = 'Meubles de Maison' AND parent_id IS NULL) AS parent_cat;

-- Step 9: Insert subcategories for Bijoux
INSERT INTO categories (name, parent_id) 
SELECT subcategory_name, parent_cat.id 
FROM (VALUES 
    ('Colliers'),
    ('Bracelets'),
    ('Boucles d''oreilles'),
    ('Bagues'),
    ('Montres')
) AS subcats(subcategory_name)
CROSS JOIN (SELECT id FROM categories WHERE name = 'Bijoux' AND parent_id IS NULL) AS parent_cat;

-- Step 10: Clear products and add sample products
TRUNCATE products CASCADE;

-- Insert sample products with proper category assignments
INSERT INTO products (name, description, price, old_price, stock, category_id, image_urls) 
SELECT * FROM (VALUES 
    (
        'Veste Saharienne "Mirage"', 
        'Une veste élégante inspirée des dunes dorées du Sahara, parfaite pour les aventures urbaines et les escapades dans le désert.',
        189.99, 
        249.99, 
        50, 
        (SELECT id FROM categories WHERE name = 'Vestes' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400']
    ),
    (
        'Smartphone Pro X', 
        'Le dernier smartphone avec un design inspiré des couleurs du désert et une performance exceptionnelle.',
        699.99, 
        899.99, 
        25, 
        (SELECT id FROM categories WHERE name = 'Smartphones' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400']
    ),
    (
        'Canapé Confortable "Sahara"', 
        'Un canapé luxueux aux tons chauds du désert, perfect pour se détendre après une longue journée.',
        499.99, 
        649.99, 
        10, 
        (SELECT id FROM categories WHERE name = 'Canapés' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400']
    ),
    (
        'Collier en Or "Dunes"', 
        'Un magnifique collier en or inspiré des formes ondulantes des dunes de sable.',
        299.99, 
        NULL, 
        15, 
        (SELECT id FROM categories WHERE name = 'Colliers' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400']
    ),
    (
        'Ordinateur Portable "Desert"', 
        'Un ordinateur portable performant avec un design élégant couleur sable.',
        899.99, 
        1199.99, 
        20, 
        (SELECT id FROM categories WHERE name = 'Ordinateurs Portables' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400']
    ),
    (
        'Table Basse "Oasis"', 
        'Une table basse moderne avec des accents dorés rappelant les oasis du désert.',
        349.99, 
        449.99, 
        8, 
        (SELECT id FROM categories WHERE name = 'Tables' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400']
    )
) AS new_products(name, description, price, old_price, stock, category_id, image_urls)
WHERE new_products.category_id IS NOT NULL;

-- Step 11: Ensure RLS is enabled and policies exist
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
DROP POLICY IF EXISTS "Enable all for authenticated users only" ON categories;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable all for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
DROP POLICY IF EXISTS "Enable all for authenticated users only" ON orders;

-- Create simple RLS policies
CREATE POLICY "Enable read access for all users" ON categories FOR SELECT USING (true);
CREATE POLICY "Enable all for authenticated users only" ON categories FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
CREATE POLICY "Enable all for authenticated users only" ON products FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON orders FOR SELECT USING (true);
CREATE POLICY "Enable all for authenticated users only" ON orders FOR ALL USING (auth.role() = 'authenticated');

-- Final verification
SELECT 
    'Fix migration completed successfully! 🎉' AS status,
    (SELECT COUNT(*) FROM categories WHERE parent_id IS NULL) AS main_categories,
    (SELECT COUNT(*) FROM categories WHERE parent_id IS NOT NULL) AS subcategories,
    (SELECT COUNT(*) FROM products) AS total_products; 