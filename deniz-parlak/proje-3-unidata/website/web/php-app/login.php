<?php
declare(strict_types=1);
require_once __DIR__ . '/app/bootstrap.php';

if (user()) {
    redirect('index.php');
}

$error = '';
if (is_post()) {
    verify_csrf();
    $email = filter_var(post_string('email', 190), FILTER_VALIDATE_EMAIL);
    $password = (string) ($_POST['password'] ?? '');
    if (!$email || $password === '' || !login_attempt((string) $email, $password)) {
        $error = 'E-posta veya parola hatalı.';
    } else {
        redirect('index.php');
    }
}
?>
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Yönetici Girişi | <?= e(config('app_name')) ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link rel="stylesheet" href="public/style.css">
</head>
<body class="login-body">
  <main class="login-shell">
    <section class="login-card-split" aria-label="Yönetici girişi">
      <div class="login-info">
        <div class="login-logo-row">
          <span class="login-logo" aria-hidden="true">
            <svg viewBox="0 0 32 32" focusable="false">
              <path d="M16 3 3.5 9.8 16 16.6l12.5-6.8L16 3Z"/>
              <path d="M8 14.2v6.2c0 2.5 3.6 5.6 8 5.6s8-3.1 8-5.6v-6.2l-8 4.3-8-4.3Z"/>
            </svg>
          </span>
          <span>Akademik Veri Yönetim Sistemi</span>
        </div>

        <div class="login-copy">
          <h1>Akademik Veri Yönetim Sistemi</h1>
          <p>Üniversitelerin akademik personel verilerini merkezi olarak yönetmek için geliştirilmiş yönetim paneli.</p>
        </div>

        <div class="login-features" aria-label="Öne çıkan özellikler">
          <div><i class="bi bi-check2-circle"></i><span>Akademisyen Yönetimi</span></div>
          <div><i class="bi bi-check2-circle"></i><span>Veri Toplama Botu</span></div>
          <div><i class="bi bi-check2-circle"></i><span>Excel Aktarım</span></div>
        </div>
      </div>

      <div class="login-form-panel">
        <form class="login-form-card" method="post" autocomplete="on">
          <?= csrf_field() ?>
          <div class="login-form-head">
            <span class="login-form-icon" aria-hidden="true"><i class="bi bi-shield-lock"></i></span>
            <div>
              <h2>Giriş Yap</h2>
              <p>Yönetim paneline devam edin.</p>
            </div>
          </div>

          <?php if ($error !== ''): ?><div class="alert error"><?= e($error) ?></div><?php endif; ?>

          <label class="form-field">
            <span>E-posta</span>
            <input type="email" name="email" placeholder="ornek@universite.edu.tr" required autofocus>
          </label>

          <label class="form-field">
            <span>Parola</span>
            <input type="password" name="password" placeholder="Parolanızı girin" required>
          </label>

          <div class="login-options">
            <label class="remember-row">
              <input type="checkbox" name="remember" value="1">
              <span>Beni Hatırla</span>
            </label>
            <a class="forgot-link disabled" href="#" aria-disabled="true" tabindex="-1">Şifremi unuttum</a>
          </div>

          <button class="login-submit" type="submit">Giriş Yap</button>
        </form>
      </div>
    </section>
  </main>
</body>
</html>
