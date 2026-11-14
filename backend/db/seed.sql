-- Seed data (T-SQL). Safe to re-run: products are only inserted if their sku is missing.
SET NOCOUNT ON;
IF NOT EXISTS (SELECT 1 FROM Products WHERE sku = N'sierra-nevada-85')
  INSERT INTO Products (sku, localized_name, category_origin, price, cacao_percent, category, localized_description, localized_notes, weight, image_url, seasonal)
  VALUES (N'sierra-nevada-85', N'{"en":"Sierra Nevada 85%","es":"Sierra Nevada 85%"}', N'Colombia', 9.50, 85, N'bars', N'{"en":"An intense single-origin bar from the slopes of the Sierra Nevada de Santa Marta.","es":"Una barra intensa de origen único de las laderas de la Sierra Nevada de Santa Marta."}', N'{"en":"Black cherry · roasted coffee · cedar","es":"Cereza negra · café tostado · cedro"}', N'80 g', N'/static/images/p-dark-bar.jpg', 0);
IF NOT EXISTS (SELECT 1 FROM Products WHERE sku = N'esmeraldas-70')
  INSERT INTO Products (sku, localized_name, category_origin, price, cacao_percent, category, localized_description, localized_notes, weight, image_url, seasonal)
  VALUES (N'esmeraldas-70', N'{"en":"Esmeraldas 70%","es":"Esmeraldas 70%"}', N'Ecuador', 8.50, 70, N'bars', N'{"en":"Fine-flavor Arriba Nacional cacao with a famously floral finish.","es":"Cacao fino de aroma Arriba Nacional con un final floral inconfundible."}', N'{"en":"Jasmine · banana · honey","es":"Jazmín · banano · miel"}', N'80 g', N'/static/images/p-dark-bar.jpg', 0);
IF NOT EXISTS (SELECT 1 FROM Products WHERE sku = N'chuao-75')
  INSERT INTO Products (sku, localized_name, category_origin, price, cacao_percent, category, localized_description, localized_notes, weight, image_url, seasonal)
  VALUES (N'chuao-75', N'{"en":"Chuao Reserve 75%","es":"Reserva Chuao 75%"}', N'Venezuela', 14.00, 75, N'bars', N'{"en":"Rare criollo beans from a village reachable only by sea.","es":"Granos criollos raros de un pueblo al que solo se llega por mar."}', N'{"en":"Red berries · almond · molasses","es":"Frutos rojos · almendra · melaza"}', N'70 g', N'/static/images/p-pure-cacao.jpg', 0);
IF NOT EXISTS (SELECT 1 FROM Products WHERE sku = N'hazelnut-sea-salt-45')
  INSERT INTO Products (sku, localized_name, category_origin, price, cacao_percent, category, localized_description, localized_notes, weight, image_url, seasonal)
  VALUES (N'hazelnut-sea-salt-45', N'{"en":"Hazelnut & Sea Salt 45%","es":"Avellana y Sal Marina 45%"}', N'Ecuador', 8.00, 45, N'bars', N'{"en":"Creamy milk chocolate studded with toasted hazelnuts and Pacific sea salt.","es":"Chocolate con leche cremoso con avellanas tostadas y sal del Pacífico."}', N'{"en":"Caramel · toasted nut · salt","es":"Caramelo · nuez tostada · sal"}', N'90 g', N'/static/images/p-milk-bar.jpg', 0);
IF NOT EXISTS (SELECT 1 FROM Products WHERE sku = N'pure-cacao-100')
  INSERT INTO Products (sku, localized_name, category_origin, price, cacao_percent, category, localized_description, localized_notes, weight, image_url, seasonal)
  VALUES (N'pure-cacao-100', N'{"en":"Pure Cacao 100%","es":"Cacao Puro 100%"}', N'Peru', 10.00, 100, N'bars', N'{"en":"Nothing but stone-ground Peruvian cacao. No sugar, no compromise.","es":"Solo cacao peruano molido en piedra. Sin azúcar, sin concesiones."}', N'{"en":"Earth · tobacco · dark plum","es":"Tierra · tabaco · ciruela oscura"}', N'75 g', N'/static/images/p-pure-cacao.jpg', 0);
