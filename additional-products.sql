-- =====================================================
-- ADDITIONAL PRODUCTS SQL FOR LES DUNES E-COMMERCE
-- =====================================================

-- Electronics - Smartphones
INSERT INTO products (name, description, price, old_price, stock, category_id, image_urls)
SELECT * FROM (VALUES 
    (
        'iPhone 14 Pro Gold Edition', 
        'Le dernier iPhone avec une finition or exclusive, parfait pour les amateurs de luxe et de technologie. Écran Super Retina XDR, puce A16 Bionic et système de caméra pro.',
        1299.99, 
        1499.99, 
        15, 
        (SELECT id FROM categories WHERE name = 'Smartphones' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500']
    ),
    (
        'Galaxy S23 Ultra Desert Edition', 
        'Le Samsung Galaxy S23 Ultra dans une teinte sable du désert exclusive. Appareil photo 108MP, écran Dynamic AMOLED 2X et S Pen inclus.',
        1199.99, 
        1399.99, 
        20, 
        (SELECT id FROM categories WHERE name = 'Smartphones' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500']
    )
) AS new_products(name, description, price, old_price, stock, category_id, image_urls)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE products.name = new_products.name);

-- Electronics - Laptops
INSERT INTO products (name, description, price, old_price, stock, category_id, image_urls)
SELECT * FROM (VALUES 
    (
        'MacBook Pro Gold Edition', 
        'MacBook Pro avec finition or exclusive. Puce M2 Pro, écran Liquid Retina XDR et jusqu''à 20 heures d''autonomie.',
        2499.99, 
        2799.99, 
        10, 
        (SELECT id FROM categories WHERE name = 'Ordinateurs Portables' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500']
    ),
    (
        'Ultrabook Sable Pro', 
        'Ultrabook léger avec finition sable doré. Processeur Intel Core i7, 16GB RAM et SSD 1TB pour une performance exceptionnelle.',
        1799.99, 
        1999.99, 
        12, 
        (SELECT id FROM categories WHERE name = 'Ordinateurs Portables' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500']
    )
) AS new_products(name, description, price, old_price, stock, category_id, image_urls)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE products.name = new_products.name);

-- Electronics - Headphones
INSERT INTO products (name, description, price, old_price, stock, category_id, image_urls)
SELECT * FROM (VALUES 
    (
        'Casque Audio Doré Premium', 
        'Casque audio sans fil avec finition dorée. Réduction de bruit active, 30 heures d''autonomie et son haute fidélité.',
        349.99, 
        399.99, 
        25, 
        (SELECT id FROM categories WHERE name = 'Casques Audio' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1545127398-14699f92334b?w=500']
    )
) AS new_products(name, description, price, old_price, stock, category_id, image_urls)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE products.name = new_products.name);

-- Clothing - T-shirts
INSERT INTO products (name, description, price, old_price, stock, category_id, image_urls)
SELECT * FROM (VALUES 
    (
        'T-shirt Dunes Collection', 
        'T-shirt premium en coton avec motif dunes dorées. Coupe moderne et confortable.',
        49.99, 
        69.99, 
        50, 
        (SELECT id FROM categories WHERE name = 'T-shirts' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500']
    ),
    (
        'T-shirt Sable Doré', 
        'T-shirt en coton bio couleur sable avec logo doré. Design élégant et minimaliste.',
        39.99, 
        59.99, 
        45, 
        (SELECT id FROM categories WHERE name = 'T-shirts' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500']
    )
) AS new_products(name, description, price, old_price, stock, category_id, image_urls)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE products.name = new_products.name);

-- Clothing - Jackets
INSERT INTO products (name, description, price, old_price, stock, category_id, image_urls)
SELECT * FROM (VALUES 
    (
        'Veste Cuir Sahara', 
        'Veste en cuir premium avec finition dorée. Parfaite pour les soirées fraîches du désert.',
        299.99, 
        399.99, 
        15, 
        (SELECT id FROM categories WHERE name = 'Vestes' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500']
    ),
    (
        'Veste Légère Dunes', 
        'Veste légère couleur sable avec détails dorés. Idéale pour le printemps et l''automne.',
        199.99, 
        249.99, 
        20, 
        (SELECT id FROM categories WHERE name = 'Vestes' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500']
    )
) AS new_products(name, description, price, old_price, stock, category_id, image_urls)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE products.name = new_products.name);

-- Furniture - Sofas
INSERT INTO products (name, description, price, old_price, stock, category_id, image_urls)
SELECT * FROM (VALUES 
    (
        'Canapé Luxe "Oasis"', 
        'Canapé de luxe avec finition velours doré. Confort exceptionnel et design élégant pour votre salon.',
        1299.99, 
        1599.99, 
        5, 
        (SELECT id FROM categories WHERE name = 'Canapés' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500']
    ),
    (
        'Canapé d''Angle "Sahara"', 
        'Canapé d''angle spacieux en tissu premium couleur sable. Parfait pour les grands espaces de vie.',
        1499.99, 
        1799.99, 
        3, 
        (SELECT id FROM categories WHERE name = 'Canapés' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=500']
    )
) AS new_products(name, description, price, old_price, stock, category_id, image_urls)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE products.name = new_products.name);

-- Furniture - Tables
INSERT INTO products (name, description, price, old_price, stock, category_id, image_urls)
SELECT * FROM (VALUES 
    (
        'Table Basse "Mirage"', 
        'Table basse en verre et métal doré. Design moderne inspiré des ondulations des dunes.',
        399.99, 
        499.99, 
        8, 
        (SELECT id FROM categories WHERE name = 'Tables' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1499933374294-4584851497cc?w=500']
    ),
    (
        'Table à Manger "Golden Sand"', 
        'Table à manger élégante avec plateau en bois et pieds dorés. Peut accueillir jusqu''à 8 personnes.',
        899.99, 
        1099.99, 
        4, 
        (SELECT id FROM categories WHERE name = 'Tables' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=500']
    )
) AS new_products(name, description, price, old_price, stock, category_id, image_urls)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE products.name = new_products.name);

-- Jewelry - Necklaces
INSERT INTO products (name, description, price, old_price, stock, category_id, image_urls)
SELECT * FROM (VALUES 
    (
        'Collier Sable Doré', 
        'Collier en or 18 carats avec pendentif inspiré des dunes du désert. Une pièce unique et élégante.',
        599.99, 
        699.99, 
        10, 
        (SELECT id FROM categories WHERE name = 'Colliers' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500']
    ),
    (
        'Collier Chaîne Dorée', 
        'Collier chaîne en or avec finition mate. Design minimaliste et intemporel.',
        399.99, 
        499.99, 
        15, 
        (SELECT id FROM categories WHERE name = 'Colliers' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=500']
    )
) AS new_products(name, description, price, old_price, stock, category_id, image_urls)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE products.name = new_products.name);

-- Jewelry - Bracelets
INSERT INTO products (name, description, price, old_price, stock, category_id, image_urls)
SELECT * FROM (VALUES 
    (
        'Bracelet Dunes d''Or', 
        'Bracelet en or 18 carats avec motif ondulé inspiré des dunes. Fermeture sécurisée et confort optimal.',
        499.99, 
        599.99, 
        12, 
        (SELECT id FROM categories WHERE name = 'Bracelets' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500']
    ),
    (
        'Bracelet Jonc Doré', 
        'Bracelet jonc en or avec finition brillante. Simple, élégant et facile à porter au quotidien.',
        349.99, 
        399.99, 
        18, 
        (SELECT id FROM categories WHERE name = 'Bracelets' AND parent_id IS NOT NULL LIMIT 1),
        ARRAY['https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=500']
    )
) AS new_products(name, description, price, old_price, stock, category_id, image_urls)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE products.name = new_products.name);

-- Display the count of products added
SELECT COUNT(*) AS products_count FROM products; 