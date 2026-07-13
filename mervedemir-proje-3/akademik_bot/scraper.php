<?php
// ============================================================
// scraper.php — Ana Scraper Motoru
// ============================================================
// Kullanım:
//   php scraper.php                        → tüm stratejiler
//   php scraper.php bilkent                → sadece Bilkent
//   php scraper.php bilkent,gazi           → birden fazla
//   php scraper.php --dry-run bilkent      → DB'ye yazmadan test
// ============================================================

require_once __DIR__ . '/config.php';

// ── Argüman işleme ────────────────────────────────────────────
$args      = array_slice($argv ?? [], 1);
$dry_run   = in_array('--dry-run', $args, true);
$args      = array_filter($args, fn($a) => $a !== '--dry-run');
$filtre    = array_values($args);   // boş = hepsi

// ── Strateji haritasını yükle ─────────────────────────────────
$stratejiler = require __DIR__ . '/config_map.php';

// Filtreleme
if (!empty($filtre)) {
    $anahtar = explode(',', $filtre[0]);
    $stratejiler = array_intersect_key(
        $stratejiler,
        array_flip($anahtar)
    );
    if (empty($stratejiler)) {
        echo "Hata: Belirtilen strateji bulunamadı. Mevcut: "
            . implode(', ', array_keys(require __DIR__ . '/config_map.php'))
            . "\n";
        exit(1);
    }
}

$pdo     = db_connect();
$toplam  = 0;
$hata    = 0;

echo "=== Akademisyen Scraper başlıyor (" . date('H:i:s') . ") ===\n";
echo ($dry_run ? "[DRY-RUN MODU — DB'ye yazılmayacak]\n" : '');

// ═══════════════════════════════════════════════════════════════
// ANA DÖNGÜ — her strateji için
// ═══════════════════════════════════════════════════════════════
foreach ($stratejiler as $anahtar => $s) {
    echo "\n▶ Strateji: $anahtar (tip: {$s['tip']})\n";

    if ($s['tip'] === 'json_api') {
        [$t, $h] = isle_json_api($anahtar, $s, $pdo, $dry_run);
    } else {
        [$t, $h] = isle_dom($anahtar, $s, $pdo, $dry_run);
    }

    $toplam += $t;
    $hata   += $h;
    echo "  → $t kayıt eklendi, $h hata\n";
}

echo "\n=== Tamamlandı: $toplam kayıt, $hata hata (" . date('H:i:s') . ") ===\n";


// ═══════════════════════════════════════════════════════════════
// DOM TARAYICI (HTML tabanlı üniversiteler)
// ═══════════════════════════════════════════════════════════════
function isle_dom(string $anahtar, array $s, PDO $pdo, bool $dry): array {
    $toplam = 0;
    $hata   = 0;

    foreach ($s['fakulteler'] as [$fak_adi, $fak_url]) {
        echo "  Fakülte: $fak_adi → $fak_url\n";

        // Fakülteyi DB'ye kaydet / bul
        $fak_id = $dry ? 0 : upsert_fakulte($pdo, $s['universite_id'], $fak_adi, $fak_url);

        // HTML'i indir
        $html = fetch_html($fak_url);
        if ($html === false) {
            log_error("[$anahtar] Sayfa indirilemedi: $fak_url");
            $hata++;
            continue;
        }

        // DOMDocument ile parse et
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'));
        libxml_clear_errors();
        $xpath = new DOMXPath($dom);

        // Kart/satır listesini al
        $kartlar = $xpath->query($s['kart_xpath']);
        if (!$kartlar || $kartlar->length === 0) {
            log_error("[$anahtar] Kart bulunamadı ($fak_url) xpath: {$s['kart_xpath']}");
            $hata++;
            continue;
        }

        echo "    {$kartlar->length} kart bulundu\n";

        foreach ($kartlar as $kart) {
            $kart_xpath = new DOMXPath($dom);

            $isim    = temizle(xpath_metin($kart_xpath, $s['isim_xpath'],    $kart));
            $unvan   = temizle(xpath_metin($kart_xpath, $s['unvan_xpath'],   $kart));
            $eposta  = temizle(xpath_metin($kart_xpath, $s['eposta_xpath'],  $kart));
            $telefon = temizle(xpath_metin($kart_xpath, $s['telefon_xpath'], $kart));
            $bolum   = temizle(xpath_metin($kart_xpath, $s['bolum_xpath'],   $kart));

            // Unvan isim içinden çıkarılabilir (örn: "Prof. Dr. Ahmet Yılmaz")
            if (empty($unvan) && !empty($isim)) {
                [$unvan, $isim] = unvan_ayir($isim);
            }

            if (empty($isim)) continue;   // isim yoksa bu satırı atla

            echo "    + $unvan $isim\n";

            if (!$dry) {
                $ok = kaydet_akademisyen($pdo, [
                    'fakulte_id'  => $fak_id,
                    'isim'        => $isim,
                    'unvan'       => $unvan,
                    'eposta'      => $eposta,
                    'telefon'     => $telefon,
                    'bolum'       => $bolum,
                    'kaynak_url'  => $fak_url,
                ]);
                if ($ok) $toplam++; else $hata++;
            } else {
                $toplam++;
            }
        }

        sleep(1); // sunucuyu yormamak için kısa bekleme
    }

    return [$toplam, $hata];
}


