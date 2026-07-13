<?php
declare(strict_types=1);
require_once __DIR__ . '/app/bootstrap.php';
require_auth();

if (is_post()) {
    verify_csrf();
    $action = post_string('action', 30);
    if ($action === 'start') {
        execute_query("INSERT INTO bot_runs (status, current_operation, started_at) VALUES ('Bekliyor', 'Siteye aktar komutu oluşturuldu.', NOW())");
        log_activity('bot', 'Siteye aktar komutu oluşturuldu.');
        flash_set('success', 'Bot için siteye aktar komutu kaydedildi.');
    } elseif ($action === 'api_test') {
        try {
            db()->query('SELECT 1');
            log_activity('api', 'API bağlantı testi başarılı.');
            flash_set('success', 'API testi başarılı. Veritabanı erişilebilir.');
        } catch (Throwable $e) {
            log_activity('api', 'API bağlantı testi başarısız.', ['error' => $e->getMessage()], 'error');
            flash_set('error', 'API testi başarısız.');
        }
    } elseif ($action === 'refresh') {
        flash_set('success', 'Bot durumu yenilendi.');
    }
    redirect('bot.php');
}

$bot = fetch_one('SELECT * FROM bot_runs ORDER BY updated_at DESC LIMIT 1') ?: [
    'status' => 'Henüz çalışmadı',
    'current_university' => '',
    'current_faculty' => '',
    'current_department' => '',
    'processed_records' => 0,
    'total_records' => 0,
    'estimated_remaining_seconds' => null,
    'current_operation' => '',
    'last_error' => '',
    'updated_at' => 'Henüz yok',
];
$progress = (int) $bot['total_records'] > 0 ? min(100, ((int) $bot['processed_records'] / (int) $bot['total_records']) * 100) : 0;
$timeline = fetch_all("SELECT message, context, level, created_at FROM logs WHERE type = 'bot' ORDER BY created_at DESC LIMIT 30");

ob_start();
?>
<section class="page-header">
  <h1>Bot</h1>
  <p>Chrome Extension uyumlu veri aktarım sürecinin durum ve ilerleme ekranı.</p>
</section>
<section class="grid two-col">
  <div class="card">
    <h2 class="card-title">Bot Durumu</h2>
    <dl class="detail-list">
      <dt>Bot Durumu</dt><dd><span class="badge"><?= e($bot['status']) ?></span></dd>
      <dt>Geçerli Üniversite</dt><dd><?= e($bot['current_university']) ?></dd>
      <dt>Geçerli Fakülte</dt><dd><?= e($bot['current_faculty']) ?></dd>
      <dt>Geçerli Bölüm</dt><dd><?= e($bot['current_department']) ?></dd>
      <dt>İşlenen Kayıt</dt><dd><?= e($bot['processed_records']) ?></dd>
      <dt>Toplam Kayıt</dt><dd><?= e($bot['total_records']) ?></dd>
      <dt>Tahmini Kalan Süre</dt><dd><?= $bot['estimated_remaining_seconds'] === null ? 'Bilinmiyor' : e(gmdate('H:i:s', (int) $bot['estimated_remaining_seconds'])) ?></dd>
      <dt>Geçerli İşlem</dt><dd><?= e($bot['current_operation']) ?></dd>
      <dt>Son Çalıştırma</dt><dd><?= e($bot['updated_at']) ?></dd>
      <dt>Son Hata</dt><dd><?= e($bot['last_error']) ?></dd>
    </dl>
    <div class="progress"><span style="width:<?= e((string) $progress) ?>%"></span></div>
    <div class="actions">
      <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="start"><button type="submit">Siteye Aktar</button></form>
      <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="refresh"><button class="ghost" type="submit">Bot Durumunu Yenile</button></form>
      <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="api_test"><button class="ghost" type="submit">API Testi</button></form>
    </div>
  </div>
  <div class="card">
    <h2 class="card-title">Kazıma Zaman Çizelgesi</h2>
    <div class="timeline">
      <?php foreach ($timeline as $item): ?><article class="timeline-item"><strong><?= e($item['created_at']) ?></strong><p><?= e($item['message']) ?></p><small><?= e($item['level']) ?></small></article><?php endforeach; ?>
      <?php if (!$timeline): ?><p class="empty">Henüz bot hareketi yok.</p><?php endif; ?>
    </div>
  </div>
</section>
<?php
$content = ob_get_clean();
$title = 'Bot';
require __DIR__ . '/app/Views/layout.php';
