from __future__ import annotations

from pathlib import Path
import json
import numbers

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import (
    StratifiedKFold,
    cross_val_score,
)
from sklearn.multiclass import OneVsRestClassifier
from sklearn.naive_bayes import ComplementNB
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.svm import LinearSVC

from intent_classifier import (
    MODEL_PATH,
    MODEL_VERSION,
    TUM_NIYETLER,
    turkce_normalize,
)


# =========================================================
# DOSYA YOLLARI
# =========================================================

TRAIN_DATA_PATH = Path(
    "data/processed/niyet_egitim.csv"
)
TEST_DATA_PATH = Path(
    "data/processed/niyet_bagimsiz_test.csv"
)

REPORTS_DIR = Path("reports")

RESULTS_PATH = (
    REPORTS_DIR
    / "niyet_model_sonuclari.csv"
)
METRICS_PATH = (
    REPORTS_DIR
    / "niyet_en_iyi_model_metrikleri.json"
)
REPORT_PATH = (
    REPORTS_DIR
    / "niyet_siniflandirma_raporu.txt"
)
CONFUSION_MATRIX_PATH = (
    REPORTS_DIR
    / "niyet_confusion_matrix.png"
)
MODEL_COMPARISON_PATH = (
    REPORTS_DIR
    / "niyet_model_karsilastirma.png"
)
ERROR_ANALYSIS_PATH = (
    REPORTS_DIR
    / "niyet_hata_analizi.csv"
)

RANDOM_STATE = 42


# =========================================================
# VERİ
# =========================================================

def klasorleri_hazirla() -> None:
    MODEL_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )
    REPORTS_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )


def veri_yukle(
    path: Path,
    bolum: str,
) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(
            f"{bolum} dosyası bulunamadı:\n"
            f"{path.resolve()}\n"
            "Önce python prepare_intent_data.py çalıştır."
        )

    df = pd.read_csv(
        path,
        low_memory=False,
    )

    gerekli = {
        "Metin",
        "Normal Metin",
        "Niyet",
    }

    eksik = gerekli.difference(df.columns)

    if eksik:
        raise ValueError(
            f"{bolum} dosyasında eksik sütunlar var: "
            f"{sorted(eksik)}"
        )

    df = df.dropna(
        subset=[
            "Metin",
            "Niyet",
        ]
    ).copy()

    df["Metin"] = (
        df["Metin"]
        .astype(str)
        .str.strip()
    )

    df["Normal Metin"] = (
        df["Metin"]
        .apply(turkce_normalize)
    )

    df["Niyet"] = (
        df["Niyet"]
        .astype(str)
        .str.strip()
    )

    df = df[
        df["Normal Metin"].str.len() >= 1
    ].copy()

    df = df.drop_duplicates(
        subset=["Normal Metin"],
        keep="first",
    ).reset_index(drop=True)

    return df


def veri_kontrolu(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
) -> None:
    beklenen_siniflar = set(TUM_NIYETLER)
    train_siniflar = set(
        train_df["Niyet"].unique()
    )
    test_siniflar = set(
        test_df["Niyet"].unique()
    )

    if train_siniflar != beklenen_siniflar:
        raise ValueError(
            "Eğitim sınıfları final niyet tanımlarıyla uyuşmuyor.\n"
            f"Eksik: {sorted(beklenen_siniflar - train_siniflar)}\n"
            f"Fazla: {sorted(train_siniflar - beklenen_siniflar)}"
        )

    if test_siniflar != beklenen_siniflar:
        raise ValueError(
            "Test sınıfları final niyet tanımlarıyla uyuşmuyor.\n"
            f"Eksik: {sorted(beklenen_siniflar - test_siniflar)}\n"
            f"Fazla: {sorted(test_siniflar - beklenen_siniflar)}"
        )

    train_sayilari = (
        train_df["Niyet"]
        .value_counts()
        .sort_index()
    )
    test_sayilari = (
        test_df["Niyet"]
        .value_counts()
        .sort_index()
    )

    if not (train_sayilari == 60).all():
        raise ValueError(
            "Eğitim sınıfları 60'ar örnek içermiyor:\n"
            f"{train_sayilari.to_string()}"
        )

    if not (test_sayilari == 15).all():
        raise ValueError(
            "Test sınıfları 15'er örnek içermiyor:\n"
            f"{test_sayilari.to_string()}"
        )

    sizinti = set(
        train_df["Normal Metin"]
    ).intersection(
        set(test_df["Normal Metin"])
    )

    if sizinti:
        raise ValueError(
            "Eğitim-test metin sızıntısı bulundu:\n"
            + "\n".join(sorted(sizinti)[:20])
        )


# =========================================================
# ÖZELLİKLER VE MODELLER
# =========================================================

