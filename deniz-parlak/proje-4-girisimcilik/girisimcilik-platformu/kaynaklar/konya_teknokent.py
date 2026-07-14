import sys
import os
sys.path.append(os.path.dirname(__file__))
from config import API_ADRESI

import requests


def calistir():
    # Site yenilendi: haberler.html artık boş bir şablon, içerik
    # JavaScript ile bu JSON adresinden yükleniyor (js/components/haberler.js).
    # Biz de HTML yerine doğrudan JSON'u okuyoruz.
    url = "https://www.konyateknokent.com.tr/data/featuredNews.asp"
    detay_adresi = "https://www.konyateknokent.com.tr/haber-detay.html?slug="

    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    haberler = response.json().get("featuredNews", [])
    gonderilen = 0

    for haber in haberler:
        baslik = haber.get("title", "").strip()
        slug = haber.get("slug", "").strip()
        link = detay_adresi + slug if slug else ""

        kategori = haber.get("category", "").strip() or "konya-teknokent-haber"
        tarih = haber.get("date", "").strip()

        if not baslik or not link:
            continue

        veri = {
            "Title": baslik,
            "Link": link,
            "Category": kategori,
            "Source": "konya-teknokent",
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

    print(f"[konya-teknokent] {gonderilen} kayıt API'ye gönderildi.")


if __name__ == "__main__":
    calistir()
