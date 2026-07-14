<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// ── Veritabanı Bağlantısı (PDO İLE GÜNCELLENDİ) ─────────────────────────
$host = 'sql108.infinityfree.com'; 
$db   = 'if0_42305019_akademisyen'; 
$user = 'if0_42305019';             
$pass = getenv('DB_PASS') ?:      die('DB_PASS environment variable is not set.'); // Şifreyi .env veya sunucu ayarlarından al

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    // Hataları daha net görebilmek için hata modunu aktif ediyoruz
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die('Bağlantı hatası: ' . $e->getMessage());
}

// ── Filtreler ──────────────────────────────────────────────────
$arama = trim($_GET['q'] ?? '');
$sayfa = max(1, (int)($_GET['sayfa'] ?? 1));
$limit = 50;
$offset = ($sayfa - 1) * $limit;

// ── Sorgu ──────────────────────────────────────────────────────
$where = '';
$params = [];

if ($arama !== '') {
    $where = "WHERE (a.isim LIKE ? OR a.eposta LIKE ?)";
    $like = "%$arama%";
    $params = [$like, $like];
}

// Toplam kayıt
$count_sql = "SELECT COUNT(*) FROM akademisyenler a $where";
$count_stmt = $pdo->prepare($count_sql);
$count_stmt->execute($params);
$toplam_kayit = (int)$count_stmt->fetchColumn();
$toplam_sayfa = ceil($toplam_kayit / $limit);

// Verileri çek
$sql = "
    SELECT 
        a.isim, 
        a.unvan, 
        a.eposta, 
        a.telefon, 
        a.bolum,
        f.ad AS fakulte,
        u.ad AS universite,
        u.sehir
    FROM akademisyenler a
    LEFT JOIN fakulteler f ON a.fakulte_id = f.id
    LEFT JOIN universiteler u ON f.universite_id = u.id
    $where
    ORDER BY u.ad, f.ad, a.isim
    LIMIT $limit OFFSET $offset
";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$satirlar = $stmt->fetchAll(PDO::FETCH_ASSOC);

