import streamlit as st
import random
import time
import pandas as pd
import sqlite3
import datetime
import os
import base64
import streamlit.components.v1 as components

# ==========================================
# DOSYA YOLLARI (OTOMATİK BULUCU)
# ==========================================
KLASOR_YOLU = os.path.dirname(os.path.abspath(__file__))
SES_YOLU = os.path.join(KLASOR_YOLU, "uyari_sesi.mp3")

# ==========================================
# 1. VERİTABANI (SQLITE) KURULUMU
# ==========================================
conn = sqlite3.connect('aegis_swarm.db', check_same_thread=False)
c = conn.cursor()
c.execute('''CREATE TABLE IF NOT EXISTS kriz_loglari (tarih TEXT, olay TEXT, durum TEXT)''')
conn.commit()

def log_kriz(olay_detayi):
    zaman = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    c.execute("INSERT INTO kriz_loglari VALUES (?, ?, ?)", (zaman, olay_detayi, "OTONOM MÜDAHALE BAŞARILI"))
    conn.commit()

# ==========================================
# 2. SAYFA AYARLARI VE DEĞİŞKENLER
# ==========================================
st.set_page_config(page_title="Aegis Swarm Live OS", page_icon="🛡️", layout="wide")

bolgeler = ["Ana Yaşam Kapsülü", "Antimadde Reaktörü", "Lojistik Hangarı", "Sera Laboratuvarı"]

kriz_detaylari = {
    "Radyasyon Sızıntısı": {"teshis": "Reaktör çevresi Geiger sayaçlarında gama izotopu sınır ihlali saptandı.", "sevkiyat": "8 Milyar Kurşun-Maddeli Nanobot hedefe kilitlendi.", "operasyon": "Reaktör etrafında elektromanyetik emici kalkan örülüyor..."},
    "Fiziksel Hasar": {"teshis": "Lojistik hangarı lazer telemetrelerinde basınç düşüşü ve akustik darbe saptandı.", "sevkiyat": "4.5 Milyar Ağır Sanayi Nanobotu yönlendirildi.", "operasyon": "Moleküler kenetlenme ile titanyum kaynak yapılıyor..."},
    "Siber Saldırı": {"teshis": "Ana kuantum ağında imza uyuşmazlığı ve sızma girişimi.", "sevkiyat": "12 Milyar Siber Savunma Yazılım Nanobotu ağa enjekte edildi.", "operasyon": "Zararlı bağlantılar kesiliyor, kuantum şifreleme yenileniyor..."},
    "Atmosfer Basınç Kaybı": {"teshis": "Sera laboratuvarı barometrik sensörlerinde oksijen düşüşü saptandı.", "sevkiyat": "3 Milyar Aerogel Nanobotu fan sistemleri üzerinden enjekte edildi.", "operasyon": "Nanobotlar genişleyerek sızıntı yapan valfleri moleküler olarak tıkıyor..."}
}

def bolgeye_ozel_kriz_belirle(bolge_adi):
    if bolge_adi == "Antimadde Reaktörü": return "Radyasyon Sızıntısı"
    elif bolge_adi == "Lojistik Hangarı": return "Fiziksel Hasar"
    elif bolge_adi == "Ana Yaşam Kapsülü": return "Siber Saldırı"
    else: return "Atmosfer Basınç Kaybı"

# ==========================================
# 3. SOL MENÜ VE UZAY KOKPİTİ CSS
# ==========================================
st.sidebar.markdown("## 🛡️ AEGIS SWARM")
st.sidebar.caption("Powepuff | Derin Teknoloji Girişimi")

ekran_secimi = st.sidebar.radio(
    "📋 EKRAN MENÜSÜ", 
    ["1. Startup Kimliği", "2. Canlı Telemetri", "3. Kriz Logları"]
)

st.sidebar.markdown("---")
st.sidebar.markdown("## 🔮 ARAYÜZ KONTROLLERİ")
arkaplan_rengi = st.sidebar.color_picker("Arka Plan Rengi:", "#03030c")
neon_yazi_rengi = st.sidebar.color_picker("Neon Yazı Rengi:", "#00ffcc")

st.sidebar.markdown("---")
st.sidebar.markdown("### ⚙️ SİSTEM TEST & SİMÜLASYON")
test_sinyali_gonder = st.sidebar.button("🚨 SENSÖRLERE TEST SİNYALİ GÖNDER", use_container_width=True)

