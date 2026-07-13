from __future__ import annotations

from pathlib import Path
import re

import pandas as pd

from intent_examples import (
    bagimsiz_test_ornekleri,
    egitim_ornekleri,
    turkce_normalize,
)


# =========================================================
# SÜRÜM VE AYARLAR
# =========================================================

SCRIPT_VERSION = "FINAL-2"

MASSIVE_DIR = Path("data/raw/massive_tr")
MASSIVE_TRAIN_PATH = MASSIVE_DIR / "massive_tr_train.csv"
MASSIVE_TEST_PATH = MASSIVE_DIR / "massive_tr_test.csv"

OUTPUT_DIR = Path("data/processed")
TRAIN_OUTPUT = OUTPUT_DIR / "niyet_egitim.csv"
TEST_OUTPUT = OUTPUT_DIR / "niyet_bagimsiz_test.csv"
REPORT_OUTPUT = OUTPUT_DIR / "niyet_veri_raporu.txt"

RANDOM_STATE = 42
TRAIN_PER_INTENT = 60
TEST_PER_INTENT = 15


# =========================================================
# YENİ NİYETLER
# =========================================================

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

HAVA_SORUSU = "HAVA_SORUSU"
TARIH_SAAT_SORUSU = "TARIH_SAAT_SORUSU"
YEMEK_TARIFI_SORUSU = "YEMEK_TARIFI_SORUSU"
HABER_SORUSU = "HABER_SORUSU"

YENI_OZEL_NIYETLER = (
    BOT_KIMLIK,
    BOT_KONUM,
    BOT_YARATICI,
    BOT_YAS,
    BOT_YETENEK,
    TESEKKUR,
    VEDA,
    SAKA_ISTEGI,
)

MASSIVE_ESLEME = {
    "weather_query": HAVA_SORUSU,
    "datetime_query": TARIH_SAAT_SORUSU,
    "cooking_recipe": YEMEK_TARIFI_SORUSU,
    "news_query": HABER_SORUSU,
}


# =========================================================
# METİN ÜRETME VE TABLOYA ÇEVİRME
# =========================================================

def temiz_metin(metin: object) -> str:
    return re.sub(r"\s+", " ", str(metin or "")).strip()


def benzersiz(metinler: list[str]) -> list[str]:
    sonuc: list[str] = []
    gorulenler: set[str] = set()

    for metin in metinler:
        temiz = temiz_metin(metin)
        normal = turkce_normalize(temiz)

        if normal and normal not in gorulenler:
            gorulenler.add(normal)
            sonuc.append(temiz)

    return sonuc


def kombinasyon(
    onler: list[str],
    govdeler: list[str],
    sonlar: list[str],
    ekler: list[str] | None = None,
) -> list[str]:
    adaylar = list(ekler or [])

    for on in onler:
        for govde in govdeler:
            for son in sonlar:
                adaylar.append(
                    " ".join(
                        parca
                        for parca in (on, govde, son)
                        if parca
                    )
                )

    return benzersiz(adaylar)


def sozlukten_aday_df(
    veri: dict[str, list[str]],
    bolum: str,
    kaynak: str,
) -> pd.DataFrame:
    satirlar: list[dict[str, str]] = []

    for niyet, cumleler in veri.items():
        for cumle in cumleler:
            metin = temiz_metin(cumle)
            normal = turkce_normalize(metin)

            if normal:
                satirlar.append(
                    {
                        "Metin": metin,
                        "Normal Metin": normal,
                        "Niyet": str(niyet),
                        "Kaynak": kaynak,
                        "Bölüm": bolum,
                    }
                )

    df = pd.DataFrame(satirlar)

    if df.empty:
        raise ValueError(
            f"{kaynak} kaynağından {bolum} verisi üretilemedi."
        )

    return df.drop_duplicates(
        subset=["Niyet", "Normal Metin"],
        keep="first",
    ).reset_index(drop=True)


# =========================================================
# YENİ TEMEL SOHBET ADAYLARI
# =========================================================

