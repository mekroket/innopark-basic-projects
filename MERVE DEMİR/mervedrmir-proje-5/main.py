from __future__ import annotations

from difflib import SequenceMatcher
from html import unescape
from pathlib import Path
from datetime import datetime
import re
import textwrap
from typing import Any

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer

from classifier import KitapKategoriSiniflandirici
from intent_classifier import Niyetler, NiyetSiniflandirici
from recipe_database import (
    TarifKaydi,
    TarifVeritabani,
    tarif_sorgusunu_temizle,
)


# =========================================================
# AYARLAR
# =========================================================

RAW_DATA_PATH = Path("data/raw/tum_kitaplar.csv")

WRAP_WIDTH = 88
SUMMARY_SENTENCE_COUNT = 2
SUMMARY_MAX_LENGTH = 430
INTENT_CONFIDENCE_THRESHOLD = 35.0
INTENT_MARGIN_THRESHOLD = 8.0
CONTEXT_INTENT_CONFIDENCE_THRESHOLD = 40.0


# =========================================================
# DOĞRULANMIŞ YEREL KİTAP DÜZELTMELERİ
# =========================================================
#
# Ham veri setindeki bazı kayıtlar yanlış tür, yanlış açıklama veya
# başka bir metinden alınmış tanıtım paragrafı içerebilir.
# Bu katman yalnızca açıkça doğrulanmış kayıtları düzeltir.
#
# Aynı başlıklı farklı eserlerin karışmaması için hem kitap adı hem
# yazar adı birlikte kontrol edilir.

AUTHOR_ALIASES = {
    "anton pavlovic cehov": "anton cehov",
    "anton p cehov": "anton cehov",
    "a p cehov": "anton cehov",
}










def yazar_kanonik_adi(yazar: object) -> str:
    normal = turkce_normalize(yazar)
    return AUTHOR_ALIASES.get(normal, normal)


VERIFIED_BOOK_CORRECTIONS = [
    {
        "kitap_adi": "Martı",
        "yazar": "Anton Çehov",
        "sayfa": (
            "Baskıya ve çeviriye göre değişir; "
            "genellikle yaklaşık 80-100 sayfa"
        ),
        "tur": "Tiyatro Oyunu (Dram/Komedi)",
        "ozet": (
            "Anton Çehov'un dört perdelik Martı adlı oyunu; sanat, aşk, "
            "hayal kırıklığı ve kuşaklar arası çatışma temalarını işler. "
            "Sorin'in taşradaki çiftliğinde bir araya gelen aktris Irina "
            "Arkadina, onun yazar olmak isteyen oğlu Konstantin Treplev, "
            "oyuncu olmayı düşleyen Nina Zareçnaya ve yazar Boris Trigorin "
            "arasındaki karmaşık ilişkiler anlatılır. Treplev'in yeni bir "
            "sanat anlayışı kurma çabası ile Nina'nın sahne hayali, "
            "karşılıksız aşklar ve sanatsal varoluş sancılarıyla kesişir."
        ),
        "aciklama": (
            "Martı, Anton Çehov tarafından yazılmış dört perdelik bir "
            "tiyatro oyunudur. Olaylar Sorin'in taşradaki çiftliğinde geçer. "
            "Ünlü aktris Irina Arkadina, onun deneysel bir yazar olmak "
            "isteyen oğlu Konstantin Treplev, oyunculuk hayalleri kuran "
            "Nina Zareçnaya ve tanınmış yazar Boris Trigorin oyunun temel "
            "karakterleridir. Treplev yeni bir tiyatro dili ararken hem "
            "annesinin küçümseyici tavrıyla hem de Nina'ya duyduğu "
            "karşılıksız aşkla mücadele eder. Nina ise Trigorin'e yaklaşır "
            "ve sahneye çıkma hayalinin peşinden gider. Oyun; sanatçı olma "
            "arzusu, başarısızlık korkusu, karşılıksız aşk, kuşak çatışması "
            "ve hayal kırıklığı temalarını işler. Birinci perde, Sorin'in "
            "çiftliğindeki parkta, gölün önüne kurulmuş geçici tiyatro "
            "sahnesinde ve güneşin yeni battığı bir atmosferde açılır."
        ),
        "not": (
            "Bu kayıt, ham veri setindeki yanlış roman etiketi ve "
            "konu dışı açıklama yerine doğrulanmış yerel düzeltme kullanır."
        ),
    },
]


# =========================================================
# KATEGORİ KURALLARI
# =========================================================

CATEGORY_RULES = [
    ("Polisiye", ["polisiye"]),
    (
        "Bilimkurgu-Fantazya",
        ["bilimkurgu-fantazya"],
    ),
    (
        "Biyografi-Otobiyografi",
        ["biyografi-otobiyografi"],
    ),
    (
        "Anı",
        ["anı (hatırat)"],
    ),
    (
        "Deneme",
        [
            "deneme (yerli)",
            "deneme (çeviri)",
        ],
    ),
    (
        "Hikâye",
        [
            "hikaye (yerli)",
            "hikaye (çeviri)",
        ],
    ),
    (
        "Şiir",
        [
            "şiir (yerli)",
            "şiir (çeviri)",
        ],
    ),
    (
        "Roman",
        [
            "roman (yerli)",
            "roman (çeviri)",
        ],
    ),
]


# =========================================================
# ÖZETLEME AYARLARI
# =========================================================

TURKISH_STOP_WORDS = {
    "acaba",
    "ama",
    "ancak",
    "artık",
    "aslında",
    "az",
    "bazı",
    "belki",
    "ben",
    "bana",
    "beni",
    "benim",
    "bile",
    "bir",
    "biraz",
    "birçok",
    "biri",
    "birkaç",
    "biz",
    "bize",
    "bizi",
    "bizim",
    "bu",
    "buna",
    "bunda",
    "bundan",
    "bunlar",
    "bunu",
    "bunun",
    "çok",
    "çünkü",
    "da",
    "daha",
    "de",
    "değil",
    "diğer",
    "diye",
    "dolayı",
    "en",
    "gibi",
    "göre",
    "hem",
    "hep",
    "hepsi",
    "her",
    "hiç",
    "için",
    "ile",
    "ise",
    "kadar",
    "karşı",
    "kendi",
    "ki",
    "kim",
    "mi",
    "mı",
    "mu",
    "mü",
    "nasıl",
    "ne",
    "neden",
    "nerede",
    "o",
    "olan",
    "olarak",
    "oldu",
    "olduğu",
    "olmak",
    "olsa",
    "olup",
    "onlar",
    "onu",
    "onun",
    "öyle",
    "pek",
    "rağmen",
    "sana",
    "sen",
    "seni",
    "senin",
    "sonra",
    "şey",
    "şimdi",
    "şöyle",
    "tüm",
    "ve",
    "veya",
    "ya",
    "yani",
    "yerine",
    "yine",
    "yok",
    "zaten",
}

PROMOTIONAL_PATTERNS = [
    "publishers weekly",
    "tanıtım bülteninden",
    "çok satan",
    "okurlarını bekliyor",
    "kitapseverlerle buluşuyor",
    "mutlaka okuyun",
    "kaçırılmayacak",
    "yeni baskısıyla",
    "özel baskı",
    "yayınları tarafından",
    "okuyucuyla buluşuyor",
    "raflardaki yerini aldı",
    "satın alınmıştır",
    "bu üründen",
]

SUMMARY_KEYWORDS = {
    "anlatır",
    "anlatan",
    "anlatıyor",
    "konu",
    "konusu",
    "hikâye",
    "hikayesi",
    "roman",
    "eser",
    "kahraman",
    "karakter",
    "yaşam",
    "hayat",
    "yolculuk",
    "mücadele",
    "macera",
    "olay",
    "öykü",
}


# =========================================================
# METİN İŞLEMLERİ
# =========================================================

def metin_temizle(metin: object) -> str:
    """HTML etiketlerini ve fazla boşlukları temizler."""

    if pd.isna(metin):
        return ""

    temiz = unescape(str(metin))
    temiz = re.sub(r"<[^>]+>", " ", temiz)
    temiz = temiz.replace("\u00a0", " ")

    temiz = (
        temiz.replace("“", '"')
        .replace("”", '"')
        .replace("„", '"')
        .replace("‟", '"')
        .replace("’", "'")
        .replace("‘", "'")
    )

    temiz = re.sub(
        r'([.!?]["\']?)(?=[A-ZÇĞİÖŞÜ])',
        r"\1 ",
        temiz,
    )

    temiz = re.sub(r"\s+", " ", temiz).strip()

    return temiz


def turkce_normalize(metin: object) -> str:
    """Türkçe metni arama ve kural kontrolü için sadeleştirir."""

    temiz = metin_temizle(metin)

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
    temiz = re.sub(r"\s+", " ", temiz).strip()

    return temiz


