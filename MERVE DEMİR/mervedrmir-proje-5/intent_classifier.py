from __future__ import annotations

from pathlib import Path
import re
from typing import Any

import joblib
import numpy as np


MODEL_PATH = Path("models/niyet_siniflandirici.joblib")
MODEL_VERSION = "7.2"


class Niyetler:
    KITAP_ARAMA = "KITAP_ARAMA"
    YAZAR = "YAZAR_SORUSU"
    KARAKTER = "KARAKTER_SORUSU"
    OLAY = "OLAY_SORUSU"
    SAYFA = "SAYFA_SORUSU"
    TUR = "TUR_SORUSU"
    OZET = "OZET_SORUSU"
    DETAY = "DETAY_SORUSU"
    SERBEST_KITAP = "SERBEST_KITAP_SORUSU"
    KITAP_ADI = "KITAP_ADI_SORUSU"
    TEKRAR = "TEKRAR_GOSTER"
    HER_KITAP = "HER_KITAP_SORUSU"
    KITAP_SAYISI = "KITAP_SAYISI"
    KATEGORILER = "KATEGORI_LISTESI"
    MODEL_BILGISI = "MODEL_BILGISI"
    YENI_SINIFLANDIR = "YENI_KITAP_SINIFLANDIR"
    YARDIM = "YARDIM"
    SELAMLAMA = "SELAMLAMA"
    NASILSIN = "NASILSIN"
    GENEL_SOHBET = "GENEL_SOHBET"
    ALAN_DISI = "ALAN_DISI"

    BOT_KIMLIK = "BOT_KIMLIK"
    BOT_KONUM = "BOT_KONUM"
    BOT_YARATICI = "BOT_YARATICI"
    BOT_YAS = "BOT_YAS"
    BOT_YETENEK = "BOT_YETENEK"
    TESEKKUR = "TESEKKUR"
    VEDA = "VEDA"
    SAKA_ISTEGI = "SAKA_ISTEGI"

    HAVA = "HAVA_SORUSU"
    TARIH_SAAT = "TARIH_SAAT_SORUSU"
    YEMEK_TARIFI = "YEMEK_TARIFI_SORUSU"
    HABER = "HABER_SORUSU"


