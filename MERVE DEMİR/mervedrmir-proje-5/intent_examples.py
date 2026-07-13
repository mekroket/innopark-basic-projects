from __future__ import annotations

import re


TRAIN_TARGET_PER_INTENT = 60


TEST_TARGET_PER_INTENT = 15


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
)


def turkce_normalize(metin: object) -> str:
    """Türkçe metni karşılaştırma ve model girdisi için sadeleştirir."""

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


def _benzersiz(ornekler: list[str]) -> list[str]:
    sonuc: list[str] = []
    gorulenler: set[str] = set()

    for ornek in ornekler:
        normal = turkce_normalize(ornek)
        if normal and normal not in gorulenler:
            gorulenler.add(normal)
            sonuc.append(re.sub(r"\s+", " ", ornek).strip())

    return sonuc


def _kombine(
    onler: list[str],
    govdeler: list[str],
    sonlar: list[str],
    hedef: int,
    ekler: list[str] | None = None,
) -> list[str]:
    adaylar: list[str] = list(ekler or [])

    # Aynı birkaç kalıbın veri setini doldurmasını önlemek için
    # önce farklı gövdeleri dolaşır, sonra ön/son varyasyonlarını genişletir.
    for on in onler:
        for son in sonlar:
            for govde in govdeler:
                adaylar.append(" ".join(parca for parca in (on, govde, son) if parca))

    sonuc = _benzersiz(adaylar)
    if len(sonuc) < hedef:
        raise ValueError(
            f"Yeterli benzersiz niyet örneği üretilemedi: {len(sonuc)} / {hedef}"
        )
    return sonuc[:hedef]