def dogrulanmis_duzeltmeyi_bul(
    kitap_adi: object,
    yazar: object,
) -> dict[str, str] | None:
    """Kitap adı ve yazar birlikte eşleşirse doğrulanmış düzeltmeyi döndürür."""

    kitap_norm = turkce_normalize(kitap_adi)
    yazar_norm = yazar_kanonik_adi(yazar)

    for duzeltme in VERIFIED_BOOK_CORRECTIONS:
        if (
            kitap_norm
            == turkce_normalize(duzeltme["kitap_adi"])
            and yazar_norm
            == yazar_kanonik_adi(duzeltme["yazar"])
        ):
            return duzeltme

    return None


def dogrulanmis_duzeltmeyi_uygula(
    kayit: pd.Series,
) -> pd.Series:
    """Ham veri kaydının kopyasına doğrulanmış alanları uygular."""

    duzeltme = dogrulanmis_duzeltmeyi_bul(
        kayit.get("Kitap Adı", ""),
        kayit.get("Yazar", ""),
    )

    if duzeltme is None:
        sonuc = kayit.copy()
        sonuc["_dogrulanmis_duzeltme"] = False
        sonuc["_dogrulanmis_not"] = ""
        return sonuc

    sonuc = kayit.copy()
    sonuc["Sayfa Sayısı"] = duzeltme["sayfa"]
    sonuc["İlgili Kategoriler"] = duzeltme["tur"]
    sonuc["Kitap Açıklaması"] = duzeltme["aciklama"]
    sonuc["_dogrulanmis_ozet"] = duzeltme["ozet"]
    sonuc["_dogrulanmis_duzeltme"] = True
    sonuc["_dogrulanmis_not"] = duzeltme["not"]

    return sonuc


def temel_kitap_adi(metin: object) -> str:
    """Başlıktaki baskı ve kapak bilgilerini kaldırır."""

    temiz = metin_temizle(metin)
    temiz = re.sub(r"\([^)]*\)", " ", temiz)
    temiz = re.sub(r"\[[^\]]*\]", " ", temiz)
    temiz = re.split(r"\s+[|–—]\s+", temiz, maxsplit=1)[0]

    normal = turkce_normalize(temiz)

    gereksiz_ekler = [
        "ciltli",
        "ciltsiz",
        "cep boy",
        "ozel baski",
        "kutulu",
        "sert kapak",
        "karton kapak",
        "tam metin",
        "resimli",
        "yeni baski",
    ]

    degisti = True

    while degisti:
        degisti = False

        for ifade in gereksiz_ekler:
            if normal.endswith(f" {ifade}"):
                normal = normal[: -len(ifade)].strip()
                degisti = True

    return normal


def soru_gibi_mi(metin: str) -> bool:
    """Metnin doğal dil sorusu veya komut olma ihtimalini kontrol eder."""

    if "?" in metin:
        return True

    normal = turkce_normalize(metin)
    kelimeler = set(normal.split())

    soru_kelimeleri = {
        "kim",
        "kimin",
        "kac",
        "hangi",
        "nedir",
        "ne",
        "neye",
        "neyi",
        "nasil",
        "neden",
        "nerede",
        "neresindesin",
        "mi",
        "midir",
        "musun",
        "misin",
        "varmi",
    }

    komut_parcalari = (
        "anlat",
        "bahset",
        "ozet",
        "goster",
        "soyle",
        "hatirlat",
        "bulabilir",
        "biliyor",
        "yardim",
        "siniflandir",
        "tahmin",
        "model",
        "bakiyorduk",
        "konusuyorduk",
        "oner",
    )

    return bool(kelimeler.intersection(soru_kelimeleri)) or any(
        parca in normal for parca in komut_parcalari
    )


















# =========================================================
# KATEGORİ İŞLEMLERİ
# =========================================================

def kategori_belirle(kategori_metni: object) -> str | None:
    """Veri setindeki kategori yolunu sekiz ana sınıfa dönüştürür."""

    metin = metin_temizle(kategori_metni).casefold()

    for ana_kategori, anahtarlar in CATEGORY_RULES:
        for anahtar in anahtarlar:
            if anahtar.casefold() in metin:
                return ana_kategori

    return None


def kategori_yolunu_kisalt(kategori_metni: object) -> str:
    """Ana sınıf bulunamazsa kategori yolunun son bölümünü döndürür."""

    metin = metin_temizle(kategori_metni)

    if not metin:
        return "Bilgi bulunamadı"

    ilk_kategori = metin.split(",")[0].strip()

    bolumler = [
        bolum.strip()
        for bolum in ilk_kategori.split(">")
        if bolum.strip()
    ]

    return bolumler[-1] if bolumler else metin


# =========================================================
# KİTAP VERİ TABANI
# =========================================================

