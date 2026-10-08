-- ============================================================================
-- SmartBrite Campus Dining - Orders & Bills Data Store (SQL)
-- Fully Synchronized with MongoDB Atlas 'orders' Collection
-- Generated on 2026-10-08T12:58:50.842Z
-- ============================================================================

USE smartbrite;

-- ----------------------------------------------------------------------------
-- Order Token: A-109 | Customer: Niroop Kumar Konka
-- ----------------------------------------------------------------------------
INSERT INTO orders (order_id, token_number, user_id, user_name, total_amount, status, payment_method, pickup_time_est, created_at)
VALUES ('ord_109', 'A-109', 'usr_001', 'Niroop Kumar Konka', 520.00, 'completed', 'Campus Card', '01:18 pm', '2026-10-08 07:36:57')
ON DUPLICATE KEY UPDATE status='completed';

INSERT INTO order_bill_items (line_id, order_id, menu_item_id, name, unit_price, qty, subtotal)
VALUES
  ('line_ord_109_1', 'ord_109', 'menu_biryani_01', 'Hyderabadi Chicken Dum Biryani', 260.00, 2, 520.00)
ON DUPLICATE KEY UPDATE qty=VALUES(qty);

INSERT INTO bills (bill_id, order_id, token_number, customer_name, customer_email, total_amount, tax_amount, grand_total, payment_method, payment_status, receipt_timestamp)
VALUES ('bill_109', 'ord_109', 'A-109', 'Niroop Kumar Konka', 'customer@campus.edu', 520.00, 0.00, 520.00, 'Campus Card', 'paid', '2026-10-08 07:36:57')
ON DUPLICATE KEY UPDATE payment_status='paid';

-- ----------------------------------------------------------------------------
-- Order Token: A-104 | Customer: Maria Santos
-- ----------------------------------------------------------------------------
INSERT INTO orders (order_id, token_number, user_id, user_name, total_amount, status, payment_method, pickup_time_est, created_at)
VALUES ('ord_104', 'A-104', 'usr_001', 'Maria Santos', 180.00, 'placed', 'Campus Card', '12:22 PM', '2026-10-08 07:30:05')
ON DUPLICATE KEY UPDATE status='placed';

INSERT INTO order_bill_items (line_id, order_id, menu_item_id, name, unit_price, qty, subtotal)
VALUES
  ('line_ord_104_1', 'ord_104', 'menu_002', 'Mediterranean Falafel & Quinoa Mezze', 180.00, 1, 180.00)
ON DUPLICATE KEY UPDATE qty=VALUES(qty);

INSERT INTO bills (bill_id, order_id, token_number, customer_name, customer_email, total_amount, tax_amount, grand_total, payment_method, payment_status, receipt_timestamp)
VALUES ('bill_104', 'ord_104', 'A-104', 'Maria Santos', 'customer@campus.edu', 180.00, 0.00, 180.00, 'Campus Card', 'paid', '2026-10-08 07:30:05')
ON DUPLICATE KEY UPDATE payment_status='paid';

-- ----------------------------------------------------------------------------
-- Order Token: A-101 | Customer: Alex Rivera
-- ----------------------------------------------------------------------------
INSERT INTO orders (order_id, token_number, user_id, user_name, total_amount, status, payment_method, pickup_time_est, created_at)
VALUES ('ord_101', 'A-101', 'usr_001', 'Alex Rivera', 410.00, 'preparing', 'Campus Card', '12:15 PM', '2026-10-08 07:21:05')
ON DUPLICATE KEY UPDATE status='preparing';

INSERT INTO order_bill_items (line_id, order_id, menu_item_id, name, unit_price, qty, subtotal)
VALUES
  ('line_ord_101_1', 'ord_101', 'menu_001', 'Teriyaki Glazed Salmon Bowl', 280.00, 1, 280.00),
  ('line_ord_101_2', 'ord_101', 'menu_009', 'Iced Ceremonial Oat Milk Matcha Latte', 130.00, 1, 130.00)
ON DUPLICATE KEY UPDATE qty=VALUES(qty);

INSERT INTO bills (bill_id, order_id, token_number, customer_name, customer_email, total_amount, tax_amount, grand_total, payment_method, payment_status, receipt_timestamp)
VALUES ('bill_101', 'ord_101', 'A-101', 'Alex Rivera', 'customer@campus.edu', 410.00, 0.00, 410.00, 'Campus Card', 'paid', '2026-10-08 07:21:05')
ON DUPLICATE KEY UPDATE payment_status='paid';

-- ----------------------------------------------------------------------------
-- Order Token: A-102 | Customer: Sarah Chen
-- ----------------------------------------------------------------------------
INSERT INTO orders (order_id, token_number, user_id, user_name, total_amount, status, payment_method, pickup_time_est, created_at)
VALUES ('ord_102', 'A-102', 'usr_001', 'Sarah Chen', 270.00, 'ready', 'Apple Pay', '12:05 PM', '2026-10-08 07:08:05')
ON DUPLICATE KEY UPDATE status='ready';

