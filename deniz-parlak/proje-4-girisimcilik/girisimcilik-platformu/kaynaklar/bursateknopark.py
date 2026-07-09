import sys
import os
sys.path.append(os.path.dirname(__file__))
from config import API_ADRESI

import requests
from bs4 import BeautifulSoup


def tam_tarihi_getir(link):
    """Detay sayfasına girip <time> etiketinin datetime özelliğini (ISO format) çeker."""
    try:
        response = requests.get(link, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(response.text, "lxml")
        tarih_etiketi = soup.find("time", class_="entry-date")
        if not tarih_etiketi:
            return ""
        return tarih_etiketi.get("datetime", "").strip()
    except requests.exceptions.RequestException:
        return ""


def kategori_bul(article_tag):
    """class listesinde 'category-XXX' olanı bulup gerçek kategori ismini çıkarır."""
    for cls in article_tag.get("class", []):
        if cls.startswith("category-"):
            return cls.replace("category-", "")
    return "bursateknopark-duyuru"


def calistir():
    url = "https://bursateknopark.com/haberler-duyurular/"

    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(response.text, "lxml")

    haberler = soup.find_all("article")
    gonderilen = 0

    for haber in haberler:
        baslik_kutusu = haber.find("h2", class_="entry-title")
        link_etiketi = baslik_kutusu.find("a") if baslik_kutusu else None

        if not link_etiketi:
            continue

        baslik = link_etiketi.text.strip()
        link = link_etiketi.get("href", "").strip()  # zaten tam adres

        if not baslik or not link:
            continue

        kategori = kategori_bul(haber)
        tam_tarih = tam_tarihi_getir(link)

        veri = {
            "Title": baslik,
            "Link": link,
            "Category": kategori,
            "Source": "bursateknopark",
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

    print(f"[bursateknopark] {gonderilen} kayıt API'ye gönderildi.")


if __name__ == "__main__":
    calistir()