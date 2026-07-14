from pathlib import Path
import json
import numbers

import joblib
import matplotlib.pyplot as plt
import pandas as pd

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
    train_test_split,
)
from sklearn.naive_bayes import ComplementNB
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.svm import LinearSVC


# =========================================================
# DOSYA YOLLARI
# =========================================================

DATA_PATH = Path(
    "data/processed/kitaplar_egitim.csv"
)

MODELS_DIR = Path("models")
REPORTS_DIR = Path("reports")

MODEL_PATH = (
    MODELS_DIR
    / "kitap_kategori_modeli.joblib"
)

RESULTS_PATH = (
    REPORTS_DIR
    / "model_sonuclari.csv"
)

METRICS_PATH = (
    REPORTS_DIR
    / "en_iyi_model_metrikleri.json"
)

REPORT_PATH = (
    REPORTS_DIR
    / "siniflandirma_raporu.txt"
)

CONFUSION_MATRIX_PATH = (
    REPORTS_DIR
    / "confusion_matrix.png"
)

MODEL_COMPARISON_PATH = (
    REPORTS_DIR
    / "model_karsilastirma.png"
)

RANDOM_STATE = 42


def klasorleri_hazirla() -> None:
    MODELS_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    REPORTS_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )


def veri_yukle() -> tuple[pd.Series, pd.Series]:
    """
    Model artık kitap adını kullanmaz.

    Kişi adlarının biyografi sınıfına yanlış yönlendirme
    yapmasını azaltmak için yalnızca açıklama kullanılır.
    """

    if not DATA_PATH.exists():
        raise FileNotFoundError(
            "İşlenmiş veri seti bulunamadı:\n"
            f"{DATA_PATH.resolve()}"
        )

    df = pd.read_csv(
        DATA_PATH
    )

    gerekli_sutunlar = {
        "Kitap Açıklaması",
        "Kategori",
    }

    eksik_sutunlar = (
        gerekli_sutunlar
        .difference(df.columns)
    )

    if eksik_sutunlar:
        raise ValueError(
            "Eksik sütunlar: "
            f"{sorted(eksik_sutunlar)}"
        )

    df = df.dropna(
        subset=[
            "Kitap Açıklaması",
            "Kategori",
        ]
    ).copy()

    df["Kitap Açıklaması"] = (
        df["Kitap Açıklaması"]
        .astype(str)
        .str.replace(
            r"<[^>]+>",
            " ",
            regex=True,
        )
        .str.replace(
            r"\s+",
            " ",
            regex=True,
        )
        .str.strip()
    )

    df["Kategori"] = (
        df["Kategori"]
        .astype(str)
        .str.strip()
    )

    X = df["Kitap Açıklaması"]
    y = df["Kategori"]

    print("=" * 70)
    print("VERİ SETİ BİLGİLERİ")
    print("=" * 70)

    print(
        f"Toplam kayıt: {len(df):,}"
    )
    print(
        f"Kategori sayısı: {y.nunique()}"
    )

    print("\nKategori dağılımı:")

    print(
        y.value_counts()
        .sort_index()
        .to_string()
    )

    return X, y


def metin_ozellikleri_olustur() -> FeatureUnion:
    """
    Daha geniş kelime ve karakter özellikleri oluşturur.
    """

    kelime_tfidf = TfidfVectorizer(
        lowercase=True,
        strip_accents=None,
        max_features=14000,
        ngram_range=(1, 3),
        min_df=2,
        max_df=0.98,
        sublinear_tf=True,
        norm="l2",
    )

    karakter_tfidf = TfidfVectorizer(
        analyzer="char_wb",
        lowercase=True,
        max_features=14000,
        ngram_range=(3, 6),
        min_df=3,
        sublinear_tf=True,
        norm="l2",
    )

    return FeatureUnion(
        transformer_list=[
            (
                "kelime_tfidf",
                kelime_tfidf,
            ),
            (
                "karakter_tfidf",
                karakter_tfidf,
            ),
        ],
        transformer_weights={
            "kelime_tfidf": 1.0,
            "karakter_tfidf": 0.55,
        },
    )


def modelleri_olustur() -> dict[str, Pipeline]:
    """
    Üç farklı sınıflandırma algoritması oluşturur.
    """

    return {
        "Logistic Regression": Pipeline(
            steps=[
                (
                    "tfidf",
                    metin_ozellikleri_olustur(),
                ),
                (
                    "model",
                    LogisticRegression(
                        C=3.0,
                        max_iter=3000,
                        solver="lbfgs",
                        class_weight="balanced",
                        random_state=RANDOM_STATE,
                    ),
                ),
            ]
        ),

        "Linear SVM": Pipeline(
            steps=[
                (
                    "tfidf",
                    metin_ozellikleri_olustur(),
                ),
                (
                    "model",
                    LinearSVC(
                        C=0.8,
                        class_weight="balanced",
                        random_state=RANDOM_STATE,
                    ),
                ),
            ]
        ),

        "Complement Naive Bayes": Pipeline(
            steps=[
                (
                    "tfidf",
                    metin_ozellikleri_olustur(),
                ),
                (
                    "model",
                    ComplementNB(
                        alpha=0.35,
                    ),
                ),
            ]
        ),
    }