INSERT INTO order_bill_items (line_id, order_id, menu_item_id, name, unit_price, qty, subtotal)
VALUES
  ('line_ord_102_1', 'ord_102', 'menu_004', 'Artisan Avocado & Poached Egg Sourdough', 160.00, 1, 160.00),
  ('line_ord_102_2', 'ord_102', 'menu_008', 'Cold-Pressed Green Glow Celery & Apple', 110.00, 1, 110.00)
ON DUPLICATE KEY UPDATE qty=VALUES(qty);

INSERT INTO bills (bill_id, order_id, token_number, customer_name, customer_email, total_amount, tax_amount, grand_total, payment_method, payment_status, receipt_timestamp)
VALUES ('bill_102', 'ord_102', 'A-102', 'Sarah Chen', 'customer@campus.edu', 270.00, 0.00, 270.00, 'Apple Pay', 'paid', '2026-10-08 07:08:05')
ON DUPLICATE KEY UPDATE payment_status='paid';

-- ----------------------------------------------------------------------------
-- Order Token: A-103 | Customer: Jordan Taylor
-- ----------------------------------------------------------------------------
INSERT INTO orders (order_id, token_number, user_id, user_name, total_amount, status, payment_method, pickup_time_est, created_at)
VALUES ('ord_103', 'A-103', 'usr_001', 'Jordan Taylor', 440.00, 'completed', 'Credit Card', '11:45 AM', '2026-10-08 06:38:05')
ON DUPLICATE KEY UPDATE status='completed';

INSERT INTO order_bill_items (line_id, order_id, menu_item_id, name, unit_price, qty, subtotal)
VALUES
  ('line_ord_103_1', 'ord_103', 'menu_003', 'Char-Grilled Herb Chicken Breast', 220.00, 2, 440.00)
ON DUPLICATE KEY UPDATE qty=VALUES(qty);

INSERT INTO bills (bill_id, order_id, token_number, customer_name, customer_email, total_amount, tax_amount, grand_total, payment_method, payment_status, receipt_timestamp)
VALUES ('bill_103', 'ord_103', 'A-103', 'Jordan Taylor', 'customer@campus.edu', 440.00, 0.00, 440.00, 'Credit Card', 'paid', '2026-10-08 06:38:05')
ON DUPLICATE KEY UPDATE payment_status='paid';


-- Order & Bill Receipt: A-110 (Rakshitha)
INSERT INTO orders (order_id, token_number, user_id, user_name, total_amount, status, payment_method, pickup_time_est, created_at) VALUES ('ord_110', 'A-110', 'usr_1791464405832', 'Rakshitha', 530.00, 'placed', 'UPI / QR Code', '06:43 pm', '2026-10-08 13:01:28');
INSERT INTO order_bill_items (line_id, order_id, menu_item_id, name, unit_price, qty, subtotal) VALUES ('line_ord_110_1', 'ord_110', 'menu_003', 'Char-Grilled Herb Chicken Breast', 220.00, 1, 220.00);
INSERT INTO order_bill_items (line_id, order_id, menu_item_id, name, unit_price, qty, subtotal) VALUES ('line_ord_110_2', 'ord_110', 'menu_006', 'Smoked Turkey & Avocado Ciabatta Panini', 180.00, 1, 180.00);
INSERT INTO order_bill_items (line_id, order_id, menu_item_id, name, unit_price, qty, subtotal) VALUES ('line_ord_110_3', 'ord_110', 'menu_ice_01', 'Belgian 70% Dark Chocolate Gelato', 130.00, 1, 130.00);
INSERT INTO bills (bill_id, order_id, token_number, customer_name, customer_email, total_amount, tax_amount, grand_total, payment_method, payment_status, receipt_timestamp) VALUES ('bill_110', 'ord_110', 'A-110', 'Rakshitha', 'customer@campus.edu', 530.00, 0.00, 530.00, 'UPI / QR Code', 'paid', '2026-10-08 13:01:28');

-- Order & Bill Receipt: A-111 (Rakshitha)
INSERT INTO orders (order_id, token_number, user_id, user_name, total_amount, status, payment_method, pickup_time_est, created_at) VALUES ('ord_111', 'A-111', 'usr_1791464405832', 'Rakshitha', 175.00, 'placed', 'UPI / QR Code', '06:46 pm', '2026-10-08 13:04:06');
INSERT INTO order_bill_items (line_id, order_id, menu_item_id, name, unit_price, qty, subtotal) VALUES ('line_ord_111_1', 'ord_111', 'menu_choc_03', 'Warm Molten Cocoa Lava Cake', 175.00, 1, 175.00);
INSERT INTO bills (bill_id, order_id, token_number, customer_name, customer_email, total_amount, tax_amount, grand_total, payment_method, payment_status, receipt_timestamp) VALUES ('bill_111', 'ord_111', 'A-111', 'Rakshitha', 'customer@campus.edu', 175.00, 0.00, 175.00, 'UPI / QR Code', 'paid', '2026-10-08 13:04:06');