def ozel_train_adaylari() -> dict[str, list[str]]:
    return {
        BOT_KIMLIK: kombinasyon(
            ["", "merak ettim", "söyler misin", "kısaca", "açıklar mısın"],
            [
                "sen kimsin",
                "adın ne",
                "ismin nedir",
                "kendini tanıt",
                "nasıl bir asistansın",
                "sen bir robot musun",
                "sen nesin",
                "kim olduğunu anlat",
                "karşımda kim var",
                "hangi sistemsin",
            ],
            ["", "lütfen", "bana"],
            [
                "KitapPusula sen misin",
                "senin kimliğin ne",
                "kendinden biraz bahset",
            ],
        ),
        BOT_KONUM: kombinasyon(
            ["", "merak ettim", "söyler misin", "acaba", "şu anda"],
            [
                "nerede yaşıyorsun",
                "nerede bulunuyorsun",
                "hangi şehirde yaşıyorsun",
                "evin nerede",
                "nerelisin",
                "fiziksel olarak neredesin",
                "hangi ülkedesin",
                "konumun neresi",
                "bir adresin var mı",
                "hangi ortamda çalışıyorsun",
            ],
            ["", "lütfen", "şu anda"],
            [
                "senin bir memleketin var mı",
                "internette mi yaşıyorsun",
                "bir şehirde mi bulunuyorsun",
            ],
        ),
        BOT_YARATICI: kombinasyon(
            ["", "merak ettim", "söyler misin", "acaba", "doğrudan"],
            [
                "seni kim geliştirdi",
                "seni kim yaptı",
                "yaratıcın kim",
                "geliştiricin kim",
                "bu projeyi kim hazırladı",
                "seni kim kodladı",
                "sahibin kim",
                "arkanda kim var",
                "bu uygulamayı yapan kim",
                "kodlarını kim yazdı",
            ],
            ["", "lütfen", "bana"],
            [
                "Merve mi seni geliştirdi",
                "kim tarafından yapıldın",
                "bu sistemi kuran kişi kim",
            ],
        ),
        BOT_YAS: kombinasyon(
            ["", "merak ettim", "söyler misin", "acaba", "şu anda"],
            [
                "kaç yaşındasın",
                "yaşın kaç",
                "ne zaman doğdun",
                "doğum tarihin ne",
                "genç misin",
                "yaşlı mısın",
                "bir yaşın var mı",
                "ne zamandır varsın",
                "kaç yıllıksın",
                "doğum günün ne zaman",
            ],
            ["", "lütfen", "şu anda"],
            [
                "senin yaşın olur mu",
                "bir doğum yılın var mı",
                "yaş kavramı senin için geçerli mi",
            ],
        ),
        BOT_YETENEK: kombinasyon(
            ["", "merak ettim", "söyler misin", "kısaca", "ayrıntılı olarak"],
            [
                "neler yapabiliyorsun",
                "ne yapabilirsin",
                "yeteneklerin neler",
                "hangi konularda yardımcı olursun",
                "ne işe yarıyorsun",
                "özelliklerin neler",
                "hangi görevleri yaparsın",
                "senden ne isteyebilirim",
                "hangi soruları anlayabilirsin",
                "bana nasıl yardım edersin",
            ],
            ["", "lütfen", "anlatır mısın"],
            [
                "kitaplar dışında ne biliyorsun",
                "işlevlerini sıralar mısın",
                "kullanım alanın nedir",
            ],
        ),
        TESEKKUR: kombinasyon(
            ["", "çok", "gerçekten", "yardımın için", "verdiğin cevap için"],
            [
                "teşekkür ederim",
                "teşekkürler",
                "sağ ol",
                "çok sağ ol",
                "eyvallah",
                "minnettarım",
                "emeğine sağlık",
                "yardımın işime yaradı",
                "cevabın faydalı oldu",
                "çok yardımcı oldun",
            ],
            ["", "KitapPusula", "sana"],
            [
                "çok teşekkürler",
                "sağ olasın",
                "teşekkürümü kabul et",
            ],
        ),
        VEDA: kombinasyon(
            ["", "tamam", "şimdilik", "o zaman", "artık"],
            [
                "görüşürüz",
                "hoşça kal",
                "bay bay",
                "kendine iyi bak",
                "sonra konuşuruz",
                "ben çıkıyorum",
                "şimdilik bu kadar",
                "tekrar görüşmek üzere",
                "sohbeti bitirelim",
                "başka zaman devam edelim",
            ],
            ["", "KitapPusula", "sonra"],
            [
                "hadi görüşürüz",
                "ben kaçıyorum",
                "yeniden görüşmek dileğiyle",
            ],
        ),
        SAKA_ISTEGI: kombinasyon(
            ["", "bana", "lütfen", "bir tane", "hadi"],
            [
                "şaka yap",
                "espri yap",
                "komik bir şey söyle",
                "beni güldür",
                "kitaplarla ilgili şaka anlat",
                "kısa bir fıkra anlat",
                "eğlenceli bir söz söyle",
                "bir espri patlat",
                "biraz mizah yap",
                "neşeli bir cümle kur",
            ],
            ["", "olur mu", "lütfen"],
            [
                "kitap kurdu şakası yap",
                "biraz gülelim",
                "komik bir cevap ver",
            ],
        ),
        GENEL_SOHBET: kombinasyon(
            ["", "bugün", "şu an", "açıkçası", "bazen", "sanırım"],
            [
                "biraz sohbet etmek istiyorum",
                "seninle konuşmak güzel",
                "kitaplardan konuşmayı seviyorum",
                "burada vakit geçirmek hoşuma gidiyor",
                "bir şeyler paylaşmak istiyorum",
                "aklıma bir konu geldi",
                "sohbetimiz güzel gidiyor",
                "konuşacak çok şey var",
                "biraz muhabbet edelim",
                "sana bir şey anlatacağım",
            ],
            ["", "aslında", "biraz", "şimdi"],
        ),
        HABER_SORUSU: kombinasyon(
            ["", "bugün", "şu anda", "son olarak", "merak ettim"],
            [
                "güncel gelişmeler neler",
                "gündem nasıl",
                "hangi haberler konuşuluyor",
                "son haberler neler",
                "günün öne çıkan haberleri hangileri",
                "haber gündeminde ne bulunuyor",
                "şu an hangi gelişmeler var",
                "bugün dünyada neler oldu",
                "ülke gündeminde neler var",
                "güncel haberleri anlat",
                "son dakika gelişmeleri neler",
                "haberlerde ne var",
            ],
            ["", "söyler misin", "özetler misin", "lütfen"],
            [
                "gündemi öğrenmek istiyorum",
                "bugünkü gelişmeleri merak ediyorum",
                "haber başlıklarını paylaş",
                "güncel olaylardan bahset",
            ],
        ),
        ALAN_DISI: kombinasyon(
            ["", "bana", "lütfen", "hemen", "kısaca"],
            [
                "Python kodu yaz",
                "kod yazabilir misin",
                "bir program kodla",
                "örnek kod oluştur",
                "uygulama kodu hazırla",
                "bana yazılım geliştir",
                "bir fonksiyon yaz",
                "Java kodu yaz",
                "C sharp kodu üret",
                "bir web sitesi tasarla",
                "matematik sorusu çöz",
                "borsa tahmini yap",
                "hukuki tavsiye ver",
                "tıbbi teşhis koy",
                "uçak bileti bul",
                "otel öner",
                "telefon tamirini anlat",
                "fotoğraf düzenle",
                "İngilizce metni çevir",
                "spor müsabakasının skorunu söyle",
                "şifre kırmayı öğret",
                "oyun kodu geliştir",
                "iş başvurusu hazırla",
                "alışveriş listesi oluştur",
            ],
            ["", "olur mu", "istiyorum"],
            [
                "kitaplarla ilgisi olmayan bir görev yap",
                "bana bilgisayar donanımı öner",
                "araba arızasını çöz",
            ],
        ),
    }