class KitapVeritabani:
    """Yerel kitap veri setini yükler ve güvenli başlık araması yapar."""

    def __init__(
        self,
        data_path: Path = RAW_DATA_PATH,
    ) -> None:
        self.data_path = data_path
        self.df = pd.DataFrame()

        self.tam_ad_indeksleri: dict[str, list[int]] = {}
        self.temel_ad_indeksleri: dict[str, list[int]] = {}

        self._veriyi_yukle()
        self._arama_indeksi_olustur()

    @property
    def kitap_sayisi(self) -> int:
        return len(self.df)

    def kategori_listesi(self) -> list[str]:
        kategoriler: set[str] = set()

        for kategori_metni in self.df["İlgili Kategoriler"]:
            kategori = kategori_belirle(kategori_metni)
            if kategori:
                kategoriler.add(kategori)

        return sorted(kategoriler)

    def _veriyi_yukle(self) -> None:
        if not self.data_path.exists():
            raise FileNotFoundError(
                "Kitap veri seti bulunamadı:\n"
                f"{self.data_path.resolve()}"
            )

        kullanilacak_sutunlar = [
            "Kitap Adı",
            "Yazar",
            "Sayfa Sayısı",
            "İlgili Kategoriler",
            "Kitap Açıklaması",
        ]

        print("Kitap veri seti yükleniyor...")

        self.df = pd.read_csv(
            self.data_path,
            usecols=kullanilacak_sutunlar,
            low_memory=False,
        )

        self.df = self.df.dropna(
            subset=[
                "Kitap Adı",
                "Kitap Açıklaması",
            ]
        ).copy()

        for sutun in [
            "Kitap Adı",
            "Yazar",
            "İlgili Kategoriler",
            "Kitap Açıklaması",
        ]:
            self.df[sutun] = self.df[sutun].apply(metin_temizle)

        self.df = self.df[
            self.df["Kitap Adı"].str.len() >= 2
        ].copy()

        self.df = self.df[
            self.df["Kitap Açıklaması"].str.len() >= 20
        ].copy()

        self.df = self.df.reset_index(drop=True)

        self.df["_tam_ad"] = self.df["Kitap Adı"].apply(
            turkce_normalize
        )

        self.df["_temel_ad"] = self.df["Kitap Adı"].apply(
            temel_kitap_adi
        )

        self.df["_yazar_norm"] = self.df["Yazar"].apply(
            turkce_normalize
        )

        print(f"{len(self.df):,} kullanılabilir kitap yüklendi.")

    def _arama_indeksi_olustur(self) -> None:
        for indeks, satir in self.df.iterrows():
            tam_ad = satir["_tam_ad"]
            sade_ad = satir["_temel_ad"]

            if tam_ad:
                self.tam_ad_indeksleri.setdefault(
                    tam_ad,
                    [],
                ).append(indeks)

            if sade_ad:
                self.temel_ad_indeksleri.setdefault(
                    sade_ad,
                    [],
                ).append(indeks)

    def _yazarli_secenekleri_olustur(
        self,
        indeksler: list[int],
        maksimum: int = 8,
    ) -> list[str]:
        """Aynı başlığın farklı yazarlara ait kayıtlarını listeler."""

        adaylar = self.df.loc[indeksler].copy()

        secenekler: list[str] = []
        gorulenler: set[tuple[str, str]] = set()

        for _, satir in adaylar.iterrows():
            kitap_adi = metin_temizle(satir["Kitap Adı"])
            yazar = metin_temizle(satir["Yazar"]) or "Yazar bilgisi yok"

            anahtar = (
                turkce_normalize(kitap_adi),
                turkce_normalize(yazar),
            )

            if anahtar in gorulenler:
                continue

            gorulenler.add(anahtar)
            secenekler.append(f"{kitap_adi} | {yazar}")

            if len(secenekler) >= maksimum:
                break

        return secenekler

    def _farkli_yazar_sayisi(
        self,
        indeksler: list[int],
    ) -> int:
        yazarlar = {
            yazar_kanonik_adi(self.df.loc[indeks, "Yazar"])
            for indeks in indeksler
            if yazar_kanonik_adi(self.df.loc[indeks, "Yazar"])
        }

        return len(yazarlar)

    def _yazara_gore_filtrele(
        self,
        indeksler: list[int],
        yazar_adi: str,
    ) -> list[int]:
        aranan_yazar = yazar_kanonik_adi(yazar_adi)

        if not aranan_yazar:
            return indeksler

        tam = [
            indeks
            for indeks in indeksler
            if yazar_kanonik_adi(
                self.df.loc[indeks, "Yazar"]
            ) == aranan_yazar
        ]

        if tam:
            return tam

        return [
            indeks
            for indeks in indeksler
            if (
                aranan_yazar
                in yazar_kanonik_adi(
                    self.df.loc[indeks, "Yazar"]
                )
                or yazar_kanonik_adi(
                    self.df.loc[indeks, "Yazar"]
                )
                in aranan_yazar
            )
        ]

    def _en_iyi_kaydi_sec(self, indeksler: list[int]) -> pd.Series:
        """Aynı kitabın baskıları arasından en dolu kaydı seçer."""

        adaylar = self.df.loc[indeksler].copy()

        adaylar["_puan"] = adaylar["Kitap Açıklaması"].str.len()

        adaylar["_puan"] += (
            adaylar["Yazar"].str.len().gt(2).astype(int) * 100
        )

        adaylar["_puan"] += (
            adaylar["İlgili Kategoriler"].str.len().gt(2).astype(int)
            * 100
        )

        secilen_indeks = adaylar["_puan"].idxmax()
        return self.df.loc[secilen_indeks]

    def _onerileri_olustur(
        self,
        aranan: str,
        maksimum: int = 5,
    ) -> list[str]:
        """Yakın başlıkları yalnızca öneri olarak döndürür."""

        if not aranan:
            return []

        skorlar: list[tuple[float, str]] = []

        for kitap_adi, indeksler in self.temel_ad_indeksleri.items():
            if not kitap_adi:
                continue

            benzerlik = SequenceMatcher(
                None,
                aranan,
                kitap_adi,
            ).ratio()

            if kitap_adi[0] == aranan[0]:
                benzerlik += 0.10
            else:
                benzerlik -= 0.25

            if kitap_adi.startswith(aranan):
                benzerlik += 0.18

            if aranan in kitap_adi.split():
                benzerlik += 0.08

            if benzerlik >= 0.63:
                kayit = self._en_iyi_kaydi_sec(indeksler)
                skorlar.append(
                    (
                        benzerlik,
                        str(kayit["Kitap Adı"]),
                    )
                )

        skorlar.sort(
            key=lambda eleman: eleman[0],
            reverse=True,
        )

        oneriler: list[str] = []

        for _, kitap_adi in skorlar:
            if kitap_adi not in oneriler:
                oneriler.append(kitap_adi)

            if len(oneriler) >= maksimum:
                break

        return oneriler

    def kitap_bul(
        self,
        kitap_adi: str,
    ) -> tuple[pd.Series | None, str, list[str]]:
        """Başlık ve isteğe bağlı yazar bilgisiyle güvenli eşleşme yapar.

        Desteklenen açık biçim:
            Martı | Anton Çehov
        """

        ham_girdi = metin_temizle(kitap_adi)

        if "|" in ham_girdi:
            baslik_parcasi, yazar_parcasi = ham_girdi.split("|", 1)
            aranan_baslik = baslik_parcasi.strip()
            aranan_yazar = yazar_parcasi.strip()
        else:
            aranan_baslik = ham_girdi
            aranan_yazar = ""

        aranan_tam = turkce_normalize(aranan_baslik)
        aranan_temel = temel_kitap_adi(aranan_baslik)

        if not aranan_tam:
            return None, "bulunamadı", []

        indeksler: list[int] = []
        eslesme_turu = ""

        if aranan_tam in self.tam_ad_indeksleri:
            indeksler = list(
                self.tam_ad_indeksleri[aranan_tam]
            )
            eslesme_turu = "tam eşleşme"

        elif aranan_temel in self.temel_ad_indeksleri:
            indeksler = list(
                self.temel_ad_indeksleri[aranan_temel]
            )
            eslesme_turu = "başlık eşleşmesi"

        # "Tutunamayanlar" gibi kısa başlıkları
        # "Tutunamayanlar / Bütün Eserleri 1" kaydıyla eşleştirir.
        if not indeksler and len(aranan_temel) >= 4:
            onek_indeksleri: list[int] = []

            for kayit_basligi, kayit_indeksleri in (
                self.temel_ad_indeksleri.items()
            ):
                if (
                    kayit_basligi.startswith(
                        aranan_temel + " "
                    )
                    or kayit_basligi.startswith(
                        aranan_temel + " /"
                    )
                    or kayit_basligi.startswith(
                        aranan_temel + "-"
                    )
                    or aranan_temel.startswith(
                        kayit_basligi + " "
                    )
                ):
                    onek_indeksleri.extend(
                        kayit_indeksleri
                    )

            if onek_indeksleri:
                indeksler = list(
                    dict.fromkeys(
                        onek_indeksleri
                    )
                )
                eslesme_turu = (
                    "başlık başlangıcı eşleşmesi"
                )

        if indeksler:
            if aranan_yazar:
                filtrelenmis = self._yazara_gore_filtrele(
                    indeksler,
                    aranan_yazar,
                )

                if filtrelenmis:
                    kayit = self._en_iyi_kaydi_sec(
                        filtrelenmis
                    )
                    return (
                        kayit,
                        f"{eslesme_turu} + yazar eşleşmesi",
                        [],
                    )

                return (
                    None,
                    "yazar eşleşmedi",
                    self._yazarli_secenekleri_olustur(
                        indeksler
                    ),
                )

            if self._farkli_yazar_sayisi(indeksler) > 1:
                return (
                    None,
                    "belirsiz eşleşme",
                    self._yazarli_secenekleri_olustur(
                        indeksler
                    ),
                )

            kayit = self._en_iyi_kaydi_sec(indeksler)
            return kayit, eslesme_turu, []

        oneriler = self._onerileri_olustur(
            aranan_temel
        )
        return None, "bulunamadı", oneriler


# =========================================================
# ÖZETLEME
# =========================================================

def reklam_cumlesi_mi(cumle: str) -> bool:
    kucuk = cumle.casefold()
    return any(ifade in kucuk for ifade in PROMOTIONAL_PATTERNS)


def cumlelere_ayir(metin: str) -> list[str]:
    """Açıklamayı temiz cümlelere ayırır."""

    temiz = metin_temizle(metin)
    parcalar = re.split(r"(?<=[.!?])\s+", temiz)

    sonuc: list[str] = []
    gorulenler: set[str] = set()

    for cumle in parcalar:
        cumle = cumle.strip("\"' ")
        cumle = re.sub(r"\s+", " ", cumle).strip()

        if len(cumle) < 35:
            continue

        if reklam_cumlesi_mi(cumle):
            continue

        if cumle.count("...") >= 2:
            continue

        normal = cumle.casefold()

        if normal in gorulenler:
            continue

        gorulenler.add(normal)
        sonuc.append(cumle)

    return sonuc


def metni_kisalt(metin: str, maksimum_uzunluk: int) -> str:
    if len(metin) <= maksimum_uzunluk:
        return metin

    kisaltilmis = metin[:maksimum_uzunluk]

    son_nokta = max(
        kisaltilmis.rfind("."),
        kisaltilmis.rfind("!"),
        kisaltilmis.rfind("?"),
    )

    if son_nokta > maksimum_uzunluk * 0.55:
        return kisaltilmis[: son_nokta + 1].strip()

    son_bosluk = kisaltilmis.rfind(" ")

    if son_bosluk > 0:
        kisaltilmis = kisaltilmis[:son_bosluk]

    return kisaltilmis.rstrip(" ,;:-") + "..."


def kisa_ozet_olustur(aciklama: str) -> str:
    """Açıklamadaki önemli cümleleri TF-IDF ile seçer."""

    cumleler = cumlelere_ayir(aciklama)

    if not cumleler:
        return metni_kisalt(
            metin_temizle(aciklama),
            SUMMARY_MAX_LENGTH,
        )

    if len(cumleler) <= SUMMARY_SENTENCE_COUNT:
        return metni_kisalt(
            " ".join(cumleler),
            SUMMARY_MAX_LENGTH,
        )

    try:
        vektorlestirici = TfidfVectorizer(
            lowercase=True,
            stop_words=list(TURKISH_STOP_WORDS),
            ngram_range=(1, 2),
            min_df=1,
        )

        matris = vektorlestirici.fit_transform(cumleler)
        puanlar = matris.sum(axis=1).A1

        for indeks, cumle in enumerate(cumleler):
            uzunluk = len(cumle)
            normal_cumle = turkce_normalize(cumle)

            if indeks == 0:
                puanlar[indeks] += 0.30
            elif indeks == 1:
                puanlar[indeks] += 0.15

            if 70 <= uzunluk <= 240:
                puanlar[indeks] += 0.20

            if uzunluk > 320:
                puanlar[indeks] -= 0.30

            for anahtar in SUMMARY_KEYWORDS:
                if turkce_normalize(anahtar) in normal_cumle:
                    puanlar[indeks] += 0.08

        secilen_indeksler = puanlar.argsort()[
            -SUMMARY_SENTENCE_COUNT:
        ]

        secilen_indeksler = sorted(
            int(indeks) for indeks in secilen_indeksler
        )

        ozet = " ".join(
            cumleler[indeks] for indeks in secilen_indeksler
        )

    except ValueError:
        ozet = " ".join(cumleler[:SUMMARY_SENTENCE_COUNT])

    return metni_kisalt(ozet, SUMMARY_MAX_LENGTH)


