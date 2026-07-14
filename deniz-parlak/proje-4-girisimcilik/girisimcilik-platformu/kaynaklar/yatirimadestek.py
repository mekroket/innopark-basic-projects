import sys
import os
sys.path.append(os.path.dirname(__file__))
from config import API_ADRESI

import requests
from bs4 import BeautifulSoup


def calistir():
    url = "https://www.yatirimadestek.gov.tr/duyurular"

    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(response.text, "lxml")

    duyurular = soup.find_all("div", class_="allNewsBox")
    gonderilen = 0

    for duyuru in duyurular:
        link_etiketi = duyuru.find("a")
        if not link_etiketi:
            continue

        link = link_etiketi.get("href", "").strip()

        baslik_etiketi = duyuru.find("li", class_="title")
        baslik = baslik_etiketi.text.strip() if baslik_etiketi else ""

        tarih_etiketi = duyuru.find("li", class_="date")
        tarih = tarih_etiketi.text.strip() if tarih_etiketi else ""

        if not baslik or not link:
            continue

        veri = {
            "Title": baslik,
            "Link": link,
            "Category": "devlet-destegi",
            "Source": "yatirimadestek",
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

    print(f"[yatirimadestek] {gonderilen} kayıt API'ye gönderildi.")


if __name__ == "__main__":
    calistir()
