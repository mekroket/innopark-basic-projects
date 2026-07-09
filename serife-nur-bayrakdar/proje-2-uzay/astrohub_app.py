import time

# ==========================================
# 1. VERİTABANI SİMÜLASYONU (2165 Verileri)
# ==========================================
KULLANICILAR = {
    "serifenur": "12345",  # Örnek kullanıcı adı ve şifre
    "admin": "mars2165"
}

HABITATLAR = [
    {"id": 1, "ad": "Valles Marineris Cam Kubbe", "gezegen": "Mars", "oda": 2, "dis_gorunus": "Modern Cam Kubbe", "fiyat": 450, "puanlar": [5, 4, 5], "yorumlar": ["Manzarası harika!", "Radyasyon yalıtımı çok iyi."]},
    {"id": 2, "ad": "Kraken Mare Yer Altı Sığınağı", "gezegen": "Titan", "oda": 3, "dis_gorunus": "Neon Endüstriyel Biyopod", "fiyat": 800, "puanlar": [3, 4, 3], "yorumlar": ["Biraz basık ama güvenli.", "Isıtma sistemi harika."]},
    {"id": 3, "ad": "Artemis Lüks Kapsülleri", "gezegen": "Ay", "oda": 1, "dis_gorunus": "Minimalist Fütüristik Metalik", "fiyat": 350, "puanlar": [5, 5, 4], "yorumlar": ["Dünya manzarası efsane.", "Küçük ama konforlu."]},
    {"id": 4, "ad": "Olympus Mons Dağ Evleri", "gezegen": "Mars", "oda": 4, "dis_gorunus": "Doğal Volkanik Taş Estetiği", "fiyat": 1200, "puanlar": [5, 5, 5], "yorumlar": ["Koloninin en lüks yeri.", "Muazzam bir genişlik."]}
]

# YENİ: NovaWork İş İlanları Veritabanı
IS_ILANLARI = [
    {"id": 1, "unvan": "Gezegenler Arası Yapay Zeka Operatörü", "sirket": "NovaAI Systems", "konum": "Mars - Neo Konya Sektörü", "maas": "6,500 Kredi", "anahtar_kelimeler": ["python", "yapay zeka", "operasyon", "makine öğrenmesi"]},
    {"id": 2, "unvan": "Derin Uzay Veri Analisti", "sirket": "Galactic Data Corp", "konum": "Europa İstasyonu", "maas": "7,200 Kredi", "anahtar_kelimeler": ["veri", "analiz", "python", "knn", "pca"]},
    {"id": 3, "unvan": "Biyokubbe Otonom Sistemler Mühendisi", "sirket": "AstroTech Robotics", "konum": "Ay Üssü", "maas": "5,800 Kredi", "anahtar_kelimeler": ["java", "c#", "otonom", "robotik"]},
    {"id": 4, "unvan": "Kuantum Siber Güvenlik Uzmanı", "sirket": "CyberShield Interstellar", "konum": "Titan Merkez", "maas": "8,000 Kredi", "anahtar_kelimeler": ["güvenlik", "kripto", "java", "network"]}
]

ETKINLIKLER = [
    {"id": 1, "ad": "Cyberpunk Canlı Müzik Gecesi", "tur": "Müzikli", "tip": "Konser", "puanlar": [5, 5, 4], "yorumlar": ["Hologramlar çok gerçekçiydi!"]},
    {"id": 2, "ad": "Yerçekimsiz Alanda Rover Tamir Workshop'u", "tur": "Müziksiz", "tip": "Workshop", "puanlar": [4, 5, 5], "yorumlar": ["Çok şey öğrendim, sertifika verdiler."]},
    {"id": 3, "ad": "Metan Denizi Kıyısında Akustik Melodiler", "tur": "Müzikli", "tip": "Konser", "puanlar": [4, 3, 4], "yorumlar": ["Ortam güzel ama hüzünlü mesajlar içeriyor."]},
    {"id": 4, "ad": "Gezegenler Arası Yapay Zeka Operatörlüğü Eğitimi", "tur": "Müziksiz", "tip": "Workshop", "puanlar": [5, 5, 5], "yorumlar": ["Kariyerim için dönüm noktası oldu."]}
]

def puan_ortalama(puan_listesi):
    return round(sum(puan_listesi) / len(puan_listesi), 1) if puan_listesi else 0.0

