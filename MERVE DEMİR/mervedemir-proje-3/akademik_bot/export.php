<?php
/**
 * export.php
 * akademisyenler tablosundaki tüm kayıtları Excel uyumlu CSV olarak indirir.
 *
 * Şema, paylaştığın api.php ile birebir aynı:
 *   akademisyenler(isim, unvan, eposta, telefon, bolum, fakulte_id)
 *   fakulteler(id, ad, universite_id)
 *   universiteler(id, ad, sehir)
 *
 * akademisyenler.fakulte_id -> fakulteler.id -> fakulteler.universite_id -> universiteler.id
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

// ── Veritabanı Bağlantısı (PDO) ─────────────────────────────────────────────
$host = 'sql108.byetcluster.com';
$db   = 'if0_42305019_akademisyen';
$user = 'if0_42305019';
$pass = getenv('DB_PASS') ?: die('DB_PASS environment variable is not set.');
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    die('Veritabanı bağlantı hatası: ' . htmlspecialchars($e->getMessage()));
}

// ── Veriyi Çek ───────────────────────────────────────────────────────────────
// LEFT JOIN: fakulte_id veya universite_id NULL olsa bile akademisyen satırı düşmesin.
$sql = "
    SELECT
        a.unvan                AS Unvan,
        a.isim                 AS AdSoyad,
        f.ad                   AS Fakulte,
        a.bolum                AS Bolum,
        COALESCE(u.ad, '')     AS Universite,
        a.eposta                AS Eposta,
        a.telefon                AS Telefon,
        COALESCE(u.sehir, '')     AS Sehir
    FROM akademisyenler a
    LEFT JOIN fakulteler    f ON a.fakulte_id    = f.id
    LEFT JOIN universiteler u ON f.universite_id = u.id
    ORDER BY u.ad, f.ad, a.isim
";

try {
    $stmt = $pdo->query($sql);
} catch (PDOException $e) {
    http_response_code(500);
    die('Sorgu hatası: ' . htmlspecialchars($e->getMessage()));
}

// ── CSV Dosyasını Hazırla ────────────────────────────────────────────────────
$dosyaAdi = 'Akademisyenler_' . date('Y-m-d_His') . '.csv';

header('Content-Type: text/csv; charset=UTF-8');
header('Content-Disposition: attachment; filename="' . $dosyaAdi . '"');
header('Pragma: no-cache');
header('Expires: 0');

$out = fopen('php://output', 'w');

// UTF-8 BOM — Excel'in Türkçe karakterleri (ş, ğ, ü, ö, ç, ı, İ) doğru göstermesi için şart
fwrite($out, chr(0xEF) . chr(0xBB) . chr(0xBF));

// Excel Türkçe yerel ayarlarda varsayılan ayraç noktalı virgül (;) olduğundan
// fputcsv'nin ayraç parametresini ';' olarak ayarlıyoruz.
$ayrac = ';';

// Başlık satırı
fputcsv($out, ['Unvan', 'Ad Soyad', 'Fakülte', 'Bölüm', 'Üniversite', 'E-Posta', 'Telefon', 'Şehir'], $ayrac);

// Satırları yaz (tek tek fetch ederek bellek dostu şekilde, 22 binin üzerinde kayıtta bile sorun çıkarmaz)
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    fputcsv($out, [
        $row['Unvan']      !== null && $row['Unvan']      !== '' ? $row['Unvan']      : '-',
        $row['AdSoyad']    !== null && $row['AdSoyad']    !== '' ? $row['AdSoyad']    : '-',
        $row['Fakulte']    !== null && $row['Fakulte']    !== '' ? $row['Fakulte']    : '-',
        $row['Bolum']      !== null && $row['Bolum']      !== '' ? $row['Bolum']      : '-',
        $row['Universite'] !== null && $row['Universite'] !== '' ? $row['Universite'] : '-',
        $row['Eposta']     !== null && $row['Eposta']     !== '' ? $row['Eposta']     : '-',
        $row['Telefon']    !== null && $row['Telefon']    !== '' ? $row['Telefon']    : '-',
        $row['Sehir']      !== null && $row['Sehir']      !== '' ? $row['Sehir']      : '-',
    ], $ayrac);
}

fclose($out);
exit;
