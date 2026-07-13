from __future__ import annotations

from pathlib import Path
import re

import pandas as pd


INPUT_PATH = Path("data/raw/massive_tr/massive_tr_tumu.csv")
OUTPUT_DIR = Path("data/processed")

TRAIN_OUTPUT = OUTPUT_DIR / "massive_sohbet_train.csv"
VALIDATION_OUTPUT = OUTPUT_DIR / "massive_sohbet_validation.csv"
TEST_OUTPUT = OUTPUT_DIR / "massive_sohbet_test.csv"
ALL_OUTPUT = OUTPUT_DIR / "massive_sohbet_tumu.csv"

UNMATCHED_OUTPUT = OUTPUT_DIR / "massive_general_quirky_eslesmeyen.csv"
REPORT_OUTPUT = OUTPUT_DIR / "massive_sohbet_raporu.txt"

RANDOM_STATE = 42


def turkce_normalize(metin: object) -> str:
    temiz = str(metin or "").strip()

    temiz = temiz.translate(
        str.maketrans(
            {
                "I": "ı",
                "İ": "i",
                "Ç": "ç",
                "Ğ": "ğ",
                "Ö": "ö",
                "Ş": "ş",
                "Ü": "ü",
            }
        )
    ).casefold()

    temiz = temiz.translate(
        str.maketrans(
            {
                "ç": "c",
                "ğ": "g",
                "ı": "i",
                "ö": "o",
                "ş": "s",
                "ü": "u",
            }
        )
    )

    temiz = re.sub(r"[^a-z0-9]+", " ", temiz)
    return re.sub(r"\s+", " ", temiz).strip()


DOGRUDAN_NIYET_ESLEMESI = {
    "datetime_query": "TARIH_SAAT_SORUSU",
    "weather_query": "HAVA_SORUSU",
    "cooking_recipe": "YEMEK_TARIFI_SORUSU",
    "news_query": "HABER_SORUSU",
}


GENERAL_QUIRKY_KURALLARI: list[tuple[str, tuple[str, ...]]] = [
    (
        "BOT_KONUM",
        (
            "nerede yas",
            "nerede otur",
            "nerede bulun",
            "hangi sehir",
            "hangi ulke",
            "konumun",
            "evin nerede",
            "nerelisin",
            "fiziksel olarak nerede",
        ),
    ),
    (
        "BOT_YAS",
        (
            "kac yas",
            "yasin kac",
            "yasli misin",
            "genc misin",
            "dogum gun",
            "ne zaman dogdun",
        ),
    ),
    (
        "BOT_YARATICI",
        (
            "kim yapt",
            "kim yaratt",
            "kim gelistir",
            "yaraticin",
            "gelistiricin",
            "sahibin kim",
            "seni yapan",
            "seni kodlayan",
        ),
    ),
    (
        "BOT_KIMLIK",
        (
            "sen kimsin",
            "adin ne",
            "ismin ne",
            "nesin sen",
            "kendini tanit",
            "ne tur bir",
            "sen bir robot",
            "sen insan misin",
        ),
    ),
    (
        "BOT_YETENEK",
        (
            "ne yapabil",
            "neler yap",
            "yeteneklerin",
            "ozelliklerin",
            "hangi isleri",
            "nelerde yardim",
            "ne ise yar",
        ),
    ),
    (
        "NASILSIN",
        (
            "nasilsin",
            "iyi misin",
            "keyfin nasil",
            "naber",
            "ne haber",
            "moralin nasil",
            "bugun nasil hissed",
        ),
    ),
    (
        "SAKA_ISTEGI",
        (
            "saka",
            "espri",
            "guldur",
            "komik bir sey",
            "fikra",
        ),
    ),
    (
        "TESEKKUR",
        (
            "tesekkur",
            "sag ol",
            "eyvallah",
            "minnettar",
        ),
    ),
    (
        "VEDA",
        (
            "gorusuruz",
            "hosca kal",
            "bay bay",
            "kendine iyi bak",
            "sonra konusuruz",
        ),
    ),
]


def general_quirky_niyet_belirle(metin: str) -> str | None:
    normal = turkce_normalize(metin)

    for hedef_niyet, ifadeler in GENERAL_QUIRKY_KURALLARI:
        if any(ifade in normal for ifade in ifadeler):
            return hedef_niyet

    return None


def hedef_niyet_belirle(orijinal_niyet: str, metin: str) -> str | None:
    orijinal = str(orijinal_niyet).strip()

    if orijinal in DOGRUDAN_NIYET_ESLEMESI:
        return DOGRUDAN_NIYET_ESLEMESI[orijinal]

    if orijinal == "general_quirky":
        return general_quirky_niyet_belirle(metin)

    return None


def gerekli_sutunlari_kontrol_et(df: pd.DataFrame) -> None:
    gerekli = {"split", "intent_name", "utt"}
    eksik = gerekli.difference(df.columns)

    if eksik:
        raise ValueError(
            "MASSIVE birleşik CSV dosyasında eksik sütunlar var: "
            f"{sorted(eksik)}"
        )


