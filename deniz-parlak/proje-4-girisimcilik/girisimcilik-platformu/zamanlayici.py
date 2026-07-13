"""
ZAMANLAYICI — Her gün otomatik olarak tüm kaynakları tarar.

Kullanım:
    python zamanlayici.py

Bu dosyayı çalıştırıp terminali AÇIK bırakman gerekiyor (arka planda
sürekli çalışması lazım). Kapatırsan otomatik tarama durur.

İleride bunu bir sunucuya (Render/Railway) taşıdığınızda, bu dosya
yerine "GitHub Actions" veya sunucunun kendi zamanlama servisini
kullanmak daha sağlıklı olur — ama şimdilik bu, günlük otomasyon
için yeterli ve çalışan bir çözüm.
"""

import schedule
import time
from ana_calistirici import tum_kaynaklari_tara


# Her gün sabah 06:00'da tüm kaynakları tara
schedule.every().day.at("06:00").do(tum_kaynaklari_tara)

print("Zamanlayıcı başladı.")
print("Her gün saat 06:00'da tüm kaynaklar otomatik olarak taranacak.")
print("Durdurmak için Ctrl+C'ye bas.")
print()

# Zamanlayıcıyı kurar kurmaz, bekletmeden bir kere de hemen çalıştıralım
# ki kurulumun doğru çalıştığını hemen görebilesin.
print("İlk tarama şimdi başlıyor (test amaçlı)...\n")
tum_kaynaklari_tara()

while True:
    schedule.run_pending()
    time.sleep(60)  # her 60 saniyede bir "zamanı geldi mi" diye kontrol eder
