<?php
declare(strict_types=1);

function contact_statuses(): array
{
    return ['Bekliyor', 'İletişime Geçildi', 'Geri Dönüş Bekleniyor', 'Olumsuz', 'Tamamlandı'];
}

function valid_contact_status(string $status): string
{
    $status = trim($status);
    if (in_array($status, contact_statuses(), true)) {
        return $status;
    }

    $normalized = normalize_import_key($status);
    $aliases = [
        'pending' => 'Bekliyor',
        'waiting' => 'Bekliyor',
        'bekliyor' => 'Bekliyor',
        'contacted' => 'İletişime Geçildi',
        'iletisimegecildi' => 'İletişime Geçildi',
        'waitingresponse' => 'Geri Dönüş Bekleniyor',
        'geridonusbekleniyor' => 'Geri Dönüş Bekleniyor',
        'negative' => 'Olumsuz',
        'olumsuz' => 'Olumsuz',
        'completed' => 'Tamamlandı',
        'done' => 'Tamamlandı',
        'tamamlandi' => 'Tamamlandı',
    ];

    return $aliases[$normalized] ?? 'Bekliyor';
}

function status_class(string $status): string
{
    return match ($status) {
        'İletişime Geçildi' => 'status-blue',
        'Geri Dönüş Bekleniyor' => 'status-yellow',
        'Olumsuz' => 'status-red',
        'Tamamlandı' => 'status-green',
        default => 'status-gray',
    };
}

function get_setting(string $key, string $default = ''): string
{
    $row = fetch_one('SELECT setting_value FROM settings WHERE setting_key = ?', [$key]);
    return $row ? (string) $row['setting_value'] : $default;
}

function set_setting(string $key, string $value): void
{
    execute_query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()',
        [$key, $value]
    );
}

function log_activity(string $type, string $message, array $context = [], string $level = 'info'): void
{
    try {
        execute_query(
            'INSERT INTO logs (type, level, message, context, ip_address, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [$type, $level, $message, json_encode($context, JSON_UNESCAPED_UNICODE), $_SERVER['REMOTE_ADDR'] ?? null]
        );
    } catch (Throwable) {
    }
}

function dashboard_stats(): array
{
    return [
        'academics' => (int) (fetch_one('SELECT COUNT(*) total FROM academics WHERE archived = 0')['total'] ?? 0),
        'universities' => (int) (fetch_one('SELECT COUNT(*) total FROM universities')['total'] ?? 0),
        'today_imports' => (int) (fetch_one("SELECT COALESCE(SUM(success_count), 0) total FROM imports WHERE DATE(created_at) = CURDATE()")['total'] ?? 0),
        'total_email' => (int) (fetch_one('SELECT COUNT(*) total FROM academics WHERE email IS NOT NULL AND email <> ""')['total'] ?? 0),
        'total_phone' => (int) (fetch_one('SELECT COUNT(*) total FROM academics WHERE phone IS NOT NULL AND phone <> ""')['total'] ?? 0),
        'last_import' => fetch_one('SELECT created_at FROM imports ORDER BY created_at DESC LIMIT 1')['created_at'] ?? 'Henüz yok',
        'last_bot' => fetch_one('SELECT updated_at FROM bot_runs ORDER BY updated_at DESC LIMIT 1')['updated_at'] ?? 'Henüz yok',
        'last_update' => fetch_one('SELECT MAX(updated_at) updated_at FROM academics')['updated_at'] ?? 'Henüz yok',
    ];
}

function academic_filters_from_request(): array
{
    return [
        'q' => str_param('q', 120),
        'university_id' => str_param('university_id', 20),
        'academic_title' => str_param('academic_title', 120),
        'faculty' => str_param('faculty', 190),
        'department' => str_param('department', 190),
        'sub_department' => str_param('sub_department', 190),
        'contact_status' => str_param('contact_status', 80),
        'has_email' => str_param('has_email', 10),
        'has_phone' => str_param('has_phone', 10),
        'archived' => str_param('archived', 10) === '' ? '0' : str_param('archived', 10),
    ];
}

function academic_base_query(array $filters, array &$params): string
{
    $where = ['1 = 1'];
    if (($filters['q'] ?? '') !== '') {
        $where[] = '(a.full_name LIKE ? OR a.email LIKE ? OR u.name LIKE ? OR a.faculty LIKE ? OR a.department LIKE ? OR a.sub_department LIKE ? OR a.academic_title LIKE ?)';
        $like = '%' . $filters['q'] . '%';
        array_push($params, $like, $like, $like, $like, $like, $like, $like);
    }
    foreach ([
        'university_id' => 'a.university_id',
        'academic_title' => 'a.academic_title',
        'faculty' => 'a.faculty',
        'department' => 'a.department',
        'sub_department' => 'a.sub_department',
        'contact_status' => 'a.contact_status',
    ] as $key => $column) {
        if (($filters[$key] ?? '') !== '') {
            $where[] = "$column = ?";
            $params[] = $filters[$key];
        }
    }
    if (($filters['has_email'] ?? '') === '1') {
        $where[] = 'a.email IS NOT NULL AND a.email <> ""';
    } elseif (($filters['has_email'] ?? '') === '0') {
        $where[] = '(a.email IS NULL OR a.email = "")';
    }
    if (($filters['has_phone'] ?? '') === '1') {
        $where[] = 'a.phone IS NOT NULL AND a.phone <> ""';
    } elseif (($filters['has_phone'] ?? '') === '0') {
        $where[] = '(a.phone IS NULL OR a.phone = "")';
    }
    if (($filters['archived'] ?? '') !== 'all') {
        $where[] = 'a.archived = ?';
        $params[] = (int) (($filters['archived'] ?? '0') === '1');
    }
    return ' FROM academics a LEFT JOIN universities u ON u.id = a.university_id WHERE ' . implode(' AND ', $where);
}