def metin_ozellikleri_olustur() -> FeatureUnion:
    kelime = TfidfVectorizer(
        lowercase=False,
        analyzer="word",
        ngram_range=(1, 3),
        min_df=1,
        max_df=1.0,
        sublinear_tf=True,
        norm="l2",
        max_features=9000,
    )

    karakter = TfidfVectorizer(
        lowercase=False,
        analyzer="char_wb",
        ngram_range=(3, 6),
        min_df=2,
        max_df=1.0,
        sublinear_tf=True,
        norm="l2",
        max_features=12000,
    )

    return FeatureUnion(
        transformer_list=[
            ("kelime", kelime),
            ("karakter", karakter),
        ],
        transformer_weights={
            "kelime": 1.0,
            "karakter": 0.75,
        },
    )


def modelleri_olustur() -> dict[str, Pipeline]:
    return {
        "Logistic Regression": Pipeline(
            steps=[
                (
                    "ozellikler",
                    metin_ozellikleri_olustur(),
                ),
                (
                    "model",
                    OneVsRestClassifier(
                        LogisticRegression(
                            C=3.0,
                            max_iter=1500,
                            solver="liblinear",
                            class_weight="balanced",
                            random_state=RANDOM_STATE,
                        ),
                        n_jobs=1,
                    ),
                ),
            ]
        ),
        "Linear SVM": Pipeline(
            steps=[
                (
                    "ozellikler",
                    metin_ozellikleri_olustur(),
                ),
                (
                    "model",
                    LinearSVC(
                        C=1.0,
                        class_weight="balanced",
                        random_state=RANDOM_STATE,
                    ),
                ),
            ]
        ),
        "Complement Naive Bayes": Pipeline(
            steps=[
                (
                    "ozellikler",
                    metin_ozellikleri_olustur(),
                ),
                (
                    "model",
                    ComplementNB(
                        alpha=0.25,
                    ),
                ),
            ]
        ),
    }


def final_model_olustur(
    model_adi: str,
) -> tuple[Pipeline, str]:
    if model_adi == "Linear SVM":
        return (
            Pipeline(
                steps=[
                    (
                        "ozellikler",
                        metin_ozellikleri_olustur(),
                    ),
                    (
                        "model",
                        CalibratedClassifierCV(
                            estimator=LinearSVC(
                                C=1.0,
                                class_weight="balanced",
                                random_state=RANDOM_STATE,
                            ),
                            method="sigmoid",
                            cv=5,
                        ),
                    ),
                ]
            ),
            "Kalibre Edilmiş Linear SVM",
        )

    return (
        modelleri_olustur()[model_adi],
        model_adi,
    )


# =========================================================
# METRİKLER
# =========================================================

def metrikleri_hesapla(
    y_true: pd.Series,
    y_pred: np.ndarray,
) -> dict[str, float]:
    return {
        "Bağımsız Test Accuracy": accuracy_score(
            y_true,
            y_pred,
        ),
        "Bağımsız Test Macro Precision": precision_score(
            y_true,
            y_pred,
            average="macro",
            zero_division=0,
        ),
        "Bağımsız Test Macro Recall": recall_score(
            y_true,
            y_pred,
            average="macro",
            zero_division=0,
        ),
        "Bağımsız Test Macro F1": f1_score(
            y_true,
            y_pred,
            average="macro",
            zero_division=0,
        ),
        "Bağımsız Test Weighted F1": f1_score(
            y_true,
            y_pred,
            average="weighted",
            zero_division=0,
        ),
    }


def parametre_sayisi_hesapla(
    pipeline: Pipeline,
) -> int | None:
    model = pipeline.named_steps["model"]
    toplam = 0

    for alan in (
        "coef_",
        "intercept_",
        "feature_log_prob_",
        "class_log_prior_",
    ):
        if hasattr(model, alan):
            toplam += int(
                np.asarray(
                    getattr(model, alan)
                ).size
            )

    if isinstance(model, OneVsRestClassifier):
        for tahminci in model.estimators_:
            if hasattr(tahminci, "coef_"):
                toplam += int(
                    np.asarray(
                        tahminci.coef_
                    ).size
                )
            if hasattr(tahminci, "intercept_"):
                toplam += int(
                    np.asarray(
                        tahminci.intercept_
                    ).size
                )

    return toplam or None


def confusion_matrix_kaydet(
    y_true: pd.Series,
    y_pred: np.ndarray,
    etiketler: list[str],
    model_adi: str,
) -> None:
    matris = confusion_matrix(
        y_true,
        y_pred,
        labels=etiketler,
    )

    fig, ax = plt.subplots(
        figsize=(22, 18)
    )

    ConfusionMatrixDisplay(
        confusion_matrix=matris,
        display_labels=etiketler,
    ).plot(
        ax=ax,
        cmap="Blues",
        xticks_rotation=90,
        values_format="d",
        colorbar=False,
    )

    ax.set_title(
        "KİTAPPUSULA Final Bağımsız Test Confusion Matrix\n"
        f"{model_adi}"
    )

    fig.tight_layout()
    fig.savefig(
        CONFUSION_MATRIX_PATH,
        dpi=200,
        bbox_inches="tight",
    )
    plt.close(fig)