# =========================================================
# YARDIMCI FONKSİYONLAR
# =========================================================

def ilgili_cumleleri_bul(
    aciklama: str,
    soru: str,
    maksimum: int = 3,
    ek_anahtarlar: tuple[str, ...] = (),
) -> list[str]:
    """Soruyla en ilgili açıklama cümlelerini TF-IDF benzerliğiyle seçer."""

    cumleler = cumlelere_ayir(aciklama)
    if not cumleler:
        temiz = metin_temizle(aciklama)
        return [temiz] if temiz else []

    soru_metni = metin_temizle(soru)
    belgeler = cumleler + [soru_metni or "kitap karakter olay konu"]

    try:
        vektorlestirici = TfidfVectorizer(
            lowercase=True,
            stop_words=list(TURKISH_STOP_WORDS),
            ngram_range=(1, 2),
            min_df=1,
            sublinear_tf=True,
        )
        matris = vektorlestirici.fit_transform(belgeler)
        benzerlikler = (matris[:-1] @ matris[-1].T).toarray().ravel()
    except ValueError:
        benzerlikler = [0.0] * len(cumleler)

    puanlar: list[tuple[float, int]] = []
    normal_anahtarlar = tuple(turkce_normalize(a) for a in ek_anahtarlar)

    for indeks, cumle in enumerate(cumleler):
        puan = float(benzerlikler[indeks])
        normal_cumle = turkce_normalize(cumle)

        if any(anahtar and anahtar in normal_cumle for anahtar in normal_anahtarlar):
            puan += 0.22
        if 55 <= len(cumle) <= 280:
            puan += 0.05
        if indeks < 3:
            puan += 0.03

        puanlar.append((puan, indeks))

    puanlar.sort(reverse=True)
    secilen = sorted(indeks for _, indeks in puanlar[:maksimum])
    return [cumleler[indeks] for indeks in secilen]


def ayrintili_bilgi_olustur(aciklama: str, maksimum_cumle: int = 5) -> str:
    """Kısa özetten farklı, daha geniş bir yerel açıklama bölümü hazırlar."""

    cumleler = cumlelere_ayir(aciklama)
    if not cumleler:
        return metni_kisalt(metin_temizle(aciklama), 950)

    secilen = ilgili_cumleleri_bul(
        aciklama=aciklama,
        soru="karakter olay konu tema yaşam yolculuk mücadele sonuç",
        maksimum=maksimum_cumle,
        ek_anahtarlar=(
            "karakter",
            "kahraman",
            "olay",
            "yolculuk",
            "mücadele",
            "yaşam",
            "konu",
            "hikâye",
        ),
    )
    return metni_kisalt(" ".join(secilen), 950)


def sayfa_sayisini_duzenle(deger: object) -> str:
    if pd.isna(deger):
        return "Bilgi bulunamadı"

    metin = str(deger).strip()

    if metin.casefold() in {
        "",
        "n/a",
        "nan",
        "none",
    }:
        return "Bilgi bulunamadı"

    metin_kucuk = metin.casefold()

    if (
        "sayfa" in metin_kucuk
        or "baskıya göre" in metin_kucuk
        or "baskiya gore" in turkce_normalize(metin)
    ):
        return metin

    try:
        sayi = float(metin.replace(",", "."))
        if sayi.is_integer():
            return f"{int(sayi)} sayfa"
    except ValueError:
        pass

    return f"{metin} sayfa"


def yuzde_yaz(deger: object) -> str:
    if deger is None:
        return "Bilgi bulunamadı"

    try:
        return f"%{float(deger) * 100:.2f}"
    except (TypeError, ValueError):
        return "Bilgi bulunamadı"


# =========================================================
# KİTAP AGENTI
# =========================================================

