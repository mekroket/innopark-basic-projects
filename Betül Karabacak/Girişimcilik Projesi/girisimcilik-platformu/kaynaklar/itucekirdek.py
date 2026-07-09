import sys
import os
sys.path.append(os.path.dirname(__file__))
from config import API_ADRESI

import requests
from bs4 import BeautifulSoup


def calistir():
    url = "https://blog.itucekirdek.com/"

    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(response.text, "lxml")

    yazilar = soup.find_all("div", class_="post-box")
    gonderilen = 0

    for yazi in yazilar:
        baslik_kutusu = yazi.find("h2", class_="post-title")
        link_etiketi = baslik_kutusu.find("a") if baslik_kutusu else None

        if not link_etiketi:
            continue

        baslik = link_etiketi.text.strip()
        link = link_etiketi.get("href", "").strip()

        tarih_etiketi = yazi.find("time")
        tarih = tarih_etiketi.get("datetime", "") if tarih_etiketi else ""

        if not baslik or not link:
            continue

        veri = {
            "Title": baslik,
            "Link": link,
            "Category": "hizlandirma-kulucka",
            "Source": "itu-cekirdek",
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

    print(f"[itu-cekirdek] {gonderilen} kayıt API'ye gönderildi.")


if __name__ == "__main__":
    calistir()
