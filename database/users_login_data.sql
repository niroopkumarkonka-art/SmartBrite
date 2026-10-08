-- ============================================================================
-- SmartBrite Users & Login Authentication Data
-- Generated SQL Data Store (Synchronized with MongoDB 'users' Collection)
-- ============================================================================

USE smartbrite;

-- 1. Users Records
INSERT INTO users (user_id, name, email, role, dietary_preference, allergies, created_at)
VALUES
('usr_admin_01', 'Niroop Kumar Konka', 'niroopkumarkonka@gmail.com', 'admin', 'Standard', '[]', '2026-03-01 10:00:00'),
('usr_001', 'Alex Rivera', 'alex.student@campus.edu', 'customer', 'High Protein', '["Peanuts"]', '2026-04-01 11:30:00'),
('usr_002', 'Chef Marcus Vance', 'marcus.chef@campus.edu', 'staff', 'Standard', '[]', '2026-03-15 08:00:00'),
('usr_003', 'Dr. Elena Rostova', 'admin.dining@campus.edu', 'admin', 'Standard', '[]', '2026-02-20 09:15:00')
ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role);

-- 2. User Login Session History
INSERT INTO user_logins (login_id, user_id, email, role, login_method, ip_address, login_time)
VALUES
('log_001', 'usr_admin_01', 'niroopkumarkonka@gmail.com', 'admin', 'Admin Password', '127.0.0.1', '2026-10-08 12:00:00'),
('log_002', 'usr_001', 'alex.student@campus.edu', 'customer', 'Google Auth', '192.168.1.45', '2026-10-08 12:15:00'),
('log_003', 'usr_002', 'marcus.chef@campus.edu', 'staff', 'Staff PIN', '10.0.0.12', '2026-10-08 08:30:00'),
('log_004', 'usr_admin_01', 'niroopkumarkonka@gmail.com', 'admin', 'Admin Password', '127.0.0.1', '2026-10-08 12:45:00');
INSERT INTO user_logins (login_id, user_id, email, role, login_method, ip_address, login_time) VALUES ('log_1791455858336', 'usr_admin_01', 'niroopkumarkonka@gmail.com', 'admin', 'Google Sign-In', '127.0.0.1', '2026-10-08 10:37:38');
INSERT INTO user_logins (login_id, user_id, email, role, login_method, ip_address, login_time) VALUES ('log_1791455858386', 'usr_001', 'alex.student@campus.edu', 'customer', 'Google Sign-In', '127.0.0.1', '2026-10-08 10:37:38');
INSERT INTO user_logins (login_id, user_id, email, role, login_method, ip_address, login_time) VALUES ('log_1791458203794', 'usr_admin_01', 'niroopkumarkonka@gmail.com', 'admin', 'Google Sign-In', '127.0.0.1', '2026-10-08 11:16:43');
INSERT INTO user_logins (login_id, user_id, email, role, login_method, ip_address, login_time) VALUES ('log_1791459864826', 'usr_admin_01', 'niroopkumarkonka@gmail.com', 'admin', 'Google Sign-In', '127.0.0.1', '2026-10-08 11:44:24');
INSERT INTO user_logins (login_id, user_id, email, role, login_method, ip_address, login_time) VALUES ('log_1791460790059', 'usr_admin_01', 'niroopkumarkonka@gmail.com', 'admin', 'Google Sign-In', '127.0.0.1', '2026-10-08 11:59:50');

-- Synced User Record: Rakshitha
INSERT INTO users (user_id, name, email, role, dietary_preference, allergies, created_at) VALUES ('usr_1791464405832', 'Rakshitha', 'rakshithakonka@gmail.com', 'customer', 'Standard', '[]', '2026-10-08 13:00:06') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO user_logins (login_id, user_id, email, role, login_method, ip_address, login_time) VALUES ('log_1791464406035', 'usr_1791464405832', 'rakshithakonka@gmail.com', 'customer', 'Registration', '127.0.0.1', '2026-10-08 13:00:06');
INSERT INTO user_logins (login_id, user_id, email, role, login_method, ip_address, login_time) VALUES ('log_1791464406036', 'usr_1791464405832', 'rakshithakonka@gmail.com', 'customer', 'Google Sign-In', '127.0.0.1', '2026-10-08 13:00:06');
INSERT INTO user_logins (login_id, user_id, email, role, login_method, ip_address, login_time) VALUES ('log_1791464817791', 'usr_admin_01', 'niroopkumarkonka@gmail.com', 'admin', 'Google Sign-In', '127.0.0.1', '2026-10-08 13:06:57');
