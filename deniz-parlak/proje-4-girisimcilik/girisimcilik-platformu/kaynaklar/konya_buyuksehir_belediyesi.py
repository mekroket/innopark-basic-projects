import sys
import os
sys.path.append(os.path.dirname(__file__))
from config import API_ADRESI

import requests
from bs4 import BeautifulSoup


def calistir():
    url = "https://www.konya.bel.tr/haber"

    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(response.text, "lxml")

    haberler = soup.find_all("article", class_="news")
    gonderilen = 0

    for haber in haberler:
        link_etiketi = haber.find("a", class_="news-inner")
        if not link_etiketi:
            continue

        img_etiketi = link_etiketi.find("img")
        tarih_kutusu = link_etiketi.find("div", class_="news-date")

        # Başlık, "news-title" div'i HTML yorum satırı içinde olduğu için
        # (görünmüyor), img'nin alt özelliğinden alıyoruz — aynı metni taşıyor.
        baslik = img_etiketi.get("alt", "").strip() if img_etiketi else ""
        link = link_etiketi.get("href", "").strip()  # zaten tam adres
        tarih = tarih_kutusu.get_text(strip=True) if tarih_kutusu else ""

        if not baslik or not link:
            continue

        veri = {
            "Title": baslik,
            "Link": link,
            "Category": "konya-buyuksehir-haber",
            "Source": "konya-buyuksehir-belediyesi",
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

    print(f"[konya-buyuksehir-belediyesi] {gonderilen} kayıt API'ye gönderildi.")


if __name__ == "__main__":
    calistir()