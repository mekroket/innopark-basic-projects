import sys
import os
sys.path.append(os.path.dirname(__file__))
from config import API_ADRESI

import requests
from bs4 import BeautifulSoup


def calistir():
    url = "https://www.mevka.org.tr/tr/haberler"

    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(response.text, "lxml")

    haberler = soup.find_all("div", class_="card-body")
    gonderilen = 0

    for haber in haberler:
        baslik_kutusu = haber.find("h5", class_="card-title")
        link_etiketi = haber.find("a")

        if not baslik_kutusu or not link_etiketi:
            continue

        baslik = baslik_kutusu.text.strip()
        link = link_etiketi.get("href", "").strip()

        tarih_kutusu = haber.find("small", class_="date-style")
        tarih = tarih_kutusu.get_text(strip=True) if tarih_kutusu else ""

        if not baslik or not link:
            continue

        veri = {
            "Title": baslik,
            "Link": link,
            "Category": "mevka-haber",
            "Source": "mevka",
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

    print(f"[mevka] {gonderilen} kayıt API'ye gönderildi.")


if __name__ == "__main__":
    calistir()