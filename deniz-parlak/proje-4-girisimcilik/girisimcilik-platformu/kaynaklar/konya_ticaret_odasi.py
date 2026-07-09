import sys
import os
sys.path.append(os.path.dirname(__file__))
from config import API_ADRESI

import requests
from bs4 import BeautifulSoup


def tam_tarihi_getir(link):
    """Bir haberin kendi sayfasına girip 'Yayın Tarihi: ...' bilgisini çeker."""
    try:
        response = requests.get(link, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(response.text, "lxml")
        tarih_etiketi = soup.find("span", class_="date")
        if not tarih_etiketi:
            return ""
        return tarih_etiketi.text.replace("Yayın Tarihi:", "").strip()
    except requests.exceptions.RequestException:
        return ""


def calistir():
    url = "https://www.kto.org.tr/haberler"
    ana_adres = "https://www.kto.org.tr"

    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(response.text, "lxml")

    haberler = soup.find_all("div", class_="post-item")
    gonderilen = 0

    for haber in haberler:
        link_etiketi = haber.find("a")
        baslik_etiketi = haber.find("span", class_="t")

        if not link_etiketi or not baslik_etiketi:
            continue

        baslik = baslik_etiketi.text.strip()
        link = ana_adres + link_etiketi.get("href", "").strip()

        if not baslik or not link:
            continue

        # Tam tarihi almak için detay sayfasına ayrıca giriyoruz
        tam_tarih = tam_tarihi_getir(link)

        veri = {
            "Title": baslik,
            "Link": link,
            "Category": "kto-haber",
            "Source": "konya-ticaret-odasi",
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

    print(f"[konya-ticaret-odasi] {gonderilen} kayıt API'ye gönderildi.")


if __name__ == "__main__":
    calistir()