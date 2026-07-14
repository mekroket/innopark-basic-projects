<?php
// CORS ve JSON başlıkları
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// XAMPP Veritabanı bağlantı bilgileri
$host = 'sql108.byetcluster.com';
$dbname = 'if0_42305019_akademisyen'; 
$username = 'if0_42305019';
$password = getenv('DB_PASS') ?: die('DB_PASS environment variable is not set.'); // Şifreyi .env veya sunucu ayarlarından al
try {
    // utf8mb4 ile Türkçe karakter desteğini kesinleştiriyoruz
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Veritabanı bağlantı hatası: ' . $e->getMessage()]);
    exit;
}

// Gelen JSON verisini al
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !is_array($data)) {
    echo json_encode(['success' => false, 'error' => 'Geçersiz veri formatı.']);
    exit;
}

$eklenenKayit = 0;

// ── PREPARED STATEMENTS (Performans ve Güvenlik İçin) ──

// 1. Üniversite: 'universite_adi' yerine 'ad' kullanıldı
$stmtUniCheck = $pdo->prepare("SELECT id FROM universiteler WHERE ad = :uni_adi LIMIT 1");
$stmtUniInsert = $pdo->prepare("INSERT INTO universiteler (ad) VALUES (:uni_adi)");

// 2. Fakülte: 'fakulte_adi' yerine 'ad' kullanıldı
$stmtFakCheck = $pdo->prepare("SELECT id FROM fakulteler WHERE universite_id = :uni_id AND ad = :fak_adi LIMIT 1");
$stmtFakInsert = $pdo->prepare("INSERT INTO fakulteler (universite_id, ad) VALUES (:uni_id, :fak_adi)");

// 3. Akademisyen: Popup.js'ten gelen verileri eşleştirmek için eposta sütunu adı 'eposta' yapıldı
// Not: Eğer tablonuzda 'email' ise aşağıdaki eposta kelimelerini email ile değiştirin. 
// Standart schema 'eposta' kullandığı varsayıldı.
$stmtAkaCheck = $pdo->prepare("SELECT id FROM akademisyenler WHERE isim = :isim AND eposta = :eposta LIMIT 1");
$stmtAkaInsert = $pdo->prepare("INSERT INTO akademisyenler (fakulte_id, unvan, isim, bolum, eposta) VALUES (:fakulte_id, :unvan, :isim, :bolum, :eposta)");

// İşlemi bir Transaction içine alıyoruz. Hata olursa hiçbirini eklemez, başarılıysa toplu kaydeder.
$pdo->beginTransaction();

try {
    foreach ($data as $row) {
        // popup.js'ten gelen veriler (Boş gelirse varsayılan değer atanır)
        $universiteAdi = !empty($row['universite']) ? trim($row['universite']) : 'Bilinmeyen Üniversite';
        $fakulteAdi    = !empty($row['fakulte'])    ? trim($row['fakulte'])    : '-';
        $unvan         = !empty($row['unvan'])      ? trim($row['unvan'])      : '-';
        $isim          = !empty($row['isim'])       ? trim($row['isim'])       : '-';
        $bolum         = !empty($row['bolum'])      ? trim($row['bolum'])      : '-';
        $eposta        = !empty($row['email'])      ? trim($row['email'])      : '-';

        // --- ADIM 1: Üniversite İşlemleri ---
        $stmtUniCheck->execute(['uni_adi' => $universiteAdi]);
        $uniId = $stmtUniCheck->fetchColumn();

        if (!$uniId) {
            $stmtUniInsert->execute(['uni_adi' => $universiteAdi]);
            $uniId = $pdo->lastInsertId();
        }

        // --- ADIM 2: Fakülte İşlemleri ---
        $stmtFakCheck->execute(['uni_id' => $uniId, 'fak_adi' => $fakulteAdi]);
        $fakulteId = $stmtFakCheck->fetchColumn();

        if (!$fakulteId) {
            $stmtFakInsert->execute(['uni_id' => $uniId, 'fak_adi' => $fakulteAdi]);
            $fakulteId = $pdo->lastInsertId();
        }

        // --- ADIM 3: Akademisyen İşlemleri ---
        $stmtAkaCheck->execute(['isim' => $isim, 'eposta' => $eposta]);
        $akaId = $stmtAkaCheck->fetchColumn();

        // Eğer sistemde bu isim ve mail ile biri yoksa INSERT yap
        if (!$akaId) {
            $stmtAkaInsert->execute([
                'fakulte_id' => $fakulteId,
                'unvan'      => $unvan,
                'isim'       => $isim,
                'bolum'      => $bolum,
                'eposta'     => $eposta
            ]);
            $eklenenKayit++;
        }
    }
    
    // Her şey yolundaysa veritabanına işle
    $pdo->commit();
    echo json_encode(['success' => true, 'eklenen_kayit' => $eklenenKayit]);

} catch (Exception $e) {
    // Hata durumunda yapılan değişiklikleri geri al
    $pdo->rollBack();
    echo json_encode(['success' => false, 'error' => 'Kayıt sırasında veritabanı hatası: ' . $e->getMessage()]);
}
?>