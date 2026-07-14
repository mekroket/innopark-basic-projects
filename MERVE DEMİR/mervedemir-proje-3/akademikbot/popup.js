// popup.js — v3.2 Kesin Ayrıştırma Motoru (Güncellenmiş Tam Sürüm)
const $ = id => document.getElementById(id);
const btnStart      = $('btnStart');
const btnSave       = $('btnSave');
const statusDot     = $('statusDot');
const statusText    = $('statusText');
const currentPerson = $('currentPerson');
const countOk       = $('countOk');
const countEmail    = $('countEmail');
const countPhone    = $('countPhone');
const logBox        = $('logBox');

let allScrapedData = [];
let isRunning = false;

function addToLog(text, level = 'info') {
    const span = document.createElement('span');
    span.className = 'log-' + level;
    const time = new Date().toLocaleTimeString('tr-TR', { hour12: false });
    span.textContent = `[${time}] ${text}\n`;
    logBox.appendChild(span);
    logBox.scrollTop = logBox.scrollHeight;
}

btnStart.addEventListener('click', async () => {
    if (isRunning) return;
    isRunning = true;
    allScrapedData = [];
    statusDot.className = 'status-dot running';
    btnStart.disabled = true;
    btnSave.disabled = true;
    addToLog('Tarama başlatıldı...', 'info');
    await startAutoScrapingLoop();
});

async function startAutoScrapingLoop() {
    let currentPageNum = 1;
    while (isRunning) {
        statusText.textContent = `Sayfa ${currentPageNum} taranıyor...`;
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) { addToLog('Sekme kayboldu.', 'err'); break; }

        const result = await runScrapeScript(tab.id);
        const pageData = result?.[0]?.result?.data || [];

        if (pageData.length > 0) {
            allScrapedData = allScrapedData.concat(pageData);
            countOk.textContent = allScrapedData.length;
            countEmail.textContent = allScrapedData.filter(p => p.email !== '-').length;
            countPhone.textContent = '-';
            currentPerson.textContent = `Son: ${allScrapedData[allScrapedData.length - 1].isim}`;
            addToLog(`Sayfa ${currentPageNum} tamam. Toplam: ${allScrapedData.length}`, 'ok');
        }

        const nextPageNum = currentPageNum + 1;
        const clickResult = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (targetPage) => {
                const links = Array.from(document.querySelectorAll('.pagination a, ul.pagination li a, a'));
                const nextBtn = links.find(el => el.textContent.trim() === String(targetPage));
                if (nextBtn) { nextBtn.click(); return true; }
                const arrowBtn = links.find(el => el.textContent.includes('»') || el.textContent.toLowerCase().includes('sonraki'));
                if (arrowBtn) { arrowBtn.click(); return true; }
                return false;
            },
            args: [nextPageNum]
        });

        const isClicked = clickResult?.[0]?.result || false;
        if (isClicked && isRunning) {
            currentPageNum = nextPageNum;
            await new Promise(r => setTimeout(r, 3500));
        } else {
            addToLog('Tarama tamamlandi!', 'ok');
            break;
        }
    }

    statusDot.className = 'status-dot done';
    statusText.textContent = `Tamamlandi - Toplam ${allScrapedData.length} kisi`;
    btnStart.disabled = false;
    btnSave.disabled = false;
    isRunning = false;
}

