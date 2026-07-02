<?php
declare(strict_types=1);
require_once __DIR__ . '/app/bootstrap.php';
require_auth();

$id = int_param('id');
$row = fetch_one('SELECT * FROM academics WHERE id = ?', [$id]);
if (!$row) {
    http_response_code(404);
    exit('Kayıt bulunamadı.');
}

if (is_post()) {
    verify_csrf();
    try {
        $newStatus = valid_contact_status(post_string('contact_status', 80));
        execute_query(
            'UPDATE academics SET university_id=?, full_name=?, normalized_name=?, academic_title=?, faculty=?, department=?, sub_department=?, email=?, phone=?, profile_url=?, source_url=?, contact_status=?, notes=?, updated_at=NOW() WHERE id=?',
            [
                (int) $_POST['university_id'],
                post_string('full_name', 190),
                normalize_name(post_string('full_name', 190)),
                nullable_string(post_string('academic_title', 120)),
                nullable_string(post_string('faculty', 190)),
                nullable_string(post_string('department', 190)),
                nullable_string(post_string('sub_department', 190)),
                nullable_string(post_string('email', 190)),
                nullable_string(post_string('phone', 80)),
                nullable_string(post_string('profile_url', 500)),
                nullable_string(post_string('source_url', 500)),
                $newStatus,
                nullable_string(post_string('notes', 5000)),
                $id,
            ]
        );
        if ((string) $row['contact_status'] !== $newStatus) {
            record_contact_history($id, (string) $row['contact_status'], $newStatus, post_string('notes', 5000));
        }
        flash_set('success', 'Akademisyen kaydı güncellendi.');
        redirect('academics.php');
    } catch (Throwable $e) {
        flash_set('error', 'Kayıt güncellenemedi: ' . $e->getMessage());
    }
    $row = fetch_one('SELECT * FROM academics WHERE id = ?', [$id]);
}

$universities = fetch_all('SELECT id, name FROM universities ORDER BY name');
ob_start();
?>
<section class="page-header">
  <h1>Akademisyen Düzenle</h1>
  <p><?= e($row['full_name']) ?></p>
</section>
<form class="card form-grid" method="post">
  <?= csrf_field() ?>
  <label><span>Ad Soyad</span><input name="full_name" value="<?= e($row['full_name']) ?>" required></label>
  <label><span>Üniversite</span><select name="university_id" required><?php foreach ($universities as $u): ?><option value="<?= e($u['id']) ?>" <?= (int) $u['id'] === (int) $row['university_id'] ? 'selected' : '' ?>><?= e($u['name']) ?></option><?php endforeach; ?></select></label>
  <label><span>Akademik Unvan</span><input name="academic_title" value="<?= e($row['academic_title']) ?>"></label>
  <label><span>Fakülte</span><input name="faculty" value="<?= e($row['faculty']) ?>"></label>
  <label><span>Bölüm</span><input name="department" value="<?= e($row['department']) ?>"></label>
  <label><span>Anabilim Dalı</span><input name="sub_department" value="<?= e($row['sub_department']) ?>"></label>
  <label><span>E-posta</span><input type="email" name="email" value="<?= e($row['email']) ?>"></label>
  <label><span>Telefon</span><input name="phone" value="<?= e($row['phone']) ?>"></label>
  <label><span>Profil Linki</span><input type="url" name="profile_url" value="<?= e($row['profile_url']) ?>"></label>
  <label><span>Kaynak Linki</span><input type="url" name="source_url" value="<?= e($row['source_url']) ?>"></label>
  <label><span>İletişim Durumu</span><select name="contact_status"><?php foreach (contact_statuses() as $status): ?><option <?= $status === $row['contact_status'] ? 'selected' : '' ?>><?= e($status) ?></option><?php endforeach; ?></select></label>
  <label><span>Not</span><textarea name="notes"><?= e($row['notes']) ?></textarea></label>
  <div class="actions"><button type="submit">Kaydet</button><a class="button ghost" href="academics.php">Vazgeç</a></div>
</form>
<?php
$content = ob_get_clean();
$title = 'Akademisyen Düzenle';
require __DIR__ . '/app/Views/layout.php';