# TAMAMEN YENİLENMİŞ SİBER UZAY TASARIMI (CSS)
st.markdown(f"""
    <style>
    /* Ana Arka Plan ve Siber Font */
    .stApp {{ 
        background-color: {arkaplan_rengi}; 
        background-image: radial-gradient(circle at 50% 0%, rgba(20,20,30,0.8) 0%, {arkaplan_rengi} 100%);
        color: {neon_yazi_rengi}; 
        font-family: 'Courier New', monospace; 
    }}
    
    /* Parlayan Başlıklar */
    h1, h2, h3, h4 {{ 
        color: {neon_yazi_rengi} !important; 
        text-shadow: 0 0 8px {neon_yazi_rengi}, 0 0 20px {neon_yazi_rengi} !important; 
        letter-spacing: 2px;
    }}

    /* Otonom Buton Tasarımı (Hover Efektli) */
    div.stButton > button:first-child {{
        background: transparent !important;
        color: {neon_yazi_rengi} !important;
        border: 2px solid {neon_yazi_rengi} !important;
        border-radius: 8px;
        box-shadow: 0 0 10px {neon_yazi_rengi} inset, 0 0 10px {neon_yazi_rengi};
        transition: all 0.3s ease-in-out;
        text-transform: uppercase;
        font-weight: 900;
        letter-spacing: 1.5px;
    }}
    div.stButton > button:first-child:hover {{
        background: {neon_yazi_rengi} !important;
        color: #000 !important;
        box-shadow: 0 0 25px {neon_yazi_rengi} inset, 0 0 40px {neon_yazi_rengi};
        transform: scale(1.05);
    }}

    /* Çarpan Kriz Kutusu (Yanıp Sönen Kırmızı Alarm) */
    @keyframes alert-pulse {{
        0% {{ box-shadow: 0 0 10px #ff0033 inset, 0 0 10px #ff0033; }}
        50% {{ box-shadow: 0 0 30px #ff0033 inset, 0 0 30px #ff0033; }}
        100% {{ box-shadow: 0 0 10px #ff0033 inset, 0 0 10px #ff0033; }}
    }}
    .kriz-kutu {{ 
        background: rgba(200, 0, 20, 0.15); 
        border: 2px solid #ff0033; 
        padding: 20px; 
        border-radius: 12px; 
        margin-bottom: 15px; 
        animation: alert-pulse 1.5s infinite;
        text-shadow: 0 0 5px #ff0033;
    }}

    /* Güvenli Durum Kutusu (Neon Yeşil Kalkan) */
    .guvenli-kutu {{ 
        background: rgba(0, 255, 100, 0.05); 
        border: 2px solid #00ff66; 
        padding: 20px; 
        border-radius: 12px; 
        margin-bottom: 15px; 
        box-shadow: 0 0 15px #00ff66 inset, 0 0 15px #00ff66;
        text-shadow: 0 0 5px #00ff66;
    }}

    audio {{ display: none !important; }}
    </style>
""", unsafe_allow_html=True)

# ==========================================
# 4. SİMÜLASYON HAFIZASI
# ==========================================
if "hafiza_v5_final" not in st.session_state:
    st.session_state.hafiza_v5_final = {}
    for b in bolgeler:
        st.session_state.hafiza_v5_final[b] = {
            "durum": "GÜVENLİ", 
            "kalan_süre": 0, 
            "veri": [100, 100, 99, 100, 98, 100, 99, 100, 100, 100], 
            "tehlike_tipi": ""
        }

if "aktif_us_secimi" not in st.session_state:
    st.session_state.aktif_us_secimi = bolgeler[0]

