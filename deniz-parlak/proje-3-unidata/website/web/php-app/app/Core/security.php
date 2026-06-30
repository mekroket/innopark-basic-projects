<?php
declare(strict_types=1);

function csrf_token(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return (string) $_SESSION['csrf_token'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="csrf_token" value="' . e(csrf_token()) . '">';
}

function verify_csrf(): void
{
    $token = (string) ($_POST['csrf_token'] ?? '');
    if ($token === '' || !hash_equals((string) ($_SESSION['csrf_token'] ?? ''), $token)) {
        http_response_code(419);
        exit('Oturum güvenlik doğrulaması başarısız oldu.');
    }
}

function user(): ?array
{
    if (empty($_SESSION['admin_id'])) {
        return null;
    }
    return fetch_one(
        'SELECT a.id, a.name, a.email, r.name role_name, r.label role_label FROM admins a LEFT JOIN roles r ON r.id = a.role_id WHERE a.id = ?',
        [(int) $_SESSION['admin_id']]
    );
}

function require_auth(): void
{
    if (!user()) {
        redirect('login.php');
    }
}

function login_attempt(string $email, string $password): bool
{
    $admin = fetch_one('SELECT * FROM admins WHERE email = ? AND is_active = 1', [$email]);
    if (!$admin || !password_verify($password, (string) $admin['password_hash'])) {
        return false;
    }

    session_regenerate_id(true);
    $_SESSION['admin_id'] = (int) $admin['id'];
    execute_query('UPDATE admins SET last_login_at = NOW() WHERE id = ?', [(int) $admin['id']]);
    log_activity('auth', 'Yönetici girişi yapıldı.', ['email' => $email]);
    return true;
}

function logout_current_user(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', (bool) $params['secure'], (bool) $params['httponly']);
    }
    session_destroy();
}

function validate_api_key(): void
{
    $headerKey = (string) ($_SERVER['HTTP_X_API_KEY'] ?? '');
    $bearer = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? ''));
    if ($bearer === '' && function_exists('getallheaders')) {
        $headers = getallheaders();
        $bearer = (string) ($headers['Authorization'] ?? $headers['authorization'] ?? '');
        $headerKey = $headerKey !== '' ? $headerKey : (string) ($headers['X-API-Key'] ?? $headers['x-api-key'] ?? '');
    }
    if (preg_match('/^Bearer\s+(.+)$/i', trim($bearer), $matches)) {
        $headerKey = trim($matches[1]);
    }
    $headerKey = trim($headerKey);
    $setting = get_setting('api_key');
    if ($setting === '' || !hash_equals($setting, $headerKey)) {
        log_activity('api', 'Geçersiz API anahtarı denemesi.', [], 'warning');
        json_response(['success' => false, 'message' => 'Yetkisiz erişim.'], 401);
    }
    rate_limit_api($headerKey);
}

function rate_limit_api(string $apiKey): void
{
    $limit = 120;
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
    $window = date('Y-m-d H:i:00');
    $hash = hash('sha256', $apiKey);
    execute_query(
        'INSERT INTO api_rate_limits (api_key_hash, ip_address, window_start, request_count) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE request_count = request_count + 1',
        [$hash, $ip, $window]
    );
    $row = fetch_one('SELECT request_count FROM api_rate_limits WHERE api_key_hash = ? AND ip_address = ? AND window_start = ?', [$hash, $ip, $window]);
    if ((int) ($row['request_count'] ?? 0) > $limit) {
        log_activity('api', 'API hız limiti aşıldı.', ['ip' => $ip], 'warning');
        json_response(['success' => false, 'message' => 'API hız limiti aşıldı.'], 429);
    }
}