# ==========================================
# 2. GÜVENLİK VE GİRİŞ SİSTEMİ
# ==========================================
def giris_yap():
    print("="*60)
    print("      ASTROHUB GEZEGENLER ARASI YAŞAM PLATFORMUNA HOŞ GELDİNİZ      ")
    print("============================================================\n")
    
    hak = 3
    while hak > 0:
        kullanici = input("🛸 Kullanıcı Adı: ")
        sifre = input("🔑 Şifre: ")
        
        if kullanici in KULLANICILAR and KULLANICILAR[kullanici] == sifre:
            print(f"\n✨ Erişim Onaylandı! Hoş geldin, {kullanici}. Koloni ağına bağlanılıyor...")
            time.sleep(1)
            return True
        else:
            hak -= 1
            print(f"❌ Hatalı bilgi! Kalan kuantum giriş hakkı: {hak}\n")
            
    print("🔒 Güvenlik Protokolü: Sistem kilitlendi. Terminali yeniden başlatın.")
    return False

# ==========================================
# 3. MODÜLLER
# ==========================================
def emlak_modulu():
    print("\n--- 🏠 ASTRODOME EMLAK SİSTEMİ ---")
    print("Nasıl bir uzay evi hayal ediyorsunuz? Kriterlerinizi giriniz:")
    
    istenen_gezegen = input("- Hangi Gezegen/Uydu? (Mars/Titan/Ay): ").capitalize()
    try:
        istenen_oda = int(input("- Kaç odalı olsun? (1/2/3/4): "))
    except ValueError:
        istenen_oda = 2
    istenen_gorunus = input("- Dış görünüş tarzı nasıl olsun? (Cam/Fütüristik/Endüstriyel/Taş): ").lower()

    print("\n🔍 Yapay zeka kriterlerinize en uygun habitatları listeliyor ve puanlarına göre sıralıyor...\n")
    time.sleep(1)

    uygun_evler = []
    for ev in HABITATLAR:
        if ev["gezegen"] == istenen_gezegen or ev["oda"] == istenen_oda or istenen_gorunus in ev["dis_gorunus"].lower():
            uygun_evler.append(ev)

    uygun_evler.sort(key=lambda x: puan_ortalama(x["puanlar"]), reverse=True)

    if not uygun_evler:
        print("🤖 Aradığınız kriterlerde ev bulunamadı, ancak mevcut en popüler evleri listeliyoruz:")
        uygun_evler = sorted(HABITATLAR, key=lambda x: puan_ortalama(x["puanlar"]), reverse=True)

    for ev in uygun_evler:
        ort_puan = puan_ortalama(ev["puanlar"])
        print(f"📍 {ev['ad']} ({ev['gezegen']}) [ID: {ev['id']}]")
        print(f"   | Oda Sayısı: {ev['oda']} | Tasarım: {ev['dis_gorunus']} | Fiyat: {ev['fiyat']} Kredi")
        print(f"   | ⭐ Yapay Zeka Puanı: {ort_puan}/5 ({len(ev['puanlar'])} Değerlendirme)")
        print(f"   | 💬 Son Yorum: \"{ev['yorumlar'][-1]}\"\n")

    secim = input("Bu mekanlardan birine puan vermek ve yorum yazmak ister misiniz? (e/h): ").lower()
    if secim == 'e':
        ev_id = int(input("Mekan ID giriniz: "))
        yeni_puan = int(input("Puanınız (1-5): "))
        yeni_yorum = input("Yorumunuz: ")
        
        for ev in HABITATLAR:
            if ev["id"] == ev_id:
                ev["puanlar"].append(yeni_puan)
                ev["yorumlar"].append(yeni_yorum)
                print("✅ Değerlendirmeniz Kuantum Veritabanına kaydedildi!")

