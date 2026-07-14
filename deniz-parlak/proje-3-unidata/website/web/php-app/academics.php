<?php
declare(strict_types=1);
require_once __DIR__ . '/app/bootstrap.php';
require_auth();

if (is_post()) {
    verify_csrf();
    $id = (int) ($_POST['id'] ?? 0);
    $action = post_string('action', 30);
    $row = $id > 0 ? fetch_one('SELECT * FROM academics WHERE id = ?', [$id]) : null;
    try {
        if (!$row) {
            throw new RuntimeException('Akademisyen kaydı bulunamadı.');
        }
        if ($action === 'quick_update') {
            $newStatus = valid_contact_status(post_string('contact_status', 80));
            $note = post_string('notes', 5000);
            execute_query('UPDATE academics SET contact_status = ?, notes = ?, updated_at = NOW() WHERE id = ?', [$newStatus, nullable_string($note), $id]);
            if ((string) $row['contact_status'] !== $newStatus) {
                record_contact_history($id, (string) $row['contact_status'], $newStatus, $note);
            }
            flash_set('success', 'Kayıt güncellendi.');
        } elseif ($action === 'archive') {
            execute_query('UPDATE academics SET archived = 1, archived_at = NOW(), updated_at = NOW() WHERE id = ?', [$id]);
            log_activity('system', 'Akademisyen arşivlendi.', ['id' => $id]);
            flash_set('success', 'Kayıt arşivlendi.');
        } elseif ($action === 'restore') {
            execute_query('UPDATE academics SET archived = 0, archived_at = NULL, updated_at = NOW() WHERE id = ?', [$id]);
            log_activity('system', 'Akademisyen arşivden çıkarıldı.', ['id' => $id]);
            flash_set('success', 'Kayıt arşivden çıkarıldı.');
        } elseif ($action === 'delete') {
            execute_query('DELETE FROM academics WHERE id = ?', [$id]);
            log_activity('system', 'Akademisyen kalıcı olarak silindi.', ['id' => $id], 'warning');
            flash_set('success', 'Kayıt kalıcı olarak silindi.');
        }
    } catch (Throwable $e) {
        flash_set('error', 'İşlem tamamlanamadı: ' . $e->getMessage());
    }
    redirect('academics.php?' . http_build_query($_GET));
}

$allowedSorts = [
    'full_name' => 'a.full_name',
    'university' => 'u.name',
    'faculty' => 'a.faculty',
    'department' => 'a.department',
    'updated_at' => 'a.updated_at',
];
$allowedPerPage = [10, 25, 50, 100];
$filters = academic_filters_from_request();
$sortKey = str_param('sort', 50);
$sort = array_key_exists($sortKey, $allowedSorts) ? $sortKey : 'updated_at';
$dir = strtolower(str_param('dir', 4)) === 'asc' ? 'ASC' : 'DESC';
$page = int_param('page', 1);
$perPageRequest = int_param('per_page', 0, 0, 100);
$perPageCookie = isset($_COOKIE['academics_per_page']) ? (int) $_COOKIE['academics_per_page'] : 25;
$perPage = in_array($perPageRequest, $allowedPerPage, true) ? $perPageRequest : (in_array($perPageCookie, $allowedPerPage, true) ? $perPageCookie : 25);
if ($perPageRequest !== 0 && $perPageRequest === $perPage) {
    setcookie('academics_per_page', (string) $perPage, time() + 60 * 60 * 24 * 180, '', '', false, true);
}

$params = [];
$base = academic_base_query($filters, $params);
$total = (int) (fetch_one('SELECT COUNT(*) total' . $base, $params)['total'] ?? 0);
$pages = max(1, (int) ceil($total / $perPage));
$page = min($page, $pages);
$offset = ($page - 1) * $perPage;
$rows = fetch_all(
    'SELECT a.*, u.name university_name' . $base . ' ORDER BY ' . $allowedSorts[$sort] . ' ' . $dir . ' LIMIT ' . $perPage . ' OFFSET ' . $offset,
    $params
);
$universities = fetch_all('SELECT id, name FROM universities ORDER BY name');
$faculties = filter_options('faculty');
$departments = filter_options('department');

function sort_link(string $key, string $label, string $sort, string $dir): string
{
    $query = $_GET;
    $query['sort'] = $key;
    $query['dir'] = ($sort === $key && $dir === 'ASC') ? 'desc' : 'asc';
    $query['page'] = 1;
    return '<a href="?' . e(http_build_query($query)) . '">' . e($label) . '</a>';
}

