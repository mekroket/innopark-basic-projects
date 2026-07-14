from pathlib import Path

import pandas as pd


# =========================================================
# DOSYA YOLLARI VE AYARLAR
# =========================================================

RAW_PATH = Path("data/raw/tum_kitaplar.csv")
OUTPUT_PATH = Path("data/processed/kitaplar_egitim.csv")

RANDOM_STATE = 42
TARGET_PER_CLASS = 1000
MAX_FILE_SIZE_MB = 5.0
MIN_DESCRIPTION_LENGTH = 120


CATEGORY_RULES = [
    ("Polisiye", ["polisiye"]),
    ("Bilimkurgu-Fantazya", ["bilimkurgu-fantazya"]),
    (
        "Biyografi-Otobiyografi",
        ["biyografi-otobiyografi"],
    ),
    ("Anı", ["anı (hatırat)"]),
    (
        "Deneme",
        ["deneme (yerli)", "deneme (çeviri)"],
    ),
    (
        "Hikâye",
        ["hikaye (yerli)", "hikaye (çeviri)"],
    ),
    (
        "Şiir",
        ["şiir (yerli)", "şiir (çeviri)"],
    ),
    (
        "Roman",
        ["roman (yerli)", "roman (çeviri)"],
    ),
]


def metin_temizle(seri: pd.Series) -> pd.Series:
    """Metinlerdeki fazla boşlukları temizler."""

    return (
        seri.astype(str)
        .str.replace(r"<[^>]+>", " ", regex=True)
        .str.replace(r"\s+", " ", regex=True)
        .str.strip()
    )


def kategori_belirle(kategori_metni: str) -> str | None:
    """
    Veri setindeki kategori yolunu sekiz ana
    sınıftan birine dönüştürür.
    """

    metin = str(kategori_metni).casefold()

    for ana_kategori, anahtarlar in CATEGORY_RULES:
        for anahtar in anahtarlar:
            if anahtar.casefold() in metin:
                return ana_kategori

    return None


def dosya_boyutu_mb(path: Path) -> float:
    """Dosyanın boyutunu MB olarak döndürür."""

    return path.stat().st_size / (1024 * 1024)


