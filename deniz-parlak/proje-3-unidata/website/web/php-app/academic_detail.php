<?php
declare(strict_types=1);
require_once __DIR__ . '/app/bootstrap.php';
require_auth();

$id = int_param('id');
$row = fetch_one('SELECT a.*, u.name university_name FROM academics a LEFT JOIN universities u ON u.id = a.university_id WHERE a.id = ?', [$id]);
if (!$row) {
    http_response_code(404);
    exit('Kayıt bulunamadı.');
}
$history = fetch_all('SELECT h.*, ad.name admin_name FROM contact_history h LEFT JOIN admins ad ON ad.id = h.admin_id WHERE h.academic_id = ? ORDER BY h.created_at DESC', [$id]);

ob_start();
?>
<section class="page-header">
  <h1><?= e($row['full_name']) ?></h1>
  <p><?= e($row['academic_title'] ?: 'Akademisyen') ?> - <?= e($row['university_name']) ?></p>
</section>

<section class="grid two-col">
  <div class="card">
    <h2 class="card-title">Akademisyen Bilgileri</h2>
    <dl class="detail-list">
      <dt>Ad Soyad</dt><dd><?= e($row['full_name']) ?></dd>
      <dt>Akademik Unvan</dt><dd><?= e($row['academic_title']) ?></dd>
      <dt>Üniversite</dt><dd><?= e($row['university_name']) ?></dd>
      <dt>Fakülte</dt><dd><?= e($row['faculty']) ?></dd>
      <dt>Bölüm</dt><dd><?= e($row['department']) ?></dd>
      <dt>Anabilim Dalı</dt><dd><?= e($row['sub_department']) ?></dd>
      <dt>E-posta</dt><dd><?= e($row['email']) ?></dd>
      <dt>Telefon</dt><dd><?= e($row['phone']) ?></dd>
      <dt>Profil Linki</dt><dd><?php if ($row['profile_url']): ?><a href="<?= e($row['profile_url']) ?>" target="_blank" rel="noopener"><?= e($row['profile_url']) ?></a><?php endif; ?></dd>
      <dt>Kaynak Linki</dt><dd><?php if ($row['source_url']): ?><a href="<?= e($row['source_url']) ?>" target="_blank" rel="noopener"><?= e($row['source_url']) ?></a><?php endif; ?></dd>
      <dt>İletişim Durumu</dt><dd><span class="status-badge <?= e(status_class((string) $row['contact_status'])) ?>"><?= e($row['contact_status']) ?></span></dd>
      <dt>Not</dt><dd><?= nl2br(e($row['notes'])) ?></dd>
      <dt>Arşiv</dt><dd><?= (int) $row['archived'] === 1 ? 'Arşivde' : 'Aktif' ?></dd>
      <dt>Oluşturma</dt><dd><?= e($row['created_at']) ?></dd>
      <dt>Son Güncelleme</dt><dd><?= e($row['updated_at']) ?></dd>
    </dl>
  </div>

  <div class="card">
    <h2 class="card-title">İletişim Geçmişi</h2>
    <div class="timeline">
      <?php foreach ($history as $item): ?>
        <article class="timeline-item">
          <strong><?= e($item['created_at']) ?></strong>
          <p><?= e($item['old_status'] ?: 'İlk Durum') ?> → <?= e($item['new_status']) ?></p>
          <?php if ($item['note']): ?><p class="muted"><?= nl2br(e($item['note'])) ?></p><?php endif; ?>
          <small><?= e($item['admin_name'] ?: 'Sistem') ?></small>
        </article>
      <?php endforeach; ?>
      <?php if (!$history): ?><p class="empty">Henüz iletişim geçmişi yok.</p><?php endif; ?>
    </div>
  </div>
</section>
<?php
$content = ob_get_clean();
$title = $row['full_name'];
require __DIR__ . '/app/Views/layout.php';
