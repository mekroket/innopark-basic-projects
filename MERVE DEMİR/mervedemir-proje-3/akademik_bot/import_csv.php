<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
set_time_limit(0);

// ── 1. Veritabanı Bağlantısı (PDO ve Yeni Şifrenle Uyarlanmış) ──
$host = 'sql108.infinityfree.com';
$db   = 'if0_42305019_akademisyen';
$user = 'if0_42305019';
$pass = getenv('DB_PASS') ?: die('DB_PASS environment variable is not set.');

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die('<div style="color:red; padding:1rem;">Veritabanı bağlantı hatası: ' . $e->getMessage() . '</div>');
}

// Yabancı anahtar kontrolünü geçici olarak kapatıyoruz
$pdo->exec("SET FOREIGN_KEY_CHECKS=0");

echo "<div style='font-family:sans-serif; padding: 2rem; background:#f4f6f9; min-height:100vh;'>";
echo "<h2>Veri Aktarım Sonucu</h2>";
echo "<hr style='border:1px solid #ddd; margin-bottom:1rem;'>";

// ── 2. Formdan Dosya Geldi mi Kontrolü ──
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['dosya']) && $_FILES['dosya']['error'] === UPLOAD_ERR_OK) {
    
    $dosya_yolu = $_FILES['dosya']['tmp_name'];
    $orijinal_isim = $_FILES['dosya']['name'];
    
    // Üniversite adını dosya adından al (Örn: "Selcuk_Universitesi.csv" -> "Selcuk_Universitesi")
    $raw_name = str_replace(['.csv', '.xlsx'], '', $orijinal_isim);
    $uni_adi = mb_check_encoding($raw_name, 'UTF-8') ? $raw_name : mb_convert_encoding($raw_name, 'UTF-8', 'ISO-8859-9');
    // Alt tireleri boşluğa çevirebiliriz istersen, şimdilik sadece trim yapıyoruz
    $uni_adi = trim(str_replace('_', ' ', $uni_adi));

    echo "<p><strong>=> " . htmlspecialchars($uni_adi) . "</strong> dosyası işleniyor...</p>";

    // ── 3. ÜNİVERSİTEYİ BUL VEYA YOKSA EKLE ──
    $stmt_u = $pdo->prepare("SELECT id FROM universiteler WHERE ad = ? LIMIT 1");
    $stmt_u->execute([$uni_adi]);
    $u_id = $stmt_u->fetchColumn();

    if (!$u_id) {
        $stmt_i = $pdo->prepare("INSERT INTO universiteler (ad) VALUES (?)");
        $stmt_i->execute([$uni_adi]);
        $u_id = $pdo->lastInsertId();
        echo "<p style='color:#718096; font-size:0.9rem;'>Yeni üniversite oluşturuldu: $uni_adi</p>";
    }

    // ── 4. DOSYAYI OKU VE UTF-16 DÜZELTMESİNİ YAP ──
    $icerik = file_get_contents($dosya_yolu);
    if (substr($icerik, 0, 2) === "\xFF\xFE") {
        $icerik = mb_convert_encoding(substr($icerik, 2), 'UTF-8', 'UTF-16LE');
    }

    $satirlar = explode("\n", str_replace("\r", "", $icerik));
    $ilk_satir = true;
    $eklenen = 0;

    // ── 5. SATIR SATIR İŞLE ──
    foreach ($satirlar as $satir) {
        if (trim($satir) === '') continue;

        // Ayırıcıyı otomatik bul
        $ayirici = strpos($satir, "\t") !== false ? "\t" : ";";
        $data = explode($ayirici, $satir);

        if (count($data) < 4) continue;
        if ($ilk_satir) { $ilk_satir = false; continue; } // Başlık satırını atla

        $unvan = trim($data[0] ?? '-');
        $isim = trim($data[1] ?? '-');
        $fakulte_adi = trim($data[2] ?? '-');
        $bolum = trim($data[3] ?? '-');
        $eposta = trim($data[4] ?? '-');

        if (empty($isim) || $isim === '-') continue;

        // FAKÜLTEYİ BUL VEYA YOKSA EKLE
        $stmt_f = $pdo->prepare("SELECT id FROM fakulteler WHERE ad = ? AND universite_id = ? LIMIT 1");
        $stmt_f->execute([$fakulte_adi, $u_id]);
        $f_id = $stmt_f->fetchColumn();

        if (!$f_id && $fakulte_adi !== '-' && $fakulte_adi !== '') {
            $stmt_fi = $pdo->prepare("INSERT INTO fakulteler (universite_id, ad) VALUES (?, ?)");
            $stmt_fi->execute([$u_id, $fakulte_adi]);
            $f_id = $pdo->lastInsertId();
        }

        // KİŞİYİ EKLE (Zaten varsa INSERT IGNORE ile atlar)
        $stmt_k = $pdo->prepare("INSERT IGNORE INTO akademisyenler (fakulte_id, isim, unvan, eposta, bolum) VALUES (?, ?, ?, ?, ?)");
        $stmt_k->execute([$f_id, $isim, $unvan, $eposta, $bolum]);
        
        if ($stmt_k->rowCount() > 0) {
            $eklenen++;
        }
    }
    
    echo "<p style='color:#2f855a; font-weight:bold;'>İşlem Tamamlandı! Veritabanına aktarılan yeni kişi sayısı: $eklenen</p>";
    echo "<br><a href='../admin.php' style='display:inline-block; padding:8px 16px; background:#2b6cb0; color:white; text-decoration:none; border-radius:4px;'>Ana Panele Dön</a>";

} else {
    echo "<p style='color:#c53030;'>Lütfen doğrudan bu sayfaya girmeyin. Bir dosya seçip yüklemek için admin panelini kullanın.</p>";
    echo "<br><a href='../admin.php'>Admin Paneline Git</a>";
}

$pdo->exec("SET FOREIGN_KEY_CHECKS=1");
$pdo = null;
echo "</div>";
?>