def model_karsilastirma_grafigi_kaydet(
    sonuclar_df: pd.DataFrame,
) -> None:
    grafik_df = sonuclar_df.set_index(
        "Model"
    )[
        [
            "CV Macro F1 Ortalama",
            "Bağımsız Test Macro F1",
        ]
    ]

    ax = grafik_df.plot(
        kind="bar",
        figsize=(12, 7),
    )

    ax.set_title(
        "KİTAPPUSULA Final Niyet Modeli Karşılaştırması"
    )
    ax.set_xlabel("Model")
    ax.set_ylabel("Macro F1")
    ax.set_ylim(0, 1)
    ax.tick_params(
        axis="x",
        rotation=18,
    )

    fig = ax.get_figure()
    fig.tight_layout()
    fig.savefig(
        MODEL_COMPARISON_PATH,
        dpi=200,
        bbox_inches="tight",
    )
    plt.close(fig)


def json_uyumlu(
    deger: object,
) -> object:
    if isinstance(deger, numbers.Real):
        return float(deger)

    if pd.isna(deger):
        return None

    return deger


# =========================================================
# ANA EĞİTİM
# =========================================================

def main() -> None:
    klasorleri_hazirla()

    train_df = veri_yukle(
        TRAIN_DATA_PATH,
        "Final eğitim",
    )
    test_df = veri_yukle(
        TEST_DATA_PATH,
        "Final bağımsız test",
    )

    veri_kontrolu(
        train_df,
        test_df,
    )

    X_train = train_df["Normal Metin"]
    y_train = train_df["Niyet"]

    X_test = test_df["Normal Metin"]
    y_test = test_df["Niyet"]

    print("=" * 88)
    print("KİTAPPUSULA FINAL NİYET MODELİ EĞİTİMİ")
    print("=" * 88)
    print(f"Model sürümü              : {MODEL_VERSION}")
    print(f"Niyet sınıfı sayısı       : {y_train.nunique()}")
    print(f"Eğitim cümlesi            : {len(train_df):,}")
    print(f"Bağımsız test cümlesi     : {len(test_df):,}")
    print("Eğitim-test çakışması     : 0")

    cv = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=RANDOM_STATE,
    )

    modeller = modelleri_olustur()
    sonuclar: list[dict[str, object]] = []
    egitilmis_modeller: dict[str, Pipeline] = {}

    for model_adi, pipeline in modeller.items():
        print("\n" + "=" * 88)
        print(f"MODEL: {model_adi}")
        print("=" * 88)
        print("5-Fold Cross Validation çalıştırılıyor...")

        cv_skorlari = cross_val_score(
            pipeline,
            X_train,
            y_train,
            cv=cv,
            scoring="f1_macro",
            n_jobs=1,
            error_score="raise",
        )

        print(
            "CV Macro F1: "
            + ", ".join(
                f"{skor:.4f}"
                for skor in cv_skorlari
            )
        )
        print(
            f"CV ortalaması: "
            f"{cv_skorlari.mean():.4f}"
        )

        pipeline.fit(
            X_train,
            y_train,
        )

        tahminler = pipeline.predict(
            X_test
        )

        metrikler = metrikleri_hesapla(
            y_test,
            tahminler,
        )

        for ad, deger in metrikler.items():
            print(f"{ad:<34}: {deger:.4f}")

        parametre = parametre_sayisi_hesapla(
            pipeline
        )

        if parametre is not None:
            print(
                "Yaklaşık öğrenilen parametre   : "
                f"{parametre:,}"
            )

        sonuclar.append(
            {
                "Model": model_adi,
                "CV Macro F1 Ortalama": float(
                    cv_skorlari.mean()
                ),
                "CV Macro F1 Standart Sapma": float(
                    cv_skorlari.std()
                ),
                **metrikler,
                "Yaklaşık Parametre Sayısı": parametre,
            }
        )

        egitilmis_modeller[
            model_adi
        ] = pipeline

    sonuclar_df = pd.DataFrame(
        sonuclar
    ).sort_values(
        by=[
            "CV Macro F1 Ortalama",
            "Bağımsız Test Macro F1",
        ],
        ascending=False,
    ).reset_index(drop=True)

    sonuclar_df.to_csv(
        RESULTS_PATH,
        index=False,
        encoding="utf-8-sig",
    )

    print("\n" + "=" * 88)
    print("MODEL KARŞILAŞTIRMASI")
    print("=" * 88)
    print(
        sonuclar_df
        .round(4)
        .to_string(index=False)
    )

    model_karsilastirma_grafigi_kaydet(
        sonuclar_df
    )

    en_iyi_model_adi = str(
        sonuclar_df.iloc[0]["Model"]
    )

    en_iyi_model = egitilmis_modeller[
        en_iyi_model_adi
    ]

    test_tahminleri = en_iyi_model.predict(
        X_test
    )

    detayli_rapor = classification_report(
        y_test,
        test_tahminleri,
        digits=4,
        zero_division=0,
    )

    print("\n" + "=" * 88)
    print("EN İYİ NİYET MODELİ")
    print("=" * 88)
    print(f"Seçilen model: {en_iyi_model_adi}")
    print("\nBağımsız test sınıflandırma raporu:")
    print(detayli_rapor)

    REPORT_PATH.write_text(
        (
            f"Model sürümü: {MODEL_VERSION}\n"
            f"En iyi model: {en_iyi_model_adi}\n\n"
            f"{detayli_rapor}"
        ),
        encoding="utf-8",
    )

    etiketler = sorted(
        y_train.unique().tolist()
    )

    confusion_matrix_kaydet(
        y_true=y_test,
        y_pred=test_tahminleri,
        etiketler=etiketler,
        model_adi=en_iyi_model_adi,
    )

    hata_df = test_df[
        [
            "Metin",
            "Normal Metin",
            "Niyet",
        ]
    ].copy()

    hata_df["Tahmin"] = test_tahminleri
    hata_df["Doğru"] = (
        hata_df["Niyet"]
        == hata_df["Tahmin"]
    )

    hata_df.sort_values(
        by=[
            "Doğru",
            "Niyet",
        ]
    ).to_csv(
        ERROR_ANALYSIS_PATH,
        index=False,
        encoding="utf-8-sig",
    )

    en_iyi_sonuc = (
        sonuclar_df.iloc[0].to_dict()
    )

    METRICS_PATH.write_text(
        json.dumps(
            {
                anahtar: json_uyumlu(deger)
                for anahtar, deger
                in en_iyi_sonuc.items()
            },
            ensure_ascii=False,
            indent=4,
        ),
        encoding="utf-8",
    )

    print(
        "\nFinal model yalnızca eğitim verisiyle "
        "yeniden eğitiliyor..."
    )

    final_model, kaydedilen_model_adi = (
        final_model_olustur(
            en_iyi_model_adi
        )
    )

    final_model.fit(
        X_train,
        y_train,
    )

    paket = {
        "version": MODEL_VERSION,
        "model": final_model,
        "model_adi": kaydedilen_model_adi,
        "egitim_ornegi_sayisi": int(
            len(train_df)
        ),
        "bagimsiz_test_ornegi_sayisi": int(
            len(test_df)
        ),
        "sinif_sayisi": int(
            y_train.nunique()
        ),
        "siniflar": etiketler,
        "cv_macro_f1": float(
            sonuclar_df.iloc[0][
                "CV Macro F1 Ortalama"
            ]
        ),
        "test_macro_f1": float(
            sonuclar_df.iloc[0][
                "Bağımsız Test Macro F1"
            ]
        ),
        "test_accuracy": float(
            sonuclar_df.iloc[0][
                "Bağımsız Test Accuracy"
            ]
        ),
        "veri_yapisi": (
            "33 dengeli niyet; sınıf başına "
            "60 eğitim ve 15 bağımsız test"
        ),
        "kaynaklar": (
            "KitapPusula özel niyet verisi + "
            "MASSIVE tr-TR + özel temel sohbet verisi"
        ),
        "normalizasyon": (
            "Türkçe karakter sadeleştirme, "
            "küçük harf ve noktalama temizleme"
        ),
        "ozellikler": (
            "Kelime TF-IDF (1-3 gram) + "
            "karakter TF-IDF (3-6 gram)"
        ),
    }

    joblib.dump(
        paket,
        MODEL_PATH,
    )

    print("\n" + "=" * 88)
    print("FINAL NİYET MODELİ EĞİTİMİ TAMAMLANDI")
    print("=" * 88)
    print(f"Model              : {MODEL_PATH.resolve()}")
    print(f"Sonuçlar           : {RESULTS_PATH.resolve()}")
    print(f"Rapor              : {REPORT_PATH.resolve()}")
    print(f"Confusion matrix   : {CONFUSION_MATRIX_PATH.resolve()}")
    print(f"Hata analizi       : {ERROR_ANALYSIS_PATH.resolve()}")
    print(f"Karşılaştırma      : {MODEL_COMPARISON_PATH.resolve()}")


if __name__ == "__main__":
    main()