# ==========================================
# EKRAN 1: STARTUP KİMLİĞİ
# ==========================================
if ekran_secimi == "1. Startup Kimliği":
    col1, col2 = st.columns([1, 4])
    with col1:
        logo_bulundu = False
        olasi_isimler = [
            "logo.jpg", "logo.png", "logo.jpeg", "logo.jpg.jpg", 
            "WhatsApp_Image_2026-06-23_at_15.37.48-removebg-preview.jpg"
        ]
        
        for isim in olasi_isimler:
            temp_yol = os.path.join(KLASOR_YOLU, isim)
            if os.path.exists(temp_yol):
                st.image(temp_yol, use_container_width=True)
                logo_bulundu = True
                break
                
        if not logo_bulundu:
            st.error(f"⚠️ Logo dosyası '{KLASOR_YOLU}' klasöründe bulunamadı. Lütfen resmi klasöre atın.")
            
    with col2:
        st.title("🛡️ AEGIS SWARM")
        st.subheader("Girişim Sloganı: Dünya'ya Haber Verin, Kriz Çözüldü.")

    st.markdown("""
    ---
    ### 1. AEGIS SWARM NEDİR?
    AEGIS SWARM, derin uzay istasyonlarını ve yüksek güvenlikli tesisleri korumak için tasarlanmış otonom bir bağışıklık sistemidir. Milyarlarca mikroskobik robot (nanobot) ve Sürü Zekası (Swarm AI) ile donatılmış bu sistem, kriz anlarında kararlar alır ve tesisin bütünlüğünü insan müdahalesine gerek kalmadan korur.

    ### 2. PROBLEM TANIMI
    **Hangi problemi çözüyor?**
    Uzay üslerinde yaşanabilecek meteor çarpmaları (basınç kaybı), görünmez radyasyon sızıntıları, fiziksel hasarlar ve siber saldırılar gibi anlık krizleri otonom olarak çözer.

    **Neden önemli?**
    Dünya ile derin uzay arasındaki iletişimde 40 dakikaya varan gecikmeler yaşanır. Kriz anında Dünya'dan onay beklemek veya yavaş insan reflekslerine güvenmek felaketle sonuçlanabilir. Saniyeler içinde otonom müdahale hayat kurtarır.

    ### 3. ÇÖZÜM
    **Ürününüz nasıl çalışıyor?**
    Tesisin altyapısına ve astronot kıyafetlerine entegre edilmiş nanobotlar, Sürü Zekası ile yönetilir. Sensörler bir anomali tespit ettiğinde sistem Dünya'dan emir beklemez, saniyeler içinde fiziksel ve yazılımsal onarımı gerçekleştirir.

    **Kullanıcılar kimler?**
    Uzay ajansları, derin uzay kolonileri, havacılık sektörü ve yüksek güvenlik gerektiren teknoloji tesisleri.

    **Neden kullanacaklar?**
    İnsan reaksiyon süresinin yetmediği ölümcül krizlerde hayatta kalmak ve sistemleri 7/24 kesintisiz, sıfır hatayla korumak için.

    ### 4. TASARIM
    Sistemimiz **Minimum 3 Ekran Tasarımına** sahiptir:
    * **1. Landing Page (Startup Kimliği):** Projenin vizyonu, problemi ve çözümünün anlatıldığı giriş ekranı.
    * **2. Dashboard (Canlı Telemetri):** Otonom operasyonların ve nanobotların canlı izlendiği, sensör verilerinin aktığı simülasyon paneli.
    * **3. Veritabanı (Kriz Logları):** Çözülen krizlerin zaman damgalı olarak geriye dönük incelenebildiği log ekranı.

    ### 5. TEKNOLOJİ MİMARİSİ
    * **Frontend:** Python Streamlit (Gerçek Zamanlı Kullanıcı Arayüzü)
    * **Backend:** Python (Sürekli çalışan State Machine Döngüsü)
    * **Veritabanı:** SQLite (Uçtan uca şifreli, çevrimdışı çalışabilen loglama)
    * **Yapay Zeka Bileşenleri:** Swarm Logic (Sürü mantığı) ile donatılmış otonom karar alma ve anomali tespit algoritmaları.
    """)