TUM_NIYETLER = (
    Niyetler.KITAP_ARAMA,
    Niyetler.YAZAR,
    Niyetler.KARAKTER,
    Niyetler.OLAY,
    Niyetler.SAYFA,
    Niyetler.TUR,
    Niyetler.OZET,
    Niyetler.DETAY,
    Niyetler.SERBEST_KITAP,
    Niyetler.KITAP_ADI,
    Niyetler.TEKRAR,
    Niyetler.HER_KITAP,
    Niyetler.KITAP_SAYISI,
    Niyetler.KATEGORILER,
    Niyetler.MODEL_BILGISI,
    Niyetler.YENI_SINIFLANDIR,
    Niyetler.YARDIM,
    Niyetler.SELAMLAMA,
    Niyetler.NASILSIN,
    Niyetler.GENEL_SOHBET,
    Niyetler.ALAN_DISI,
    Niyetler.BOT_KIMLIK,
    Niyetler.BOT_KONUM,
    Niyetler.BOT_YARATICI,
    Niyetler.BOT_YAS,
    Niyetler.BOT_YETENEK,
    Niyetler.TESEKKUR,
    Niyetler.VEDA,
    Niyetler.SAKA_ISTEGI,
    Niyetler.HAVA,
    Niyetler.TARIH_SAAT,
    Niyetler.YEMEK_TARIFI,
    Niyetler.HABER,
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




class NiyetSiniflandirici:
    """Yerel niyet modelini yükler ve tahminleri yalnızca ML ile üretir."""

    def __init__(
        self,
        model_path: Path = MODEL_PATH,
    ) -> None:
        self.model_path = model_path
        self.model: Any = None
        self.model_adi = "Bilinmiyor"
        self.egitim_ornegi_sayisi = 0
        self.bagimsiz_test_ornegi_sayisi = 0
        self.cv_macro_f1: float | None = None
        self.test_macro_f1: float | None = None
        self.test_accuracy: float | None = None
        self._modeli_yukle()

    def _modeli_yukle(self) -> None:
        if not self.model_path.exists():
            raise FileNotFoundError(
                "Final niyet modeli bulunamadı:\n"
                f"{self.model_path.resolve()}\n"
                "Önce python train_intent.py çalıştır."
            )

        paket = joblib.load(self.model_path)

        if not isinstance(paket, dict) or "model" not in paket:
            raise TypeError(
                "Final niyet modeli paketi geçerli değil."
            )

        if str(paket.get("version")) != MODEL_VERSION:
            raise ValueError(
                "Niyet modeli eğitim sürümü kodla uyumlu değil.\n"
                "python train_intent.py komutunu yeniden çalıştır."
            )

        self.model = paket["model"]
        self.model_adi = str(
            paket.get("model_adi", "Bilinmiyor")
        )
        self.egitim_ornegi_sayisi = int(
            paket.get("egitim_ornegi_sayisi", 0)
        )
        self.bagimsiz_test_ornegi_sayisi = int(
            paket.get("bagimsiz_test_ornegi_sayisi", 0)
        )
        self.cv_macro_f1 = paket.get("cv_macro_f1")
        self.test_macro_f1 = paket.get("test_macro_f1")
        self.test_accuracy = paket.get("test_accuracy")

    @staticmethod
    def _softmax(degerler: np.ndarray) -> np.ndarray:
        degerler = np.asarray(degerler, dtype=float)
        degerler = degerler - np.max(degerler)
        uslu = np.exp(degerler)
        toplam = float(uslu.sum())

        if toplam == 0:
            return np.zeros_like(uslu)

        return uslu / toplam

    def _olasiliklari_hesapla(
        self,
        girdi: list[str],
    ) -> np.ndarray:
        if hasattr(self.model, "predict_proba"):
            return np.asarray(
                self.model.predict_proba(girdi)[0],
                dtype=float,
            )

        if hasattr(self.model, "decision_function"):
            skorlar = np.asarray(
                self.model.decision_function(girdi)
            )

            if skorlar.ndim > 1:
                skorlar = skorlar[0]

            return self._softmax(skorlar)

        raise RuntimeError(
            "Final niyet modeli olasılık veya karar skoru üretmiyor."
        )

    def tahmin_et(
        self,
        metin: str,
        alternatif_sayisi: int = 3,
    ) -> dict[str, Any]:
        """Kullanıcı metnini yalnızca eğitilmiş ML modeliyle sınıflandırır."""

        temiz = turkce_normalize(metin)

        if not temiz:
            return {
                "niyet": Niyetler.GENEL_SOHBET,
                "guven": 0.0,
                "fark": 0.0,
                "alternatifler": [],
                "kaynak": "bos_girdi",
            }

        olasiliklar = self._olasiliklari_hesapla([temiz])
        siniflar = np.asarray(self.model.classes_)
        sirali = np.argsort(olasiliklar)[::-1]

        alternatifler = [
            {
                "niyet": str(siniflar[indeks]),
                "guven": round(
                    float(olasiliklar[indeks]) * 100,
                    2,
                ),
            }
            for indeks in sirali[: max(2, alternatif_sayisi)]
        ]

        en_iyi = alternatifler[0]
        ikinci = (
            alternatifler[1]
            if len(alternatifler) > 1
            else {"guven": 0.0}
        )

        return {
            "niyet": en_iyi["niyet"],
            "guven": en_iyi["guven"],
            "fark": round(
                float(en_iyi["guven"])
                - float(ikinci["guven"]),
                2,
            ),
            "alternatifler": alternatifler[
                :alternatif_sayisi
            ],
            "kaynak": "makine_ogrenmesi",
        }


    def model_bilgisi(self) -> dict[str, Any]:
        return {
            "model_adi": self.model_adi,
            "egitim_ornegi_sayisi": self.egitim_ornegi_sayisi,
            "bagimsiz_test_ornegi_sayisi": (
                self.bagimsiz_test_ornegi_sayisi
            ),
            "sinif_sayisi": len(self.model.classes_),
            "siniflar": list(self.model.classes_),
            "cv_macro_f1": self.cv_macro_f1,
            "test_macro_f1": self.test_macro_f1,
            "test_accuracy": self.test_accuracy,
            "model_surumu": MODEL_VERSION,
            "model_dosyasi": str(
                self.model_path.resolve()
            ),
        }


if __name__ == "__main__":
    siniflandirici = NiyetSiniflandirici()

    print("=" * 76)
    print("KİTAPPUSULA FINAL NİYET SINIFLANDIRICI")
    print("=" * 76)
    print("Çıkmak için 'çıkış' yaz.")

    while True:
        metin = input("\nMesaj: ").strip()

        if turkce_normalize(metin) in {
            "cikis",
            "exit",
            "quit",
        }:
            break

        sonuc = siniflandirici.tahmin_et(metin)

        print(f"Niyet: {sonuc['niyet']}")
        print(f"Güven: %{sonuc['guven']:.2f}")
        print(f"İlk iki tahmin farkı: %{sonuc['fark']:.2f}")
        print(f"Kaynak: {sonuc['kaynak']}")
