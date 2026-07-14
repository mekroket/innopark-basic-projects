# Akademik Veri Yönetim Sistemi

PHP 8+, Apache ve MySQL üzerinde çalışan kurumsal akademik veri yönetim paneli.

## Kurulum

1. MySQL üzerinde `akademik_veri` adlı veritabanı oluşturun.
2. `database/schema.sql` dosyasını içe aktarın.
3. `app/config.example.php` dosyasını `app/config.php` olarak kopyalayın.
4. `app/config.php` içindeki veritabanı bilgilerini düzenleyin.
5. İlk kurulum hesabı `admin@example.com` / `password` bilgisidir. Canlı kullanımdan önce yeni parola hash'i üretip `admins.password_hash` alanını güncelleyin.
6. Panelde `Bot Ayarları` sayfasından API anahtarını değiştirin.

## Ana Özellikler

- Yönetici girişi, oturum yönetimi, çıkış ve CSRF koruması
- Rol hazır yönetici mimarisi
- Kalıcı MySQL veri saklama
- Akademisyen arama, filtreleme, sayfalama, hızlı düzenleme
- İletişim durumu, not, arşiv, geri yükleme ve kalıcı silme
- İletişim geçmişi
- CSV/XLSX içe aktarma: dosya seçme, ön izleme, doğrulama, aktarma
- CSV/XLSX dışa aktarma: seçilebilir kolonlar
- Bot durum ekranı
- Log arama, filtreleme ve sayfalama
- İstatistik grafikleri
- API anahtarı ve hız limiti

## API

Tüm API isteklerinde `X-API-KEY` başlığı veya `Authorization: Bearer ...` kullanılmalıdır.

- `POST /api/import.php`
- `GET /api/export.php`
- `GET /api/health.php`

## Desteklenen Import Alanları

Türkçe başlıklar ve Chrome Extension uyumlu camelCase alanlar desteklenir:

- `fullName` / `Ad Soyad`
- `academicTitle` / `Akademik Unvan`
- `university` / `Üniversite`
- `faculty` / `Fakülte`
- `department` / `Bölüm`
- `subDepartment` / `Anabilim Dalı`
- `email` / `E-posta`
- `phone` / `Telefon`
- `profileUrl` / `Profil Linki`
- `sourceUrl` / `Kaynak Linki`
- `contactStatus` / `İletişim Durumu`
- `notes` / `Not`

## Sunucu Notları

- `pdo_mysql`, `json`, `session`, `zip` ve `simplexml` eklentileri önerilir.
- XLSX import/export için `ZipArchive` gerekir.
- Apache `AllowOverride` açık olmalıdır; `app` ve `database` klasörleri `.htaccess` ile web erişimine kapatılmıştır.
