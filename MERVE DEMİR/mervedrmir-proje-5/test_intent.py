from __future__ import annotations

from collections import Counter

from intent_classifier import (
    Niyetler,
    NiyetSiniflandirici,
)


TESTLER = [
    ("Ana karakteri kim", Niyetler.KARAKTER),
    ("Santiago kim", Niyetler.KARAKTER),
    ("Bu kitabın yazarı kim", Niyetler.YAZAR),
    ("Santiago neden Mısır'a gidiyor", Niyetler.OLAY),
    ("Kitap hakkında biraz daha detay ver", Niyetler.DETAY),
    ("Bu kitap ne anlatıyor", Niyetler.OZET),
    ("Kaç sayfa", Niyetler.SAYFA),
    ("Hangi türe ait", Niyetler.TUR),
    ("Sence okunmaya değer mi", Niyetler.SERBEST_KITAP),
    ("Forsa", Niyetler.KITAP_ARAMA),
    ("Modelin macro f1 skoru kaç", Niyetler.MODEL_BILGISI),
    ("Hangi kategorileri biliyorsun", Niyetler.KATEGORILER),
    ("Kaç kitap var", Niyetler.KITAP_SAYISI),
    ("Yardım", Niyetler.YARDIM),
    ("Merhaba", Niyetler.SELAMLAMA),
    ("Nasılsın", Niyetler.NASILSIN),
    ("Sen kimsin", Niyetler.BOT_KIMLIK),
    ("Adın ve görevin ne", Niyetler.BOT_KIMLIK),
    ("Nerede yaşıyorsun", Niyetler.BOT_KONUM),
    ("Fiziksel olarak neredesin", Niyetler.BOT_KONUM),
    ("Seni kim geliştirdi", Niyetler.BOT_YARATICI),
    ("Bu projeyi kim hazırladı", Niyetler.BOT_YARATICI),
    ("Kaç yaşındasın", Niyetler.BOT_YAS),
    ("Bir doğum tarihin var mı", Niyetler.BOT_YAS),
    ("Neler yapabiliyorsun", Niyetler.BOT_YETENEK),
    ("Hangi konularda yardımcı olursun", Niyetler.BOT_YETENEK),
    ("Çok teşekkür ederim", Niyetler.TESEKKUR),
    ("Emeğine sağlık", Niyetler.TESEKKUR),
    ("Görüşürüz", Niyetler.VEDA),
    ("Kendine iyi bak", Niyetler.VEDA),
    ("Bana bir şaka yap", Niyetler.SAKA_ISTEGI),
    ("Komik bir şey söyle", Niyetler.SAKA_ISTEGI),
    ("Bugün biraz sohbet etmek istiyorum", Niyetler.GENEL_SOHBET),
    ("Aklıma bir konu geldi", Niyetler.GENEL_SOHBET),
    ("Bugün hava nasıl", Niyetler.HAVA),
    ("Yarın yağmur yağacak mı", Niyetler.HAVA),
    ("Saat kaç", Niyetler.TARIH_SAAT),
    ("Bugünün tarihi ne", Niyetler.TARIH_SAAT),
    ("Makarna tarifi verir misin", Niyetler.YEMEK_TARIFI),
    ("Bu yemek nasıl yapılır", Niyetler.YEMEK_TARIFI),
    ("Bugünün haberleri neler", Niyetler.HABER),
    ("Gündemde ne var", Niyetler.HABER),
    ("Son gelişmeler neler", Niyetler.HABER),
    ("Haberlerde hangi konular var", Niyetler.HABER),
    ("Python kodu yazar mısın", Niyetler.ALAN_DISI),
    ("Kod yaz", Niyetler.ALAN_DISI),
    ("Bana kod yazar mısın", Niyetler.ALAN_DISI),
    ("Bana bir web sitesi tasarla", Niyetler.ALAN_DISI),
]


def main() -> None:
    model = NiyetSiniflandirici()
    dogru = 0
    hatalar: list[
        tuple[str, str, str, float, str]
    ] = []

    print("=" * 124)
    print("KİTAPPUSULA FINAL SAF ML KRİTİK NİYET TESTLERİ")
    print("=" * 124)

    for metin, beklenen in TESTLER:
        sonuc = model.tahmin_et(metin)
        tahmin = str(sonuc["niyet"])
        guven = float(sonuc["guven"])
        kaynak = str(sonuc.get("kaynak", ""))

        dogru_tahmin = (
            tahmin == beklenen
            and kaynak == "makine_ogrenmesi"
        )

        durum = (
            "DOĞRU"
            if dogru_tahmin
            else "HATA"
        )

        print(
            f"{durum:<6} | "
            f"{metin:<43} | "
            f"{tahmin:<28} | "
            f"%{guven:6.2f} | "
            f"{kaynak}"
        )

        if dogru_tahmin:
            dogru += 1
        else:
            hatalar.append(
                (
                    metin,
                    beklenen,
                    tahmin,
                    guven,
                    kaynak,
                )
            )

    print("\n" + "=" * 124)
    print(
        f"Sonuç: {dogru}/{len(TESTLER)} doğru "
        f"(%{dogru / len(TESTLER) * 100:.2f})"
    )

    if hatalar:
        print("\nHatalı örnekler:")

        for (
            metin,
            beklenen,
            tahmin,
            guven,
            kaynak,
        ) in hatalar:
            print(
                f"  • {metin!r}: "
                f"beklenen={beklenen}, "
                f"tahmin={tahmin}, "
                f"güven=%{guven:.2f}, "
                f"kaynak={kaynak}"
            )

        hata_sayilari = Counter(
            tahmin
            for _, _, tahmin, _, _
            in hatalar
        )

        print("\nEn sık hatalı tahminler:")
        for niyet, sayi in hata_sayilari.most_common():
            print(f"  • {niyet}: {sayi}")

        raise SystemExit(1)

    print(
        "Bütün final kritik niyet testleri "
        "eğitilmiş ML modeliyle geçti."
    )


if __name__ == "__main__":
    main()