def ozel_test_adaylari() -> dict[str, list[str]]:
    return {
        BOT_KIMLIK: kombinasyon(
            ["", "doğrudan", "tek cümleyle", "kısaca"],
            [
                "karşımdaki asistan kim",
                "kendi kimliğini açıkla",
                "ne tür bir yazılımsın",
                "adını ve görevini söyle",
                "bir insan mısın yoksa program mı",
                "hangi uygulamasın",
            ],
            ["", "söyler misin", "lütfen"],
        ),
        BOT_KONUM: kombinasyon(
            ["", "fiziksel olarak", "doğrudan", "şu anda"],
            [
                "hangi ortamda çalışıyorsun",
                "bir şehirde mi bulunuyorsun",
                "yaşadığın bir yer var mı",
                "nerede barınıyorsun",
                "senin adresin var mı",
                "hangi cihazın içindesin",
            ],
            ["", "söyler misin", "lütfen"],
        ),
        BOT_YARATICI: kombinasyon(
            ["", "merak ettim", "doğrudan", "kısaca"],
            [
                "bu uygulamayı hazırlayan kim",
                "geliştirme işini kim yaptı",
                "seni oluşturan kişinin adı ne",
                "bu projenin geliştiricisi kim",
                "programını kim yazdı",
                "seni meydana getiren kim",
            ],
            ["", "söyler misin", "lütfen"],
        ),
        BOT_YAS: kombinasyon(
            ["", "şu anda", "merak ettim", "doğrudan"],
            [
                "kaç senedir çalışıyorsun",
                "bir doğum yılın bulunuyor mu",
                "ne kadar zamandır aktifsin",
                "senin doğduğun bir gün var mı",
                "yaşını nasıl hesaplıyorsun",
                "bir yaşa sahip misin",
            ],
            ["", "söyler misin", "lütfen"],
        ),
        BOT_YETENEK: kombinasyon(
            ["", "kısaca", "ayrıntılı olarak", "doğrudan"],
            [
                "hangi işleri başarabilirsin",
                "benden gelen hangi soruları çözersin",
                "yardım edebildiğin konular hangileri",
                "hangi özelliklere sahipsin",
                "kullanıcıya ne sunuyorsun",
                "görev alanın nedir",
            ],
            ["", "anlatır mısın", "lütfen"],
        ),
        TESEKKUR: kombinasyon(
            ["", "yardımın için", "verdiğin yanıt için", "gerçekten"],
            [
                "minnetlerimi sunarım",
                "emeğin için sağ ol",
                "cevabın işime yaradı",
                "teşekkürümü kabul et",
                "yardımın faydalı oldu",
                "çok naziksin",
            ],
            ["", "KitapPusula", "sana"],
        ),
        VEDA: kombinasyon(
            ["", "artık", "şimdi", "o halde"],
            [
                "sohbeti sonlandıralım",
                "burada ayrılalım",
                "oturumu kapatalım",
                "bugünlük yeter",
                "sonra yeniden konuşalım",
                "ben artık gidiyorum",
            ],
            ["", "hoşça kal", "KitapPusula"],
        ),
        SAKA_ISTEGI: kombinasyon(
            ["", "hadi", "lütfen", "bir tane"],
            [
                "neşeli bir kitap esprisi söyle",
                "komik bir cümle kur",
                "gülmem için bir şey anlat",
                "kısa ve eğlenceli bir şaka söyle",
                "beni biraz neşelendir",
                "kitap temalı mizah yap",
            ],
            ["", "olur mu", "lütfen"],
        ),
        GENEL_SOHBET: kombinasyon(
            ["", "bugün", "şu sıralar", "açıkçası"],
            [
                "konuşmak bana iyi geliyor",
                "biraz muhabbet etmek isterim",
                "aklımdakileri paylaşacağım",
                "sohbet etmeye devam edelim",
                "seninle kitap konuşmak hoş",
                "bir konu üzerine konuşalım",
            ],
            ["", "şimdi", "biraz"],
        ),
        HABER_SORUSU: kombinasyon(
            ["", "bugün", "şimdi", "kısaca"],
            [
                "günün gündemi nedir",
                "haberlerde hangi konular var",
                "son gelişmeleri söyle",
                "güncel olaylar neler",
                "hangi haberler öne çıkıyor",
                "bugünkü haber başlıkları neler",
                "dünyada şu an neler oluyor",
                "haber gündemini özetle",
            ],
            ["", "anlatır mısın", "söyler misin", "lütfen"],
        ),
        ALAN_DISI: kombinasyon(
            ["", "bana", "lütfen", "kısaca"],
            [
                "mobil uygulama geliştir",
                "kod yazıp gönder",
                "bir sınıf kodla",
                "programlama ödevi yap",
                "yazılım kodu üret",
                "vergi hesabı yap",
                "ev dekorasyonu öner",
                "bilgisayar virüsünü temizle",
                "futbol maçı sonucu ver",
                "bir sözleşme hazırla",
                "sağlık raporumu yorumla",
                "gezi rotası çiz",
                "ürün fiyatı araştır",
                "sunucu kurulumunu anlat",
            ],
            ["", "olur mu", "istiyorum"],
        ),
    }


