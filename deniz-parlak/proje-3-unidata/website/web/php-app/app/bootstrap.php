<?php
declare(strict_types=1);

$configFile = __DIR__ . '/config.php';
$config = file_exists($configFile) ? require $configFile : require __DIR__ . '/config.example.php';

date_default_timezone_set('Europe/Istanbul');

ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
ini_set('session.cookie_httponly', '1');

$isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
session_name((string) ($config['session_name'] ?? 'akademik_veri_oturum'));
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => $isSecure,
    'httponly' => true,
    'samesite' => 'Lax',
]);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

require_once __DIR__ . '/Core/helpers.php';
require_once __DIR__ . '/Core/database.php';
require_once __DIR__ . '/Core/security.php';
require_once __DIR__ . '/Core/repositories.php';
require_once __DIR__ . '/Core/spreadsheet.php';