class KitapAgenti:
    """Kitap arama, hafıza, soru yönlendirme ve sınıflandırmayı yönetir."""

    def __init__(self) -> None:
        self.veritabani = KitapVeritabani()

        print("Kategori modeli yükleniyor...")
        self.siniflandirici = KitapKategoriSiniflandirici()

        print("Doğal dil niyet modeli yükleniyor...")
        self.niyet_siniflandirici = NiyetSiniflandirici()

        self.tarif_veritabani = TarifVeritabani()

        self.son_tarif: TarifKaydi | None = None
        self.son_tarif_secenekleri: list[TarifKaydi] = []

        self.son_kitap: pd.Series | None = None
        self.son_kitap_kategorisi = ""
        self.son_kitap_ozeti = ""
        self.son_eslesme_turu = ""
        self.son_kitap_secenekleri: list[str] = []

    # -----------------------------------------------------
    # YEREL GENEL SOHBET / ALAN DIŞI / SERBEST SORU CEVAPLARI
    # -----------------------------------------------------
    # Hazır bir LLM (Ollama/Qwen, OpenAI, Claude, Gemini vb.) KULLANILMAZ.
    # Niyet ML modeliyle belirlenir; cevaplar yerel ve şeffaf şablonlarla üretilir.

    def nasilsin_cevapla(self) -> None:
        print(
            "\nİyiyim, teşekkür ederim. Yerel kitap veri tabanımı ve "
            "kendi eğittiğim niyet modelini kullanarak çalışıyorum."
        )
        print(
            "Senin günün nasıl geçiyor? İstersen bir kitap adıyla da "
            "devam edebiliriz."
        )

    def genel_sohbet_cevapla(self) -> None:
        print(
            "\nBuradayım. Kitaplar, okuma tercihleri ve sistemimin "
            "yapabildikleri hakkında sohbet edebiliriz."
        )
        print(
            "Ben açık alanlı bir hazır LLM değilim; 33 niyeti ayıran "
            "kendi scikit-learn modelim ve yerel cevap kurallarım var."
        )

    def alan_disi_cevapla(self) -> None:
        print("\nBu istek benim güvenli çalışma alanımın dışında kalıyor.")
        print(
            "Kitap arama, kitap bilgisi, tür tahmini ve temel sohbet "
            "konularında yardımcı olabilirim."
        )

    def bot_kimlik_cevapla(self) -> None:
        print(
            "\nBen KİTAPPUSULA AI'yım. Kitapları yerel veri tabanında "
            "arayan, kitap türü tahmini yapan ve kullanıcının niyetini "
            "kendi scikit-learn modeliyle anlayan yerel bir yapay zekâ agentıyım."
        )
        print(
            "OpenAI, Claude, Gemini, Ollama veya hazır bir dil modeli kullanmıyorum."
        )

    def bot_konum_cevapla(self) -> None:
        print(
            "\nBir şehirde veya evde yaşamıyorum. Kullanıcının bilgisayarında "
            "yerel Python programı olarak çalışıyorum."
        )

    def bot_yaratici_cevapla(self) -> None:
        print(
            "\nBu proje Merve Demir tarafından geliştirildi. "
            "Niyet ve kitap türü sınıflandırıcılarım scikit-learn ile "
            "yerel olarak eğitildi."
        )

    def bot_yas_cevapla(self) -> None:
        print(
            "\nİnsanlar gibi biyolojik bir yaşım yok. "
            "KİTAPPUSULA projesinin final niyet modeliyle çalışıyor."
        )

    def bot_yetenek_cevapla(self) -> None:
        print("\nYapabildiklerim:")
        print("  • Yerel veri setinde kitap adına göre arama yapmak.")
        print("  • Yazar, tür, sayfa, karakter, olay, özet ve detay sorularını ayırmak.")
        print("  • Yeni kitap açıklamalarının türünü kendi modelimle tahmin etmek.")
        print("  • Son konuşulan kitabı hafızada tutup devam sorularını yanıtlamak.")
        print("  • Selamlama, teşekkür, veda, şaka, tarih-saat ve temel sohbeti anlamak.")
        print("  • Yerel tarif veri tabanından yemek tarifi bulmak.")
        print(
            "  • Hava ve haber gibi güncel konularda internet erişimimin "
            "olmadığını açıkça belirtmek."
        )

    def tesekkur_cevapla(self) -> None:
        print(
            "\nRica ederim. Yardımcı olabildiysem ne mutlu. "
            "Başka bir kitap adı veya soru yazabilirsin."
        )

    def veda_cevapla(self) -> None:
        print("\nGörüşürüz. Yeni bir kitap keşfetmek istediğinde buradayım.")

    def saka_cevapla(self) -> None:
        print(
            "\nKitap neden doktora gitmiş? Çünkü cildi biraz yıpranmış. 🙂"
        )





    def hava_sorusunu_cevapla(self) -> None:
        print(
            "\nTamamen yerel ve çevrimdışı çalıştığım için güncel hava "
            "durumuna erişemiyorum."
        )
        print(
            "Bu nedenle sıcaklık veya yağmur bilgisi uydurmam. "
            "Güncel sonuç için internet bağlantılı bir hava servisi gerekir."
        )

    def tarih_saat_sorusunu_cevapla(self) -> None:
        simdi = datetime.now()

        gunler = [
            "Pazartesi",
            "Salı",
            "Çarşamba",
            "Perşembe",
            "Cuma",
            "Cumartesi",
            "Pazar",
        ]

        aylar = [
            "",
            "Ocak",
            "Şubat",
            "Mart",
            "Nisan",
            "Mayıs",
            "Haziran",
            "Temmuz",
            "Ağustos",
            "Eylül",
            "Ekim",
            "Kasım",
            "Aralık",
        ]

        print(
            "\nBilgisayarın yerel saatine göre "
            f"{simdi.day} {aylar[simdi.month]} {simdi.year} "
            f"{gunler[simdi.weekday()]}, saat {simdi:%H:%M}."
        )

    def tarif_kaydini_yazdir(
        self,
        kayit: TarifKaydi,
        eslesme_turu: str,
    ) -> None:
        """Yerel tarif kaydını düzenli biçimde terminale yazar."""

        self.son_tarif = kayit
        self.son_tarif_secenekleri = []

        print("\n" + "=" * 90)
        print("YEREL YEMEK TARİFİ")
        print("=" * 90)
        print(f"Eşleşme: {eslesme_turu}")
        print(f"Tarif: {kayit.tarif_adi}")
        print(f"Kategori: {kayit.kategori}")

        print("\nMalzemeler:")
        for malzeme in kayit.malzeme_listesi:
            print(f"  • {malzeme}")

        print("\nYapılışı:")
        for sira, adim in enumerate(
            kayit.yapilis_adimlari,
            start=1,
        ):
            print(f"  {sira}. {adim}")

        print(
            "\nVeri notu: Bu tarif uygulamayla birlikte gelen "
            "yerel tarif veri tabanından alınmıştır."
        )
        print(
            "Farklı bir tarif için 'başka tarif' yazabilirsin."
        )
        print("=" * 90)

    def yemek_tarifi_sorusunu_cevapla(
        self,
        kullanici_metni: str = "",
    ) -> None:
        """Tarif isteğini yerel veri tabanında arar."""

        normal = turkce_normalize(kullanici_metni)

        baska_ifadeleri = {
            "baska",
            "baska tarif",
            "baska yemek",
            "baska yemek tarifi",
            "farkli tarif",
            "farkli yemek",
            "bir tane daha",
        }

        if normal in baska_ifadeleri:
            kayit = self.tarif_veritabani.rastgele_tarif(
                haric_tarif_id=(
                    self.son_tarif.tarif_id
                    if self.son_tarif is not None
                    else None
                )
            )
            self.tarif_kaydini_yazdir(
                kayit,
                "yerel veri tabanından farklı tarif",
            )
            return

        sorgu = tarif_sorgusunu_temizle(
            kullanici_metni
        )

        genel_sorgular = {
            "",
            "yemek",
            "bir yemek",
            "yemek oner",
            "ne pisirsem",
            "ne yapabilirim",
        }

        if sorgu in genel_sorgular:
            kayit = self.tarif_veritabani.rastgele_tarif(
                haric_tarif_id=(
                    self.son_tarif.tarif_id
                    if self.son_tarif is not None
                    else None
                )
            )
            self.tarif_kaydini_yazdir(
                kayit,
                "yerel veri tabanından öneri",
            )
            return

        kategori_haritasi = {
            "kahvaltilik": "Kahvaltı",
            "kahvalti": "Kahvaltı",
            "tatli": "Tatlı",
            "corba": "Çorba",
            "salata": "Salata",
            "icecek": "İçecek",
            "atistirmalik": "Atıştırmalık",
        }

        if sorgu in kategori_haritasi:
            kayit = self.tarif_veritabani.rastgele_tarif(
                haric_tarif_id=(
                    self.son_tarif.tarif_id
                    if self.son_tarif is not None
                    else None
                ),
                kategori=kategori_haritasi[sorgu],
            )
            self.tarif_kaydini_yazdir(
                kayit,
                f"{kategori_haritasi[sorgu]} kategorisinden öneri",
            )
            return

        kayit, eslesme_turu, oneriler = (
            self.tarif_veritabani.tarif_bul(
                sorgu
            )
        )

        if kayit is not None:
            self.tarif_kaydini_yazdir(
                kayit,
                eslesme_turu,
            )
            return

        if oneriler:
            self.son_tarif_secenekleri = list(
                oneriler
            )
            self.son_kitap_secenekleri = []

            print(
                f"\n'{sorgu}' için birden fazla yakın tarif bulundu:"
            )

            for sira, oneri in enumerate(
                oneriler,
                start=1,
            ):
                print(
                    f"  {sira}. {oneri.tarif_adi} "
                    f"({oneri.kategori})"
                )

            print(
                "\nSeçmek için yalnızca sıra numarasını yaz."
            )
            return

        print(
            f"\n'{sorgu}' için yerel tarif veri tabanında "
            "güvenli bir eşleşme bulunamadı."
        )
        print(
            "Örnek: 'menemen tarifi', 'kısır tarifi', "
            "'mercimek çorbası' veya 'kahvaltılık tarif'."
        )


    def haber_sorusunu_cevapla(self) -> None:
        print(
            "\nTamamen yerel çalıştığım için güncel haber akışına "
            "erişemiyorum."
        )
        print(
            "Gündem bilgisi uydurmam; güncel haber için internet bağlantılı "
            "ve tarihli bir haber kaynağı gerekir."
        )

    def serbest_kitap_sorusunu_cevapla(self, kullanici_metni: str) -> None:
        """Açık uçlu yorum sorularında yalnızca yerel açıklamadaki ilgili
        cümleleri sunar; yazarın niyeti veya kişisel bir görüş gibi veri
        setinde bulunmayan bilgileri UYDURMAZ."""

        if self.son_kitap is None:
            print("\nBu açık uçlu kitap sorusu için önce bir kitap seçmelisin.")
            return

        kitap_adi = metin_temizle(self.son_kitap["Kitap Adı"])
        aciklama = metin_temizle(self.son_kitap["Kitap Açıklaması"])

        cumleler = ilgili_cumleleri_bul(
            aciklama=aciklama,
            soru=kullanici_metni,
            maksimum=2,
        )

        print(
            "\nBu tür bir soru (yazarın niyeti, kişisel yorum, değer "
            "yargısı) benim yerel, kural tabanlı sistemimin üretebileceği "
            "bir bilgi değil; böyle bir şeyi uydurmak istemem."
        )

        if cumleler:
            print(f"\n{kitap_adi} açıklamasında sorunla en ilgili gördüğüm kısım:")
            print(
                textwrap.fill(
                    " ".join(cumleler),
                    width=WRAP_WIDTH,
                    initial_indent="  ",
                    subsequent_indent="  ",
                )
            )

    # -----------------------------------------------------
    # HAFIZA
    # -----------------------------------------------------

    def son_kitap_var_mi(self) -> bool:
        return self.son_kitap is not None

    def son_kitap_yok_uyarisi(self) -> None:
        print("\nHenüz hakkında konuştuğumuz bir kitap yok.")
        print("Önce bir kitap adı yazmalısın.")

    def son_kitabi_hafizaya_al(
        self,
        kayit: pd.Series,
        kategori: str,
        ozet: str,
        eslesme_turu: str,
    ) -> None:
        self.son_kitap = kayit
        self.son_kitap_kategorisi = kategori
        self.son_kitap_ozeti = ozet
        self.son_eslesme_turu = eslesme_turu

    def son_kitap_bilgilerini_yazdir(self) -> None:
        if self.son_kitap is None:
            self.son_kitap_yok_uyarisi()
            return

        kitap_adi = metin_temizle(self.son_kitap["Kitap Adı"])
        yazar = metin_temizle(self.son_kitap["Yazar"])

        print("\n" + "=" * 90)
        print("SON KİTAP BİLGİSİ")
        print("=" * 90)
        print(f"Kitap: {kitap_adi}")
        print(f"Yazar: {yazar or 'Bilgi bulunamadı'}")
        print(
            "Sayfa sayısı: "
            f"{sayfa_sayisini_duzenle(self.son_kitap['Sayfa Sayısı'])}"
        )
        print(f"Tür: {self.son_kitap_kategorisi}")
        print("\nKısa özet:")
        print(
            textwrap.fill(
                self.son_kitap_ozeti,
                width=WRAP_WIDTH,
                initial_indent="  ",
                subsequent_indent="  ",
            )
        )
        print("=" * 90)

    # -----------------------------------------------------
    # NİYETLERE VERİLEN CEVAPLAR
    # -----------------------------------------------------

    def yazar_sorusunu_cevapla(self) -> None:
        if self.son_kitap is None:
            self.son_kitap_yok_uyarisi()
            return

        kitap_adi = metin_temizle(self.son_kitap["Kitap Adı"])
        yazar = metin_temizle(self.son_kitap["Yazar"])

        print(
            f"\n{kitap_adi}, "
            f"{yazar or 'yazarı veri setinde bulunamayan bir yazar'} "
            "tarafından yazılmıştır."
        )


    def sayfa_sorusunu_cevapla(self) -> None:
        if self.son_kitap is None:
            self.son_kitap_yok_uyarisi()
            return

        kitap_adi = metin_temizle(self.son_kitap["Kitap Adı"])
        sayfa = sayfa_sayisini_duzenle(
            self.son_kitap["Sayfa Sayısı"]
        )

        print(f"\n{kitap_adi}, {sayfa}dır.")

    def tur_sorusunu_cevapla(self) -> None:
        if self.son_kitap is None:
            self.son_kitap_yok_uyarisi()
            return

        kitap_adi = metin_temizle(self.son_kitap["Kitap Adı"])
        print(
            f"\n{kitap_adi} kitabının türü "
            f"{self.son_kitap_kategorisi}."
        )

    def ozet_sorusunu_cevapla(self) -> None:
        if self.son_kitap is None:
            self.son_kitap_yok_uyarisi()
            return

        kitap_adi = metin_temizle(self.son_kitap["Kitap Adı"])
        print(f"\n{kitap_adi} için kısa özet:")
        print(
            textwrap.fill(
                self.son_kitap_ozeti,
                width=WRAP_WIDTH,
                initial_indent="  ",
                subsequent_indent="  ",
            )
        )

    def detay_sorusunu_cevapla(self) -> None:
        if self.son_kitap is None:
            self.son_kitap_yok_uyarisi()
            return

        kitap_adi = metin_temizle(self.son_kitap["Kitap Adı"])
        aciklama = metin_temizle(self.son_kitap["Kitap Açıklaması"])
        detay = ayrintili_bilgi_olustur(aciklama)

        print(f"\n{kitap_adi} hakkında veri setinden daha ayrıntılı bilgi:")
        print(
            textwrap.fill(
                detay,
                width=WRAP_WIDTH,
                initial_indent="  ",
                subsequent_indent="  ",
            )
        )

    def karakter_sorusunu_cevapla(self, kullanici_metni: str) -> None:
        if self.son_kitap is None:
            self.son_kitap_yok_uyarisi()
            return

        kitap_adi = metin_temizle(self.son_kitap["Kitap Adı"])
        aciklama = metin_temizle(self.son_kitap["Kitap Açıklaması"])
        cumleler = ilgili_cumleleri_bul(
            aciklama=aciklama,
            soru=kullanici_metni,
            maksimum=2,
            ek_anahtarlar=(
                "karakter",
                "kahraman",
                "başkahraman",
                "çoban",
                "genç",
                "adam",
                "kadın",
                "kız",
                "oğlan",
                "kişi",
            ),
        )

        if not cumleler:
            print(
                f"\n{kitap_adi} için yerel açıklamada güvenilir "
                "karakter bilgisi bulunamadı."
            )
            return

        print(f"\n{kitap_adi} için karakterle ilgili yerel bilgi:")
        print(
            textwrap.fill(
                " ".join(cumleler),
                width=WRAP_WIDTH,
                initial_indent="  ",
                subsequent_indent="  ",
            )
        )

    def olay_sorusunu_cevapla(self, kullanici_metni: str) -> None:
        if self.son_kitap is None:
            self.son_kitap_yok_uyarisi()
            return

        kitap_adi = metin_temizle(self.son_kitap["Kitap Adı"])
        aciklama = metin_temizle(self.son_kitap["Kitap Açıklaması"])
        cumleler = ilgili_cumleleri_bul(
            aciklama=aciklama,
            soru=kullanici_metni,
            maksimum=3,
            ek_anahtarlar=(
                "olay",
                "yolculuk",
                "mücadele",
                "macera",
                "sonunda",
                "karar",
                "gider",
                "aramaya",
                "yaşar",
            ),
        )

        if not cumleler:
            print(
                f"\n{kitap_adi} için yerel açıklamada bu olayı "
                "cevaplayacak yeterli bilgi bulunamadı."
            )
            return

        print(f"\n{kitap_adi} için soruyla en ilgili yerel olay bilgisi:")
        print(
            textwrap.fill(
                " ".join(cumleler),
                width=WRAP_WIDTH,
                initial_indent="  ",
                subsequent_indent="  ",
            )
        )

    def kitap_adi_sorusunu_cevapla(self) -> None:
        if self.son_kitap is None:
            self.son_kitap_yok_uyarisi()
            return

        kitap_adi = metin_temizle(self.son_kitap["Kitap Adı"])
        print(f"\nHakkında konuştuğumuz kitap: {kitap_adi}.")

    def her_kitap_sorusunu_cevapla(self) -> None:
        print("\nDünyadaki her kitabı bulamam.")
        print(
            "Yerel veri setimde "
            f"{self.veritabani.kitap_sayisi:,} "
            "kullanılabilir kitap kaydı var."
        )
        print(
            "Kitap veri setinde bulunuyorsa yazarını, türünü, "
            "sayfa sayısını ve açıklamasından çıkarılan özeti "
            "gösterebilirim."
        )
        print("Veri setinde olmayan kitaplar için bilgi uydurmam.")

    def kitap_sayisini_cevapla(self) -> None:
        print(
            "\nYerel veri setimde "
            f"{self.veritabani.kitap_sayisi:,} "
            "kullanılabilir kitap kaydı bulunuyor."
        )

    def kategori_listesini_yazdir(self) -> None:
        print("\nSınıflandırma modelinin ana kategorileri:")
        for kategori in self.veritabani.kategori_listesi():
            print(f"  • {kategori}")

    def yardim_yazdir(self) -> None:
        print("\nYapabileceklerim:")
        print("  • Bir kitap adıyla 64 bini aşkın yerel kayıtta arama yaparım.")
        print("  • Yazar, karakter, olay, sayfa, tür, özet ve detay sorularını ayırırım.")
        print("  • Son seçilen kitabı hafızada tutup devam sorularını yanıtlarım.")
        print("  • Yeni bir açıklamanın kitap türünü kendi sınıflandırıcım ile tahmin ederim.")
        print("  • Kimlik, konum, geliştirici, yaş ve yetenek sorularına cevap veririm.")
        print("  • Selamlama, nasılsın, teşekkür, veda ve şaka niyetlerini anlarım.")
        print("  • Bilgisayarın yerel tarih ve saatini söyleyebilirim.")
        print("  • Yerel veri tabanından yemek tarifi bulabilirim.")
        print("  • Güncel hava ve haber verisine erişemediğimi dürüstçe belirtirim.")
        print("  • Belirsiz başlıklarda 'kitap ara: Kitap Adı' komutunu kullanabilirsin.")
        print("  • Model sonuçları için 'model bilgisi' yazabilirsin.")
        print("  • Çıkmak için 'çıkış' yazabilirsin.")

    def selamlamayi_cevapla(self) -> None:
        print(
            "\nMerhaba! Bir kitap adı yazabilir veya "
            "kitaplar hakkında doğal bir soru sorabilirsin."
        )

    def model_bilgisi_yazdir(self) -> None:
        kategori_bilgileri: dict[str, Any] = (
            self.siniflandirici.model_bilgisi()
        )

        niyet_bilgileri: dict[str, Any] = (
            self.niyet_siniflandirici.model_bilgisi()
        )

        print("\n" + "=" * 78)
        print("KİTAP TÜRÜ SINIFLANDIRMA MODELİ")
        print("=" * 78)
        print(
            f"Model: {kategori_bilgileri.get('model_adi', 'Bilinmiyor')}"
        )
        print(
            "Eğitim kayıt sayısı: "
            f"{kategori_bilgileri.get('egitim_kayit_sayisi', 0):,}"
        )
        print(
            "Cross Validation Macro F1: "
            f"{yuzde_yaz(kategori_bilgileri.get('cv_macro_f1'))}"
        )
        print(
            "Test Macro F1: "
            f"{yuzde_yaz(kategori_bilgileri.get('test_macro_f1'))}"
        )

        print("\n" + "=" * 78)
        print("DOĞAL DİL NİYET SINIFLANDIRMA MODELİ")
        print("=" * 78)
        print(
            f"Model: {niyet_bilgileri.get('model_adi', 'Bilinmiyor')}"
        )
        print(
            "Eğitim cümlesi sayısı: "
            f"{niyet_bilgileri.get('egitim_ornegi_sayisi', 0):,}"
        )
        print(
            "Niyet sınıfı sayısı: "
            f"{niyet_bilgileri.get('sinif_sayisi', 0)}"
        )
        print(
            "Bağımsız test cümlesi sayısı: "
            f"{niyet_bilgileri.get('bagimsiz_test_ornegi_sayisi', 0):,}"
        )
        print(
            "5-Fold CV Macro F1: "
            f"{yuzde_yaz(niyet_bilgileri.get('cv_macro_f1'))}"
        )
        print(
            "Bağımsız Test Macro F1: "
            f"{yuzde_yaz(niyet_bilgileri.get('test_macro_f1'))}"
        )
        print(
            "Bağımsız Test Accuracy: "
            f"{yuzde_yaz(niyet_bilgileri.get('test_accuracy'))}"
        )
        print(
            "Bu ikinci model, soruyu birebir ezberlenmiş bir komuta "
            "bağlı kalmadan yazar, sayfa, tür, özet ve diğer "
            "niyetlerden birine ayırır."
        )

    def yeni_kitap_siniflandir(self) -> None:
        print("\n" + "=" * 70)
        print("YENİ KİTAP SINIFLANDIRMA")
        print("=" * 70)

        kitap_adi = input("Yeni kitabın adı: ").strip()
        aciklama = input("Kitabın açıklaması: ").strip()

        if len(aciklama) < 30:
            print("\nAçıklama çok kısa. En az 30 karakter yaz.")
            return

        try:
            sonuc = self.siniflandirici.tahmin_et(
                kitap_adi=kitap_adi,
                kitap_aciklamasi=aciklama,
                alternatif_sayisi=3,
            )
        except Exception as hata:
            print(f"\nSınıflandırma hatası: {hata}")
            return

        print("\nModelin tahmini:")
        print(f"  Tür: {sonuc['kategori']}")
        print(f"  Güven: %{sonuc['guven']:.2f}")

        print("\nEn güçlü üç tahmin:")
        for sira, alternatif in enumerate(
            sonuc["alternatifler"],
            start=1,
        ):
            print(
                f"  {sira}. {alternatif['kategori']} "
                f"(%{alternatif['guven']:.2f})"
            )

    # -----------------------------------------------------
    # KİTAP ARAMA
    # -----------------------------------------------------

    def kitabi_analiz_et(self, aranan_kitap_adi: str) -> None:
        kayit, eslesme_turu, oneriler = self.veritabani.kitap_bul(
            aranan_kitap_adi
        )

        if kayit is None:
            if eslesme_turu == "belirsiz eşleşme":
                print(
                    "\nAynı başlıkla birden fazla farklı eser bulundu."
                )
                print(
                    "Doğru eseri seçmek için kitap adıyla birlikte "
                    "yazarını da yazmalısın:"
                )

                self.son_kitap_secenekleri = list(oneriler)

                for sira, oneri in enumerate(
                    oneriler,
                    start=1,
                ):
                    print(f"  {sira}. {oneri}")

                if oneriler:
                    print(
                        "\nSeçmek için yalnızca sıra numarasını "
                        "(örnek: 1) veya şu biçimi yaz:"
                    )
                    print(
                        f"  kitap ara: {oneriler[0]}"
                    )
                return

            if eslesme_turu == "yazar eşleşmedi":
                print(
                    "\nBaşlık bulundu fakat yazdığın yazarla eşleşmedi."
                )

                if oneriler:
                    self.son_kitap_secenekleri = list(oneriler)
                    print("\nBulunan seçenekler:")
                    for sira, oneri in enumerate(
                        oneriler,
                        start=1,
                    ):
                        print(f"  {sira}. {oneri}")

                print(
                    "\nSeçmek için sıra numarasını veya "
                    "'Kitap Adı | Yazar' biçimini kullan."
                )
                return

            print(
                "\nKitap adıyla güvenli bir eşleşme bulunamadı."
            )

            if oneriler:
                self.son_kitap_secenekleri = list(oneriler)
                print("\nŞunlardan birini arıyor olabilirsin:")
                for sira, oneri in enumerate(
                    oneriler,
                    start=1,
                ):
                    print(f"  {sira}. {oneri}")

                print(
                    "\nSeçmek için sıra numarasını veya listedeki "
                    "kitap adını yaz."
                )
            else:
                print(
                    "Bu kitap veri setinde bulunmuyor olabilir."
                )

            return

        self.son_kitap_secenekleri = []

        # Ham veri setindeki doğrulanmış hatalar burada düzeltilir.
        kayit = dogrulanmis_duzeltmeyi_uygula(kayit)

        kitap_adi = metin_temizle(
            kayit["Kitap Adı"]
        )
        yazar = metin_temizle(
            kayit["Yazar"]
        )
        aciklama = metin_temizle(
            kayit["Kitap Açıklaması"]
        )
        kategori_metni = metin_temizle(
            kayit["İlgili Kategoriler"]
        )

        kategori = kategori_belirle(
            kategori_metni
        )

        if kategori is None:
            kategori = kategori_yolunu_kisalt(
                kategori_metni
            )

        dogrulanmis_ozet = metin_temizle(
            kayit.get("_dogrulanmis_ozet", "")
        )

        if dogrulanmis_ozet:
            kisa_ozet = dogrulanmis_ozet
        else:
            kisa_ozet = kisa_ozet_olustur(
                aciklama
            )

        self.son_kitabi_hafizaya_al(
            kayit=kayit,
            kategori=kategori,
            ozet=kisa_ozet,
            eslesme_turu=eslesme_turu,
        )

        print("\n" + "=" * 90)
        print("KİTAP BİLGİSİ")
        print("=" * 90)
        print(f"Eşleşme: {eslesme_turu}")
        print(f"Kitap: {kitap_adi}")
        print(
            f"Yazar: "
            f"{yazar or 'Bilgi bulunamadı'}"
        )
        print(
            "Sayfa sayısı: "
            f"{sayfa_sayisini_duzenle(kayit['Sayfa Sayısı'])}"
        )
        print(f"Tür: {kategori}")

        if dogrulanmis_ozet:
            print("\nDoğrulanmış kısa özet:")
        else:
            print(
                "\nVeri seti açıklamasından çıkarılan kısa bilgi:"
            )

        print(
            textwrap.fill(
                kisa_ozet,
                width=WRAP_WIDTH,
                initial_indent="  ",
                subsequent_indent="  ",
            )
        )

        if not dogrulanmis_ozet:
            print(
                "\nBilgi notu: Bu bölüm veri setindeki yayınevi veya "
                "tanıtım açıklamasından çıkarılmıştır; eksiksiz olay "
                "özeti olduğu garanti edilmez."
            )

        if bool(
            kayit.get(
                "_dogrulanmis_duzeltme",
                False,
            )
        ):
            dogrulanmis_not = metin_temizle(
                kayit.get(
                    "_dogrulanmis_not",
                    "",
                )
            )

            print(
                "\nVeri notu: "
                + dogrulanmis_not
            )

        print(
            "\nBu kitap hakkında doğal cümlelerle "
            "devam edebilirsin."
        )
        print("=" * 90)

    # -----------------------------------------------------
    # NİYET YÖNLENDİRME (GÜNCELLENDİ)
    # -----------------------------------------------------

    def niyeti_uygula(
        self,
        niyet: str,
        kullanici_metni: str = "",
    ) -> bool:
        """Tahmin edilen niyeti uygun yerel işleme yönlendirir."""

        islemler = {
            Niyetler.YAZAR: self.yazar_sorusunu_cevapla,
            Niyetler.KARAKTER: lambda: self.karakter_sorusunu_cevapla(
                kullanici_metni
            ),
            Niyetler.OLAY: lambda: self.olay_sorusunu_cevapla(
                kullanici_metni
            ),
            Niyetler.SAYFA: self.sayfa_sorusunu_cevapla,
            Niyetler.TUR: self.tur_sorusunu_cevapla,
            Niyetler.OZET: self.ozet_sorusunu_cevapla,
            Niyetler.DETAY: self.detay_sorusunu_cevapla,
            Niyetler.KITAP_ADI: self.kitap_adi_sorusunu_cevapla,
            Niyetler.TEKRAR: self.son_kitap_bilgilerini_yazdir,
            Niyetler.HER_KITAP: self.her_kitap_sorusunu_cevapla,
            Niyetler.KITAP_SAYISI: self.kitap_sayisini_cevapla,
            Niyetler.KATEGORILER: self.kategori_listesini_yazdir,
            Niyetler.MODEL_BILGISI: self.model_bilgisi_yazdir,
            Niyetler.YARDIM: self.yardim_yazdir,
            Niyetler.YENI_SINIFLANDIR: self.yeni_kitap_siniflandir,
            Niyetler.SELAMLAMA: self.selamlamayi_cevapla,
            Niyetler.NASILSIN: self.nasilsin_cevapla,
            Niyetler.GENEL_SOHBET: self.genel_sohbet_cevapla,
            Niyetler.ALAN_DISI: self.alan_disi_cevapla,
            Niyetler.SERBEST_KITAP: lambda: self.serbest_kitap_sorusunu_cevapla(
                kullanici_metni
            ),
            Niyetler.BOT_KIMLIK: self.bot_kimlik_cevapla,
            Niyetler.BOT_KONUM: self.bot_konum_cevapla,
            Niyetler.BOT_YARATICI: self.bot_yaratici_cevapla,
            Niyetler.BOT_YAS: self.bot_yas_cevapla,
            Niyetler.BOT_YETENEK: self.bot_yetenek_cevapla,
            Niyetler.TESEKKUR: self.tesekkur_cevapla,
            Niyetler.VEDA: self.veda_cevapla,
            Niyetler.SAKA_ISTEGI: self.saka_cevapla,
            Niyetler.HAVA: self.hava_sorusunu_cevapla,
            Niyetler.TARIH_SAAT: self.tarih_saat_sorusunu_cevapla,
            Niyetler.YEMEK_TARIFI: lambda: self.yemek_tarifi_sorusunu_cevapla(
                kullanici_metni
            ),
            Niyetler.HABER: self.haber_sorusunu_cevapla,
        }

        islem = islemler.get(niyet)

        if islem is None:
            return False

        islem()
        return True

    @staticmethod
    def _komut_icerigini_ayir(kullanici_metni: str, komut: str) -> str:
        desen = rf"^\s*{re.escape(komut)}\s*:?\s*"
        return re.sub(
            desen,
            "",
            kullanici_metni,
            count=1,
            flags=re.IGNORECASE,
        ).strip()

    def _tarif_secimini_coz(
        self,
        kullanici_metni: str,
    ) -> TarifKaydi | None:
        """Son gösterilen tarif seçeneklerinden sayı veya adla seçim yapar."""

        if not self.son_tarif_secenekleri:
            return None

        normal = turkce_normalize(kullanici_metni)

        sayi_eslesmesi = re.fullmatch(
            r"\s*(\d+)\s*[.)-]?\s*",
            kullanici_metni,
        )

        if sayi_eslesmesi:
            sira = int(sayi_eslesmesi.group(1))

            if 1 <= sira <= len(self.son_tarif_secenekleri):
                return self.son_tarif_secenekleri[sira - 1]

        for secenek in self.son_tarif_secenekleri:
            if normal == turkce_normalize(secenek.tarif_adi):
                return secenek

        return None

    def _kitap_secimini_coz(
        self,
        kullanici_metni: str,
    ) -> str | None:
        """Son gösterilen kitap seçeneklerinden sayı, başlık veya yazarla seçim yapar."""

        if not self.son_kitap_secenekleri:
            return None

        normal = turkce_normalize(kullanici_metni)

        sayi_eslesmesi = re.match(
            r"^\s*(\d+)\s*[.)-]?",
            kullanici_metni,
        )

        if sayi_eslesmesi:
            sira = int(sayi_eslesmesi.group(1))

            if 1 <= sira <= len(self.son_kitap_secenekleri):
                return self.son_kitap_secenekleri[sira - 1]

        for secenek in self.son_kitap_secenekleri:
            secenek_norm = turkce_normalize(
                secenek.replace("|", " ")
            )

            if normal == secenek_norm:
                return secenek

            if "|" in secenek:
                baslik, yazar = [
                    parca.strip()
                    for parca in secenek.split("|", 1)
                ]

                if normal == turkce_normalize(yazar):
                    return secenek

                birlesik = turkce_normalize(
                    f"{baslik} {yazar}"
                )
                if normal == birlesik:
                    return secenek

        return None

    def mesaji_isle(self, kullanici_metni: str) -> None:
        """Deterministik kitap işlemlerinden sonra ML niyetini güvenli uygular."""

        normal = turkce_normalize(kullanici_metni)

        # 1) Açık ve deterministik kitap arama komutu.
        if normal.startswith("kitap ara ") or normal == "kitap ara":
            kitap_adi = self._komut_icerigini_ayir(
                kullanici_metni,
                "kitap ara",
            )

            if not kitap_adi:
                print(
                    "\nAramak istediğin kitabın adını "
                    "'kitap ara: ...' şeklinde yaz."
                )
                return

            print(
                "\n[Yönlendirme: deterministik 'kitap ara' komutu]"
            )
            self.kitabi_analiz_et(kitap_adi)
            return

        # 2) Önceden gösterilmiş tarif seçeneklerinden seçim.
        secilen_tarif = self._tarif_secimini_coz(
            kullanici_metni
        )

        if secilen_tarif is not None:
            print(
                "\n[Yönlendirme: deterministik tarif seçimi]"
            )
            self.tarif_kaydini_yazdir(
                secilen_tarif,
                "numaralı tarif seçimi",
            )
            return

        # 3) Önceden gösterilmiş kitap seçeneklerinden sayı/yazar seçimi.
        secilen_kitap = self._kitap_secimini_coz(
            kullanici_metni
        )

        if secilen_kitap is not None:
            print(
                "\n[Yönlendirme: deterministik kitap seçimi]"
            )
            self.kitabi_analiz_et(secilen_kitap)
            return

        # 4) Soru görünümünde olmayan yalnızca TAM veya TEMEL başlık eşleşmesi.
        # Başlık başlangıcı eşleşmesi burada kullanılmaz. Böylece "kod yaz"
        # ifadesi "Kod" adlı kitap sanılmaz.
        baslik_adayi = (
            not soru_gibi_mi(kullanici_metni)
            and 1 <= len(normal.split()) <= 8
        )

        if baslik_adayi:
            kayit, eslesme_turu, _ = self.veritabani.kitap_bul(
                kullanici_metni
            )

            deterministik_eslesmeler = {
                "tam eşleşme",
                "başlık eşleşmesi",
                "belirsiz eşleşme",
            }

            if (
                kayit is not None
                and eslesme_turu in deterministik_eslesmeler
            ) or eslesme_turu == "belirsiz eşleşme":
                print(
                    "\n[Yönlendirme: deterministik kitap başlığı eşleşmesi]"
                )
                self.kitabi_analiz_et(kullanici_metni)
                return

        # 5) Doğal dil anlama yalnızca eğitilmiş ML modeline bırakılır.
        sonuc = self.niyet_siniflandirici.tahmin_et(
            kullanici_metni,
            alternatif_sayisi=3,
        )

        niyet = str(sonuc["niyet"])
        guven = float(sonuc["guven"])
        fark = float(sonuc.get("fark", 0.0))
        kaynak = str(sonuc["kaynak"])

        print(
            "\n[Niyet kaynağı: "
            f"{kaynak} | Tahmin: {niyet} | "
            f"Güven: %{guven:.2f} | Fark: %{fark:.2f}]"
        )

        # Aktif kitaba bağlı niyetlerde daha yüksek güven şartı aranır.
        # Böylece "bana kod yazar mısın" gibi düşük güvenli yanlış bir
        # YAZAR_SORUSU tahmini son kitabın yazarını cevaplamaz.
        kitap_baglam_niyetleri = {
            Niyetler.YAZAR,
            Niyetler.KARAKTER,
            Niyetler.OLAY,
            Niyetler.SAYFA,
            Niyetler.TUR,
            Niyetler.OZET,
            Niyetler.DETAY,
            Niyetler.KITAP_ADI,
            Niyetler.TEKRAR,
            Niyetler.HER_KITAP,
            Niyetler.SERBEST_KITAP,
        }

        if niyet in kitap_baglam_niyetleri:
            guvenilir = (
                guven >= CONTEXT_INTENT_CONFIDENCE_THRESHOLD
                and fark >= INTENT_MARGIN_THRESHOLD
            )
        else:
            guvenilir = (
                guven >= INTENT_CONFIDENCE_THRESHOLD
                or (
                    guven >= 30.0
                    and fark >= 10.0
                )
            )

        # Kitap adı sınıfı düşük güvenli olsa bile veri tabanı araması
        # güvenlidir; bulunmayan bilgi için sistem uydurma yapmaz.
        if niyet == Niyetler.KITAP_ARAMA:
            self.kitabi_analiz_et(kullanici_metni)
            return

        if (
            guvenilir
            and self.niyeti_uygula(
                niyet,
                kullanici_metni,
            )
        ):
            return

        print(
            "\nSorunun niyetini yeterince güvenli anlayamadım."
        )
        print(
            "Yanlış bilgi vermemek için düşük güvenli tahmini "
            "uygulamıyorum."
        )

        if self.son_kitap_var_mi():
            print(
                "Son kitap hakkında yazarını, sayfa sayısını, türünü, "
                "konusunu veya bütün bilgilerini daha açık sorabilirsin."
            )
        else:
            print(
                "Bir kitap adı yazabilir veya 'yardım' diyebilirsin."
            )

        alternatifler = sonuc.get(
            "alternatifler",
            [],
        )

        if alternatifler:
            okunabilir = [
                (
                    str(alt["niyet"])
                    .replace("_", " ")
                    .title()
                    + f" (%{float(alt['guven']):.2f})"
                )
                for alt in alternatifler[:2]
            ]
            print(
                "En yakın ML tahminleri: "
                + " / ".join(okunabilir)
            )


def ana_program() -> None:
    print("=" * 90)
    print("KİTAPPUSULA AI")
    print("Tamamen yerel, ML öncelikli ve güvenli KİTAPPUSULA agentı")
    print("=" * 90)
    print("Kitap adı, kitap sorusu veya desteklenen bir niyet mesajı yaz.")
    print("Yardım için 'yardım', çıkmak için 'çıkış' yaz.")

    try:
        agent = KitapAgenti()
    except Exception as hata:
        print("\nProgram başlatılamadı:")
        print(hata)
        return

    while True:
        print("\n" + "-" * 90)

        try:
            kullanici_metni = input("Sen: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n\nKitapPusula kapatıldı.")
            break

        if turkce_normalize(kullanici_metni) in {
            "cikis",
            "exit",
            "quit",
            "q",
            "kapat",
        }:
            print("\nKitapPusula kapatıldı.")
            break

        if not kullanici_metni:
            print("Lütfen bir kitap adı veya soru yaz.")
            continue

        try:
            agent.mesaji_isle(kullanici_metni)
        except KeyboardInterrupt:
            print("\nİşlem iptal edildi.")
        except Exception as hata:
            print("\nİşlem sırasında hata oluştu:")
            print(hata)


if __name__ == "__main__":
    ana_program()