function runScrapeScript(tabId) {
    return new Promise((resolve) => {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                const UNVANLAR = [
                    "PROFESÖR DOKTOR", "DOÇENT DOKTOR", "DOKTOR ÖĞRETIM ÜYESI",
                    "DOKTOR ÖĞRETİM ÜYESİ", "ARAŞTIRMA GÖREVLİSİ DOKTOR",
                    "ARAŞTIRMA GÖREVLİSİ", "ÖĞRETİM GÖREVLİSİ DOKTOR",
                    "ÖĞRETİM GÖREVLİSİ", "PROFESÖR", "DOÇENT", "UZMAN"
                ];

                const BIRIM_SONEKI = [
                    'FAKÜLTESİ', 'YÜKSEKOKULU', 'ENSTİTÜSÜ',
                    'MESLEK YÜKSEKOKULU', 'MYO', 'MERKEZİ'
                ];

                // --- Üniversite Adını Dinamik Çıkarma ---
                let uniAdi = "Bilinmeyen Üniversite";
                const baslik = document.title || "";
                const uniMatch = baslik.match(/(.*?Üniversitesi)/i);
                if (uniMatch && uniMatch[1]) {
                    uniAdi = uniMatch[1].trim();
                }

                const rows = document.querySelectorAll('table tbody tr');
                const data = [];

                rows.forEach(row => {
                    let hedefHucre = null;
                    let maxLen = 0;
                    row.querySelectorAll('td').forEach(td => {
                        const t = (td.innerText || td.textContent).replace(/\s+/g, ' ').trim();
                        if ((t.includes('FAKÜLTESİ') || t.includes('YÜKSEKOKULU') ||
                             t.includes('ENSTİTÜSÜ') || t.includes('BÖLÜMÜ')) && t.length > maxLen) {
                            maxLen = t.length;
                            hedefHucre = td;
                        }
                    });

                    if (!hedefHucre) return;

                    const raw = (hedefHucre.innerText || hedefHucre.textContent).replace(/\s+/g, ' ').trim();

                    let unvan = '-';
                    let sonrasi = raw;
                    for (const u of UNVANLAR) {
                        if (raw.toUpperCase().startsWith(u)) {
                            unvan = u.charAt(0) + u.slice(1).toLowerCase();
                            sonrasi = raw.substring(u.length).trim();
                            break;
                        }
                    }

                    let isim = '-';
                    let fakulte = '-';
                    let bolum = '-';
                    const slashIdx = sonrasi.indexOf('/');

                    if (slashIdx !== -1) {
                        const slashOnce = sonrasi.substring(0, slashIdx).trim();
                        const slashSonra = sonrasi.substring(slashIdx + 1).trim();

                        let birimBaslangic = -1;
                        for (const sonek of BIRIM_SONEKI) {
                            const idx = slashOnce.indexOf(sonek);
                            if (idx !== -1) {
                                const kelimeler = slashOnce.substring(0, idx + sonek.length).split(' ');
                                const isimKelimeSayisi = Math.min(4, kelimeler.length - 1);
                                isim = kelimeler.slice(0, isimKelimeSayisi).join(' ').trim();
                                fakulte = kelimeler.slice(isimKelimeSayisi).join(' ').trim();
                                birimBaslangic = idx;
                                break;
                            }
                        }

                        if (birimBaslangic === -1) {
                            isim = slashOnce;
                        }

                        const ikincSlash = slashSonra.indexOf('/');
                        if (ikincSlash !== -1) {
                            if (fakulte === '-') {
                                fakulte = slashSonra.substring(0, ikincSlash).trim();
                                bolum = slashSonra.substring(ikincSlash + 1).trim();
                            } else {
                                bolum = slashSonra.substring(0, ikincSlash).trim();
                            }
                        } else {
                            if (fakulte === '-') fakulte = slashSonra;
                            else bolum = slashSonra;
                        }
                    } else {
                        isim = sonrasi;
                    }

                    // --- Dinamik İsim Temizleme İşlemi ---
                    function _temizleDinamik(metin, uniIsmi) {
                        let temizMetin = metin;
                        const uniRegex = new RegExp(uniIsmi, 'gi');
                        temizMetin = temizMetin.replace(uniRegex, ' ');

                        const uniKelimeler = uniIsmi.replace(/Üniversitesi/gi, '').trim().split(' ');
                        uniKelimeler.forEach(kelime => {
                            if (kelime.length > 2) {
                                const kelimeRegex = new RegExp('\\b' + kelime + '\\b', 'gi');
                                temizMetin = temizMetin.replace(kelimeRegex, ' ');
                            }
                        });
                        
                        temizMetin = temizMetin.replace(/ÜNİVERSİTESİ/gi, ' ')
                                               .replace(/\s+/g, ' ')
                                               .trim();
                        return temizMetin;
                    }

                    isim = _temizleDinamik(isim, uniAdi);
                    const ucuncuSlash = bolum.indexOf('/');
                    if (ucuncuSlash !== -1) bolum = bolum.substring(0, ucuncuSlash).trim();

                    const emailLink = row.querySelector('a[href^="mailto:"]');
                    const email = emailLink ? emailLink.href.replace('mailto:', '').trim() : '-';

                    if (isim && isim.length > 1 && isim !== '-') {
                        data.push({ universite: uniAdi, unvan, isim, fakulte, bolum, email });
                    }
                });

                return { data, uniAdi };
            }
        }, (results) => resolve(results));
    });
}

btnSave.addEventListener('click', async () => {
    if (allScrapedData.length === 0) return;
    
    // 1. Orijinal İşlem: CSV İndir (Dinamik Üniversite Adı ile Güncellendi)
    const tespitEdilenUni = allScrapedData.length > 0 ? allScrapedData[0].universite : "Akademik_Liste";
    chrome.runtime.sendMessage({ 
        type: 'DOWNLOAD_CSV', 
        data: allScrapedData,
        uniAdi: tespitEdilenUni 
    });
    addToLog('Excel dosyasi indiriliyor...', 'ok');

    // 2. Yeni İşlem: SQL Veritabanına Gönder
    addToLog('Veritabanına aktarılıyor, bekleyin...', 'info');
    try {
       const res = await fetch('http://akademisyenrehberi.42web.io/api_kayit.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(allScrapedData)
        });
        const sonuc = await res.json();
        
        if(sonuc.success) {
            addToLog(`Veritabanına aktarıldı: ${sonuc.eklenen_kayit} kayıt!`, 'ok');
        } else {
            addToLog('Veritabanı hatası: ' + sonuc.error, 'err');
        }
    } catch (err) {
        addToLog('Bağlantı hatası: XAMPP açık mı?', 'err');
    }
});