# YENİ: NovaWork (İşKur) Modülü
def is_bulma_modulu():
    print("\n--- 💼 NOVAWORK GEZEGENLER ARASI İSTİHDAM ---")
    print("Yapay zekanın size en uygun işleri bulması için yeteneklerinizi veya bildiğiniz dilleri girin.")
    print("(Örn: python, veri analizi, makine öğrenmesi, knn, pca, java, siber güvenlik)")
    yetenekler_input = input("\n💡 Yetenekleriniz (Virgülle ayırarak yazın): ").lower()
    
    # Kullanıcının girdilerini listeye çeviriyoruz
    kullanici_yetenekleri = [y.strip() for y in yetenekler_input.split(",")]
    
    print("\n🤖 AstroHub AI ilanları tarıyor ve eşleşme skorlarını hesaplıyor...\n")
    time.sleep(1)
    
    sirali_ilanlar = []
    
    for ilan in IS_ILANLARI:
        eslesme_sayisi = 0
        # Basit kelime bazlı yapay zeka eşleşme algoritması
        for yetenek in kullanici_yetenekleri:
            for anahtar in ilan["anahtar_kelimeler"]:
                if yetenek in anahtar or anahtar in yetenek:
                    eslesme_sayisi += 1
                    
        # Skor yüzdesi hesaplama (Maksimum %100 olacak şekilde)
        uyum_skoru = min(100, round((eslesme_sayisi / len(ilan["anahtar_kelimeler"])) * 100))
        if uyum_skoru == 0:
            uyum_skoru = 12  # Kolonide temel adaptasyon taban puanı
            
        ilan_kopya = ilan.copy()
        ilan_kopya["skor"] = uyum_skoru
        sirali_ilanlar.append(ilan_kopya)
        
    # İlanları en yüksek yapay zeka uyum skoruna göre sırala
    sirali_ilanlar.sort(key=lambda x: x["skor"], reverse=True)
    
    print("-" * 65)
    print(f"{'AI MATCH':<10} | {'İŞ UNVANI':<35} | {'ŞİRKET / KONUM':<25}")
    print("-" * 65)
    for ilan in sirali_ilanlar:
        rozet = "⭐" if ilan["skor"] >= 40 else "  "
        print(f"%{ilan['skor']:<7} {rozet} | {ilan['unvan']:<35} | {ilan['sirket']} ({ilan['konum']})")
        print(f"          | Maaş: {ilan['maas']} | Gerekli Teknolojiler: {', '.join(ilan['anahtar_kelimeler'])}\n")
    print("-" * 65)
    
    basvuru_secim = input("Kuantum CV'niz ile bir ilana başvurmak ister misiniz? (e/h): ").lower()
    if basvuru_secim == 'e':
        is_unvan = input("Başvurmak istediğiniz işin unvanını tam olarak yazın: ")
        print(f"🚀 Kuantum CV'niz ve AI Uyum Raporunuz ilgili şirkete ışık hızıyla gönderildi!")

def eglence_modulu():
    print("\n--- 🎭 NEBULAPULSE EĞLENCE MERKEZİ ---")
    print("Bugün kolonide nasıl vakit geçirmek istersiniz?")
    tur_secim = input("- Müzikli mi, Müziksiz mi? (Müzikli/Müziksiz): ").capitalize()
    tip_secim = input("- Etkinlik Türü? (Konser/Workshop): ").capitalize()

    print("\n🎉 Uygun etkinlikler puan sıralamasına göre getiriliyor...\n")
    time.sleep(1)

    uygun_etkinlikler = [e for e in ETKINLIKLER if e["tur"] == tur_secim or e["tip"] == tip_secim]
    uygun_etkinlikler.sort(key=lambda x: puan_ortalama(x["puanlar"]), reverse=True)

    for et in uygun_etkinlikler:
        ort_puan = puan_ortalama(et["puanlar"])
        print(f"🎬 {et['ad']} [ID: {et['id']}]")
        print(f"   | Tarz: {et['tur']} | Tip: {et['tip']}")
        print(f"   | ⭐ Etkinlik Puanı: {ort_puan}/5")
        print(f"   | 💬 Ziyaretçi Yorumu: \"{et['yorumlar'][-1]}\"\n")

    secim = input("Bir etkinliğe puan ve yorum eklemek ister misiniz? (e/h): ").lower()
    if secim == 'e':
        et_id = int(input("Etkinlik ID giriniz: "))
        yeni_puan = int(input("Puanınız (1-5): "))
        yeni_yorum = input("Yorumunuz: ")
        
        for et in ETKINLIKLER:
            if et["id"] == et_id:
                et["puanlar"].append(yeni_puan)
                et["yorumlar"].append(yeni_yorum)
                print("✅ Puanınız ve yorumunuz başarıyla eklendi!")

# ==========================================
# 4. ANA PROGRAM DÖNGÜSÜ (MENÜ)
# ==========================================
def ana_menu():
    if not giris_yap():
        return

    while True:
        print("\n" + "="*40)
        print("             ASTROHUB ANA MENÜ             ")
        print("="*40)
        print("1- 🏠 AstroDome (Emlak/Habitat Arama)")
        print("2- 💼 NovaWork (İş Arama & AI Match)")
        print("3- 🎭 NebulaPulse (Eğlence & Workshop)")
        print("4- 🚪 Çıkış Yap")
        
        secim = input("\nYapmak istediğiniz işlem numarasını giriniz: ")
        
        if secim == "1":
            emlak_modulu()
        elif secim == "2":
            is_bulma_modulu()
        elif secim == "3":
            eglence_modulu()
        elif secim == "4":
            print("\n🚀 Güvenli çıkış yapıldı. AstroHub, yeni dünyanızda her zaman yanınızda!")
            break
        else:
            print("❌ Geçersiz seçim! Lütfen 1, 2, 3 veya 4 yazın.")

if __name__ == "__main__":
    ana_menu()