IF NOT EXISTS (SELECT 1 FROM Products WHERE sku = N'classic-truffles-9')
  INSERT INTO Products (sku, localized_name, category_origin, price, cacao_percent, category, localized_description, localized_notes, weight, image_url, seasonal)
  VALUES (N'classic-truffles-9', N'{"en":"Classic Truffle Collection","es":"Colección de Trufas Clásicas"}', N'Peru', 24.00, 64, N'truffles', N'{"en":"Nine hand-rolled ganache truffles dusted in raw cacao powder.","es":"Nueve trufas de ganache enrolladas a mano y espolvoreadas con cacao crudo."}', N'{"en":"Velvet ganache · cocoa dust","es":"Ganache aterciopelada · polvo de cacao"}', N'9 pcs', N'/static/images/p-truffles.jpg', 0);
IF NOT EXISTS (SELECT 1 FROM Products WHERE sku = N'painted-bonbons-5')
  INSERT INTO Products (sku, localized_name, category_origin, price, cacao_percent, category, localized_description, localized_notes, weight, image_url, seasonal)
  VALUES (N'painted-bonbons-5', N'{"en":"Hand-Painted Bonbons","es":"Bombones Pintados a Mano"}', N'Mexico', 18.00, 66, N'bonbons', N'{"en":"Five glossy shells with passion fruit, mezcal, and salted caramel centers.","es":"Cinco bombones brillantes rellenos de maracuyá, mezcal y caramelo salado."}', N'{"en":"Tropical · smoky · buttery","es":"Tropical · ahumado · mantequilla"}', N'5 pcs', N'/static/images/p-bonbons.jpg', 0);
IF NOT EXISTS (SELECT 1 FROM Products WHERE sku = N'spiced-orange-72')
  INSERT INTO Products (sku, localized_name, category_origin, price, cacao_percent, category, localized_description, localized_notes, weight, image_url, seasonal)
  VALUES (N'spiced-orange-72', N'{"en":"Spiced Orange 72%","es":"Naranja Especiada 72%"}', N'Mexico', 11.00, 72, N'seasonal', N'{"en":"Our autumn bar: Oaxacan cacao with candied orange, cinnamon and chile.","es":"Nuestra barra de otoño: cacao oaxaqueño con naranja confitada, canela y chile."}', N'{"en":"Citrus · cinnamon · gentle heat","es":"Cítrico · canela · picor suave"}', N'85 g', N'/static/images/p-spiced-bar.jpg', 1);
IF NOT EXISTS (SELECT 1 FROM Products WHERE sku = N'holiday-truffles-16')
  INSERT INTO Products (sku, localized_name, category_origin, price, cacao_percent, category, localized_description, localized_notes, weight, image_url, seasonal)
  VALUES (N'holiday-truffles-16', N'{"en":"Holiday Truffle Box","es":"Caja de Trufas Navideñas"}', N'Colombia', 38.00, 68, N'seasonal', N'{"en":"Sixteen limited-edition truffles: gingerbread, eggnog, and dark cherry.","es":"Dieciséis trufas de edición limitada: jengibre, rompope y cereza oscura."}', N'{"en":"Warm spice · festive","es":"Especias cálidas · festivo"}', N'16 pcs', N'/static/images/p-truffles.jpg', 1);
IF NOT EXISTS (SELECT 1 FROM Products WHERE sku = N'hispaniola-62')
  INSERT INTO Products (sku, localized_name, category_origin, price, cacao_percent, category, localized_description, localized_notes, weight, image_url, seasonal)
  VALUES (N'hispaniola-62', N'{"en":"Hispaniola 62%","es":"La Española 62%"}', N'Dominican Republic', 7.50, 62, N'bars', N'{"en":"A gentle, approachable dark from organic Dominican cooperatives.","es":"Un oscuro suave y amable de cooperativas orgánicas dominicanas."}', N'{"en":"Brown sugar · raisin · vanilla","es":"Panela · pasas · vainilla"}', N'80 g', N'/static/images/p-dark-bar.jpg', 0);
IF NOT EXISTS (SELECT 1 FROM Products WHERE sku = 'sampler-box-6')
  INSERT INTO Products (sku, localized_name, category_origin, price, cacao_percent, category, localized_description, weight, seasonal, active)
  VALUES ('sampler-box-6', N'{"en":"Custom sampler (6 pieces)","es":"Surtido personalizado (6 piezas)"}', NULL, 16.50, 0, 'sampler', '{}', N'6 pcs', 0, 0);