function nullable_string(?string $value): ?string
{
    $value = trim((string) $value);
    return $value === '' ? null : $value;
}

function normalize_name(string $name): string
{
    $name = trim($name);
    $name = function_exists('mb_strtolower') ? mb_strtolower($name, 'UTF-8') : strtolower($name);
    return preg_replace('/\s+/u', ' ', $name) ?: $name;
}

function ensure_university(string $name, ?string $city = null, ?string $website = null): int
{
    execute_query(
        'INSERT INTO universities (name, city, website) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE city = COALESCE(VALUES(city), city), website = COALESCE(VALUES(website), website)',
        [$name, nullable_string($city), nullable_string($website)]
    );
    $row = fetch_one('SELECT id FROM universities WHERE name = ?', [$name]);
    return (int) ($row['id'] ?? 0);
}

function record_contact_history(int $academicId, ?string $oldStatus, string $newStatus, ?string $note = null): void
{
    execute_query(
        'INSERT INTO contact_history (academic_id, admin_id, old_status, new_status, note) VALUES (?, ?, ?, ?, ?)',
        [$academicId, $_SESSION['admin_id'] ?? null, $oldStatus, $newStatus, nullable_string($note)]
    );
}

function upsert_academic(array $data): bool
{
    $fullName = trim((string) ($data['full_name'] ?? ''));
    $universityId = (int) ($data['university_id'] ?? 0);
    if ($fullName === '' || $universityId < 1) {
        throw new InvalidArgumentException('Ad soyad ve üniversite zorunludur.');
    }

    $email = nullable_string($data['email'] ?? null);
    $normalizedName = normalize_name($fullName);
    $existing = $email ? fetch_one('SELECT * FROM academics WHERE email = ?', [$email]) : null;
    if (!$existing) {
        $existing = fetch_one('SELECT * FROM academics WHERE normalized_name = ? AND university_id = ?', [$normalizedName, $universityId]);
    }

    $contactStatus = ($data['contact_status'] ?? '') !== ''
        ? valid_contact_status((string) $data['contact_status'])
        : (is_array($existing) ? ($existing['contact_status'] ?? 'Bekliyor') : 'Bekliyor');
    $notes = array_key_exists('notes', $data)
        ? nullable_string($data['notes'])
        : (is_array($existing) ? ($existing['notes'] ?? null) : null);

    $optionalValue = static function (string $key) use ($data, $existing): ?string {
        if (array_key_exists($key, $data)) {
            return nullable_string($data[$key]);
        }
        return is_array($existing) ? ($existing[$key] ?? null) : null;
    };

    $fields = [
        'university_id' => $universityId,
        'full_name' => $fullName,
        'normalized_name' => $normalizedName,
        'academic_title' => $optionalValue('academic_title'),
        'faculty' => $optionalValue('faculty'),
        'department' => $optionalValue('department'),
        'sub_department' => $optionalValue('sub_department'),
        'email' => array_key_exists('email', $data) ? $email : (is_array($existing) ? ($existing['email'] ?? null) : null),
        'phone' => $optionalValue('phone'),
        'profile_url' => $optionalValue('profile_url'),
        'source_url' => $optionalValue('source_url'),
        'contact_status' => $contactStatus,
        'notes' => $notes,
    ];

    if ($existing) {
        execute_query(
            'UPDATE academics SET university_id=?, full_name=?, normalized_name=?, academic_title=?, faculty=?, department=?, sub_department=?, email=?, phone=?, profile_url=?, source_url=?, contact_status=?, notes=?, updated_at=NOW() WHERE id=?',
            array_merge(array_values($fields), [(int) $existing['id']])
        );
        return false;
    }

    execute_query(
        'INSERT INTO academics (university_id, full_name, normalized_name, academic_title, faculty, department, sub_department, email, phone, profile_url, source_url, contact_status, notes, archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())',
        array_values($fields)
    );
    return true;
}

function filter_options(string $column): array
{
    $allowed = ['academic_title', 'faculty', 'department', 'sub_department'];
    if (!in_array($column, $allowed, true)) {
        return [];
    }
    return fetch_all("SELECT DISTINCT $column value FROM academics WHERE $column IS NOT NULL AND $column <> '' ORDER BY $column");
}
