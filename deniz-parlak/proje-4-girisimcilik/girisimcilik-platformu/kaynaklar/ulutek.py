import sys
import os
sys.path.append(os.path.dirname(__file__))
from config import API_ADRESI

import requests
from bs4 import BeautifulSoup


def calistir():
    url = "https://ulutek.com.tr/haberler"
    ana_adres = "https://ulutek.com.tr"

    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(response.text, "lxml")

    kartlar = soup.find_all("div", class_="by-flipbox-1")
    gonderilen = 0

    for kart in kartlar:
        baslik_etiketi = kart.find("h3", class_="by-title")
        link_etiketi = kart.find("a", class_="by-btn")

        if not baslik_etiketi or not link_etiketi:
            continue

        baslik = baslik_etiketi.text.strip()
        link = ana_adres + link_etiketi.get("href", "").strip()

        tarih_kutusu = kart.find("div", class_="by-meta-row")
        tarih_etiketi = tarih_kutusu.find("span") if tarih_kutusu else None
        tarih = tarih_etiketi.text.strip() if tarih_etiketi else ""

        if not baslik or not link:
            continue

        veri = {
            "Title": baslik,
            "Link": link,
            "Category": "ulutek-haber",
            "Source": "ulutek",
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

    print(f"[ulutek] {gonderilen} kayıt API'ye gönderildi.")


if __name__ == "__main__":
    calistir()