<?php
declare(strict_types=1);
require_once __DIR__ . '/app/bootstrap.php';
require_auth();

$keys = [
    'api_url' => 'API URL',
    'api_key' => 'API KEY',
    'default_timeout' => 'Varsayılan Zaman Aşımı',
    'retry_count' => 'Tekrar Deneme Sayısı',
    'max_concurrent_requests' => 'Maksimum Eş Zamanlı İstek',
];

if (is_post()) {
    verify_csrf();
    $action = post_string('action', 20);
    if ($action === 'test') {
        try {
            db()->query('SELECT 1');
            log_activity('api', 'Ayarlar sayfasından bağlantı testi başarılı.');
            flash_set('success', 'Bağlantı testi başarılı.');
        } catch (Throwable $e) {
            log_activity('api', 'Ayarlar sayfasından bağlantı testi başarısız.', ['error' => $e->getMessage()], 'error');
            flash_set('error', 'Bağlantı testi başarısız.');
        }
        redirect('settings.php');
    }
    foreach ($keys as $key => $label) {
        $value = post_string($key, $key === 'api_key' ? 500 : 255);
        if ($key !== 'api_key' && in_array($key, ['default_timeout', 'retry_count', 'max_concurrent_requests'], true)) {
            $value = (string) max(0, (int) $value);
        }
        set_setting($key, $value);
    }
    log_activity('system', 'Bot ayarları güncellendi.');
    flash_set('success', 'Bot ayarları kaydedildi.');
    redirect('settings.php');
}

ob_start();
?>
<section class="page-header">
  <h1>Bot Ayarları</h1>
  <p>Veri aktarma servisleri için bağlantı, zaman aşımı ve deneme ayarları.</p>
</section>
<form class="card form-grid" method="post">
  <?= csrf_field() ?>
  <input type="hidden" name="action" value="save">
  <?php foreach ($keys as $key => $label): ?>
    <label>
      <span><?= e($label) ?></span>
      <input name="<?= e($key) ?>" value="<?= e(get_setting($key)) ?>" <?= $key === 'api_key' ? 'autocomplete="off"' : '' ?> required>
    </label>
  <?php endforeach; ?>
  <div class="actions">
    <button type="submit">Kaydet</button>
    <button class="ghost" type="submit" name="action" value="test">Bağlantıyı Test Et</button>
  </div>
</form>
<?php
$content = ob_get_clean();
$title = 'Bot Ayarları';
require __DIR__ . '/app/Views/layout.php';
