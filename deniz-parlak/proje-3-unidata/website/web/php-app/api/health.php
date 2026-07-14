<?php
declare(strict_types=1);
require_once __DIR__ . '/../app/bootstrap.php';

try {
    validate_api_key();
    db()->query('SELECT 1');
    json_response([
        'success' => true,
        'status' => 'ok',
        'database' => 'ok',
        'time' => date(DATE_ATOM),
    ]);
} catch (Throwable $e) {
    log_activity('error', 'Sağlık kontrolü başarısız.', ['error' => $e->getMessage()], 'error');
    json_response([
        'success' => false,
        'status' => 'error',
        'database' => 'error',
        'message' => 'Veritabanı bağlantısı kurulamadı.',
    ], 503);
}
