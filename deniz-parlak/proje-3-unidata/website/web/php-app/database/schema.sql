CREATE TABLE roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  label VARCHAR(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id INT UNSIGNED NOT NULL DEFAULT 1,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_admins_role FOREIGN KEY (role_id) REFERENCES roles(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE universities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  city VARCHAR(120) NULL,
  website VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_universities_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE academics (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  university_id INT UNSIGNED NOT NULL,
  full_name VARCHAR(190) NOT NULL,
  normalized_name VARCHAR(190) NOT NULL,
  academic_title VARCHAR(120) NULL,
  faculty VARCHAR(190) NULL,
  department VARCHAR(190) NULL,
  sub_department VARCHAR(190) NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(80) NULL,
  profile_url VARCHAR(500) NULL,
  source_url VARCHAR(500) NULL,
  contact_status ENUM('Bekliyor','İletişime Geçildi','Geri Dönüş Bekleniyor','Olumsuz','Tamamlandı') NOT NULL DEFAULT 'Bekliyor',
  notes TEXT NULL,
  archived TINYINT(1) NOT NULL DEFAULT 0,
  archived_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_academics_email (email),
  UNIQUE KEY uq_academics_name_university (normalized_name, university_id),
  KEY idx_academics_title (academic_title),
  KEY idx_academics_faculty (faculty),
  KEY idx_academics_department (department),
  KEY idx_academics_sub_department (sub_department),
  KEY idx_academics_status (contact_status),
  KEY idx_academics_archived (archived),
  CONSTRAINT fk_academics_university FOREIGN KEY (university_id) REFERENCES universities(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE contact_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  academic_id BIGINT UNSIGNED NOT NULL,
  admin_id INT UNSIGNED NULL,
  old_status VARCHAR(80) NULL,
  new_status VARCHAR(80) NOT NULL,
  note TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_contact_history_academic (academic_id, created_at),
  CONSTRAINT fk_contact_history_academic FOREIGN KEY (academic_id) REFERENCES academics(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_contact_history_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE imports (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  source VARCHAR(120) NOT NULL DEFAULT 'api',
  file_name VARCHAR(255) NULL,
  total_count INT UNSIGNED NOT NULL DEFAULT 0,
  success_count INT UNSIGNED NOT NULL DEFAULT 0,
  skipped_count INT UNSIGNED NOT NULL DEFAULT 0,
  error_count INT UNSIGNED NOT NULL DEFAULT 0,
  validation_report JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE bot_runs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  status VARCHAR(80) NOT NULL DEFAULT 'Bekliyor',
  current_university VARCHAR(190) NULL,
  current_faculty VARCHAR(190) NULL,
  current_department VARCHAR(190) NULL,
  processed_records INT UNSIGNED NOT NULL DEFAULT 0,
  total_records INT UNSIGNED NOT NULL DEFAULT 0,
  estimated_remaining_seconds INT UNSIGNED NULL,
  current_operation VARCHAR(255) NULL,
  last_error TEXT NULL,
  started_at DATETIME NULL,
  finished_at DATETIME NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type ENUM('api','import','error','validation','auth','system','bot') NOT NULL,
  level ENUM('info','warning','error') NOT NULL DEFAULT 'info',
  message VARCHAR(500) NOT NULL,
  context JSON NULL,
  ip_address VARCHAR(45) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_logs_type_date (type, created_at),
  KEY idx_logs_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE api_rate_limits (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  api_key_hash CHAR(64) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  window_start DATETIME NOT NULL,
  request_count INT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_api_rate_window (api_key_hash, ip_address, window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (id, name, label) VALUES
(1, 'admin', 'Yönetici')
ON DUPLICATE KEY UPDATE label = VALUES(label);

INSERT INTO admins (role_id, name, email, password_hash)
VALUES (1, 'Sistem Yöneticisi', 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/4vbhzXJrE4fM7aPq')
ON DUPLICATE KEY UPDATE email = email;

INSERT INTO settings (setting_key, setting_value) VALUES
('api_url', 'https://ornek.edu.tr/api'),
('api_key', 'degistiriniz-guvenli-api-anahtari'),
('default_timeout', '30'),
('retry_count', '3'),
('max_concurrent_requests', '5')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