IF NOT EXISTS (SELECT 1 FROM Products WHERE sku = 'sampler-box-12')
  INSERT INTO Products (sku, localized_name, category_origin, price, cacao_percent, category, localized_description, weight, seasonal, active)
  VALUES ('sampler-box-12', N'{"en":"Custom sampler (12 pieces)","es":"Surtido personalizado (12 piezas)"}', NULL, 33.00, 0, 'sampler', '{}', N'12 pcs', 0, 0);
GO
IF NOT EXISTS (SELECT 1 FROM Inventory i JOIN Products p ON p.product_id = i.product_id WHERE p.sku = N'sierra-nevada-85')
  INSERT INTO Inventory (product_id, quantity_on_hand, reserved_quantity, reorder_level)
  SELECT product_id, 42, 0, 10 FROM Products WHERE sku = N'sierra-nevada-85';
IF NOT EXISTS (SELECT 1 FROM Inventory i JOIN Products p ON p.product_id = i.product_id WHERE p.sku = N'esmeraldas-70')
  INSERT INTO Inventory (product_id, quantity_on_hand, reserved_quantity, reorder_level)
  SELECT product_id, 60, 0, 10 FROM Products WHERE sku = N'esmeraldas-70';
IF NOT EXISTS (SELECT 1 FROM Inventory i JOIN Products p ON p.product_id = i.product_id WHERE p.sku = N'chuao-75')
  INSERT INTO Inventory (product_id, quantity_on_hand, reserved_quantity, reorder_level)
  SELECT product_id, 12, 0, 10 FROM Products WHERE sku = N'chuao-75';
IF NOT EXISTS (SELECT 1 FROM Inventory i JOIN Products p ON p.product_id = i.product_id WHERE p.sku = N'hazelnut-sea-salt-45')
  INSERT INTO Inventory (product_id, quantity_on_hand, reserved_quantity, reorder_level)
  SELECT product_id, 80, 0, 10 FROM Products WHERE sku = N'hazelnut-sea-salt-45';
IF NOT EXISTS (SELECT 1 FROM Inventory i JOIN Products p ON p.product_id = i.product_id WHERE p.sku = N'pure-cacao-100')
  INSERT INTO Inventory (product_id, quantity_on_hand, reserved_quantity, reorder_level)
  SELECT product_id, 30, 0, 10 FROM Products WHERE sku = N'pure-cacao-100';
IF NOT EXISTS (SELECT 1 FROM Inventory i JOIN Products p ON p.product_id = i.product_id WHERE p.sku = N'classic-truffles-9')
  INSERT INTO Inventory (product_id, quantity_on_hand, reserved_quantity, reorder_level)
  SELECT product_id, 25, 0, 10 FROM Products WHERE sku = N'classic-truffles-9';
IF NOT EXISTS (SELECT 1 FROM Inventory i JOIN Products p ON p.product_id = i.product_id WHERE p.sku = N'painted-bonbons-5')
  INSERT INTO Inventory (product_id, quantity_on_hand, reserved_quantity, reorder_level)
  SELECT product_id, 18, 0, 10 FROM Products WHERE sku = N'painted-bonbons-5';
IF NOT EXISTS (SELECT 1 FROM Inventory i JOIN Products p ON p.product_id = i.product_id WHERE p.sku = N'spiced-orange-72')
  INSERT INTO Inventory (product_id, quantity_on_hand, reserved_quantity, reorder_level)
  SELECT product_id, 35, 0, 10 FROM Products WHERE sku = N'spiced-orange-72';
IF NOT EXISTS (SELECT 1 FROM Inventory i JOIN Products p ON p.product_id = i.product_id WHERE p.sku = N'holiday-truffles-16')
  INSERT INTO Inventory (product_id, quantity_on_hand, reserved_quantity, reorder_level)
  SELECT product_id, 20, 0, 10 FROM Products WHERE sku = N'holiday-truffles-16';
IF NOT EXISTS (SELECT 1 FROM Inventory i JOIN Products p ON p.product_id = i.product_id WHERE p.sku = N'hispaniola-62')
  INSERT INTO Inventory (product_id, quantity_on_hand, reserved_quantity, reorder_level)
  SELECT product_id, 55, 0, 10 FROM Products WHERE sku = N'hispaniola-62';
