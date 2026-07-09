import sys
import os
sys.path.append(os.path.dirname(__file__))
from config import API_ADRESI

import requests
from bs4 import BeautifulSoup


def calistir():
    url = "https://www.atap.com.tr/haber-ve-duyurular"
    ana_adres = "https://www.atap.com.tr"

    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(response.text, "lxml")

    haberler = soup.find_all("div", class_="post-item")
    gonderilen = 0

    for haber in haberler:
        baslik_etiketi = haber.find("h2")
        link_etiketi = baslik_etiketi.find("a") if baslik_etiketi else None

        if not link_etiketi:
            continue

        baslik = link_etiketi.text.strip()
        link = ana_adres + link_etiketi.get("href", "").strip()

        tarih_kutusu = haber.find("li", class_="meta-user")
        tarih_etiketi = tarih_kutusu.find("a") if tarih_kutusu else None
        tarih = tarih_etiketi.text.strip() if tarih_etiketi else ""

        if not baslik or not link:
            continue

        veri = {
            "Title": baslik,
            "Link": link,
            "Category": "atap-haber",
            "Source": "atap",
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

    print(f"[atap] {gonderilen} kayıt API'ye gönderildi.")


if __name__ == "__main__":
    calistir()