# =========================================================
# MASSIVE VERİSİNİ OKUMA
# =========================================================

def massive_yukle(
    path: Path,
    bolum: str,
) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(
            "MASSIVE dosyası bulunamadı:\n"
            f"{path.resolve()}"
        )

    df = pd.read_csv(path, low_memory=False)

    gerekli = {"intent_name", "utt"}
    eksik = gerekli.difference(df.columns)

    if eksik:
        raise ValueError(
            f"{path.name} dosyasında eksik sütunlar var: "
            f"{sorted(eksik)}"
        )

    df = df.dropna(subset=["intent_name", "utt"]).copy()
    df["intent_name"] = df["intent_name"].astype(str).str.strip()
    df["Metin"] = df["utt"].astype(str).str.strip()
    df["Normal Metin"] = df["Metin"].apply(turkce_normalize)

    df = df[df["intent_name"].isin(MASSIVE_ESLEME)].copy()
    df["Niyet"] = df["intent_name"].map(MASSIVE_ESLEME)
    df["Kaynak"] = "MASSIVE-tr-TR"
    df["Bölüm"] = bolum

    return df[
        ["Metin", "Normal Metin", "Niyet", "Kaynak", "Bölüm"]
    ].drop_duplicates(
        subset=["Niyet", "Normal Metin"],
        keep="first",
    ).reset_index(drop=True)


