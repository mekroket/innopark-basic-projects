<?php
declare(strict_types=1);
$active = current_path();
$currentUser = user();
$pageTitle = $title ?? 'Panel';
$avatarLetter = function_exists('mb_substr')
    ? mb_substr((string) ($currentUser['name'] ?? 'Y'), 0, 1, 'UTF-8')
    : substr((string) ($currentUser['name'] ?? 'Y'), 0, 1);
?>
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= e($pageTitle . ' | ' . config('app_name')) ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link rel="stylesheet" href="public/style.css">
</head>
<body>
  <div class="app-shell">
    <aside class="app-sidebar" data-main-nav>
      <div class="sidebar-head">
        <a class="brand" href="index.php">
          <span class="brand-mark"><i class="bi bi-mortarboard"></i></span>
          <span>
            <strong>Akademik Veri</strong>
            <small>Yönetim Sistemi</small>
          </span>
        </a>
        <button class="sidebar-collapse" type="button" aria-label="Menüyü daralt" data-sidebar-collapse>
          <i class="bi bi-layout-sidebar-inset"></i>
        </button>
      </div>
      <nav class="main-nav" aria-label="Ana menü">
        <a class="<?= $active === 'index.php' ? 'active' : '' ?>" href="index.php"><i class="bi bi-grid-1x2"></i><span>Gösterge Paneli</span></a>
        <a class="<?= $active === 'academics.php' ? 'active' : '' ?>" href="academics.php"><i class="bi bi-people"></i><span>Akademisyenler</span></a>
        <a class="<?= $active === 'universities.php' ? 'active' : '' ?>" href="universities.php"><i class="bi bi-building"></i><span>Üniversiteler</span></a>
        <a class="<?= $active === 'statistics.php' ? 'active' : '' ?>" href="statistics.php"><i class="bi bi-bar-chart"></i><span>İstatistikler</span></a>
        <a class="<?= $active === 'logs.php' ? 'active' : '' ?>" href="logs.php"><i class="bi bi-journal-text"></i><span>Loglar</span></a>
        <a class="<?= $active === 'import.php' ? 'active' : '' ?>" href="import.php"><i class="bi bi-file-earmark-arrow-up"></i><span>Excel Aktar</span></a>
        <a class="<?= $active === 'settings.php' ? 'active' : '' ?>" href="settings.php"><i class="bi bi-gear"></i><span>Ayarlar</span></a>
        <a href="logout.php"><i class="bi bi-box-arrow-right"></i><span>Çıkış</span></a>
      </nav>
    </aside>

    <div class="app-main">
      <header class="topbar">
        <button class="menu-button" type="button" aria-label="Menüyü aç" data-menu-button>
          <i class="bi bi-list"></i>
        </button>
        <div class="topbar-title">
          <span>Akademik Veri Yönetim Sistemi</span>
          <strong><?= e($pageTitle) ?></strong>
        </div>
        <div class="user-area">
          <span class="user-avatar" aria-hidden="true"><?= e($avatarLetter) ?></span>
          <span class="user-name"><?= e($currentUser['name'] ?? '') ?></span>
          <a class="button ghost small topbar-logout" href="logout.php"><i class="bi bi-box-arrow-right"></i><span>Çıkış</span></a>
        </div>
      </header>

      <main class="page">
        <?php foreach (flash_get() as $flash): ?>
          <div class="alert <?= e($flash['type']) ?>"><?= e($flash['message']) ?></div>
        <?php endforeach; ?>
        <?= $content ?>
      </main>
    </div>
  </div>
  <script src="public/app.js"></script>
</body>
</html>
