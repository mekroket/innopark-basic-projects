# AVESİS Araştırmacı Toplayıcı v2.0 — Chrome Eklentisi

## Kurulum (1 dakika)

1. Chrome adres çubuğuna `chrome://extensions` yazın
2. Sağ üstte **"Geliştirici modu"** açın
3. **"Paketlenmemiş öğe yükle"** butonuna tıklayın
4. `avesis-extension` klasörünü seçin ✅

---

## Nasıl Kullanılır?

1. AVESİS sitesine gidin → örn: `https://avesis.erciyes.edu.tr/arastirmacilar`
2. İstediğiniz filtreyi uygulayın (fakülte, bölüm vb.)
3. Eklenti ikonuna tıklayın → **▶ Başla**
4. Bot her araştırmacının profiline girerek bilgileri toplar
5. **⏹ Durdur** ile istediğiniz zaman durdurun
6. **💾 CSV İndir** ile dosyayı alın

---

## CSV Çıktısı (11 Sütun)

| Sütun | Açıklama |
|-------|----------|
| Ünvan | Prof. Dr., Doç. Dr. vb. |
| Ad Soyad | Tam isim |
| Fakülte | Bağlı fakülte |
| Bölüm | Bağlı bölüm |
| Anabilim Dalı | Anabilim dalı |
| **E-posta** | 6 katmanlı fallback ile çekilir |
| **Telefon** | İletişim sayfasından çekilir |
| Araştırma Alanları | Uzmanlık alanları |
| ORCID | ORCID numarası |
| Web Sitesi | Kişisel web sitesi |
| Profil URL | Avesis profil linki |

> CSV dosyasını Excel'de açmak için: Dosya → Aç → Dosya türü "Tüm dosyalar" → Sınırlayıcı olarak "Noktalı virgül" seçin

---

## v2.0 Yenilikler

- **E-posta 6 katmanlı fallback:** mailto linki, gizli onclick, iletişim bölümü, .edu.tr regex, JSON-LD, genel regex
- **Sayfalama 4 yöntem:** next butonu, sayfa linki, URL parametresi, URL ekleme
- **8 farklı kart yapısı** desteklenir (farklı üniversiteler)
- **Telefon icon fix:** FontAwesome + Tabler Icons class'ları düzeltildi
- **Popup istatistikleri:** E-posta ve telefon sayaçları ayrı gösterilir

---

## Gecikme Ayarı

| Süre | Öneri |
|------|-------|
| 1–2 sn | Hızlı (ban riski var) |
| **2.5–4 sn** | **Güvenli (varsayılan)** |
| 4–8 sn | Çok güvenli |

---

## Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| Bot başlamıyor | AVESİS sayfasında olun, sayfayı yenileyin |
| Kart bulunamadı | F12 ile sayfanın HTML yapısını kontrol edin |
| E-posta boş | Profil sayfasında mailto linki olmayabilir |
| Sayfa ilerlemiyor | Gecikmeyi 4 sn'ye çıkarın |
| CSV açılmıyor | Excel'de noktalı virgül sınırlayıcı seçin |

---

## Desteklenen Üniversiteler

`avesis.*.edu.tr` formatındaki tüm AVESİS sistemleri:
- avesis.erciyes.edu.tr
- avesis.hacettepe.edu.tr
- avesis.ankara.edu.tr
- avesis.gazi.edu.tr
- avesis.yildiz.edu.tr
- ve diğerleri...