# =========================================================
# DENGELİ SEÇİM
# =========================================================

def siniftan_sec(
    aday_df: pd.DataFrame,
    niyet: str,
    hedef: int,
    yasak_normaller: set[str],
    seed: int,
) -> pd.DataFrame:
    adaylar = aday_df[
        (aday_df["Niyet"] == niyet)
        & (~aday_df["Normal Metin"].isin(yasak_normaller))
    ].drop_duplicates(
        subset=["Normal Metin"],
        keep="first",
    ).copy()

    if len(adaylar) < hedef:
        raise ValueError(
            f"{niyet} için yeterli aday bulunamadı: "
            f"{len(adaylar)} / {hedef}"
        )

    # HABER_SORUSU ve ALAN_DISI için elle hazırlanmış Türkçe örneklerin
    # bir bölümü eğitimde mutlaka yer alsın. Böylece kısa ve günlük
    # ifadeler yalnızca MASSIVE çevirilerine bırakılmaz.
    oncelikli_niyetler = {
        HABER_SORUSU,
        ALAN_DISI,
    }

    if niyet in oncelikli_niyetler:
        ozel = adaylar[
            adaylar["Kaynak"].eq(
                "KitapPusula-Final-özel"
            )
        ].copy()

        # Önce en fazla 24 özel Türkçe örnek seçilir.
        # Ardından kalan ihtiyaç, seçilmemiş bütün adaylardan tamamlanır.
        # Böylece diğer kaynak havuzu boş olsa bile pandas.sample hatası oluşmaz.
        ozel_hedef = min(
            24,
            len(ozel),
            hedef,
        )

        if ozel_hedef > 0:
            secilen_ozel = ozel.sample(
                n=ozel_hedef,
                random_state=seed,
            )
        else:
            secilen_ozel = adaylar.iloc[0:0].copy()

        kalan_hedef = hedef - len(secilen_ozel)

        kalan_havuz = adaylar[
            ~adaylar.index.isin(
                secilen_ozel.index
            )
        ].copy()

        if len(kalan_havuz) < kalan_hedef:
            raise ValueError(
                f"{niyet} için seçim havuzu yetersiz: "
                f"{len(kalan_havuz)} / {kalan_hedef}"
            )

        if kalan_hedef > 0:
            secilen_kalan = kalan_havuz.sample(
                n=kalan_hedef,
                random_state=seed + 100,
            )
        else:
            secilen_kalan = adaylar.iloc[0:0].copy()

        return pd.concat(
            [secilen_ozel, secilen_kalan],
            ignore_index=True,
        ).sample(
            frac=1.0,
            random_state=seed + 200,
        ).reset_index(drop=True)

    return adaylar.sample(
        n=hedef,
        random_state=seed,
    ).copy()


