import sys
import os
sys.path.append(os.path.dirname(__file__))
from config import API_ADRESI

import requests
from bs4 import BeautifulSoup


def calistir():
    url = "https://webrazzi.com/kategori/girisimler/"
    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(response.text, "lxml")

    kartlar = soup.find_all("div", class_="col-12 col-md-7")
    gonderilen = 0

    for kart in kartlar:
        kategori_kutusu = kart.find("div", class_="post-category")
        kategori_etiketi = kategori_kutusu.find("a") if kategori_kutusu else None
        kategori = kategori_etiketi.text.strip() if kategori_etiketi else ""

        baslik_kutusu = kart.find("div", class_="post-title")
        link_etiketi = baslik_kutusu.find("a") if baslik_kutusu else None

        if not link_etiketi:
            continue

        baslik = link_etiketi.get("title", "").strip()
        link = link_etiketi.get("href", "").strip()

        if not baslik or not link:
            continue

        veri = {
            "Title": baslik,
            "Link": link,
            "Category": kategori,
            "Source": "webrazzi",
            "DataDate": ""
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

    print(f"[webrazzi] {gonderilen} kayıt API'ye gönderildi.")


if __name__ == "__main__":
    calistir()
