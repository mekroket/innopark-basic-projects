<?php
/**
 * api.php
 * Akademisyen verilerini JSON formatında döndürür (website.html için).
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=utf-8');

// ── Veritabanı Bilgileri (Güncellendi) ─────────────────────────
$host = 'sql108.infinityfree.com';
$db   = 'if0_42305019_akademisyen';
$user = 'if0_42305019';
$pass = getenv('DB_PASS') ?: die('DB_PASS environment variable is not set.'); 
try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // ── Sorgu ──────────────────────────────────────────────────
    $sql = "
        SELECT
            a.isim                    AS 'Ad Soyad',
            a.unvan                   AS 'Unvan',
            a.eposta                  AS 'E-posta',
            a.telefon                 AS 'Telefon',
            a.bolum                   AS 'Bölüm',
            COALESCE(u.ad,   '')      AS 'Üniversite',
            COALESCE(u.sehir,'')      AS 'Şehir'
        FROM akademisyenler a
        LEFT JOIN fakulteler   f ON a.fakulte_id    = f.id
        LEFT JOIN universiteler u ON f.universite_id = u.id
        ORDER BY a.isim
    ";

    $stmt = $pdo->query($sql);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Verileri JSON formatında basıyoruz
    echo json_encode(['data' => $data], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Sunucu/Veritabanı Hatası: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}

$pdo = null;
exit;