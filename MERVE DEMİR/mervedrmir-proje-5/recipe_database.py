from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel


DEFAULT_RECIPE_DATA_PATH = Path(
    "data/processed/yemek_tarifleri.csv"
)


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


def tarif_sorgusunu_temizle(metin: object) -> str:
    normal = turkce_normalize(metin)

    kaliplar = (
        "bana",
        "lutfen",
        "kolay",
        "pratik",
        "tarifini verir misin",
        "tarifini ver",
        "tarifi verir misin",
        "tarifi ver",
        "tarif verir misin",
        "tarif ver",
        "tarif oner",
        "tarifini",
        "tarifi",
        "tarif",
        "nasil yapilir",
        "nasil pisirilir",
        "yapilisi nedir",
        "yapilisi",
        "malzemeleri neler",
        "malzemeleri ne",
    )

    for kalip in kaliplar:
        normal = normal.replace(
            turkce_normalize(kalip),
            " ",
        )

    return re.sub(r"\s+", " ", normal).strip()


@dataclass(frozen=True)
class TarifKaydi:
    tarif_id: int
    tarif_adi: str
    kategori: str
    malzemeler: str
    yapilis: str
    benzerlik: float = 1.0

    @property
    def malzeme_listesi(self) -> list[str]:
        return [
            parca.strip()
            for parca in str(self.malzemeler).split("|")
            if parca.strip()
        ]

    @property
    def yapilis_adimlari(self) -> list[str]:
        return [
            parca.strip()
            for parca in str(self.yapilis).split("|")
            if parca.strip()
        ]


class TarifVeritabani:
    """Yerel CSV içindeki Türkçe tarifleri TF-IDF ile arar."""

    def __init__(
        self,
        data_path: Path = DEFAULT_RECIPE_DATA_PATH,
    ) -> None:
        self.data_path = data_path
        self.df = self._veriyi_yukle()

        self.tam_ad_indeksi: dict[str, list[int]] = {}

        for indeks, normal_ad in enumerate(
            self.df["tarif_adi_norm"]
        ):
            self.tam_ad_indeksi.setdefault(
                normal_ad,
                [],
            ).append(indeks)

        self.vectorizer = TfidfVectorizer(
            analyzer="char_wb",
            ngram_range=(2, 5),
            min_df=1,
            sublinear_tf=True,
            norm="l2",
        )

        self.ad_matrisi = self.vectorizer.fit_transform(
            self.df["arama_metni"]
        )

    def _veriyi_yukle(self) -> pd.DataFrame:
        if not self.data_path.exists():
            raise FileNotFoundError(
                "Yerel tarif veri tabanı bulunamadı:\n"
                f"{self.data_path.resolve()}"
            )

        df = pd.read_csv(
            self.data_path,
            encoding="utf-8-sig",
        )

        gerekli = {
            "tarif_id",
            "tarif_adi",
            "kategori",
            "malzemeler",
            "yapilis",
        }

        eksik = gerekli.difference(df.columns)

        if eksik:
            raise ValueError(
                "Tarif veri tabanında eksik sütunlar var: "
                f"{sorted(eksik)}"
            )

        for sutun in (
            "tarif_adi",
            "kategori",
            "malzemeler",
            "yapilis",
        ):
            df[sutun] = (
                df[sutun]
                .fillna("")
                .astype(str)
                .str.strip()
            )

        df["tarif_adi_norm"] = df["tarif_adi"].map(
            turkce_normalize
        )

        df["kategori_norm"] = df["kategori"].map(
            turkce_normalize
        )

        df["arama_metni"] = (
            df["tarif_adi_norm"]
            + " "
            + df["kategori_norm"]
        ).str.strip()

        return df.reset_index(drop=True)

    def __len__(self) -> int:
        return len(self.df)

    def kaydi_olustur(
        self,
        indeks: int,
        benzerlik: float = 1.0,
    ) -> TarifKaydi:
        satir = self.df.iloc[int(indeks)]

        return TarifKaydi(
            tarif_id=int(satir["tarif_id"]),
            tarif_adi=str(satir["tarif_adi"]),
            kategori=str(satir["kategori"]),
            malzemeler=str(satir["malzemeler"]),
            yapilis=str(satir["yapilis"]),
            benzerlik=float(benzerlik),
        )

    def rastgele_tarif(
        self,
        haric_tarif_id: int | None = None,
        kategori: str | None = None,
        random_state: int | None = None,
    ) -> TarifKaydi:
        adaylar = self.df

        if haric_tarif_id is not None:
            adaylar = adaylar[
                adaylar["tarif_id"] != int(haric_tarif_id)
            ]

        if kategori:
            kategori_norm = turkce_normalize(kategori)
            kategori_adaylari = adaylar[
                adaylar["kategori_norm"] == kategori_norm
            ]

            if not kategori_adaylari.empty:
                adaylar = kategori_adaylari

        if adaylar.empty:
            raise RuntimeError(
                "Tarif veri tabanında seçilebilecek kayıt yok."
            )

        secilen = adaylar.sample(
            n=1,
            random_state=random_state,
        ).iloc[0]

        return self.kaydi_olustur(
            int(secilen.name),
            benzerlik=1.0,
        )

    def tarif_bul(
        self,
        sorgu: str,
        guven_esigi: float = 0.48,
        oner_esigi: float = 0.24,
        maksimum_oneri: int = 5,
    ) -> tuple[
        TarifKaydi | None,
        str,
        list[TarifKaydi],
    ]:
        temiz = tarif_sorgusunu_temizle(sorgu)

        if not temiz:
            temiz = turkce_normalize(sorgu)

        if not temiz:
            return None, "boş sorgu", []

        tam_indeksler = self.tam_ad_indeksi.get(
            temiz,
            [],
        )

        if tam_indeksler:
            return (
                self.kaydi_olustur(
                    tam_indeksler[0],
                    benzerlik=1.0,
                ),
                "tam eşleşme",
                [],
            )

        sorgu_vektoru = self.vectorizer.transform(
            [temiz]
        )

        skorlar = linear_kernel(
            sorgu_vektoru,
            self.ad_matrisi,
        ).ravel()

        sirali = np.argsort(skorlar)[::-1]
        oneriler: list[TarifKaydi] = []

        for indeks in sirali:
            skor = float(skorlar[indeks])

            if skor < oner_esigi:
                break

            oneriler.append(
                self.kaydi_olustur(
                    int(indeks),
                    benzerlik=skor,
                )
            )

            if len(oneriler) >= maksimum_oneri:
                break

        if not oneriler:
            return None, "bulunamadı", []

        en_iyi = oneriler[0]
        ikinci_skor = (
            oneriler[1].benzerlik
            if len(oneriler) > 1
            else 0.0
        )

        if (
            en_iyi.benzerlik >= guven_esigi
            and (
                en_iyi.benzerlik - ikinci_skor
            ) >= 0.04
        ):
            return (
                en_iyi,
                "benzer başlık eşleşmesi",
                [],
            )

        return (
            None,
            "belirsiz eşleşme",
            oneriler,
        )
