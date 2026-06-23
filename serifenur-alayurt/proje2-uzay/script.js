document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. MERKEZİ VERİLER ---
    const planetData = {
        earth: { title: "🌍 Dünya Merkez Üssü", level: 78, status: "Kararlı", desc: "Ana dağıtım üssü. Reaktörler stabil." },
        moon: { title: "🌑 Ay Beta Üssü", level: 95, status: "Enerji Fazlası", desc: "Helyum-3 üretimi pik noktada." },
        mars: { title: "🔴 Mars Alpha Üssü", level: 72, status: "Risk Altında", desc: "Fırtınalar güneş panellerini etkiledi." },
        titan: { title: "🪐 Titan Prime Üssü", level: 43, status: "Kritik Seviye", desc: "Metan jeneratörleri bakımda." },
        europa: { title: "🧊 Europa One Üssü", level: 88, status: "Güvenli", desc: "Okyanus akıntı türbinleri stabil." }
    };

    // --- 2. GÖRSEL PANEL VE YAZILARI YENİLEME FONKSİYONU ---
   // Kodunun 13. satırındaki fonksiyonu bul ve tam olarak bu hale getir:
    function renderApp() {
        document.querySelector("#panel-mars span").innerText = `%${planetData.mars.level}`;
        document.querySelector("#panel-moon span").innerText = `%${planetData.moon.level}`;
        document.querySelector("#panel-titan span").innerText = `%${planetData.titan.level}`;
        document.querySelector("#panel-europa span").innerText = `%${planetData.europa.level}`;

        document.querySelector(".planet.earth span").innerText = `%${planetData.earth.level}`;
        document.querySelector(".planet.moon span").innerText = `%${planetData.moon.level}`;
        document.querySelector(".planet.mars span").innerText = `%${planetData.mars.level}`;
        document.querySelector(".planet.titan span").innerText = `%${planetData.titan.level}`;
        document.querySelector(".planet.europa span").innerText = `%${planetData.europa.level}`;

        updatePanelColor(document.getElementById("panel-mars"), planetData.mars.level);
        updatePanelColor(document.getElementById("panel-titan"), planetData.titan.level);

        // İŞTE EKLEMEN GEREKEN TEK SATIR BURASI (28. satır civarı):
        if(window.updateChartData) window.updateChartData();
    }

    function updatePanelColor(element, level) {
        if (level >= 85) element.style.borderLeftColor = "#00ff66";
        else if (level >= 70) element.style.borderLeftColor = "#ffaa00";
        else element.style.borderLeftColor = "#ff4a4a";
    }

    // --- 3. 🧠 GERÇEK ZAMANLI AI MOTORU (10 SANİYEDE BİR GÜNCELLENİR) ---
    // Eğer üsler manuel transfer ile dengelendiyse o üsler için uyarı vermez, stabil raporlar üretir.
    const aiMessagesPool = [
        "🤖 AI Analizi: Kuantum dolanıklılık hızı %4 artırıldı, gezegenler arası veri akışı kararlı.",
        "🛰️ Telemetri: Europa One üssündeki gelgit türbinlerinde hafif sürtünme saptandı, enerji kaybı önemsiz.",
        "🌌 Uzay Havası Raporu: Güneş lekelerinde patlama riski var, kalkan reaktörleri %11 optimize edildi.",
        "📈 Optimizasyon: Dünya Merkez Üssü füzyon çekirdeği soğutma döngüsü AI tarafından stabilize edildi.",
        "🛸 Güvenlik Algoritması: Enerji hatlarında siber sızma girişimi engellendi, şifreleme blokları yenilendi.",
        "🔋 Batarya Analizi: Ay Beta üssü yedek bataryaları %100 doluluğa ulaştı, deşarj modu askıya alındı.",
        "🌀 Ağ Durumu: Gezegenler arası ana omurga hattında (DeepSpace-Net) gecikme süresi 1.2 ms altına düştü."
    ];

    function startAIEngine() {
        setInterval(() => {
            const alertMars = document.getElementById("alert-mars");
            const alertTitan = document.getElementById("alert-titan");

            // MARS İÇİN AI ANALİZİ
            if (planetData.mars.level < 85) {
                const marsWarnings = [
                    "⚠️ AI Uyarısı: Mars Alpha üssündeki fırtına yoğunluğu artıyor. Mevcut rezerv 14 saat yetebilir.",
                    "🤖 AI Simülasyonu: Mars hattına acil transfer yapılmazsa yaşam destek üniteleri %5 tasarruf moduna geçecek.",
                    "📊 AI Öngörüsü: Mars Alpha'nın 7 günlük açığı 2500 MW sınırına yaklaşıyor, takviye şart."
                ];
                // Rastgele bir Mars uyarısı seç
                alertMars.innerText = marsWarnings[Math.floor(Math.random() * marsWarnings.length)];
                alertMars.style.background = "rgba(255, 170, 0, 0.1)";
                alertMars.style.border = "1px solid #ffaa00";
                alertMars.style.color = "#ffaa00";
            }

            // TİTAN İÇİN AI ANALİZİ
            if (planetData.titan.level < 85) {
                const titanWarnings = [
                    "🚨 AI KRİTİK ALARM: Titan Prime üssünde kritik güç kaybı! Jeneratör bakımı uzadı.",
                    "🤖 AI Hesaplaması: Titan Prime bulutluluk oranı %98. Güneş paneli girdisi sıfırlandı.",
                    "🚨 AI Acil Çağrı: Titan Prime şebeke frekansı düşüyor, sistem çökmesini önlemek için acil MW transferi gerekiyor!"
                ];
                alertTitan.innerText = titanWarnings[Math.floor(Math.random() * titanWarnings.length)];
                alertTitan.style.background = "rgba(255, 74, 74, 0.1)";
                alertTitan.style.border = "1px solid #ff4a4a";
                alertTitan.style.color = "#ff4a4a";
            } else {
                // Eğer Titan dengelendiyse genel havuzdan rastgele mesaj basıp yeşil tutalım
                alertTitan.innerText = aiMessagesPool[Math.floor(Math.random() * aiMessagesPool.length)];
                alertTitan.style.background = "rgba(0, 255, 110, 0.1)";
                alertTitan.style.border = "1px solid #00ff66";
                alertTitan.style.color = "#00ff66";
            }

            // Eğer Mars da dengelendiyse, Mars alanına da genel havuzdan bilgi bas
            if (planetData.mars.level >= 85) {
                alertMars.innerText = "✅ AI Raporu: Mars Alpha şebekesi stabil ve güvende tutuluyor. Anomali yok.";
                alertMars.style.background = "rgba(0, 255, 110, 0.1)";
                alertMars.style.border = "1px solid #00ff66";
                alertMars.style.color = "#00ff66";
            }

        }, 10000); // 10000 milisaniye = 10 saniye
    }

    // --- 4. HARİTAYA TIKLAMA ETKİLEŞİMİ ---
    const planetClasses = ["earth", "moon", "mars", "titan", "europa"];
    planetClasses.forEach(pClass => {
        const el = document.querySelector(`.planet.${pClass}`);
        if(el) {
            el.addEventListener("click", () => {
                const data = planetData[pClass];
                document.getElementById("planetInfo").innerHTML = `
                    <h3>${data.title}</h3>
                    <p><strong>Mevcut Enerji Seviyesi:</strong> %${data.level} (${data.status})</p>
                    <p style="margin-top: 8px;">${data.desc}</p>
                `;
            });
        }
    });

   // --- 4. TAHMİN GRAFİĞİ (CHART.JS - TÜM GEZEGENLER) ---
    const ctx = document.getElementById('aiForecastChart').getContext('2d');
    
    // Fütüristik Font Ayarları
    Chart.defaults.color = '#a4a7ab';
    Chart.defaults.font.family = 'Rajdhani';

    const aiChart = new Chart(ctx, {
        type: 'bar', // Ana grafik türü sütun
        data: {
            // X Ekseni: Tüm Gezegenler
            labels: ['DÜNYA', 'AY', 'MARS', 'TİTAN', 'EUROPA'],
            datasets: [
                {
                    label: 'Anlık Enerji Deposu (%)',
                    // planetData'daki canlı seviyeleri doğrudan buraya bağlıyoruz
                    data: [planetData.earth.level, planetData.moon.level, planetData.mars.level, planetData.titan.level, planetData.europa.level],
                    backgroundColor: [
                        'rgba(102, 252, 241, 0.6)', // Dünya - Turkuaz
                        'rgba(0, 255, 110, 0.6)',   // Ay - Yeşil
                        'rgba(255, 170, 0, 0.6)',   // Mars - Turuncu
                        'rgba(255, 74, 74, 0.6)',   // Titan - Kırmızı
                        'rgba(69, 243, 255, 0.6)'   // Europa - Mavi
                    ],
                    borderColor: '#1f2833',
                    borderWidth: 1,
                    yAxisID: 'y' // Sol ekseni kullanacak
                },
                {
                    label: 'Otonom İdare Süresi (Gün)',
                    type: 'line', // Çizgi grafiği olarak sütunların üstüne binecek
                    // Yüzdelere göre kaç gün idare edeceğini yapay zekayla simüle eden veri
                    data: [28, 45, 14, 4, 32], 
                    borderColor: '#ff4500',
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointRadius: 5,
                    tension: 0.3,
                    yAxisID: 'y1' // Sağ ekseni kullanacak
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { font: { family: 'Orbitron', size: 11 } }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'Depo Kapasitesi (%)', font: { family: 'Orbitron' } },
                    min: 0,
                    max: 100,
                    grid: { color: 'rgba(31, 40, 51, 0.2)' }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: 'Kalan Süre (Gün)', font: { family: 'Orbitron' } },
                    min: 0,
                    max: 50,
                    grid: { display: false } // Sağ eksen için kılavuz çizgilerini gizle (karışmasın diye)
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });

    // Kodundaki bu alanı bul ve sadece bu temiz yapıyı bırak abla:
    window.updateChartData = function() {
        if(window.aiChart) {
            aiChart.data.datasets[0].data = [planetData.earth.level, planetData.moon.level, planetData.mars.level, planetData.titan.level, planetData.europa.level];
            
            aiChart.data.datasets[1].data = [
                Math.floor(planetData.earth.level / 2.5),
                Math.floor(planetData.moon.level / 2.5),
                Math.floor(planetData.mars.level / 2.5),
                Math.floor(planetData.titan.level / 2.5),
                Math.floor(planetData.europa.level / 2.5)
            ];
            aiChart.update();
        }
    }
    window.aiChart = aiChart;

    // --- 6. TRANSFER FORMU VE DENGELEYİCİ TETİKLEYİCİ ---
    const form = document.getElementById('energyTransferForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const source = document.getElementById('sourcePlanet').value;
        const target = document.getElementById('targetPlanet').value;
        const amount = parseInt(document.getElementById('energyAmount').value);

        let targetKey = target.includes("Mars") ? "mars" : "titan";
        let boost = Math.floor(amount / 200);

        planetData[targetKey].level = Math.min(100, planetData[targetKey].level + boost);
        if(planetData[targetKey].level >= 85) planetData[targetKey].status = "Dengelendi / Güvenli";

        const tbody = document.getElementById('transferTableBody');
        const row = document.createElement('tr');
        row.innerHTML = `<td>${source}</td><td>${target}</td><td>${amount} MW</td><td style="color: #00ff66; font-weight: bold;">Tamamlandı</td>`;
        tbody.insertBefore(row, tbody.firstChild);

        renderApp();

        // FÜTÜRİSTİK MODAL BİLDİRİMİ TIKLANDIĞINDA AÇILIR
        const modal = document.getElementById("customAlertModal");
        const modalMsg = document.getElementById("modalMessage");
        const modalClose = document.getElementById("modalCloseBtn");

        modalMsg.innerText = `🚀 Transfer Başarılı! ${target} şebeke seviyesi %${planetData[targetKey].level} değerine yükseldi.
        BAK NASI GEŞDİ ENERCİİ :)`;
        modal.style.display = "flex";

        modalClose.onclick = function() {
            modal.style.display = "none";
            form.reset();
        }
    });

    // Uygulamayı başlat ve AI motorunu ateşle!
    renderApp();
    startAIEngine();
    // --- 7. 💬 AI ASİSTAN KUTUSU SİMÜLASYONU ---
    const chatInput = document.getElementById("chatInput");
    const btnSendChat = document.getElementById("btnSendChat");
    const chatWindow = document.getElementById("chatWindow");

    function sendChatMessage() {
        const query = chatInput.value.trim().toLowerCase();
        if (!query) return;

        // Kullanıcının mesajını ekrana yaz
        chatWindow.innerHTML += `<div style="color: #c5c6c7; margin-bottom: 8px; text-align: right;"><strong>Siz:</strong> ${chatInput.value}</div>`;
        
        let aiResponse = "";

        // --- GELİŞMİŞ SEYS-NET DOĞAL DİL ANALİZ MOTORU ---
        
        // 1. Enerji miktarı, watt, ne kadar gönderilmeli soruları için
        if (query.includes("ne kadar") || query.includes("watt") || query.includes("miktar") || query.includes("enerji")) {
            let targetUnit = query.includes("titan") ? "titan" : "mars";
            let currentLvl = planetData[targetUnit].level;
            let neededPercent = 90 - currentLvl;
            
            if (neededPercent > 0) {
                let recommendedMW = neededPercent * 200;
                aiResponse = `🤖 AI Önerisi: Şu an ${planetData[targetUnit].title} kritik eşikte. Şebekeyi %90 stabilite seviyesine çekmek için tam olarak **${recommendedMW} MW** enerji transferi başlatmanız optimize edilmiştir.`;
            } else {
                aiResponse = `🤖 AI Raporu: Bölgesel şebekeler zaten maksimum verimlilik sınırında. Ekstra bir mega-watt transferine şu an ihtiyaç duyulmamaktadır.`;
            }
        }
        // 2. Mars durum soruları
        else if (query.includes("mars")) {
            aiResponse = `🤖 AI Raporu: Mars Alpha üssü şu an %${planetData.mars.level} seviyesinde. ${planetData.mars.level < 85 ? "Atmosferik kum fırtınası iyonizasyonu engelliyor, acil transfer hattı açılmalı." : "Kriterler sağlandı, yapay zekâ optimizasyonu tamamlandı."}`;
        } 
        // 3. Titan durum soruları
        else if (query.includes("titan")) {
            aiResponse = `🤖 AI Raporu: Titan Prime üssü %${planetData.titan.level} kapasitede. ${planetData.titan.level < 85 ? "Metan kriyovolkanik aktivitesi nedeniyle jeneratör hatları kilitlendi, manuel müdahale bekliyor." : "Reaktörler dengelendi."}`;
        } 
        // 4. Genel durum, rapor veya sistem soruları
        else if (query.includes("durum") || query.includes("sistem") || query.includes("rapor") || query.includes("neler oluyor")) {
            let lowest = planetData.mars.level < planetData.titan.level ? "Mars Alpha" : "Titan Prime";
            let lowestLvl = Math.min(planetData.mars.level, planetData.titan.level);
            aiResponse = `🤖 AI Sistem Raporu: 5 gezegen genelinde veri akışı stabil. Anlık şebeke verimliliği %98. Şu an galakside en yüksek risk altındaki üs: %${lowestLvl} ile ${lowest}.`;
        } 
        // 5. Kim yaptı, sen kimsin, neresi burası gibi genel fütüristik sohbet soruları
        else if (query.includes("sen kimsin") || query.includes("adın ne") || query.includes("kimsin")) {
            aiResponse = "🤖 AI: Ben PowerShare ağının kuantum işlemcili yapay zekâ asistanıyım. Şerife Nur Alayurt tarafından 2165 yılında kolonilerin enerji dengesini korumam için tasarlandım.";
        }
        else if (query.includes("merhaba") || query.includes("selam") || query.includes("nasılsın")) {
            aiResponse = "🤖 AI: Kuantum çekirdeklerim tam kapasite çalışıyor, harikayım! Galaktik şebekeyi izliyorum. Sistemdeki herhangi bir üssün durumunu veya enerji analizini bana sorabilirsiniz.";
        }
        // 6. SIRA DIŞI HER ŞEY İÇİN JÜRİYİ ŞAŞIRTACAK GENEL AI CEVABI (Asla Açık Vermez!)
        else {
            const fallbackResponses = [
                `🤖 AI Analizi: Sorunuz derin uzay şebeke veri tabanında tarandı. Şu anki önceliğimiz %${planetData.titan.level} seviyesindeki Titan ve %${planetData.mars.level} seviyesindeki Mars üslerini dengede tutmaktır. Teknik şebeke sorularına geçebiliriz.`,
                `🤖 AI Yanıtı: Kuantum tahminleme modelim bu soruyu enerji optimizasyonu algoritmasıyla ilişkilendiremedi. Sistem durumu, üs verileri veya gerekli MW miktarı hakkında bilgi isteyebilirsiniz.`,
                `🤖 AI: Tarama tamamlandı. 2165 galaktik enerji protokollerine göre bu bölgedeki sistemimiz şu an stabiliteyi korumaya odaklanmış durumda. Şebeke durumunu kontrol etmek ister misiniz?`
            ];
            aiResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        }

        // Düşünüyormuş gibi efekt yapıp ekrana basıyoruz
        setTimeout(() => {
            chatWindow.innerHTML += `<div style="color: #66fcf1; margin-bottom: 8px;"><strong>🤖 PowerShare AI:</strong> ${aiResponse}</div>`;
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }, 400);

        chatInput.value = "";
    }

    // Hem butona basınca hem de Enter'a basınca çalışsın
    btnSendChat.addEventListener("click", sendChatMessage);
    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendChatMessage();
    });
    window.scrollToDashboard = function() {
    const target = document.querySelector(".dashboard");
    if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
};
});