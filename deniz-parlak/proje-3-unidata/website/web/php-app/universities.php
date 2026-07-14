<?php
declare(strict_types=1);
require_once __DIR__ . '/app/bootstrap.php';
require_auth();

if (is_post()) {
    verify_csrf();
    $action = post_string('action', 20);
    $id = (int) ($_POST['id'] ?? 0);
    try {
        if ($action === 'save') {
            $name = post_string('name', 190);
            if ($name === '') {
                throw new RuntimeException('Üniversite adı zorunludur.');
            }
            $params = [$name, post_string('city', 120), post_string('website', 255)];
            if ($id > 0) {
                $params[] = $id;
                execute_query('UPDATE universities SET name=?, city=?, website=? WHERE id=?', $params);
                flash_set('success', 'Üniversite güncellendi.');
            } else {
                execute_query('INSERT INTO universities (name, city, website) VALUES (?, ?, ?)', $params);
                flash_set('success', 'Üniversite eklendi.');
            }
        } elseif ($action === 'toggle' && $id > 0) {
            execute_query('UPDATE universities SET is_active = 1 - is_active WHERE id = ?', [$id]);
            flash_set('success', 'Üniversite durumu güncellendi.');
        } elseif ($action === 'delete' && $id > 0) {
            execute_query('DELETE FROM universities WHERE id = ?', [$id]);
            flash_set('success', 'Üniversite silindi.');
        }
        log_activity('system', 'Üniversite işlemi tamamlandı.', ['action' => $action, 'id' => $id]);
    } catch (Throwable $e) {
        flash_set('error', 'İşlem tamamlanamadı: ' . $e->getMessage());
    }
    redirect('universities.php');
}

$edit = null;
if (isset($_GET['edit'])) {
    $edit = fetch_one('SELECT * FROM universities WHERE id = ?', [(int) $_GET['edit']]);
}
$rows = fetch_all('SELECT u.*, (SELECT COUNT(*) FROM academics a WHERE a.university_id = u.id) academic_count FROM universities u ORDER BY u.name');

ob_start();
?>
<section class="page-header">
  <h1>Üniversiteler</h1>
  <p>Üniversite kayıtlarını ekleyin, düzenleyin, pasifleştirin veya silin.</p>
</section>
<section class="grid two-col">
  <form class="card" method="post">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="save">
    <input type="hidden" name="id" value="<?= e($edit['id'] ?? 0) ?>">
    <h2 class="card-title"><?= $edit ? 'Üniversite Düzenle' : 'Üniversite Ekle' ?></h2>
    <label><span>Üniversite Adı</span><input name="name" value="<?= e($edit['name'] ?? '') ?>" required></label>
    <label><span>Şehir</span><input name="city" value="<?= e($edit['city'] ?? '') ?>"></label>
    <label><span>Web Sitesi</span><input type="url" name="website" value="<?= e($edit['website'] ?? '') ?>"></label>
    <div class="actions">
      <button type="submit">Kaydet</button>
      <?php if ($edit): ?><a class="button ghost" href="universities.php">Vazgeç</a><?php endif; ?>
    </div>
  </form>
  <section class="card">
    <h2 class="card-title">Üniversite Listesi</h2>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Ad</th><th>Şehir</th><th>Web Sitesi</th><th>Akademisyen</th><th>Durum</th><th>İşlemler</th></tr></thead>
        <tbody>
        <?php foreach ($rows as $row): ?>
          <tr>
            <td><?= e($row['name']) ?></td>
            <td><?= e($row['city']) ?></td>
            <td><?php if ($row['website']): ?><a href="<?= e($row['website']) ?>" target="_blank" rel="noopener">Aç</a><?php endif; ?></td>
            <td><?= e($row['academic_count']) ?></td>
            <td><span class="badge"><?= $row['is_active'] ? 'Aktif' : 'Pasif' ?></span></td>
            <td class="actions">
              <a class="button ghost small" href="universities.php?edit=<?= e($row['id']) ?>">Düzenle</a>
              <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="<?= e($row['id']) ?>"><button class="ghost small" type="submit"><?= $row['is_active'] ? 'Pasifleştir' : 'Aktifleştir' ?></button></form>
              <form method="post" data-confirm="Bu üniversite silinsin mi?"><?= csrf_field() ?><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= e($row['id']) ?>"><button class="danger small" type="submit">Sil</button></form>
            </td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </section>
</section>
<?php
$content = ob_get_clean();
$title = 'Üniversiteler';
require __DIR__ . '/app/Views/layout.php';