// ═══════════════════════════════════════════════════════════════
// JSON API TARAYICI (İTÜ ve benzeri JS-render'lı siteler)
// ═══════════════════════════════════════════════════════════════
function isle_json_api(string $anahtar, array $s, PDO $pdo, bool $dry): array {
    $toplam = 0;
    $hata   = 0;

    foreach ($s['birimler'] as [$fak_adi, $birim_id]) {
        echo "  Birim: $fak_adi (id: $birim_id)\n";

        $fak_id  = $dry ? 0 : upsert_fakulte($pdo, $s['universite_id'], $fak_adi, $s['api_base']);

        // API isteği
        $params  = http_build_query(array_merge($s['api_params'], ['birim' => $birim_id]));
        $url     = $s['api_base'] . '?' . $params;
        $json    = fetch_html($url);

        if ($json === false) {
            log_error("[$anahtar] API yanıtı alınamadı: $url");
            $hata++;
            continue;
        }

        $veri = json_decode($json, true);
        if (!is_array($veri)) {
            // JSON parse hatası — HTML içinde JSON gömülü olabilir
            preg_match('/\[.*?\]/s', $json, $m);
            $veri = $m ? json_decode($m[0], true) : null;
        }

        if (empty($veri)) {
            log_error("[$anahtar] Geçerli JSON verisi alınamadı: $url");
            $hata++;
            continue;
        }

        // Veri dizisi düz liste mi, yoksa iç içe mi?
        $liste = isset($veri[0]) ? $veri : ($veri['data'] ?? $veri['items'] ?? []);

        foreach ($liste as $satir) {
            $isim    = temizle($satir[$s['json_isim']]    ?? '');
            $unvan   = temizle($satir[$s['json_unvan']]   ?? '');
            $eposta  = temizle($satir[$s['json_eposta']]  ?? '');
            $telefon = temizle($satir[$s['json_telefon']] ?? '');
            $bolum   = temizle($satir[$s['json_bolum']]   ?? '');

            if (empty($unvan) && !empty($isim)) {
                [$unvan, $isim] = unvan_ayir($isim);
            }

            if (empty($isim)) continue;

            echo "    + $unvan $isim\n";

            if (!$dry) {
                $ok = kaydet_akademisyen($pdo, [
                    'fakulte_id'  => $fak_id,
                    'isim'        => $isim,
                    'unvan'       => $unvan,
                    'eposta'      => $eposta,
                    'telefon'     => $telefon,
                    'bolum'       => $bolum,
                    'kaynak_url'  => $url,
                ]);
                if ($ok) $toplam++; else $hata++;
            } else {
                $toplam++;
            }
        }

        sleep(1);
    }

    return [$toplam, $hata];
}


// ═══════════════════════════════════════════════════════════════
// YARDIMCI FONKSİYONLAR
// ═══════════════════════════════════════════════════════════════

/**
 * XPath sorgusuyla bir düğümden metin çeker.
 * Önce @href içinden e-posta almayı da dener.
 */
function xpath_metin(DOMXPath $xpath, string $sorgu, DOMNode $baglam = null): string {
    if (empty($sorgu)) return '';

    $dugumler = $baglam
        ? $xpath->query($sorgu, $baglam)
        : $xpath->query($sorgu);

    if (!$dugumler || $dugumler->length === 0) return '';

    $dugum = $dugumler->item(0);

    // mailto: link ise href'ten al
    if ($dugum->nodeName === 'a') {
        $href = $dugum->getAttribute('href');
        if (str_starts_with($href, 'mailto:')) {
            return str_replace('mailto:', '', $href);
        }
    }

    return trim($dugum->textContent);
}

/**
 * "Prof. Dr. Ahmet Yılmaz" gibi birleşik metinden unvan ayırır.
 * @return array [unvan, isim]
 */
function unvan_ayir(string $metin): array {
    $unvanlar = [
        'Prof. Dr.', 'Doç. Dr.', 'Dr. Öğr. Üyesi',
        'Araş. Gör. Dr.', 'Araş. Gör.', 'Öğr. Gör. Dr.',
        'Öğr. Gör.', 'Uzm.', 'Dr.',
    ];
    foreach ($unvanlar as $u) {
        if (str_starts_with($metin, $u)) {
            return [trim($u), trim(substr($metin, strlen($u)))];
        }
    }
    return ['', $metin];
}

/** Gereksiz boşluk ve karakter temizleme */
function temizle(string $s): string {
    $s = html_entity_decode($s, ENT_QUOTES, 'UTF-8');
    $s = preg_replace('/\s+/u', ' ', $s);
    return trim($s);
}

/**
 * Fakülte kaydı yoksa ekler, varsa id döner.
 */
function upsert_fakulte(PDO $pdo, int $uni_id, string $ad, string $url): int {
    $st = $pdo->prepare(
        'SELECT id FROM fakulteler WHERE universite_id = ? AND ad = ? LIMIT 1'
    );
    $st->execute([$uni_id, $ad]);
    $mevcut = $st->fetchColumn();
    if ($mevcut) return (int)$mevcut;

    $pdo->prepare(
        'INSERT INTO fakulteler (universite_id, ad, url) VALUES (?,?,?)'
    )->execute([$uni_id, $ad, $url]);

    return (int)$pdo->lastInsertId();
}

/**
 * Akademisyen kaydını ekler; UNIQUE kısıtı ihlali sessizce geçer.
 */
function kaydet_akademisyen(PDO $pdo, array $veri): bool {
    try {
        $pdo->prepare(
            'INSERT IGNORE INTO akademisyenler
                (fakulte_id, isim, unvan, eposta, telefon, bolum, kaynak_url)
             VALUES
                (:fakulte_id, :isim, :unvan, :eposta, :telefon, :bolum, :kaynak_url)'
        )->execute($veri);
        return true;
    } catch (PDOException $e) {
        log_error('[KAYDET] ' . $e->getMessage() . ' | ' . json_encode($veri));
        return false;
    }
}
