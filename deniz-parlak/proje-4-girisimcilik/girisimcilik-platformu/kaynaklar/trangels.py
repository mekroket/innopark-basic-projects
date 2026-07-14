import sys
import os
sys.path.append(os.path.dirname(__file__))
from config import API_ADRESI

import requests
from bs4 import BeautifulSoup


def tam_tarihi_getir(link):
    """Bir haberin kendi sayfasına girip tam (yıl dahil) tarihini çeker."""
    try:
        response = requests.get(link, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(response.text, "lxml")
        tarih_etiketi = soup.find("span", class_="post_date")
        return tarih_etiketi.text.strip() if tarih_etiketi else ""
    except requests.exceptions.RequestException:
        return ""


def calistir():
    url = "https://www.trangels.com/bizden-haberler/"
    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(response.text, "lxml")

    yazilar = soup.find_all("div", class_="sc_blogger_item_content")
    gonderilen = 0

    for yazi in yazilar:
        baslik_kutusu = yazi.find("h5", class_="sc_blogger_item_title")
        link_etiketi = baslik_kutusu.find("a") if baslik_kutusu else None

        if not link_etiketi:
            continue

        baslik = link_etiketi.text.strip()
        link = link_etiketi.get("href", "").strip()

        kategori_kutusu = yazi.find("span", class_="post_categories")
        kategori_etiketi = kategori_kutusu.find("a") if kategori_kutusu else None
        kategori = kategori_etiketi.text.strip() if kategori_etiketi else "trangels"

        if not baslik or not link:
            continue

        tam_tarih = tam_tarihi_getir(link)

        veri = {
            "Title": baslik,
            "Link": link,
            "Category": kategori,
            "Source": "trangels",
            "DataDate": tam_tarih
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

    print(f"[trangels] {gonderilen} kayıt API'ye gönderildi.")


if __name__ == "__main__":
    calistir()
