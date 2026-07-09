# 🛡️ AEGIS SWARM: Otonom Derin Uzay Bağışıklık Sistemi

> **"Dünya'ya Haber Verin, Kriz Çözüldü."** 
> *Derin Teknoloji Girişimi*

AEGIS SWARM, uzay istasyonları, derin uzay kolonileri ve yüksek güvenlikli tesisler için geliştirilmiş **otonom bir bağışıklık sistemidir**. İletişim gecikmelerinin (örneğin Mars ile Dünya arasındaki 40 dakikalık sinyal süresi) felakete yol açabileceği durumlarda, sistem insan müdahalesini veya Dünya'dan gelecek onayı beklemez. Sürü Zekası (Swarm AI) ile yönetilen simüle edilmiş nanobot ağları sayesinde, krizleri (basınç kaybı, radyasyon sızıntısı, siber saldırı) saniyeler içinde tespit eder, yalıtır ve otonom olarak onarır.

---

## 🌟 Temel Özellikler

* **🚀 Otonom Kriz Yönetimi:** Tesis sensörleri anomali tespit ettiği an sistem merkeze sormadan inisiyatif alır ve saniyeler içinde müdahale sürecini (nanobot sevkiyatı) başlatır.
* **📡 Gerçek Zamanlı Dashboard (Canlı Telemetri):** Tesisin farklı bölgelerinin (Ana Yaşam Kapsülü, Antimadde Reaktörü vb.) sağlık durumlarını anlık grafiklerle simüle eden siber-güvenlik arayüzü.
* **🤖 Sürü Zekası Mantığı (Swarm Logic):** Karar alma süreci tek bir merkeze bağlı değildir. Sistem, probleme özgü nanobot tiplerini (Ağır Sanayi, Siber Savunma, Kurşun-Maddeli vb.) koordine eder.
* **📂 Çevrimdışı Kriz Veritabanı:** Kriz anlarında yaşanan her gelişme, saniye saniye şifreli ve uçtan uca kapalı bir sistem olan SQLite veritabanına loglanır.
* **🚨 Görsel ve İşitsel Uyarı Sistemi:** Kriz anında arka planda kesintisiz çalışan uyarı alarmları ve siberpunk esintili, duruma göre tepki veren (neon yanıp sönen) akıllı arayüz bileşenleri.

---

## 🛠️ Teknoloji Mimarisi

* **Frontend:** Python [Streamlit](https://streamlit.io/) (Gelişmiş CSS ve HTML/JS enjeksiyonları ile özelleştirilmiş Siberpunk Arayüz)
* **Backend:** Python (State Machine mimarisi ve sürekli çalışan otonom döngü)
* **Veritabanı:** SQLite & Pandas Dataframes (Yerel ve güvenilir loglama)
* **Görsel/İşitsel Entegrasyon:** Base64 ve JavaScript ile tarayıcı seviyesinde asenkron ses kontrolü

---

## ⚙️ Kurulum ve Çalıştırma

Projeyi kendi bilgisayarınızda (lokal olarak) test etmek için aşağıdaki adımları izleyin:

### 1. Gereksinimleri Yükleyin
Sistemin çalışması için Python yüklü olmalıdır. Terminal veya Komut İstemini (CMD) açarak gerekli kütüphaneleri kurun:
`pip install streamlit pandas`

### 2. Dosya Yapısını Hazırlayın
Projenin ana klasöründe şu dosyaların aynı konumda olduğundan emin olun:
* `app.py` (Ana uygulama kodunuz)
* `logo.jpg` (veya desteklenen bir logo formatı)
* `uyari_sesi.mp3` (Kriz anında çalacak alarm sesi)

### 3. Uygulamayı Başlatın
Aynı klasörde terminali açın ve aşağıdaki komutu çalıştırın:
`streamlit run app.py`

Tarayıcınız otomatik olarak açılacak ve AEGIS SWARM Canlı Telemetri merkezi karşınıza gelecektir.

---

## 🖥️ Arayüz Ekranları (Modüller)

1. **Startup Kimliği:** Projenin vizyonunu, problem tanımını ve teknolojik çözümünü anlatan karşılama ekranı.
2. **Canlı Telemetri:** Sensör ağlarının canlı aktığı, olası bir kriz anında sistemin nasıl otonom müdahale ettiğini (geri sayımlar, anlık grafikler ve alarmlar ile) gösteren kontrol merkezi. Sol menüdeki "Test Sinyali Gönder" butonu ile manuel kriz simülasyonu başlatılabilir.
3. **Kriz Logları:** Başarıyla çözülen geçmiş krizlerin, türleri ve zaman damgaları ile birlikte saklandığı denetlenebilir veritabanı okuma paneli.

---

*Geleceğin uzay kolonileri, kendi bağışıklık sistemine sahip olacak. Bizimle güvendesiniz.*