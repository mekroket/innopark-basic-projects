<?php
declare(strict_types=1);
require_once __DIR__ . '/app/bootstrap.php';
require_auth();

$stats = dashboard_stats();
$activities = fetch_all('SELECT type, level, message, created_at FROM logs ORDER BY created_at DESC LIMIT 10');
$latest = fetch_all('SELECT a.full_name, a.academic_title, u.name university_name, a.created_at FROM academics a LEFT JOIN universities u ON u.id = a.university_id ORDER BY a.created_at DESC LIMIT 10');
$errors = fetch_all("SELECT message, context, created_at FROM logs WHERE level = 'error' ORDER BY created_at DESC LIMIT 8");

ob_start();
?>
<section class="page-header">
  <h1>Yönetim Paneli</h1>
  <p>Akademik veri tabanı, bot aktarımı, iletişim durumu ve sistem sağlığı için günlük özet.</p>
</section>

<section class="grid stats dashboard-stats">
  <div class="card stat-card"><span>Toplam Akademisyen</span><strong><?= e($stats['academics']) ?></strong></div>
  <div class="card stat-card"><span>Toplam Üniversite</span><strong><?= e($stats['universities']) ?></strong></div>
  <div class="card stat-card"><span>Bugünkü Aktarma</span><strong><?= e($stats['today_imports']) ?></strong></div>
  <div class="card stat-card"><span>Toplam Mail</span><strong><?= e($stats['total_email']) ?></strong></div>
  <div class="card stat-card"><span>Toplam Telefon</span><strong><?= e($stats['total_phone']) ?></strong></div>
  <div class="card stat-card"><span>Son Veri Aktarma</span><strong><?= e($stats['last_import']) ?></strong></div>
  <div class="card stat-card"><span>Son Bot Çalıştırma</span><strong><?= e($stats['last_bot']) ?></strong></div>
  <div class="card stat-card"><span>Son Güncelleme</span><strong><?= e($stats['last_update']) ?></strong></div>
</section>

<section class="grid dashboard-grid">
  <div class="card">
    <h2 class="card-title">Son Hareketler</h2>
    <div class="table-wrap compact"><table><thead><tr><th>Tür</th><th>Seviye</th><th>Açıklama</th><th>Tarih</th></tr></thead><tbody>
      <?php foreach ($activities as $activity): ?><tr><td><span class="badge"><?= e($activity['type']) ?></span></td><td><?= e($activity['level']) ?></td><td><?= e($activity['message']) ?></td><td><?= e($activity['created_at']) ?></td></tr><?php endforeach; ?>
      <?php if (!$activities): ?><tr><td colspan="4" class="empty">Henüz hareket kaydı yok.</td></tr><?php endif; ?>
    </tbody></table></div>
  </div>
  <div class="card">
    <h2 class="card-title">Son Aktarılan Kayıtlar</h2>
    <div class="table-wrap compact"><table><thead><tr><th>Ad Soyad</th><th>Üniversite</th><th>Tarih</th></tr></thead><tbody>
      <?php foreach ($latest as $row): ?><tr><td><?= e($row['full_name']) ?></td><td><?= e($row['university_name']) ?></td><td><?= e($row['created_at']) ?></td></tr><?php endforeach; ?>
      <?php if (!$latest): ?><tr><td colspan="3" class="empty">Henüz aktarılmış kayıt yok.</td></tr><?php endif; ?>
    </tbody></table></div>
  </div>
  <div class="card">
    <h2 class="card-title">Son Sistem Hataları</h2>
    <div class="table-wrap compact"><table><thead><tr><th>Tarih</th><th>Hata</th></tr></thead><tbody>
      <?php foreach ($errors as $error): ?><tr><td><?= e($error['created_at']) ?></td><td><?= e($error['message']) ?></td></tr><?php endforeach; ?>
      <?php if (!$errors): ?><tr><td colspan="2" class="empty">Kayıtlı hata yok.</td></tr><?php endif; ?>
    </tbody></table></div>
  </div>
</section>
<?php
$content = ob_get_clean();
$title = 'Yönetim Paneli';
require __DIR__ . '/app/Views/layout.php';
