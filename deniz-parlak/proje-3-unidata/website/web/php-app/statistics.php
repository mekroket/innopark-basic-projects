<?php
declare(strict_types=1);
require_once __DIR__ . '/app/bootstrap.php';
require_auth();

$byUniversity = fetch_all('SELECT u.name label, COUNT(*) total FROM academics a LEFT JOIN universities u ON u.id = a.university_id WHERE a.archived = 0 GROUP BY u.name ORDER BY total DESC LIMIT 12');
$byFaculty = fetch_all('SELECT COALESCE(faculty, "Belirtilmemiş") label, COUNT(*) total FROM academics WHERE archived = 0 GROUP BY faculty ORDER BY total DESC LIMIT 12');
$byDepartment = fetch_all('SELECT COALESCE(department, "Belirtilmemiş") label, COUNT(*) total FROM academics WHERE archived = 0 GROUP BY department ORDER BY total DESC LIMIT 12');
$importsByDay = fetch_all('SELECT DATE(created_at) label, SUM(success_count) total FROM imports GROUP BY DATE(created_at) ORDER BY label DESC LIMIT 14');
$statusDistribution = fetch_all('SELECT contact_status label, COUNT(*) total FROM academics WHERE archived = 0 GROUP BY contact_status ORDER BY total DESC');

function render_chart(string $title, array $rows): void
{
    $max = max(array_map(fn($row): int => (int) $row['total'], $rows) ?: [1]);
    echo '<div class="card"><h2 class="card-title">' . e($title) . '</h2><div class="chart-list">';
    foreach ($rows as $row) {
        $percent = $max > 0 ? ((int) $row['total'] / $max) * 100 : 0;
        echo '<div class="chart-row"><span>' . e($row['label'] ?: 'Belirtilmemiş') . '</span><div class="chart-bar"><b style="width:' . e((string) $percent) . '%"></b></div><strong>' . e($row['total']) . '</strong></div>';
    }
    if (!$rows) {
        echo '<p class="empty">Veri yok.</p>';
    }
    echo '</div></div>';
}

ob_start();
?>
<section class="page-header">
  <h1>İstatistikler</h1>
  <p>Akademisyen dağılımları, günlük aktarımlar ve iletişim durumları.</p>
</section>
<section class="grid charts-grid">
  <?php render_chart('Üniversiteye Göre Akademisyen', $byUniversity); ?>
  <?php render_chart('Fakülteye Göre Akademisyen', $byFaculty); ?>
  <?php render_chart('Bölüme Göre Akademisyen', $byDepartment); ?>
  <?php render_chart('Güne Göre Aktarımlar', array_reverse($importsByDay)); ?>
  <?php render_chart('Durum Dağılımı', $statusDistribution); ?>
</section>
<?php
$content = ob_get_clean();
$title = 'İstatistikler';
require __DIR__ . '/app/Views/layout.php';