def dengeli_veri_olustur(
    aday_df: pd.DataFrame,
    siniflar: list[str],
    hedef: int,
    yasak_normaller: set[str],
    seed_baslangic: int,
) -> pd.DataFrame:
    kullanilan = set(yasak_normaller)
    parcalar: list[pd.DataFrame] = []

    for sira, niyet in enumerate(siniflar):
        secilen = siniftan_sec(
            aday_df=aday_df,
            niyet=niyet,
            hedef=hedef,
            yasak_normaller=kullanilan,
            seed=seed_baslangic + sira,
        )

        kullanilan.update(secilen["Normal Metin"])
        parcalar.append(secilen)

    sonuc = pd.concat(parcalar, ignore_index=True)

    return sonuc.sample(
        frac=1.0,
        random_state=seed_baslangic,
    ).reset_index(drop=True)


def denge_kontrolu(
    df: pd.DataFrame,
    beklenen_siniflar: set[str],
    hedef: int,
    bolum: str,
) -> None:
    gercek_siniflar = set(df["Niyet"].unique())

    if gercek_siniflar != beklenen_siniflar:
        raise ValueError(
            f"{bolum} sınıf listesi hatalı.\n"
            f"Eksik: {sorted(beklenen_siniflar - gercek_siniflar)}\n"
            f"Fazla: {sorted(gercek_siniflar - beklenen_siniflar)}"
        )

    sayilar = df["Niyet"].value_counts().sort_index()

    if not (sayilar == hedef).all():
        raise ValueError(
            f"{bolum} sınıfları dengeli değil:\n"
            f"{sayilar.to_string()}"
        )


# =========================================================
# ANA PROGRAM
# =========================================================

