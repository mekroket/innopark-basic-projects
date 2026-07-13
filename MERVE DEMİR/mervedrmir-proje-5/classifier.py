from pathlib import Path
from typing import Any

import joblib
import numpy as np


MODEL_PATH = Path(
    "models/kitap_kategori_modeli.joblib"
)


class KitapKategoriSiniflandirici:
    """
    Eğitilmiş kitap kategori modelini yükler ve
    kitap açıklamasından tür tahmini yapar.
    """

    def __init__(
        self,
        model_path: Path = MODEL_PATH,
    ) -> None:
        self.model_path = model_path

        self.model_paketi: dict[str, Any] = {}
        self.model = None

        self.model_adi = ""
        self.kategoriler: list[str] = []
        self.egitim_kayit_sayisi = 0
        self.parametre_sayisi = None
        self.cv_macro_f1 = None
        self.test_macro_f1 = None

        self._modeli_yukle()

    def _modeli_yukle(self) -> None:
        if not self.model_path.exists():
            raise FileNotFoundError(
                "Model dosyası bulunamadı:\n"
                f"{self.model_path.resolve()}\n"
                "Önce python train.py çalıştır."
            )

        self.model_paketi = joblib.load(
            self.model_path
        )

        if not isinstance(
            self.model_paketi,
            dict,
        ):
            raise TypeError(
                "Model paketi geçerli bir sözlük değil."
            )

        if "model" not in self.model_paketi:
            raise KeyError(
                "Model paketinde 'model' alanı yok."
            )

        self.model = self.model_paketi["model"]

        self.model_adi = self.model_paketi.get(
            "model_adi",
            "Bilinmiyor",
        )

        self.kategoriler = self.model_paketi.get(
            "kategoriler",
            [],
        )

        self.egitim_kayit_sayisi = (
            self.model_paketi.get(
                "egitim_kayit_sayisi",
                0,
            )
        )

        self.parametre_sayisi = (
            self.model_paketi.get(
                "parametre_sayisi"
            )
        )

        self.cv_macro_f1 = (
            self.model_paketi.get(
                "cv_macro_f1"
            )
        )

        self.test_macro_f1 = (
            self.model_paketi.get(
                "test_macro_f1"
            )
        )

    @staticmethod
    def _metin_temizle(
        metin: str,
    ) -> str:
        return " ".join(
            str(metin).strip().split()
        )

    @staticmethod
    def _softmax(
        degerler: np.ndarray,
    ) -> np.ndarray:
        degerler = np.asarray(
            degerler,
            dtype=float,
        )

        degerler = (
            degerler
            - np.max(degerler)
        )

        uslu_degerler = np.exp(
            degerler
        )

        toplam = uslu_degerler.sum()

        if toplam == 0:
            return np.zeros_like(
                uslu_degerler
            )

        return uslu_degerler / toplam

    def _olasiliklari_hesapla(
        self,
        model_girdisi: list[str],
    ) -> dict[str, float]:
        siniflar = list(
            self.model.classes_
        )

        if hasattr(
            self.model,
            "predict_proba",
        ):
            olasiliklar = (
                self.model.predict_proba(
                    model_girdisi
                )[0]
            )

        elif hasattr(
            self.model,
            "decision_function",
        ):
            skorlar = (
                self.model.decision_function(
                    model_girdisi
                )
            )

            skorlar = np.asarray(
                skorlar
            )

            if skorlar.ndim > 1:
                skorlar = skorlar[0]

            olasiliklar = self._softmax(
                skorlar
            )

        else:
            return {}

        return {
            str(sinif): float(olasilik)
            for sinif, olasilik
            in zip(
                siniflar,
                olasiliklar,
            )
        }

    def tahmin_et(
        self,
        kitap_aciklamasi: str,
        kitap_adi: str = "",
        alternatif_sayisi: int = 3,
    ) -> dict[str, Any]:
        """
        Kitap adı yalnızca sonuç ekranında gösterilir.
        Model tahmininde yalnızca açıklama kullanılır.
        """

        temiz_aciklama = self._metin_temizle(
            kitap_aciklamasi
        )

        temiz_kitap_adi = self._metin_temizle(
            kitap_adi
        )

        if len(temiz_aciklama) < 30:
            raise ValueError(
                "Kitap açıklaması tahmin için çok kısa."
            )

        model_girdisi = [
            temiz_aciklama
        ]

        tahmin = str(
            self.model.predict(
                model_girdisi
            )[0]
        )

        olasiliklar = (
            self._olasiliklari_hesapla(
                model_girdisi
            )
        )

        sirali_olasiliklar = sorted(
            olasiliklar.items(),
            key=lambda eleman: eleman[1],
            reverse=True,
        )

        guven = (
            olasiliklar.get(
                tahmin,
                0.0,
            )
            * 100
        )

        alternatifler = [
            {
                "kategori": kategori,
                "guven": round(
                    olasilik * 100,
                    2,
                ),
            }
            for kategori, olasilik
            in sirali_olasiliklar[
                :max(1, alternatif_sayisi)
            ]
        ]

        return {
            "kitap_adi": (
                temiz_kitap_adi
                or "Belirtilmedi"
            ),
            "kategori": tahmin,
            "guven": round(
                guven,
                2,
            ),
            "alternatifler": alternatifler,
            "model_adi": self.model_adi,
        }

    def model_bilgisi(self) -> dict[str, Any]:
        return {
            "model_adi": self.model_adi,
            "kategoriler": self.kategoriler,
            "egitim_kayit_sayisi": (
                self.egitim_kayit_sayisi
            ),
            "parametre_sayisi": (
                self.parametre_sayisi
            ),
            "cv_macro_f1": (
                self.cv_macro_f1
            ),
            "test_macro_f1": (
                self.test_macro_f1
            ),
            "model_dosyasi": str(
                self.model_path.resolve()
            ),
        }


def terminal_testi() -> None:
    try:
        siniflandirici = (
            KitapKategoriSiniflandirici()
        )
    except Exception as hata:
        print(
            f"Model yüklenemedi: {hata}"
        )
        return

    bilgiler = (
        siniflandirici.model_bilgisi()
    )

    print("=" * 65)
    print("MODEL BİLGİLERİ")
    print("=" * 65)

    print(
        f"Model: {bilgiler['model_adi']}"
    )
    print(
        "Eğitim kayıt sayısı: "
        f"{bilgiler['egitim_kayit_sayisi']:,}"
    )

    while True:
        print("\n" + "-" * 65)

        kitap_adi = input(
            "Kitap adı: "
        ).strip()

        if kitap_adi.casefold() in {
            "çıkış",
            "cikis",
            "exit",
        }:
            break

        aciklama = input(
            "Kitap açıklaması: "
        ).strip()

        try:
            sonuc = siniflandirici.tahmin_et(
                kitap_adi=kitap_adi,
                kitap_aciklamasi=aciklama,
            )

            print(
                "\nTahmin: "
                f"{sonuc['kategori']}"
            )
            print(
                "Güven: "
                f"%{sonuc['guven']:.2f}"
            )

        except Exception as hata:
            print(
                f"Hata: {hata}"
            )


if __name__ == "__main__":
    terminal_testi()