def metrikleri_hesapla(
    gercek: pd.Series,
    tahminler,
) -> dict[str, float]:
    return {
        "Test Accuracy": accuracy_score(
            gercek,
            tahminler,
        ),
        "Test Macro Precision": precision_score(
            gercek,
            tahminler,
            average="macro",
            zero_division=0,
        ),
        "Test Macro Recall": recall_score(
            gercek,
            tahminler,
            average="macro",
            zero_division=0,
        ),
        "Test Macro F1": f1_score(
            gercek,
            tahminler,
            average="macro",
            zero_division=0,
        ),
        "Test Weighted F1": f1_score(
            gercek,
            tahminler,
            average="weighted",
            zero_division=0,
        ),
    }


def parametre_sayisi_hesapla(
    pipeline: Pipeline,
) -> int | None:
    model = pipeline.named_steps["model"]

    toplam = 0

    if hasattr(model, "coef_"):
        toplam += int(
            model.coef_.size
        )

    if hasattr(model, "intercept_"):
        toplam += int(
            model.intercept_.size
        )

    if hasattr(model, "feature_log_prob_"):
        toplam += int(
            model.feature_log_prob_.size
        )

    if hasattr(model, "class_log_prior_"):
        toplam += int(
            model.class_log_prior_.size
        )

    return toplam if toplam else None