ob_start();
?>
<section class="academics-sketch">
  <form class="sketch-filters" method="get" data-instant-search>
    <input type="hidden" name="sort" value="<?= e($sort) ?>">
    <input type="hidden" name="dir" value="<?= e(strtolower($dir)) ?>">
    <input type="hidden" name="page" value="<?= e($page) ?>">
    <input type="hidden" name="per_page" value="<?= e($perPage) ?>">
    <div class="filter-row">
      <input type="search" name="q" value="<?= e($filters['q']) ?>" placeholder="Arama">
      <select name="university_id"><option value="">Üniversite seç</option><?php foreach ($universities as $u): ?><option value="<?= e($u['id']) ?>" <?= (string) $u['id'] === $filters['university_id'] ? 'selected' : '' ?>><?= e($u['name']) ?></option><?php endforeach; ?></select>
      <select name="faculty"><option value="">Fakülte seç</option><?php foreach ($faculties as $item): ?><option <?= $item['value'] === $filters['faculty'] ? 'selected' : '' ?>><?= e($item['value']) ?></option><?php endforeach; ?></select>
      <select name="department"><option value="">Bölüm seç</option><?php foreach ($departments as $item): ?><option <?= $item['value'] === $filters['department'] ? 'selected' : '' ?>><?= e($item['value']) ?></option><?php endforeach; ?></select>
    </div>
  </form>

  <section class="sketch-table-panel">
    <div class="sketch-actions">
      <a class="sketch-button" href="import.php">Excel Aktar</a>
      <button class="sketch-button" type="button" data-open-export>Dışa Aktar</button>
    </div>

    <div class="sketch-table-wrap">
      <table class="sketch-table">
        <thead>
          <tr>
            <th><?= sort_link('full_name', 'Ad-Soyad', $sort, $dir) ?></th>
            <th><?= sort_link('university', 'Üniversite', $sort, $dir) ?></th>
            <th><?= sort_link('faculty', 'Fakülte', $sort, $dir) ?></th>
            <th><?= sort_link('department', 'Bölüm', $sort, $dir) ?></th>
            <th>E-posta</th>
            <th>Telefon</th>
            <th>Kişi durum paneli</th>
          </tr>
        </thead>
        <tbody>
        <?php foreach ($rows as $row): ?>
          <tr>
            <td><a href="academic_detail.php?id=<?= e($row['id']) ?>"><?= e($row['full_name']) ?></a></td>
            <td><?= e($row['university_name']) ?></td>
            <td><?= e($row['faculty']) ?></td>
            <td><?= e($row['department']) ?></td>
            <td><?= e($row['email']) ?></td>
            <td><?= e($row['phone']) ?></td>
            <td>
              <form method="post" class="sketch-row-panel">
                <?= csrf_field() ?>
                <input type="hidden" name="id" value="<?= e($row['id']) ?>">
                <input type="hidden" name="action" value="quick_update">
                <input type="hidden" name="notes" value="<?= e($row['notes']) ?>">
                <select name="contact_status" aria-label="İletişim durumu"><?php foreach (contact_statuses() as $status): ?><option <?= $status === $row['contact_status'] ? 'selected' : '' ?>><?= e($status) ?></option><?php endforeach; ?></select>
                <a href="academic_edit.php?id=<?= e($row['id']) ?>">Düzenle</a>
                <button type="submit">Kaydet</button>
              </form>
            </td>
          </tr>
        <?php endforeach; ?>
        <?php if (!$rows): ?><tr><td colspan="7" class="empty">Kriterlere uygun kayıt bulunamadı.</td></tr><?php endif; ?>
        </tbody>
      </table>
    </div>

    <nav class="pagination sketch-pagination">
      <?php if ($page > 1): $q = array_merge($_GET, ['page' => $page - 1, 'per_page' => $perPage]); ?><a href="?<?= e(http_build_query($q)) ?>">Önceki</a><?php endif; ?>
      <?php for ($i = max(1, $page - 2); $i <= min($pages, $page + 2); $i++): $q = array_merge($_GET, ['page' => $i, 'per_page' => $perPage]); ?>
        <?= $i === $page ? '<span class="active">' . e($i) . '</span>' : '<a href="?' . e(http_build_query($q)) . '">' . e($i) . '</a>' ?>
      <?php endfor; ?>
      <?php if ($page < $pages): $q = array_merge($_GET, ['page' => $page + 1, 'per_page' => $perPage]); ?><a href="?<?= e(http_build_query($q)) ?>">Sonraki</a><?php endif; ?>
    </nav>
  </section>
</section>

<dialog class="export-dialog" data-export-dialog>
  <form method="get" action="api/export.php">
    <h2>Dışa Aktar</h2>
    <?php foreach ($_GET as $key => $value): if (is_scalar($value)): ?><input type="hidden" name="<?= e((string) $key) ?>" value="<?= e((string) $value) ?>"><?php endif; endforeach; ?>
    <label><span>Format</span><select name="format"><option value="xlsx">XLSX</option><option value="csv">CSV</option></select></label>
    <div class="export-columns">
      <?php foreach (['full_name'=>'Ad Soyad','academic_title'=>'Akademik Unvan','university'=>'Üniversite','faculty'=>'Fakülte','department'=>'Bölüm','sub_department'=>'Anabilim Dalı','email'=>'E-posta','phone'=>'Telefon','profile_url'=>'Profil Linki','contact_status'=>'İletişim Durumu','notes'=>'Not','updated_at'=>'Son Güncelleme'] as $key => $label): ?>
        <label class="check"><input type="checkbox" name="columns[]" value="<?= e($key) ?>" checked> <?= e($label) ?></label>
      <?php endforeach; ?>
    </div>
    <div class="actions">
      <button type="submit">İndir</button>
      <button class="ghost" type="button" data-close-export>Vazgeç</button>
    </div>
  </form>
</dialog>
<?php
$content = ob_get_clean();
$title = '';
require __DIR__ . '/app/Views/layout.php';