// PDO'da bağlantıyı kapatmak için null atamak yeterlidir
$pdo = null;
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Akademisyen Veritabanı</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
               background: #f5f7fa; color: #2d3748; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        
        .header { display: flex; justify-content: space-between; align-items: center;
                  margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .header h1 { font-size: 2rem; }
        
        .search-box { display: flex; gap: 0.5rem; }
        .search-box input { padding: 0.6rem 1rem; border: 1px solid #cbd5e0;
                            border-radius: 6px; font-size: 1rem; width: 300px; }
        .search-box button { padding: 0.6rem 1.5rem; background: #2b6cb0;
                             color: white; border: none; border-radius: 6px;
                             cursor: pointer; font-size: 1rem; }
        .search-box button:hover { background: #1e4e8a; }
        
        .info { font-size: 0.9rem; color: #718096; margin-bottom: 1rem; }
        
        .table-wrapper { background: white; border-radius: 8px;
                         box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                         overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        thead { background: #2b3e50; color: white; }
        th { padding: 1rem; text-align: left; font-weight: 600;
             font-size: 0.9rem; text-transform: uppercase; }
        td { padding: 0.8rem 1rem; border-bottom: 1px solid #edf2f7; }
        tr:hover { background: #f9fbfc; }
        
        .empty { text-align: center; padding: 3rem 1rem; color: #a0aec0; }
        
        .pagination { display: flex; gap: 0.4rem; margin-top: 2rem; flex-wrap: wrap; }
        .pagination a, .pagination span { padding: 0.5rem 0.8rem;
                                         border: 1px solid #cbd5e0;
                                         border-radius: 4px;
                                         text-decoration: none;
                                         color: #2d3748; }
        .pagination a:hover { background: #edf2f7; }
        .pagination .active { background: #2b6cb0; color: white; border-color: #2b6cb0; }
        
        .badge { display: inline-block; padding: 0.2rem 0.6rem;
                 border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
        .badge-prof { background: #bee3f8; color: #2c5aa0; }
        .badge-doc { background: #c6f6d5; color: #22543d; }
        .badge-dr { background: #fed7d7; color: #742a2a; }
        .badge-other { background: #e2e8f0; color: #2d3748; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📚 Akademisyen Veritabanı</h1>
            <form class="search-box" method="get">
                <input type="text" name="q" placeholder="İsim, e-posta ara..."
                       value="<?= htmlspecialchars($arama) ?>">
                <button type="submit">Ara</button>
            </form>
        </div>

        <div class="info">
            Toplam <strong><?= number_format($toplam_kayit) ?></strong> kayıt
            <?php if ($arama): ?>
                — "<em><?= htmlspecialchars($arama) ?></em>" araması
            <?php endif; ?>
            <?php if ($toplam_sayfa > 1): ?>
                | Sayfa <strong><?= $sayfa ?></strong> / <strong><?= $toplam_sayfa ?></strong>
            <?php endif; ?>
        </div>

        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Unvan &amp; İsim</th>
                        <th>E-Posta</th>
                        <th>Telefon</th>
                        <th>Bölüm</th>
                        <th>Fakülte</th>
                        <th>Üniversite</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($satirlar)): ?>
                        <tr><td colspan="7" class="empty">Kayıt bulunamadı.</td></tr>
                    <?php else: ?>
                        <?php foreach ($satirlar as $i => $row): ?>
                            <tr>
                                <td style="color: #a0aec0; font-size: 0.9rem;">
                                    <?= $offset + $i + 1 ?>
                                </td>
                                <td>
                                    <span class="badge <?= get_badge_class($row['unvan']) ?>">
                                        <?= htmlspecialchars($row['unvan'] ?: '—') ?>
                                    </span>
                                    <div style="font-weight: 600; margin-top: 0.3rem;">
                                        <?= htmlspecialchars($row['isim']) ?>
                                    </div>
                                </td>
                                <td>
                                    <?php if ($row['eposta']): ?>
                                        <a href="mailto:<?= htmlspecialchars($row['eposta']) ?>"
                                           style="color: #2b6cb0; text-decoration: none;">
                                            <?= htmlspecialchars($row['eposta']) ?>
                                        </a>
                                    <?php else: ?>—<?php endif; ?>
                                </td>
                                <td><?= htmlspecialchars($row['telefon'] ?: '—') ?></td>
                                <td><?= htmlspecialchars($row['bolum'] ?: '—') ?></td>
                                <td><?= htmlspecialchars($row['fakulte'] ?: '—') ?></td>
                                <td><?= htmlspecialchars($row['universite'] ?: '—') ?></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <?php if ($toplam_sayfa > 1): ?>
            <div class="pagination">
                <?php if ($sayfa > 1): ?>
                    <a href="?sayfa=1<?= $arama ? '&q=' . urlencode($arama) : '' ?>">
                        ⟨ İlk
                    </a>
                    <a href="?sayfa=<?= $sayfa - 1 ?><?= $arama ? '&q=' . urlencode($arama) : '' ?>">
                        ‹ Önceki
                    </a>
                <?php endif; ?>

                <?php
                $pencere = 2;
                for ($s = 1; $s <= $toplam_sayfa; $s++):
                    if ($s == 1 || $s == $toplam_sayfa || abs($s - $sayfa) <= $pencere):
                        $class = $s == $sayfa ? 'active' : '';
                        echo "<a href='?sayfa=$s" 
                            . ($arama ? '&q=' . urlencode($arama) : '') 
                            . "' class='$class'>$s</a>";
                    elseif (abs($s - $sayfa) == $pencere + 1):
                        echo "<span>…</span>";
                    endif;
                endfor;
                ?>

                <?php if ($sayfa < $toplam_sayfa): ?>
                    <a href="?sayfa=<?= $sayfa + 1 ?><?= $arama ? '&q=' . urlencode($arama) : '' ?>">
                        Sonraki ›
                    </a>
                    <a href="?sayfa=<?= $toplam_sayfa ?><?= $arama ? '&q=' . urlencode($arama) : '' ?>">
                        Son ⟩
                    </a>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>

<?php
function get_badge_class(string $unvan): string {
    $u = mb_strtolower($unvan);
    if (strpos($u, 'prof') !== false) return 'badge-prof';
    if (strpos($u, 'doç') !== false) return 'badge-doc';
    if (strpos($u, 'dr.') !== false) return 'badge-dr';
    return 'badge-other';
}
?>