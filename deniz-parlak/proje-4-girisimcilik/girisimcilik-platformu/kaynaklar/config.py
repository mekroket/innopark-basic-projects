"""
ORTAK API AYARI — StartupRadar Scraper'ları İçin
===================================================
Tüm scraper dosyaları (webrazzi.py, kosgeb.py, tubitak.py, vs.) artık
API adresini kendi içlerinde AYRI AYRI tutmuyor, hepsi bu dosyadan okuyor.

NEDEN ÖNEMLİ: Kişi 2 backend'i gerçek bir sunucuya (Render/Railway)
deploy ettiğinde, ya da Kişi 2'nin bilgisayarının IP'si her değiştiğinde,
7 farklı dosyayı tek tek açıp düzeltmek yerine SADECE BURAYI güncellersin.
"""

# ------------------------------------------------------------
# ŞU AN KULLANILAN ADRES (yerel ağ — Kişi 2'nin bilgisayarı)
# ------------------------------------------------------------
API_BASE = "https://girisimcilik-platformu.onrender.com"

# ------------------------------------------------------------
# Kişi 2 backend'i Render/Railway'e deploy ettiğinde, yukarıdaki
# satırı silip aşağıdaki gibi gerçek adresi buraya yazacaksın:
#
# API_BASE = "https://startupradar-backend.onrender.com"
# ------------------------------------------------------------

# Aşağıdaki satırlara dokunmana gerek yok — otomatik hesaplanıyor.
API_BASE = API_BASE.rstrip("/")
API_ADRESI = API_BASE + "/add-data/"