def confusion_matrix_kaydet(
    y_test: pd.Series,
    tahminler,
    etiketler: list[str],
    model_adi: str,
) -> None:
    matris = confusion_matrix(
        y_test,
        tahminler,
        labels=etiketler,
    )

    fig, ax = plt.subplots(
        figsize=(13, 10)
    )

    ConfusionMatrixDisplay(
        confusion_matrix=matris,
        display_labels=etiketler,
    ).plot(
        ax=ax,
        cmap="Blues",
        xticks_rotation=45,
        values_format="d",
    )

    ax.set_title(
        "Kitap Kategorisi Confusion Matrix\n"
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
    grafik_df = (
        sonuclar_df
        .set_index("Model")
        [
            [
                "CV Macro F1 Ortalama",
                "Test Macro F1",
            ]
        ]
    )

    ax = grafik_df.plot(
        kind="bar",
        figsize=(11, 7),
    )

    ax.set_title(
        "Model Performans Karşılaştırması"
    )
    ax.set_xlabel(
        "Model"
    )
    ax.set_ylabel(
        "Macro F1 Skoru"
    )
    ax.set_ylim(
        0,
        1,
    )
    ax.tick_params(
        axis="x",
        rotation=20,
    )

    fig = ax.get_figure()
    fig.tight_layout()

    fig.savefig(
        MODEL_COMPARISON_PATH,
        dpi=200,
        bbox_inches="tight",
    )

    plt.close(fig)


def json_uyumlu_deger(deger):
    if isinstance(deger, numbers.Real):
        return float(deger)

    return deger


def main() -> None:
    klasorleri_hazirla()

    X, y = veri_yukle()

    (
        X_train,
        X_test,
        y_train,
        y_test,
    ) = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    print("\n" + "=" * 70)
    print("EĞİTİM VE TEST AYRIMI")
    print("=" * 70)

    print(
        f"Eğitim verisi: {len(X_train):,}"
    )
    print(
        f"Test verisi: {len(X_test):,}"
    )

    modeller = modelleri_olustur()

    cv = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=RANDOM_STATE,
    )

    sonuclar = []
    egitilmis_modeller = {}

    for model_adi, pipeline in modeller.items():
        print("\n" + "=" * 70)
        print(
            f"MODEL: {model_adi}"
        )
        print("=" * 70)

        print(
            "5-Fold Cross Validation çalıştırılıyor..."
        )

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
            "CV Macro F1 skorları: "
            + ", ".join(
                f"{skor:.4f}"
                for skor in cv_skorlari
            )
        )

        print(
            "Ortalama CV Macro F1: "
            f"{cv_skorlari.mean():.4f}"
        )

        print(
            "Model eğitim verisi üzerinde eğitiliyor..."
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

        for metrik_adi, deger in metrikler.items():
            print(
                f"{metrik_adi:<24}: {deger:.4f}"
            )

        parametre_sayisi = (
            parametre_sayisi_hesapla(
                pipeline
            )
        )

        if parametre_sayisi:
            print(
                "Yaklaşık öğrenilen parametre: "
                f"{parametre_sayisi:,}"
            )

        sonuclar.append(
            {
                "Model": model_adi,
                "CV Macro F1 Ortalama": (
                    cv_skorlari.mean()
                ),
                "CV Macro F1 Standart Sapma": (
                    cv_skorlari.std()
                ),
                **metrikler,
                "Yaklaşık Parametre Sayısı": (
                    parametre_sayisi
                ),
            }
        )

        egitilmis_modeller[
            model_adi
        ] = pipeline

    sonuclar_df = pd.DataFrame(
        sonuclar
    )

    sonuclar_df = (
        sonuclar_df
        .sort_values(
            by="CV Macro F1 Ortalama",
            ascending=False,
        )
        .reset_index(drop=True)
    )

    sonuclar_df.to_csv(
        RESULTS_PATH,
        index=False,
        encoding="utf-8-sig",
    )

    print("\n" + "=" * 70)
    print("MODEL KARŞILAŞTIRMASI")
    print("=" * 70)

    gosterilecek_df = sonuclar_df.copy()

    sayisal_sutunlar = (
        gosterilecek_df
        .select_dtypes(
            include="number"
        )
        .columns
    )

    gosterilecek_df[
        sayisal_sutunlar
    ] = (
        gosterilecek_df[
            sayisal_sutunlar
        ].round(4)
    )

    print(
        gosterilecek_df.to_string(
            index=False
        )
    )

    model_karsilastirma_grafigi_kaydet(
        sonuclar_df
    )

    en_iyi_model_adi = (
        sonuclar_df.iloc[0]["Model"]
    )

    en_iyi_model = (
        egitilmis_modeller[
            en_iyi_model_adi
        ]
    )

    test_tahminleri = (
        en_iyi_model.predict(
            X_test
        )
    )

    print("\n" + "=" * 70)
    print("EN İYİ MODEL")
    print("=" * 70)

    print(
        f"Seçilen model: {en_iyi_model_adi}"
    )

    detayli_rapor = classification_report(
        y_test,
        test_tahminleri,
        digits=4,
        zero_division=0,
    )

    print("\nSınıflandırma raporu:")
    print(detayli_rapor)

    REPORT_PATH.write_text(
        (
            f"En iyi model: {en_iyi_model_adi}\n\n"
            f"{detayli_rapor}"
        ),
        encoding="utf-8",
    )

    etiketler = sorted(
        y.unique().tolist()
    )

    confusion_matrix_kaydet(
        y_test=y_test,
        tahminler=test_tahminleri,
        etiketler=etiketler,
        model_adi=en_iyi_model_adi,
    )

    en_iyi_sonuc = (
        sonuclar_df.iloc[0].to_dict()
    )

    METRICS_PATH.write_text(
        json.dumps(
            {
                anahtar: json_uyumlu_deger(deger)
                for anahtar, deger
                in en_iyi_sonuc.items()
            },
            ensure_ascii=False,
            indent=4,
        ),
        encoding="utf-8",
    )

    print(
        "\nEn iyi model bütün veri setiyle "
        "yeniden eğitiliyor..."
    )

    final_model = modelleri_olustur()[
        en_iyi_model_adi
    ]

    final_model.fit(
        X,
        y,
    )

    final_parametre_sayisi = (
        parametre_sayisi_hesapla(
            final_model
        )
    )

    model_paketi = {
        "model": final_model,
        "model_adi": en_iyi_model_adi,
        "kategoriler": etiketler,
        "egitim_kayit_sayisi": len(X),
        "metin_olusturma": "Yalnızca Kitap Açıklaması",
        "parametre_sayisi": final_parametre_sayisi,
        "cv_macro_f1": float(
            sonuclar_df.iloc[0][
                "CV Macro F1 Ortalama"
            ]
        ),
        "test_macro_f1": float(
            sonuclar_df.iloc[0][
                "Test Macro F1"
            ]
        ),
    }

    joblib.dump(
        model_paketi,
        MODEL_PATH,
    )

    print("\n" + "=" * 70)
    print("EĞİTİM TAMAMLANDI")
    print("=" * 70)

    print(
        f"Model dosyası:\n{MODEL_PATH.resolve()}"
    )
    print(
        f"\nModel sonuçları:\n{RESULTS_PATH.resolve()}"
    )
    print(
        f"\nConfusion matrix:\n"
        f"{CONFUSION_MATRIX_PATH.resolve()}"
    )
    print(
        f"\nModel karşılaştırma grafiği:\n"
        f"{MODEL_COMPARISON_PATH.resolve()}"
    )

    if final_parametre_sayisi:
        print(
            "\nFinal modelin yaklaşık parametre sayısı: "
            f"{final_parametre_sayisi:,}"
        )


if __name__ == "__main__":
    main()