# ==========================================
# EKRAN 2: CANLI TELEMETRİ
# ==========================================
elif ekran_secimi == "2. Canlı Telemetri":
    
    if test_sinyali_gonder:
        hedef = st.session_state.aktif_us_secimi
        st.session_state.hafiza_v5_final[hedef]["durum"] = "KRİZ"
        st.session_state.hafiza_v5_final[hedef]["kalan_süre"] = 20
        tehlike_adi = bolgeye_ozel_kriz_belirle(hedef)
        st.session_state.hafiza_v5_final[hedef]["tehlike_tipi"] = tehlike_adi
        st.session_state.hafiza_v5_final[hedef]["veri"][-1] = random.randint(15, 30)
        log_kriz(f"{hedef} - {tehlike_adi}")

    for b in bolgeler:
        state = st.session_state.hafiza_v5_final[b]
        if state["durum"] == "GÜVENLİ":
            if random.random() < 0.02 and not test_sinyali_gonder:
                state["durum"] = "KRİZ"
                state["kalan_süre"] = 20
                tehlike_adi = bolgeye_ozel_kriz_belirle(b)
                state["tehlike_tipi"] = tehlike_adi
                yeni_veri = random.randint(15, 30)
                log_kriz(f"{b} - {tehlike_adi}")
            else:
                yeni_veri = random.randint(97, 100)
        else:
            state["kalan_süre"] -= 1
            iyilesme_orani = 100 - (state["kalan_süre"] * 4)
            yeni_veri = max(15, min(100, iyilesme_orani + random.randint(-5, 5)))
            
            if state["kalan_süre"] <= 0:
                state["durum"] = "GÜVENLİ"
                state["tehlike_tipi"] = ""
        state["veri"].pop(0)
        state["veri"].append(yeni_veri)

    st.title("🛡️ AEGIS SWARM // 7/24 Otonom Çevresel İzleme Merkezi")
    st.write("📡 **Sistem Durumu:** Çoklu Bölge Sensör Ağları Aktif. Her bölge bağımsız taranmaktadır.")
    st.markdown("---")

    ctrl_col1, ctrl_col2 = st.columns([2, 1])
    with ctrl_col1:
        st.session_state.aktif_us_secimi = st.selectbox(
            "Canlı İzlenecek Üs Bölgesi:", 
            bolgeler, 
            index=bolgeler.index(st.session_state.aktif_us_secimi)
        )

    st.markdown("---")
    us_bolgesi = st.session_state.aktif_us_secimi
    aktif_state = st.session_state.hafiza_v5_final[us_bolgesi]
    
    col1, col2 = st.columns([1, 1])

    with col1:
        st.subheader(f"📡 {us_bolgesi} Canlı Analizi")
        ui_icerik = st.empty()
        with ui_icerik.container():
            if aktif_state["durum"] == "GÜVENLİ":
                st.markdown("<div class='guvenli-kutu'><h3 style='color:#00ff66; margin-top:0;'>✅ SİSTEM STABİL VE GÜVENLİ</h3><p>Sensör verileri referans aralığında.</p></div>", unsafe_allow_html=True)
                st.info("🤖 **Sürü Modu:** Nanobotlar bekleme modunda devriyede.")
                st.write(f"📊 **Anlık Sensör Performansı:** %{aktif_state['veri'][-1]}")
                
                # SİSTEM GÜVENLİYE DÖNDÜĞÜNDE SESİ SUSTURAN KOD
                components.html("""
                    <script>
                    var parentDoc = window.parent.document;
                    var alarm = parentDoc.getElementById("aegis_alarm_audio");
                    if (alarm) {
                        alarm.pause();
                        alarm.remove();
                    }
                    </script>
                """, height=0, width=0)
                
            elif aktif_state["durum"] == "KRİZ":
                st.markdown("<div class='kriz-kutu'><h3 style='color:#ff0033; margin-top:0;'>🚨 KRİTİK ANOMALİ ALGILANDI!</h3><p>Otonom Müdahale Protokolü Devrede.</p></div>", unsafe_allow_html=True)
                tehlike = aktif_state['tehlike_tipi']
                detay = kriz_detaylari[tehlike]
                st.error(f"🕵️ **Yapay Zeka Teşhisi:** {tehlike}")
                st.write(f"1️⃣ **Teşhis:** {detay['teshis']}")
                st.write(f"2️⃣ **Sevkıyat:** {detay['sevkiyat']}")
                st.write(f"3️⃣ **Operasyon:** {detay['operasyon']}")
                st.warning(f"⏳ Otonom operasyonun tamamlanmasına **{aktif_state['kalan_süre']} saniye** kaldı...")
                
                # KESİNTİSİZ SES OYNATICI 
                if os.path.exists(SES_YOLU):
                    with open(SES_YOLU, "rb") as f:
                        b64_ses = base64.b64encode(f.read()).decode()
                        components.html(f"""
                            <script>
                            var parentDoc = window.parent.document;
                            if (!parentDoc.getElementById("aegis_alarm_audio")) {{
                                var audioEl = parentDoc.createElement("audio");
                                audioEl.id = "aegis_alarm_audio";
                                audioEl.src = "data:audio/mp3;base64,{b64_ses}";
                                audioEl.loop = true;
                                parentDoc.body.appendChild(audioEl);
                                audioEl.play();
                            }}
                            </script>
                        """, height=0, width=0)

    with col2:
        st.subheader("📈 Gerçek Zamanlı Grafik Akışı")
        df = pd.DataFrame(aktif_state["veri"], columns=["Sistem Sağlık Endeksi (%)"])
        st.line_chart(df)
        if aktif_state["durum"] == "GÜVENLİ":
            st.caption(f"🟩 Şu an {us_bolgesi} sensörleri 7/24 taranmaktadır. Akış normal.")
        else:
            st.caption(f"🟥 DİKKAT: {us_bolgesi} onarım sürecindedir. Endeksin %100'e dönmesi bekleniyor.")

    # SADECE 2. EKRANDA YENİLEME YAPILACAK 
    time.sleep(1.0)
    st.rerun()

# ==========================================
# EKRAN 3: KRİZ LOGLARI
# ==========================================
elif ekran_secimi == "3. Kriz Logları":
    st.title("📂 Otonom Müdahale Kayıtları (Veritabanı)")
    st.caption("Aegis Swarm tarafından çözülen krizlerin zaman damgalı SQLite kayıtlarıdır.")
    
    log_datasi = pd.read_sql_query("SELECT * FROM kriz_loglari ORDER BY tarih DESC", conn)
    if log_datasi.empty:
        st.info("Sistemde henüz kayıtlı bir kriz anı bulunmamaktadır.")
    else:
        st.dataframe(log_datasi, use_container_width=True)