def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 84)
    print(f"KİTAPPUSULA NİYET VERİ SETİ OLUŞTURUCU - {SCRIPT_VERSION}")
    print("=" * 84)

    v6_train_sozluk = egitim_ornekleri()
    v6_test_sozluk = bagimsiz_test_ornekleri()

    v6_siniflar = set(v6_train_sozluk)
    if set(v6_test_sozluk) != v6_siniflar:
        raise ValueError(
            "V6 eğitim ve test sınıfları aynı değil."
        )

    # GENEL_SOHBET ve ALAN_DISI yeni, çakışmasız örneklerle yeniden kurulur.
    korunacak_v6_siniflar = sorted(
        v6_siniflar - {GENEL_SOHBET, ALAN_DISI}
    )

    v6_train_filtreli = {
        niyet: v6_train_sozluk[niyet]
        for niyet in korunacak_v6_siniflar
    }
    v6_test_filtreli = {
        niyet: v6_test_sozluk[niyet]
        for niyet in korunacak_v6_siniflar
    }

    base_train = sozlukten_aday_df(
        v6_train_filtreli,
        bolum="eğitim",
        kaynak="KitapPusula-V6",
    )
    base_test = sozlukten_aday_df(
        v6_test_filtreli,
        bolum="bağımsız_test",
        kaynak="KitapPusula-V6",
    )

    ozel_train = sozlukten_aday_df(
        ozel_train_adaylari(),
        bolum="eğitim",
        kaynak="KitapPusula-Final-özel",
    )
    ozel_test = sozlukten_aday_df(
        ozel_test_adaylari(),
        bolum="bağımsız_test",
        kaynak="KitapPusula-Final-özel",
    )

    massive_train = massive_yukle(
        MASSIVE_TRAIN_PATH,
        bolum="eğitim",
    )
    massive_test = massive_yukle(
        MASSIVE_TEST_PATH,
        bolum="bağımsız_test",
    )

    tum_siniflar = (
        korunacak_v6_siniflar
        + [GENEL_SOHBET, ALAN_DISI]
        + list(YENI_OZEL_NIYETLER)
        + list(MASSIVE_ESLEME.values())
    )

    if len(tum_siniflar) != len(set(tum_siniflar)):
        raise ValueError(
            "Niyet listesinde tekrarlanan sınıf bulundu."
        )

    train_adaylari = pd.concat(
        [base_train, ozel_train, massive_train],
        ignore_index=True,
    ).drop_duplicates(
        subset=["Niyet", "Normal Metin"],
        keep="first",
    )

    train_df = dengeli_veri_olustur(
        aday_df=train_adaylari,
        siniflar=tum_siniflar,
        hedef=TRAIN_PER_INTENT,
        yasak_normaller=set(),
        seed_baslangic=RANDOM_STATE,
    )

    train_normalleri = set(train_df["Normal Metin"])

    test_adaylari = pd.concat(
        [base_test, ozel_test, massive_test],
        ignore_index=True,
    ).drop_duplicates(
        subset=["Niyet", "Normal Metin"],
        keep="first",
    )

    test_df = dengeli_veri_olustur(
        aday_df=test_adaylari,
        siniflar=tum_siniflar,
        hedef=TEST_PER_INTENT,
        yasak_normaller=train_normalleri,
        seed_baslangic=RANDOM_STATE + 1000,
    )

    beklenen_siniflar = set(tum_siniflar)

    denge_kontrolu(
        train_df,
        beklenen_siniflar=beklenen_siniflar,
        hedef=TRAIN_PER_INTENT,
        bolum="Eğitim",
    )
    denge_kontrolu(
        test_df,
        beklenen_siniflar=beklenen_siniflar,
        hedef=TEST_PER_INTENT,
        bolum="Bağımsız test",
    )

    sizinti = set(train_df["Normal Metin"]).intersection(
        set(test_df["Normal Metin"])
    )

    if sizinti:
        raise ValueError(
            "Eğitim ve test arasında metin sızıntısı bulundu:\n"
            + "\n".join(sorted(sizinti)[:20])
        )

    train_df.to_csv(
        TRAIN_OUTPUT,
        index=False,
        encoding="utf-8-sig",
    )
    test_df.to_csv(
        TEST_OUTPUT,
        index=False,
        encoding="utf-8-sig",
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

    rapor = "\n".join(
        [
            "=" * 84,
            f"KİTAPPUSULA V{SCRIPT_VERSION} - BİRLEŞİK NİYET VERİ RAPORU",
            "=" * 84,
            f"Niyet sınıfı sayısı     : {len(beklenen_siniflar)}",
            f"Eğitim cümlesi          : {len(train_df):,}",
            f"Bağımsız test cümlesi   : {len(test_df):,}",
            f"Sınıf başına eğitim     : {TRAIN_PER_INTENT}",
            f"Sınıf başına test       : {TEST_PER_INTENT}",
            "Eğitim-test çakışması   : 0",
            "",
            "Eğitim kaynakları:",
            train_df["Kaynak"].value_counts().sort_index().to_string(),
            "",
            "Eğitim dağılımı:",
            train_sayilari.to_string(),
            "",
            "Bağımsız test dağılımı:",
            test_sayilari.to_string(),
        ]
    )

    REPORT_OUTPUT.write_text(
        rapor,
        encoding="utf-8",
    )

    print(rapor)

    print("\nOluşturulan dosyalar:")
    print(f"  • {TRAIN_OUTPUT.resolve()}")
    print(f"  • {TEST_OUTPUT.resolve()}")
    print(f"  • {REPORT_OUTPUT.resolve()}")

    print(
        "\nBaşarılı: Final niyet veri seti hazırlandı. "
        "Eski niyet modeli henüz değiştirilmedi."
    )


if __name__ == "__main__":
    main()