def egitim_ornekleri() -> dict[str, list[str]]:
    """21 niyet için dengeli, proje odaklı Türkçe eğitim verisi üretir."""

    veri: dict[str, list[str]] = {}
    h = TRAIN_TARGET_PER_INTENT

    veri[Niyetler.YAZAR] = _kombine(
        ["bu kitabın", "bu eserin", "az önceki kitabın", "gösterdiğin romanın", "okuduğumuz eserin", "bunun"],
        [
            "yazarı kim",
            "yazan kişi kim",
            "müellifi kim",
            "kimin eseri",
            "kim tarafından yazıldı",
            "kim kaleme aldı",
            "yazarının adı ne",
            "hangi yazar yazdı",
            "sahibi hangi yazar",
        ],
        ["", "söyler misin", "hatırlatır mısın"],
        h,
        ["bunu kim yazmış", "yazarı neydi", "kim yazdı bunu", "bu kitap kime ait"],
    )

    veri[Niyetler.KARAKTER] = _kombine(
        ["bu kitapta", "bu romanda", "hikâyede", "eserde", "az önceki kitapta", "anlatıda"],
        [
            "ana karakter kim",
            "başkahraman kim",
            "merkezdeki kişi kim",
            "kahramanın adı ne",
            "öne çıkan karakter kim",
            "baş karakter kimdir",
            "hangi karakterler var",
            "hikâyeyi taşıyan kişi kim",
            "anlatılan kişi kim",
        ],
        ["", "söyler misin", "hatırlatır mısın"],
        h,
        [
            "Ali kim",
            "Santiago kim",
            "Feride kim",
            "Koca Ali kimdir",
            "bu karakter kimmiş",
            "kahraman kim ki",
        ],
    )

    veri[Niyetler.OLAY] = _kombine(
        ["bu kitapta", "romanda", "hikâyede", "eserde", "olay örgüsünde", "kahramanın yolculuğunda"],
        [
            "sonunda ne oluyor",
            "olaylar nasıl gelişiyor",
            "kahraman neden yola çıkıyor",
            "başına neler geliyor",
            "ana olay nedir",
            "hikâye nasıl bitiyor",
            "neden böyle davranıyor",
            "bu olayın sebebi ne",
            "hangi maceralar yaşanıyor",
        ],
        ["", "anlatır mısın", "kısaca söyler misin"],
        h,
        [
            "Santiago neden Mısır'a gidiyor",
            "Ali neden borçlanıyor",
            "finalde ne yaşanıyor",
            "son bölümde ne oluyor",
        ],
    )

    veri[Niyetler.SAYFA] = _kombine(
        ["bu kitap", "bu eser", "az önceki kitap", "gösterdiğin roman", "bahsettiğimiz kitap", "seçtiğim eser"],
        [
            "kaç sayfa",
            "sayfa sayısı kaç",
            "ne kadar uzun",
            "uzun bir kitap mı",
            "okuması uzun sürer mi",
            "kaç sayfalık",
            "kalın mı",
            "hacmi ne kadar",
        ],
        ["", "söyler misin", "hatırlatır mısın"],
        h,
        ["kaç sayfaydı", "sayfa bilgisini ver", "kitabın uzunluğu nedir"],
    )

    veri[Niyetler.TUR] = _kombine(
        ["bu kitap", "bu eser", "az önceki kitap", "gösterdiğin roman", "bahsettiğimiz eser", "seçtiğim kitap"],
        [
            "hangi tür",
            "türü ne",
            "kategorisi ne",
            "hangi türe ait",
            "hangi edebî sınıfa giriyor",
            "roman mı hikâye mi",
            "edebî türü nedir",
            "hangi kategoride",
        ],
        ["", "söyler misin", "hatırlatır mısın"],
        h,
        ["türü neydi", "bu roman mı", "kategori bilgisini ver"],
    )

    veri[Niyetler.OZET] = _kombine(
        ["bu kitap", "bu eser", "az önceki kitap", "gösterdiğin roman", "bahsettiğimiz eser", "seçtiğim kitap"],
        [
            "ne anlatıyor",
            "konusu ne",
            "neyi konu alıyor",
            "kısaca özetle",
            "hikâyesi ne",
            "içeriğinden bahset",
            "ana konusu nedir",
            "kısa özetini ver",
        ],
        ["", "lütfen", "anlatır mısın"],
        h,
        ["özetle", "bana konusunu anlat", "neyle ilgili bu"],
    )

    veri[Niyetler.DETAY] = _kombine(
        ["bu kitap hakkında", "bu eserle ilgili", "az önceki kitap için", "gösterdiğin roman hakkında", "hikâye üzerine", "seçtiğimiz kitap için"],
        [
            "daha fazla detay ver",
            "biraz daha ayrıntı anlat",
            "ek bilgi paylaş",
            "konuyu daha geniş açıkla",
            "başka neler biliyorsun",
            "daha derin bilgi ver",
            "ayrıntılı anlat",
            "detaylandır",
        ],
        ["", "lütfen", "mümkünse"],
        h,
        ["az daha detay ver", "aynı özeti değil daha ayrıntılı anlat", "konuyu biraz aç"],
    )

    veri[Niyetler.SERBEST_KITAP] = _kombine(
        ["sence", "yorumuna göre", "bir okur olarak", "bu kitapta", "bu eser için", "yazar açısından"],
        [
            "verilmek istenen mesaj ne olabilir",
            "kitap okunmaya değer mi",
            "ana fikir nasıl yorumlanabilir",
            "yazar bunu neden yazmış olabilir",
            "bu eserden ne ders çıkarılır",
            "karakterin davranışı nasıl değerlendirilebilir",
            "kitap kimlere uygun",
            "eserin duygusu nasıl",
            "sonun anlamı ne olabilir",
            "kitap hakkında ne düşünüyorsun",
        ],
        ["", "yorumlar mısın", "kısaca değerlendir"],
        h,
        [
            "Paulo neden bu kitabı yazmış olabilir",
            "sence bana uygun mu",
            "bu kitap insana ne hissettirir",
            "kitabın mesajını yorumla",
        ],
    )

    veri[Niyetler.KITAP_ADI] = _kombine(
        ["", "az önce", "biraz önce", "şu anda", "son olarak", "hafızandaki kayda göre"],
        [
            "hangi kitabı konuşuyoruz",
            "kitabın adı neydi",
            "hangi eser açık",
            "son kitap hangisiydi",
            "neye bakıyorduk",
            "kitabın ismini hatırlat",
            "hangi kitaptan söz ettik",
            "seçtiğimiz kitabın adı ne",
        ],
        ["", "söyler misin", "hatırlatır mısın"],
        h,
        ["adı ne bunun", "bu hangi kitaptı", "son aradığım kitap neydi"],
    )

    veri[Niyetler.TEKRAR] = _kombine(
        ["", "lütfen", "az önceki kitap için", "bu eser için", "tekrar", "yeniden"],
        [
            "bütün bilgileri göster",
            "kitap kartını aç",
            "bilgileri baştan yaz",
            "yazar tür sayfa ve özeti söyle",
            "detayları yeniden göster",
            "tam bilgiyi getir",
            "kitap bilgisini yinele",
            "hepsini tekrar et",
        ],
        ["", "lütfen", "bir kez daha"],
        h,
        ["baştan göster", "bilgileri tekrar ver", "aynı kartı yeniden aç"],
    )

    veri[Niyetler.HER_KITAP] = _kombine(
        ["sen", "bu sistem", "KitapPusula", "yerel veri tabanın", "uygulama", "model"],
        [
            "her kitabı bulabiliyor musun",
            "bütün kitapları biliyor mu",
            "dünyadaki tüm eserleri tanıyor mu",
            "veri setinde olmayan kitabı bulabilir mi",
            "sınırsız kitaba erişebiliyor mu",
            "istediğim her eseri getirebilir mi",
            "tüm kitaplar sende var mı",
        ],
        ["", "gerçekten", "şu anda"],
        h,
        ["her kitap sende mevcut mu", "bilmediğin kitap var mı"],
    )

    veri[Niyetler.KITAP_SAYISI] = _kombine(
        ["", "yerel veri tabanında", "sistemde", "kütüphanende", "veri setinde", "KitapPusula içinde"],
        [
            "kaç kitap var",
            "kitap sayısı kaç",
            "toplam kaç eser bulunuyor",
            "kaç kayıt tutuluyor",
            "ne kadar kitap biliyorsun",
            "kaç kitabı arayabiliyorsun",
            "kitap havuzu ne kadar büyük",
        ],
        ["", "söyler misin", "şu anda"],
        h,
        ["elinde kaç kitap var", "toplam kayıt sayısını ver"],
    )

    veri[Niyetler.KATEGORILER] = _kombine(
        ["", "model", "sınıflandırıcı", "KitapPusula", "kategori modeli", "sistemin"],
        [
            "hangi türleri biliyor",
            "desteklenen kategoriler neler",
            "hangi sınıflar var",
            "kaç tür tanıyor",
            "edebî kategorileri göster",
            "hangi kitap türlerini ayırıyor",
            "kategori listesini ver",
        ],
        ["", "söyler misin", "şu anda"],
        h,
        ["türlerin neler", "sınıflandırma etiketlerini göster"],
    )

    veri[Niyetler.MODEL_BILGISI] = _kombine(
        ["", "kitap modeli için", "niyet modeli için", "sistemde", "eğitimde", "rapora göre"],
        [
            "model bilgilerini göster",
            "başarı oranı nedir",
            "macro f1 kaç",
            "hangi algoritma kullanıldı",
            "kaç örnekle eğitildi",
            "performans metrikleri ne",
            "cross validation sonucu nedir",
            "model nasıl çalışıyor",
        ],
        ["", "söyler misin", "ayrıntılı anlat"],
        h,
        ["doğruluk oranını göster", "kaç parametre öğrendi", "eğitim sonuçları ne"],
    )

    veri[Niyetler.YENI_SINIFLANDIR] = _kombine(
        ["", "modelle", "KitapPusula ile", "şimdi", "elimdeki açıklamaya göre", "yeni bir metin için"],
        [
            "yeni kitap sınıflandır",
            "kitap açıklamasından tür tahmin et",
            "etiketsiz kitabın kategorisini bul",
            "açıklamayı sınıfa ayır",
            "bilinmeyen kitabın türünü belirle",
            "yeni tahmin yap",
            "metinden kitap türü çıkar",
        ],
        ["", "lütfen", "başlat"],
        h,
        ["bir açıklama sınıflandırmak istiyorum", "yeni kitap türü tahmini yap"],
    )

    veri[Niyetler.YARDIM] = _kombine(
        ["", "bana", "kısaca", "uygulamada", "KitapPusula için", "sistem hakkında"],
        [
            "yardım et",
            "ne yapabiliyorsun",
            "nasıl kullanılır",
            "hangi soruları sorabilirim",
            "komutları göster",
            "özelliklerini anlat",
            "kullanım seçeneklerini ver",
            "nereden başlamalıyım",
        ],
        ["", "lütfen", "anlatır mısın"],
        h,
        ["yardım", "kullanım rehberini aç", "bana yol göster"],
    )

    selamlar = [
        "merhaba",
        "selam",
        "selamlar",
        "günaydın",
        "iyi günler",
        "iyi akşamlar",
        "iyi geceler",
        "merhabalar",
        "hey",
        "selamünaleyküm",
        "tekrar merhaba",
        "yeniden selam",
    ]
    veri[Niyetler.SELAMLAMA] = _kombine(
        [""],
        selamlar,
        ["", "KitapPusula", "orada mısın", "sana da", "bugün de", "arkadaşım"],
        h,
    )

    veri[Niyetler.NASILSIN] = _kombine(
        ["", "bugün", "şu anda", "peki", "merak ettim", "sana sorayım"],
        [
            "nasılsın",
            "iyi misin",
            "keyfin nasıl",
            "moralin nasıl",
            "nasıl gidiyor",
            "ne haber",
            "kendini nasıl hissediyorsun",
            "işler nasıl",
        ],
        ["", "KitapPusula", "bakalım", "söyler misin"],
        h,
        ["naber", "sen nasılsın", "her şey yolunda mı"],
    )

    veri[Niyetler.GENEL_SOHBET] = _kombine(
        ["", "bugün", "şu an", "aslında", "biraz", "sana bir şey söyleyeyim"],
        [
            "sen kimsin",
            "adın ne",
            "kendini tanıt",
            "benimle sohbet et",
            "çok yoruldum",
            "canım sıkkın",
            "sıkıldım",
            "bana bir espri yap",
            "motive edici bir şey söyle",
            "beni anlıyor musun",
            "neden cevap vermiyorsun",
            "biraz konuşalım",
        ],
        ["", "lütfen", "olur mu"],
        h,
        ["sorumun niyetini neden anlamıyorsun", "sen bir yapay zekâ mısın", "seni kim geliştirdi"],
    )

    alan_disi_govdeler = [
        "bana yemek tarifi ver",
        "makarna nasıl yapılır",
        "bugün hava nasıl",
        "yarın yağmur yağar mı",
        "matematik problemi çöz",
        "iki artı iki kaç",
        "python kodu yaz",
        "bilgisayarım neden yavaş",
        "futbol maçı kaç kaç",
        "film öner",
        "dizi tavsiye et",
        "müzik öner",
        "dolar kuru ne kadar",
        "telefon tavsiye et",
        "spor programı hazırla",
        "kahvaltılık tarif ver",
        "seyahat planı yap",
        "araba fiyatları nasıl",
        "bugün hangi gün",
        "İngilizce cümleyi çevir",
    ]
    veri[Niyetler.ALAN_DISI] = _kombine(
        ["", "lütfen", "şimdi"],
        alan_disi_govdeler,
        ["", "bilir misin", "yardım eder misin"],
        h,
    )

    kitaplar = [
        "Çalıkuşu",
        "Simyacı",
        "Diyet",
        "Suç ve Ceza",
        "Kürk Mantolu Madonna",
        "Tutunamayanlar",
        "1984",
        "Hayvan Çiftliği",
        "Şeker Portakalı",
        "Küçük Prens",
        "Dönüşüm",
        "Sefiller",
        "Karamazov Kardeşler",
        "Yeraltından Notlar",
        "İnce Memed",
        "Aşk-ı Memnu",
        "Mai ve Siyah",
        "Saatleri Ayarlama Enstitüsü",
        "Puslu Kıtalar Atlası",
        "Serenad",
        "Masumiyet Müzesi",
        "Kırmızı Saçlı Kadın",
        "Beyaz Diş",
        "Martin Eden",
        "Uğultulu Tepeler",
        "Gurur ve Önyargı",
        "Anna Karenina",
        "Madame Bovary",
        "Vadideki Zambak",
        "Yabancı",
        "Veba",
        "Körlük",
        "Olasılıksız",
        "Kayıp Sembol",
        "Da Vinci Şifresi",
        "Doğu Ekspresinde Cinayet",
        "On Küçük Zenci",
        "Harry Potter ve Felsefe Taşı",
        "Yüzüklerin Efendisi",
        "Hobbit",
        "Dune",
        "Fahrenheit 451",
        "Cesur Yeni Dünya",
        "Bülbülü Öldürmek",
        "Bir İdam Mahkumunun Son Günü",
        "İki Şehrin Hikayesi",
        "Denizler Altında Yirmi Bin Fersah",
        "Kırmızı Pazartesi",
        "Yüzyıllık Yalnızlık",
        "Momo",
        "Bilinmeyen Bir Kadının Mektubu",
        "İnsan Neyle Yaşar",
        "Bir Delinin Hatıra Defteri",
        "Dokuzuncu Hariciye Koğuşu",
        "Sineklerin Tanrısı",
        "Koku",
        "Monte Kristo Kontu",
        "Robinson Crusoe",
        "Define Adası",
        "Pollyanna",
    ]
    veri[Niyetler.KITAP_ARAMA] = _benzersiz(
        kitaplar
        + [
            "kitap ara Simyacı",
            "Çalıkuşu kitabını bul",
            "Diyet adlı eseri aç",
            "Suç ve Ceza'yı göster",
            "Kürk Mantolu Madonna'yı ara",
            "bana Dune kitabını getir",
        ]
    )[:h]

    eksikler = set(TUM_NIYETLER).difference(veri)
    if eksikler:
        raise ValueError(f"Eğitim verisinde eksik niyetler var: {sorted(eksikler)}")

    return veri


