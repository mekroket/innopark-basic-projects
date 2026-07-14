import sys
import os
sys.path.append(os.path.dirname(__file__))
from config import API_ADRESI

import requests
from bs4 import BeautifulSoup


def calistir():
    url = "https://www.kosgeb.gov.tr/site/tr/genel/liste/2/duyurular"
    ana_adres = "https://www.kosgeb.gov.tr"

    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(response.text, "lxml")

    duyurular = soup.find_all("div", class_="duyuru-item")
    gonderilen = 0

    for duyuru in duyurular:
        baslik_etiketi = duyuru.find("h5", class_="title")
        link_etiketi = baslik_etiketi.find("a") if baslik_etiketi else None

        if not link_etiketi:
            continue

        baslik = link_etiketi.text.strip()
        link = ana_adres + link_etiketi.get("href", "").strip()

        tarih_kutusu = duyuru.find("div", class_="tarih")
        tarih = tarih_kutusu.get_text(separator=" ", strip=True) if tarih_kutusu else ""

        if not baslik or not link:
            continue

        veri = {
            "Title": baslik,
            "Link": link,
            "Category": "kosgeb-duyuru",
            "Source": "kosgeb",
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

    print(f"[kosgeb] {gonderilen} kayıt API'ye gönderildi.")


if __name__ == "__main__":
    calistir()
