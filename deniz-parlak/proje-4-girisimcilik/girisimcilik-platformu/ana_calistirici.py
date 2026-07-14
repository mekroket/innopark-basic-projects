"""
ANA ÇALIŞTIRICI — Tüm scraper'ları tek komutla çalıştırır.

Kullanım:
    python ana_calistirici.py

Bu dosyayı zamanlayici.py çağırıyor (otomatik günlük çalıştırma için).
Elle test etmek istediğinde de doğrudan bunu çalıştırabilirsin.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "kaynaklar"))

from kaynaklar import (
    webrazzi, kosgeb, tubitak, trangels, ufukavrupa, yatirimadestek, itucekirdek,
    mevka, konya_sanayi_odasi, konya_ticaret_odasi, bilkent_cyberpark,
    konya_teknokent, atap, ulutek, bursateknopark, divizyon, konya_buyuksehir_belediyesi
)


def tum_kaynaklari_tara():
    kaynaklar = [
    ("Webrazzi", webrazzi),
    ("KOSGEB", kosgeb),
    ("TÜBİTAK", tubitak),
    ("TRAngels", trangels),
    ("Ufuk Avrupa", ufukavrupa),
    ("Yatırım Destek", yatirimadestek),
    ("İTÜ Çekirdek", itucekirdek),
    ("MEVKA", mevka),
    ("Konya Sanayi Odası", konya_sanayi_odasi),
    ("Konya Ticaret Odası", konya_ticaret_odasi),
    ("Bilkent Cyberpark", bilkent_cyberpark),
    ("Konya Teknokent", konya_teknokent),
    ("ATAP", atap),
    ("Uludağ Teknopark", ulutek),
    ("Bursa Teknopark", bursateknopark),
    ("Divizyon", divizyon),
    ("Konya Büyükşehir Belediyesi", konya_buyuksehir_belediyesi),
]
    print("=" * 50)
    print("STARTUPRADAR — GÜNLÜK TARAMA BAŞLADI")
    print("=" * 50)

    basarili = 0
    basarisiz = 0

    for isim, modul in kaynaklar:
        print(f"\n[{isim}] taranıyor...")
        try:
            modul.calistir()
            basarili += 1
        except Exception as e:
            print(f"[{isim}] HATA: {e}")
            basarisiz += 1

    print("\n" + "=" * 50)
    print(f"TARAMA TAMAMLANDI — {basarili} kaynak başarılı, {basarisiz} kaynak hatalı")
    print("=" * 50)


if __name__ == "__main__":
    tum_kaynaklari_tara()
