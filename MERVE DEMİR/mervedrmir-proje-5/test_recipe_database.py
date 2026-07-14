from recipe_database import TarifVeritabani


def main() -> None:
    db = TarifVeritabani()

    print(f"Tarif sayısı: {len(db)}")

    kayit, eslesme, _ = db.tarif_bul("menemen tarifi")

    if kayit is None:
        raise SystemExit(
            "HATA: Menemen tarifi bulunamadı."
        )

    print(f"Eşleşme: {eslesme}")
    print(f"Tarif: {kayit.tarif_adi}")
    print("Tarif veri tabanı bağlantısı başarılı.")


if __name__ == "__main__":
    main()
