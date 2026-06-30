<?php
declare(strict_types=1);
require_once __DIR__ . '/app/bootstrap.php';
require_auth();

$type = str_param('type', 20);
$search = str_param('q', 120);
$start = str_param('start', 20);
$end = str_param('end', 20);
$page = int_param('page', 1);
$perPage = 20;
$offset = ($page - 1) * $perPage;
$params = [];
$where = ['1 = 1'];
if ($type !== '') {
    $where[] = 'type = ?';
    $params[] = $type;
}
if ($search !== '') {
    $where[] = '(message LIKE ? OR context LIKE ?)';
    $params[] = '%' . $search . '%';
    $params[] = '%' . $search . '%';
}
if ($start !== '') {
    $where[] = 'DATE(created_at) >= ?';
    $params[] = $start;
}
if ($end !== '') {
    $where[] = 'DATE(created_at) <= ?';
    $params[] = $end;
}
$sqlWhere = implode(' AND ', $where);
$total = (int) (fetch_one('SELECT COUNT(*) total FROM logs WHERE ' . $sqlWhere, $params)['total'] ?? 0);
$rows = fetch_all('SELECT * FROM logs WHERE ' . $sqlWhere . ' ORDER BY created_at DESC LIMIT ' . $perPage . ' OFFSET ' . $offset, $params);
$pages = max(1, (int) ceil($total / $perPage));

ob_start();
?>
<section class="page-header">
  <h1>Log Sayfası</h1>
  <p>Import, API, validasyon ve sistem hatalarını arayın, tarihe göre filtreleyin.</p>
</section>
<section class="card">
  <form class="filters" method="get">
    <label><span>Arama</span><input type="search" name="q" value="<?= e($search) ?>" placeholder="Mesaj veya detay"></label>
    <label><span>Log Türü</span><select name="type"><option value="">Tümü</option><?php foreach (['api','import','validation','error','auth','system','bot'] as $item): ?><option value="<?= e($item) ?>" <?= $type === $item ? 'selected' : '' ?>><?= e($item) ?></option><?php endforeach; ?></select></label>
    <label><span>Başlangıç</span><input type="date" name="start" value="<?= e($start) ?>"></label>
    <label><span>Bitiş</span><input type="date" name="end" value="<?= e($end) ?>"></label>
    <div class="actions"><button type="submit">Filtrele</button><a class="button ghost" href="logs.php">Temizle</a></div>
  </form>
  <p class="muted">Toplam Sonuç: <?= e(number_format($total, 0, ',', '.')) ?></p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tarih</th><th>Tür</th><th>Seviye</th><th>Mesaj</th><th>IP</th><th>Detay</th></tr></thead>
      <tbody>
      <?php foreach ($rows as $row): ?>
        <tr><td><?= e($row['created_at']) ?></td><td><span class="badge"><?= e($row['type']) ?></span></td><td><?= e($row['level']) ?></td><td><?= e($row['message']) ?></td><td><?= e($row['ip_address']) ?></td><td><?= e($row['context']) ?></td></tr>
      <?php endforeach; ?>
      <?php if (!$rows): ?><tr><td colspan="6" class="empty">Log kaydı bulunamadı.</td></tr><?php endif; ?>
      </tbody>
    </table>
  </div>
  <nav class="pagination">
    <?php if ($page > 1): $q = array_merge($_GET, ['page' => $page - 1]); ?><a href="?<?= e(http_build_query($q)) ?>">Önceki</a><?php endif; ?>
    <?php for ($i = max(1, $page - 2); $i <= min($pages, $page + 2); $i++): $q = array_merge($_GET, ['page' => $i]); ?>
      <?= $i === $page ? '<span class="active">' . $i . '</span>' : '<a href="?' . e(http_build_query($q)) . '">' . $i . '</a>' ?>
    <?php endfor; ?>
    <?php if ($page < $pages): $q = array_merge($_GET, ['page' => $page + 1]); ?><a href="?<?= e(http_build_query($q)) ?>">Sonraki</a><?php endif; ?>
  </nav>
</section>
<?php
$content = ob_get_clean();
$title = 'Loglar';
require __DIR__ . '/app/Views/layout.php';
