import sys
import os
sys.path.append(os.path.dirname(__file__))
from config import API_ADRESI

import json
import requests
from bs4 import BeautifulSoup


def calistir():
    url = "https://luma.com/user/divizyon"
    ana_adres = "https://luma.com"

    # Luma sayfası artık etkinlikleri JavaScript ile yüklüyor; HTML'de sadece
    # boş yer tutucular var. Önce profil sayfasındaki __NEXT_DATA__ içinden
    # kullanıcı ID'sini alıp etkinlikleri Luma API'sinden çekiyoruz.
    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(response.text, "lxml")

    veri_etiketi = soup.find("script", id="__NEXT_DATA__")
    if not veri_etiketi or not veri_etiketi.string:
        print("[divizyon] __NEXT_DATA__ bulunamadı — sayfa yapısı yine değişmiş olabilir.")
        return

    sayfa_verisi = json.loads(veri_etiketi.string)
    kullanici_id = (
        sayfa_verisi.get("props", {})
        .get("pageProps", {})
        .get("initialData", {})
        .get("user", {})
        .get("api_id", "")
    )
    if not kullanici_id:
        print("[divizyon] Kullanıcı ID'si bulunamadı.")
        return

    api_url = f"https://api.lu.ma/user/profile/events-hosting?user_api_id={kullanici_id}"
    api_cevap = requests.get(api_url, headers={"User-Agent": "Mozilla/5.0"})
    etkinlikler = api_cevap.json().get("entries", [])
    gonderilen = 0

    for kayit in etkinlikler:
        etkinlik = kayit.get("event", {})

        baslik = etkinlik.get("name", "").strip()
        # "url" alanı sadece slug içeriyor (ör. "m8q0akgp")
        slug = etkinlik.get("url", "").strip()
        link = f"{ana_adres}/{slug}" if slug else ""

        tarih = etkinlik.get("start_at", "").strip()

        if not baslik or not link:
            continue

        veri = {
            "Title": baslik,
            "Link": link,
            "Category": "divizyon-etkinlik",
            "Source": "divizyon",
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

    print(f"[divizyon] {gonderilen} kayıt API'ye gönderildi.")


if __name__ == "__main__":
    calistir()
