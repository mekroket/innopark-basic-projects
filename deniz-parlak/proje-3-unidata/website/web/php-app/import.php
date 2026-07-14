<?php
declare(strict_types=1);
require_once __DIR__ . '/app/bootstrap.php';
require_auth();

$report = $_SESSION['import_preview'] ?? null;

if (is_post()) {
    verify_csrf();
    $action = post_string('action', 20);
    try {
        if ($action === 'preview') {
            if (!isset($_FILES['excel_file']) || $_FILES['excel_file']['error'] !== UPLOAD_ERR_OK) {
                throw new RuntimeException('Dosya yüklenemedi.');
            }
            $rows = read_spreadsheet_file((string) $_FILES['excel_file']['tmp_name'], (string) $_FILES['excel_file']['name']);
            $validation = validate_import_rows($rows);
            $_SESSION['import_preview'] = [
                'file_name' => (string) $_FILES['excel_file']['name'],
                'total' => count($rows),
                'valid' => $validation['valid'],
                'invalid' => $validation['invalid'],
            ];
            log_activity('validation', 'Excel içe aktarma ön izlemesi oluşturuldu.', ['total' => count($rows), 'valid' => count($validation['valid']), 'invalid' => count($validation['invalid'])]);
            flash_set('success', 'Dosya doğrulandı. Geçerli kayıtları içe aktarabilirsiniz.');
        } elseif ($action === 'import') {
            $preview = $_SESSION['import_preview'] ?? null;
            if (!$preview || empty($preview['valid']) || !is_array($preview['valid'])) {
                throw new RuntimeException('İçe aktarılacak geçerli kayıt bulunamadı.');
            }
            $imported = 0;
            $updated = 0;
            foreach ($preview['valid'] as $item) {
                $universityId = ensure_university((string) $item['university']);
                $academicData = [
                    'university_id' => $universityId,
                    'full_name' => $item['full_name'] ?? '',
                ];
                foreach (['academic_title', 'faculty', 'department', 'sub_department', 'email', 'phone', 'profile_url', 'source_url', 'contact_status', 'notes'] as $key) {
                    if (array_key_exists($key, $item)) {
                        $academicData[$key] = $item[$key];
                    }
                }
                $created = upsert_academic($academicData);
                $created ? $imported++ : $updated++;
            }
            execute_query(
                'INSERT INTO imports (source, file_name, total_count, success_count, skipped_count, error_count, validation_report) VALUES (?, ?, ?, ?, ?, ?, ?)',
                ['web', $preview['file_name'] ?? null, (int) $preview['total'], $imported + $updated, $updated, count($preview['invalid'] ?? []), json_encode($preview['invalid'] ?? [], JSON_UNESCAPED_UNICODE)]
            );
            log_activity('import', 'Excel içe aktarma tamamlandı.', ['imported' => $imported, 'updated' => $updated, 'invalid' => count($preview['invalid'] ?? [])]);
            unset($_SESSION['import_preview']);
            flash_set('success', 'İçe aktarma tamamlandı. Yeni: ' . $imported . ', güncellenen/atlanan: ' . $updated . '.');
        } elseif ($action === 'clear') {
            unset($_SESSION['import_preview']);
        }
    } catch (Throwable $e) {
        log_activity('error', 'Excel içe aktarma hatası.', ['error' => $e->getMessage()], 'error');
        flash_set('error', $e->getMessage());
    }
    redirect('import.php');
}

$report = $_SESSION['import_preview'] ?? null;
ob_start();
?>
<section class="page-header">
  <h1>Excel İçe Aktar</h1>
  <p>CSV veya XLSX dosyası seçin, ön izleyin, doğrulayın ve geçerli kayıtları kalıcı olarak MySQL veritabanına aktarın.</p>
</section>

<section class="grid two-col">
  <form class="card" method="post" enctype="multipart/form-data">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="preview">
    <h2 class="card-title">Dosya Seç</h2>
    <label><span>Excel / CSV Dosyası</span><input type="file" name="excel_file" accept=".xlsx,.csv" required></label>
    <button type="submit">Ön İzle ve Doğrula</button>
  </form>

  <div class="card">
    <h2 class="card-title">Beklenen Kolonlar</h2>
    <p class="muted">Ad Soyad ve Üniversite zorunludur. Diğer alanlar boş bırakılabilir.</p>
    <div class="export-columns">
      <?php foreach (spreadsheet_columns() as $label): ?><span class="badge"><?= e($label) ?></span><?php endforeach; ?>
    </div>
  </div>
</section>

<?php if ($report): ?>
<section class="card">
  <div class="toolbar">
    <div>
      <h2 class="card-title">Doğrulama Raporu</h2>
      <p class="muted">Dosya: <?= e($report['file_name']) ?> | Toplam: <?= e($report['total']) ?> | Geçerli: <?= e(count($report['valid'])) ?> | Reddedilen: <?= e(count($report['invalid'])) ?></p>
    </div>
    <div class="actions">
      <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="import"><button type="submit" <?= count($report['valid']) === 0 ? 'disabled' : '' ?>>Geçerli Kayıtları Aktar</button></form>
      <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="clear"><button class="ghost" type="submit">Temizle</button></form>
    </div>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Satır</th><th>Durum</th><th>Ad Soyad</th><th>Üniversite</th><th>E-posta</th><th>Hata</th></tr></thead>
      <tbody>
        <?php foreach (array_slice($report['valid'], 0, 20) as $i => $row): ?>
          <tr><td><?= e($i + 2) ?></td><td><span class="status-badge status-green">Geçerli</span></td><td><?= e($row['full_name'] ?? '') ?></td><td><?= e($row['university'] ?? '') ?></td><td><?= e($row['email'] ?? '') ?></td><td></td></tr>
        <?php endforeach; ?>
        <?php foreach ($report['invalid'] as $item): ?>
          <tr><td><?= e($item['row']) ?></td><td><span class="status-badge status-red">Reddedildi</span></td><td><?= e($item['data']['full_name'] ?? '') ?></td><td><?= e($item['data']['university'] ?? '') ?></td><td><?= e($item['data']['email'] ?? '') ?></td><td><?= e(implode(' ', $item['errors'])) ?></td></tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</section>
<?php endif; ?>
<?php
$content = ob_get_clean();
$title = 'Excel İçe Aktar';
require __DIR__ . '/app/Views/layout.php';
