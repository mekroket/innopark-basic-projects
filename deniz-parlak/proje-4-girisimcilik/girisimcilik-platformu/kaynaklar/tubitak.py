import sys
import os
sys.path.append(os.path.dirname(__file__))
from config import API_ADRESI

import requests
from bs4 import BeautifulSoup


def calistir():
    url = "https://tubitak.gov.tr/tr/duyuru"
    ana_adres = "https://tubitak.gov.tr"

    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(response.text, "lxml")

    duyurular = soup.find_all("div", class_="views-row")
    gonderilen = 0

    for duyuru in duyurular:
        baslik_kutusu = duyuru.find("div", class_="views-field-title")
        link_etiketi = baslik_kutusu.find("a") if baslik_kutusu else None

        if not link_etiketi:
            continue

        baslik = link_etiketi.text.strip()
        link = ana_adres + link_etiketi.get("href", "").strip()

        tarih_kutusu = duyuru.find("div", class_="views-field-created")
        tarih_etiketi = tarih_kutusu.find("time") if tarih_kutusu else None
        tarih = tarih_etiketi.get("datetime", "") if tarih_etiketi else ""

        if not baslik or not link:
            continue

        veri = {
            "Title": baslik,
            "Link": link,
            "Category": "tubitak-duyuru",
            "Source": "tubitak",
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

    print(f"[tubitak] {gonderilen} kayıt API'ye gönderildi.")


if __name__ == "__main__":
    calistir()