def tabloyu_hazirla(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    satirlar: list[dict[str, str]] = []
    eslesmeyen_general: list[dict[str, str]] = []

    for _, satir in df.iterrows():
        metin = str(satir.get("utt", "")).strip()
        orijinal_niyet = str(satir.get("intent_name", "")).strip()
        split = str(satir.get("split", "")).strip()

        if not metin:
            continue

        hedef = hedef_niyet_belirle(
            orijinal_niyet=orijinal_niyet,
            metin=metin,
        )

        if hedef is None:
            if orijinal_niyet == "general_quirky":
                eslesmeyen_general.append(
                    {
                        "Metin": metin,
                        "Normal Metin": turkce_normalize(metin),
                        "Orijinal Niyet": orijinal_niyet,
                        "Split": split,
                    }
                )
            continue

        satirlar.append(
            {
                "Metin": metin,
                "Normal Metin": turkce_normalize(metin),
                "Niyet": hedef,
                "Orijinal Niyet": orijinal_niyet,
                "Kaynak": "MASSIVE-tr-TR",
                "Split": split,
            }
        )

    secilen = pd.DataFrame(satirlar)
    eslesmeyen = pd.DataFrame(eslesmeyen_general)

    if secilen.empty:
        raise ValueError(
            "Projeye uygun MASSIVE sohbet örneği seçilemedi."
        )

    secilen = secilen[
        secilen["Normal Metin"].str.len() >= 2
    ].copy()

    secilen = secilen.drop_duplicates(
        subset=["Normal Metin"],
        keep="first",
    ).reset_index(drop=True)

    if not eslesmeyen.empty:
        eslesmeyen = eslesmeyen.drop_duplicates(
            subset=["Normal Metin"],
            keep="first",
        ).reset_index(drop=True)

    return secilen, eslesmeyen


def split_kaydet(
    df: pd.DataFrame,
    split_adi: str,
    path: Path,
) -> pd.DataFrame:
    bolum = df[df["Split"] == split_adi].copy()
    bolum = bolum.sample(
        frac=1.0,
        random_state=RANDOM_STATE,
    ).reset_index(drop=True)

    bolum.to_csv(
        path,
        index=False,
        encoding="utf-8-sig",
    )

    return bolum


def rapor_olustur(
    tumu: pd.DataFrame,
    train_df: pd.DataFrame,
    validation_df: pd.DataFrame,
    test_df: pd.DataFrame,
    eslesmeyen: pd.DataFrame,
) -> str:
    satirlar: list[str] = []

    satirlar.append("=" * 78)
    satirlar.append("MASSIVE TÜRKÇE - KİTAPPUSULA TEMEL SOHBET SEÇİM RAPORU")
    satirlar.append("=" * 78)
    satirlar.append(f"Seçilen toplam örnek : {len(tumu):,}")
    satirlar.append(f"Train örneği         : {len(train_df):,}")
    satirlar.append(f"Validation örneği    : {len(validation_df):,}")
    satirlar.append(f"Test örneği          : {len(test_df):,}")
    satirlar.append(f"Yeni niyet sayısı    : {tumu['Niyet'].nunique()}")
    satirlar.append(
        "Eşleşmeyen general_quirky: "
        f"{len(eslesmeyen):,}"
    )

    satirlar.append("\nToplam niyet dağılımı:")
    satirlar.append(
        tumu["Niyet"]
        .value_counts()
        .sort_index()
        .to_string()
    )

    satirlar.append("\nTrain dağılımı:")
    satirlar.append(
        train_df["Niyet"]
        .value_counts()
        .sort_index()
        .to_string()
    )

    satirlar.append("\nTest dağılımı:")
    satirlar.append(
        test_df["Niyet"]
        .value_counts()
        .sort_index()
        .to_string()
    )

    return "\n".join(satirlar)


def main() -> None:
    if not INPUT_PATH.exists():
        raise FileNotFoundError(
            "MASSIVE birleşik CSV bulunamadı:\n"
            f"{INPUT_PATH.resolve()}\n"
            "Önce python download_massive.py çalıştır."
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 78)
    print("MASSIVE TÜRKÇE VERİSİ TEMEL SOHBET İÇİN SEÇİLİYOR")
    print("=" * 78)

    df = pd.read_csv(
        INPUT_PATH,
        low_memory=False,
    )

    gerekli_sutunlari_kontrol_et(df)

    secilen, eslesmeyen = tabloyu_hazirla(df)

    train_df = split_kaydet(
        secilen,
        "train",
        TRAIN_OUTPUT,
    )

    validation_df = split_kaydet(
        secilen,
        "validation",
        VALIDATION_OUTPUT,
    )

    test_df = split_kaydet(
        secilen,
        "test",
        TEST_OUTPUT,
    )

    secilen.to_csv(
        ALL_OUTPUT,
        index=False,
        encoding="utf-8-sig",
    )

    if not eslesmeyen.empty:
        eslesmeyen.to_csv(
            UNMATCHED_OUTPUT,
            index=False,
            encoding="utf-8-sig",
        )

    rapor = rapor_olustur(
        tumu=secilen,
        train_df=train_df,
        validation_df=validation_df,
        test_df=test_df,
        eslesmeyen=eslesmeyen,
    )

    REPORT_OUTPUT.write_text(
        rapor,
        encoding="utf-8",
    )

    print(rapor)

    print("\nOluşturulan dosyalar:")
    print(f"  • {TRAIN_OUTPUT.resolve()}")
    print(f"  • {VALIDATION_OUTPUT.resolve()}")
    print(f"  • {TEST_OUTPUT.resolve()}")
    print(f"  • {ALL_OUTPUT.resolve()}")
    print(f"  • {REPORT_OUTPUT.resolve()}")

    if not eslesmeyen.empty:
        print(f"  • {UNMATCHED_OUTPUT.resolve()}")

    print(
        "\nNot: Bu aşamada model henüz yeniden eğitilmedi. "
        "Yalnızca projeye uygun MASSIVE örnekleri ayrıldı."
    )


if __name__ == "__main__":
    main()