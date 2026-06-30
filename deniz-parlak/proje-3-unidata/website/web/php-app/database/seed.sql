INSERT INTO roles (id, name, label) VALUES
(1, 'admin', 'Yönetici')
ON DUPLICATE KEY UPDATE label = VALUES(label);

INSERT INTO admins (role_id, name, email, password_hash)
VALUES (1, 'Sistem Yöneticisi', 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/4vbhzXJrE4fM7aPq')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO universities (name, city, website, is_active) VALUES
('Ankara Üniversitesi', 'Ankara', 'https://www.ankara.edu.tr', 1),
('İstanbul Üniversitesi', 'İstanbul', 'https://www.istanbul.edu.tr', 1)
ON DUPLICATE KEY UPDATE city = VALUES(city), website = VALUES(website);
