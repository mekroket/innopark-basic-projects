import sys
import os
sys.path.append(os.path.dirname(__file__))
from config import API_ADRESI

import requests
from bs4 import BeautifulSoup


def calistir():
    url = "https://ufukavrupa.org.tr/tr/haberler"
    ana_adres = "https://ufukavrupa.org.tr"

    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(response.text, "lxml")

    haberler = soup.find_all("div", class_="news-list-row")
    gonderilen = 0

    for haber in haberler:
        baslik_kutusu = haber.find("div", class_="news-list-title")
        link_etiketi = baslik_kutusu.find("a") if baslik_kutusu else None

        if not link_etiketi:
            continue

        baslik = link_etiketi.text.strip()
        link = ana_adres + link_etiketi.get("href", "").strip()

        tarih_etiketi = haber.find("time")
        tarih = tarih_etiketi.get("datetime", "") if tarih_etiketi else ""

        etiket_kutusu = haber.find("div", class_="news-list-label")
        kategori = etiket_kutusu.text.strip() if etiket_kutusu else "ufuk-avrupa-haber"

        if not baslik or not link:
            continue

        veri = {
            "Title": baslik,
            "Link": link,
            "Category": kategori,
            "Source": "ufuk-avrupa",
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

    print(f"[ufuk-avrupa] {gonderilen} kayıt API'ye gönderildi.")


if __name__ == "__main__":
    calistir()