def main() -> None:
    if not RAW_PATH.exists():
        raise FileNotFoundError(
            "Orijinal veri seti bulunamadı:\n"
            f"{RAW_PATH.resolve()}"
        )

    print("=" * 70)
    print("GELİŞTİRİLMİŞ VERİ SETİ HAZIRLAMA")
    print("=" * 70)

    kullanilacak_sutunlar = [
        "Kitap Adı",
        "Yazar",
        "İlgili Kategoriler",
        "Kitap Açıklaması",
    ]

    print("Orijinal veri seti okunuyor...")

    df = pd.read_csv(
        RAW_PATH,
        usecols=kullanilacak_sutunlar,
        low_memory=False,
    )

    print(f"Orijinal kayıt sayısı: {len(df):,}")

    df = df.dropna(
        subset=[
            "Kitap Adı",
            "Yazar",
            "İlgili Kategoriler",
            "Kitap Açıklaması",
        ]
    ).copy()

    for sutun in kullanilacak_sutunlar:
        df[sutun] = metin_temizle(df[sutun])

    gecersiz_degerler = {
        "",
        "n/a",
        "nan",
        "none",
        "null",
    }

    for sutun in [
        "Kitap Adı",
        "Yazar",
        "Kitap Açıklaması",
    ]:
        df = df[
            ~df[sutun]
            .str.casefold()
            .isin(gecersiz_degerler)
        ].copy()

    # Çok kısa tanıtımlar modeli yanıltabilir.
    df = df[
        df["Kitap Açıklaması"].str.len()
        >= MIN_DESCRIPTION_LENGTH
    ].copy()

    # Aynı kitabın farklı baskılarının veri tekrarına
    # yol açmasını engelle.
    df = df.drop_duplicates(
        subset=[
            "Kitap Adı",
            "Yazar",
        ],
        keep="first",
    ).copy()

    df["Kategori"] = (
        df["İlgili Kategoriler"]
        .apply(kategori_belirle)
    )

    df = df.dropna(
        subset=["Kategori"]
    ).copy()

    kategori_sayilari = (
        df["Kategori"]
        .value_counts()
    )

    print("\nTemizleme sonrasındaki kategori dağılımı:")
    print(kategori_sayilari.to_string())

    eksik_kategoriler = [
        kategori
        for kategori, _ in CATEGORY_RULES
        if kategori not in kategori_sayilari.index
    ]

    if eksik_kategoriler:
        raise ValueError(
            "Bulunamayan kategoriler: "
            f"{eksik_kategoriler}"
        )

    en_kucuk_sinif = int(
        kategori_sayilari.min()
    )

    ornek_sayisi = min(
        TARGET_PER_CLASS,
        en_kucuk_sinif,
    )

    if ornek_sayisi < 800:
        raise ValueError(
            "Bazı sınıflarda 800'den az veri kaldı."
        )

    print(
        "\nHer kategoriden alınacak kitap sayısı: "
        f"{ornek_sayisi}"
    )

    dengeli_parcalar = []

    for kategori, _ in CATEGORY_RULES:
        kategori_verisi = df[
            df["Kategori"] == kategori
        ]

        kategori_ornekleri = (
            kategori_verisi.sample(
                n=ornek_sayisi,
                random_state=RANDOM_STATE,
            )
        )

        dengeli_parcalar.append(
            kategori_ornekleri
        )

    dengeli_df = pd.concat(
        dengeli_parcalar,
        ignore_index=True,
    )

    dengeli_df = dengeli_df.sample(
        frac=1,
        random_state=RANDOM_STATE,
    ).reset_index(drop=True)

    # Eğitim dosyasında yalnızca inceleme için kitap adı,
    # model girdisi olarak açıklama ve hedef kategori tutulur.
    dengeli_df = dengeli_df[
        [
            "Kitap Adı",
            "Kitap Açıklaması",
            "Kategori",
        ]
    ]

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    # 8.000 kayıt 5 MB altında tutulurken mümkün olan
    # en uzun açıklamalar korunur.
    aciklama_siniri = 700
    kaydedilecek_df = dengeli_df.copy()

    while aciklama_siniri >= 300:
        kaydedilecek_df = dengeli_df.copy()

        kaydedilecek_df["Kitap Açıklaması"] = (
            kaydedilecek_df["Kitap Açıklaması"]
            .str.slice(0, aciklama_siniri)
            .str.strip()
        )

        kaydedilecek_df.to_csv(
            OUTPUT_PATH,
            index=False,
            encoding="utf-8-sig",
        )

        boyut = dosya_boyutu_mb(
            OUTPUT_PATH
        )

        if boyut <= MAX_FILE_SIZE_MB:
            break

        aciklama_siniri -= 50

    son_boyut = dosya_boyutu_mb(
        OUTPUT_PATH
    )

    if son_boyut > MAX_FILE_SIZE_MB:
        raise RuntimeError(
            "İşlenmiş veri seti 5 MB sınırının "
            "altına indirilemedi."
        )

    print("\n" + "=" * 70)
    print("VERİ HAZIRLAMA TAMAMLANDI")
    print("=" * 70)

    print(
        f"Dosya: {OUTPUT_PATH.resolve()}"
    )
    print(
        f"Toplam kayıt: {len(kaydedilecek_df):,}"
    )
    print(
        "Kategori sayısı: "
        f"{kaydedilecek_df['Kategori'].nunique()}"
    )
    print(
        f"Açıklama sınırı: {aciklama_siniri} karakter"
    )
    print(
        f"Dosya boyutu: {son_boyut:.2f} MB"
    )

    print("\nSon kategori dağılımı:")

    print(
        kaydedilecek_df["Kategori"]
        .value_counts()
        .sort_index()
        .to_string()
    )


if __name__ == "__main__":
    main()