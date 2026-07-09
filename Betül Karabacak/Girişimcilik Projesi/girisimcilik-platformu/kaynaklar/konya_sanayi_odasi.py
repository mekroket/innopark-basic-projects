import sys
import os
sys.path.append(os.path.dirname(__file__))
from config import API_ADRESI

import requests
from bs4 import BeautifulSoup


def calistir():
    url = "https://www.kso.org.tr/tr-TR/Media/Announcement"
    ana_adres = "https://www.kso.org.tr"

    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(response.text, "lxml")

    # Site yenilendi: duyurular artık doğrudan <a class="l-news__small-item">
    # etiketlerinde, araya <strong class="l-news__small-category"> ile ay
    # başlıkları serpiştirilmiş durumda.
    duyurular = soup.find_all("a", class_="l-news__small-item")
    gonderilen = 0

    for duyuru in duyurular:
        baslik = duyuru.get_text(strip=True)
        link = ana_adres + duyuru.get("href", "").strip()

        # Duyurunun kendi tarihi yok; listede kendisinden önce gelen
        # ay başlığını (ör. "Haziran") tarih olarak kullanıyoruz.
        ay_basligi = duyuru.find_previous("strong", class_="l-news__small-category")
        tarih = ay_basligi.get_text(strip=True) if ay_basligi else ""

        if not baslik or not link:
            continue

        veri = {
            "Title": baslik,
            "Link": link,
            "Category": "kso-duyuru",
            "Source": "konya-sanayi-odasi",
            "DataDate": tarih
        }

        try:
            cevap = requests.post(API_ADRESI, json=veri)
            if cevap.status_code == 200:
                gonderilen += 1
            else:
                print(f"Gönderilemedi ({cevap.status_code}): {baslik}")
        except requests.exceptions.ConnectionError:
            print("API'ye bağlanılamadı — Kişi 2'nin uvicorn'u çalışıyor mu kontrol et.")
            return

    print(f"[konya-sanayi-odasi] {gonderilen} kayıt API'ye gönderildi.")


if __name__ == "__main__":
    calistir()