def bagimsiz_test_ornekleri() -> dict[str, list[str]]:
    """Eğitimde birebir bulunmayan, bağımsız değerlendirme cümleleri üretir."""

    h = TEST_TARGET_PER_INTENT
    test: dict[str, list[str]] = {}

    test[Niyetler.YAZAR] = _kombine(
        ["şu yapıtın", "incelediğimiz metnin", "elimdeki kitabın"],
        ["yaratıcısı hangi yazar", "kalem sahibi kim", "yazar adı nedir", "eseri ortaya koyan kim", "hangi edebiyatçı yazmış"],
        ["", "öğrenebilir miyim"],
        h,
    )
    test[Niyetler.KARAKTER] = _kombine(
        ["bu anlatıda", "öykünün içinde", "romanın merkezinde"],
        ["hikâyeyi taşıyan kişi kimmiş", "esas kişi hangisi", "başroldeki karakter kim", "kahraman olarak kimi görüyoruz", "merkez karakterin adı nedir"],
        ["", "anlatır mısın"],
        h,
    )
    test[Niyetler.OLAY] = _kombine(
        ["anlatının içinde", "romanın ilerleyen kısmında", "öykü boyunca"],
        ["çatışma nasıl ortaya çıkıyor", "kahramanın başına ne geliyor", "final hangi olayla tamamlanıyor", "yolculuğun nedeni nedir", "gelişmeler hangi sırayla yaşanıyor"],
        ["", "özetler misin"],
        h,
    )
    test[Niyetler.SAYFA] = _kombine(
        ["şu eser", "incelediğimiz yapıt", "bu baskı"],
        ["toplam kaç yapraklık", "okuma uzunluğu ne kadar", "sayfa adedi nedir", "kısa bir kitap sayılır mı", "kaç sayfadan oluşuyor"],
        ["", "merak ettim"],
        h,
    )
    test[Niyetler.TUR] = _kombine(
        ["şu eser", "incelediğimiz yapıt", "bu anlatı"],
        ["hangi edebiyat dalına girer", "tür bakımından nedir", "hangi sınıfta yer alıyor", "roman kategorisinde mi", "edebî biçimi nedir"],
        ["", "merak ettim"],
        h,
    )
    test[Niyetler.OZET] = _kombine(
        ["şu eser için", "incelediğimiz kitapta", "bu anlatının"],
        ["temel konuyu iki cümlede açıkla", "kısa bir konu özeti çıkar", "hikâyenin özünü anlat", "ana içeriği nedir", "genel olarak ne işleniyor"],
        ["", "lütfen"],
        h,
    )
    test[Niyetler.DETAY] = _kombine(
        ["şu eserle ilgili", "incelediğimiz kitap için", "bu anlatı hakkında"],
        ["yüzeysel olmayan bilgi ver", "konuyu biraz daha aç", "daha kapsamlı açıklama yap", "ayrıntıları çoğalt", "ek bilgilerle genişlet"],
        ["", "lütfen"],
        h,
    )
    test[Niyetler.SERBEST_KITAP] = _kombine(
        ["senin yorumunla", "bir değerlendirme olarak", "okur gözüyle"],
        ["eserin alt metni nasıl okunabilir", "kitabın etkisi ne olabilir", "yazarın niyeti hakkında çıkarım yap", "bu yapıt kimlere hitap eder", "sonun sembolik anlamı ne olabilir"],
        ["", "yorumlar mısın"],
        h,
    )
    test[Niyetler.KITAP_ADI] = _kombine(
        ["hafızana göre", "önceki konuşmamızda", "şu anki bağlamda"],
        ["aktif eserin ismi nedir", "hangi başlık üzerinde duruyoruz", "son seçimin adını söyle", "hangi yapıtı açmıştık", "konuştuğumuz başlığı hatırlat"],
        ["", "lütfen"],
        h,
    )
    test[Niyetler.TEKRAR] = _kombine(
        ["şu kitap için", "önceki kayıt için", "aktif eser hakkında"],
        ["bilgi kartını bir daha getir", "tüm alanları yeniden sırala", "aynı verileri tekrar sun", "kitap künyesini yeniden aç", "bütün ayrıntıları baştan göster"],
        ["", "lütfen"],
        h,
    )
    test[Niyetler.HER_KITAP] = _kombine(
        ["uygulaman", "yerel sistemin", "kitap motorun"],
        ["yayınlanmış her eseri tanır mı", "evrendeki tüm kitapları kapsıyor mu", "hiç bilmediği kitap olur mu", "her başlığı bulma garantisi var mı", "veri dışında kalan eserleri tanır mı"],
        ["", "gerçekten"],
        h,
    )
    test[Niyetler.KITAP_SAYISI] = _kombine(
        ["katalogda", "yerel arşivde", "arama havuzunda"],
        ["kaç farklı başlık tutuluyor", "kayıt hacmi nedir", "toplam eser adedi kaç", "kaç kitaplık koleksiyon var", "veri miktarı kaç kitap"],
        ["", "şu an"],
        h,
    )
    test[Niyetler.KATEGORILER] = _kombine(
        ["sınıflandırma tarafında", "etiket yapısında", "kategori modelinde"],
        ["hangi edebî sınıflar mevcut", "kaç ayrı etiket bulunuyor", "tanınan türleri say", "sınıf adlarını listele", "hangi kategorilere ayırıyorsun"],
        ["", "lütfen"],
        h,
    )
    test[Niyetler.MODEL_BILGISI] = _kombine(
        ["değerlendirme raporunda", "eğitim sürecinde", "makine öğrenmesi bölümünde"],
        ["hangi skor elde edildi", "kullanılan yöntemi açıkla", "test performansı kaç", "çapraz doğrulama sonucu ne", "öğrenme modelinin ayrıntıları nedir"],
        ["", "lütfen"],
        h,
    )
    test[Niyetler.YENI_SINIFLANDIR] = _kombine(
        ["şimdi", "yeni bir örnek için", "etiketsiz metin üzerinde"],
        ["kategori tahmini başlat", "açıklamayı sınıflandırıcıya ver", "tür etiketi üret", "metnin edebî sınıfını bul", "yeni kitap kaydını tahmin et"],
        ["", "lütfen"],
        h,
    )
    test[Niyetler.YARDIM] = _kombine(
        ["uygulamayı kullanırken", "ilk kez girince", "burada"],
        ["hangi işlemler yapılabilir", "kullanım adımlarını söyle", "neler sorabileceğimi açıkla", "özellik menüsünü anlat", "bana kısa bir rehber sun"],
        ["", "lütfen"],
        h,
    )
    test[Niyetler.SELAMLAMA] = _kombine(
        [""],
        ["esenlikler", "hayırlı günler", "selam sana", "günaydın yeniden", "merhaba sistem"],
        ["", "KitapPusula", "orada mısın"],
        h,
    )
    test[Niyetler.NASILSIN] = _kombine(
        ["bugün", "bu akşam", "şu sıralar"],
        ["halin vaktin nasıl", "keyfin yerinde mi", "durumun nasıl", "kendini iyi hissediyor musun", "günün nasıl geçiyor"],
        ["", "merak ettim"],
        h,
    )
    test[Niyetler.GENEL_SOHBET] = _kombine(
        ["bugün", "şimdi", "biraz"],
        ["sohbet arkadaşım olur musun", "bana moral ver", "kendinden söz et", "neden bazen beni yanlış anlıyorsun", "sadece konuşmak istiyorum"],
        ["", "lütfen"],
        h,
    )
    test[Niyetler.ALAN_DISI] = _kombine(
        ["şimdi", "bana", "lütfen"],
        ["omlet tarifi hazırla", "haftalık hava tahmini ver", "JavaScript kodu yaz", "basketbol sonucu söyle", "ucuz telefon öner"],
        ["", "yardım eder misin"],
        h,
    )
    test[Niyetler.KITAP_ARAMA] = _benzersiz(
        [
            "Forsa",
            "Eylül",
            "Araba Sevdası",
            "İntibah",
            "Kuyucaklı Yusuf",
            "Devlet Ana",
            "Yaban",
            "Aylak Adam",
            "Anayurt Oteli",
            "Kuyruklu Yıldız Altında Bir İzdivaç",
            "Kiralık Konak",
            "Felatun Bey ile Rakım Efendi",
            "Taaşşuk-ı Talat ve Fitnat",
            "Sodom ve Gomore",
            "Huzur",
        ]
    )[:h]

    eksikler = set(TUM_NIYETLER).difference(test)
    if eksikler:
        raise ValueError(f"Bağımsız test verisinde eksik niyetler var: {sorted(eksikler)}")

    return test


__all__ = [
    "Niyetler",
    "TUM_NIYETLER",
    "TRAIN_TARGET_PER_INTENT",
    "TEST_TARGET_PER_INTENT",
    "turkce_normalize",
    "egitim_ornekleri",
    "bagimsiz_test_ornekleri",
]
