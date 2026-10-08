-- ============================================================================
-- SmartBrite Campus Dining & Cafeteria Management System
-- Relational SQL Database Schema (DDL)
-- Mirrored with MongoDB Collections
-- ============================================================================

CREATE DATABASE IF NOT EXISTS smartbrite;
USE smartbrite;

-- 1. Users & Authentication
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    role ENUM('customer', 'staff', 'admin') DEFAULT 'customer',
    dietary_preference VARCHAR(64) DEFAULT 'Standard',
    allergies JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Login Session History
CREATE TABLE IF NOT EXISTS user_logins (
    login_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    email VARCHAR(191) NOT NULL,
    role VARCHAR(32) NOT NULL,
    login_method VARCHAR(32) DEFAULT 'Password',
    ip_address VARCHAR(45) DEFAULT '127.0.0.1',
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. Menu Items Catalog
CREATE TABLE IF NOT EXISTS menu_items (
    item_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    category VARCHAR(64) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_qty INT NOT NULL DEFAULT 0,
    prep_time_minutes INT DEFAULT 8,
    ingredients JSON NULL,
    calories INT DEFAULT 0,
    protein_g DECIMAL(6, 2) DEFAULT 0,
    carbs_g DECIMAL(6, 2) DEFAULT 0,
    fat_g DECIMAL(6, 2) DEFAULT 0,
    dietary_tags JSON NULL,
    image_url TEXT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Raw Kitchen Inventory
CREATE TABLE IF NOT EXISTS inventory (
    inv_id VARCHAR(64) PRIMARY KEY,
    ingredient_name VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    current_stock_kg DECIMAL(10, 2) NOT NULL,
    threshold_kg DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(16) DEFAULT 'kg',
    last_restocked TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Customer Orders
CREATE TABLE IF NOT EXISTS orders (
    order_id VARCHAR(64) PRIMARY KEY,
    token_number VARCHAR(32) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    user_name VARCHAR(128) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('placed', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'placed',
    payment_method VARCHAR(64) DEFAULT 'Campus Card',
    pickup_time_est VARCHAR(32) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 6. Itemized Order Lines
CREATE TABLE IF NOT EXISTS order_bill_items (
    line_id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    menu_item_id VARCHAR(64) NOT NULL,
    name VARCHAR(191) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    qty INT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(item_id)
);

-- 7. Bills & Payment Receipts
CREATE TABLE IF NOT EXISTS bills (
    bill_id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    token_number VARCHAR(32) NOT NULL,
    customer_name VARCHAR(128) NOT NULL,
    customer_email VARCHAR(191) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    grand_total DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(64) NOT NULL,
    payment_status ENUM('paid', 'pending', 'refunded') DEFAULT 'paid',
    receipt_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- 8. Food Leftovers & IoT Waste Scaling Logs
CREATE TABLE IF NOT EXISTS waste_records (
    waste_id VARCHAR(64) PRIMARY KEY,
    menu_item_id VARCHAR(64) NOT NULL,
    item_name VARCHAR(191) NOT NULL,
    wasted_qty INT DEFAULT 1,
    weight_kg DECIMAL(10, 2) NOT NULL,
    reason ENUM('overproduction', 'expired', 'plate_scrapings', 'prep_trimmings') NOT NULL,
    station VARCHAR(128) DEFAULT 'Kitchen Line Scale',
    cost_loss DECIMAL(10, 2) NOT NULL,
    co2_kg DECIMAL(10, 2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Customer Feedback & Dining Satisfaction
CREATE TABLE IF NOT EXISTS feedback (
    feedback_id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);
