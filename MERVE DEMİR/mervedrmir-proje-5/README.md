# KİTAPPUSULA AI

KİTAPPUSULA AI, kitap arama, kitap bilgisi sunma, kitap türü tahmini ve kullanıcı mesajlarının niyetini sınıflandırma görevlerini tamamen yerel çalışan makine öğrenmesi modelleriyle gerçekleştiren Türkçe bir terminal uygulamasıdır.

Proje; hazır bir büyük dil modeli, OpenAI/Claude/Gemini API'si, Ollama, Qwen veya başka bir dış yapay zekâ servisi kullanmaz. Çalışma zamanındaki bütün model tahminleri, proje kapsamında hazırlanan verilerle eğitilmiş scikit-learn modellerinden gelir.

**Geliştirici:** Merve Demir  
**Arayüz:** Terminal / Komut satırı  
**Test edilen ortam:** Windows, Python 3.14.6

---

## 1. Projenin amacı

Projenin temel amacı, tek bir kitap odaklı yerel sistem içinde iki farklı makine öğrenmesi görevini birleştirmektir:

1. Kitap açıklamasından sekiz ana kategoriden birini tahmin etmek.
2. Kullanıcının Türkçe mesajını 33 niyet sınıfından birine yönlendirmek.

Uygulama ayrıca yerel kitap veri tabanında başlık araması yapar, aynı başlıklı eserlerde yazar seçimi sunar ve son açılan kitapla ilgili bağlamı korur.

---

## 2. Temel özellikler

- 64.682 kullanılabilir kitap kaydında yerel arama
- Kitap adı ve yazarla kesin arama
- Aynı isimli kitaplarda numaralı seçim
- Son seçilen kitap hakkında bağlamlı sorular
- Yazar, sayfa, tür, özet, karakter ve olay sorularını anlama
- Yeni bir kitap açıklamasının türünü tahmin etme
- 33 sınıflı Türkçe niyet sınıflandırması
- Düşük güvenli tahminleri uygulamama
- Güncel haber, hava veya internet verisi uydurmama
- Model sonuçlarını CSV, JSON, metin ve grafik olarak kaydetme
- Tamamen yerel çıkarım

Örnek mesajlar:

```text
Martı
Simyacı
kitap ara: Şaka | Domenico Starnone
Bu kitabın yazarı kim?
Kaç sayfa?
Bu kitap ne anlatıyor?
Hangi türe ait?
Nasılsın?
Gündemde ne var?
Kod yaz
Model bilgisi
Yeni kitap sınıflandır
```

---

## 3. Sistem mimarisi

KİTAPPUSULA üç ana katmandan oluşur.

### 3.1. Kitap veri tabanı ve arama

`main.py`, `data/raw/tum_kitaplar.csv` dosyasındaki kitapları yükler. Başlıklar Türkçe karakterlere ve yazım farklılıklarına karşı normalize edilir.

Arama katmanı:

- tam başlık eşleşmesi,
- başlık ve yazar eşleşmesi,
- aynı isimli eserlerin ayrıştırılması,
- numarayla seçim,
- güvenli yakın başlık önerileri

işlemlerini gerçekleştirir.

Açık kitap arama biçimi:

```text
kitap ara: Kitap Adı | Yazar
```

### 3.2. Kitap kategori modeli

Kitap kategori modeli yalnızca kitap açıklamasını kullanır. Kitap adı model girdisine eklenmez; böylece kişi adlarının biyografi sınıfına gereksiz yönlendirme yapması azaltılır.

Kullanılan ana kategoriler:

1. Roman
2. Şiir
3. Hikâye
4. Deneme
5. Bilimkurgu-Fantazya
6. Anı
7. Biyografi-Otobiyografi
8. Polisiye

`prepare_data.py`, her sınıftan en fazla 1.000 kayıt alarak dengeli bir eğitim tablosu üretir. İşlenmiş dosya 5 MB sınırının altında tutulur.

`train.py` aşağıdaki modelleri karşılaştırır:

- Logistic Regression
- Linear SVM
- Complement Naive Bayes

Model seçimi, eğitim bölümündeki 5-Fold Cross Validation Macro F1 ortalamasına göre yapılır. Nihai model:

```text
models/kitap_kategori_modeli.joblib
```

dosyasına kaydedilir.

### 3.3. Niyet sınıflandırma modeli

Niyet modeli, kullanıcının mesajını 33 sınıftan birine ayırır. Örnek sınıflar:

```text
KITAP_ARAMA
YAZAR_SORUSU
SAYFA_SORUSU
TUR_SORUSU
OZET_SORUSU
KARAKTER_SORUSU
OLAY_SORUSU
MODEL_BILGISI
SELAMLAMA
NASILSIN
BOT_KIMLIK
BOT_KONUM
TESEKKUR
VEDA
SAKA_ISTEGI
HAVA_SORUSU
HABER_SORUSU
YEMEK_TARIFI_SORUSU
ALAN_DISI
```

Niyet verisi üç kaynaktan birleştirilmiştir:

- proje için elle hazırlanmış Türkçe örnekler,
- önceki yerel kitap niyeti örnekleri,
- Amazon MASSIVE veri setinin Türkçe bölümünden seçilen örnekler.

Final veri yapısı:

| Özellik | Değer |
|---|---:|
| Niyet sınıfı | 33 |
| Eğitim cümlesi | 1.980 |
| Bağımsız test cümlesi | 495 |
| Sınıf başına eğitim | 60 |
| Sınıf başına bağımsız test | 15 |
| Eğitim-test birebir çakışması | 0 |

`train_intent.py` şu modelleri karşılaştırır:

- Logistic Regression
- Linear SVM
- Complement Naive Bayes

Nihai model, bağımsız test verisine bakılarak değil, 5-Fold Cross Validation Macro F1 ortalamasına göre seçilir. Bu seçim yöntemi test verisinin model seçimine sızmasını önler.

Final niyet modelinin seçimi ve sonuçları:

| Ölçüm | Sonuç |
|---|---:|
| Seçilen model | Logistic Regression |
| 5-Fold CV Macro F1 ortalaması | 0,9640 |
| Bağımsız test accuracy | 0,7657 |
| Bağımsız test macro precision | 0,7897 |
| Bağımsız test macro recall | 0,7657 |
| Bağımsız test macro F1 | 0,7566 |
| Yaklaşık öğrenilen parametre | 444.015 |

Linear SVM bağımsız testte daha yüksek Macro F1 üretmiş olsa da model seçimi bağımsız test sonucuna göre yapılmamıştır. Logistic Regression, Cross Validation ortalaması daha yüksek olduğu için seçilmiştir.

Nihai model:

```text
models/niyet_siniflandirici.joblib
```

dosyasına kaydedilir.

---

## 4. ML öncelikli yönlendirme

Doğal dil mesajları doğrudan eğitilmiş niyet modeline gönderilir. Niyet sınıflandırıcısında hazır cevap seçen bir regex tahmin zinciri kullanılmaz.

Yalnızca aşağıdaki işlemler deterministiktir:

- `kitap ara:` komutu
- boş giriş
- çıkış komutu
- numaralı kitap seçimi
- başlık ve yazarla kesin eşleşme
- güvenli tam kitap başlığı eşleşmesi

Terminalde yönlendirme kaynağı görünür:

```text
[Niyet kaynağı: makine_ogrenmesi | Tahmin: NASILSIN | Güven: %58.78]
```

Kitap başlığı doğrudan eşleştiğinde:

```text
[Yönlendirme: deterministik kitap başlığı eşleşmesi]
```

yazılır.

---

## 5. Güvenli cevap davranışı

Model düşük güvenli bir tahmin üretirse sistem tahmini uygulamaz:

```text
Sorunun niyetini yeterince güvenli anlayamadım.
Yanlış bilgi vermemek için düşük güvenli tahmini uygulamıyorum.
```

Bu davranış özellikle son kitap bağlamında yanlış yazar, sayfa veya özet cevabı verilmesini önlemek için kullanılır.

Uygulama internet bağlantısı olmadan çalıştığı için:

- güncel haberleri getirmez,
- güncel hava durumunu söylemez,
- gerçek zamanlı fiyat veya sonuç vermez,
- veri setinde bulunmayan kitap bilgilerini uydurmaz,
- tarif verisi bulunmadığı için yemek tarifi üretmez.

Bu tür isteklerin niyeti sınıflandırılabilir; ancak içerik kaynağı yoksa sistem bunu açıkça belirtir.

---

## 6. Kritik test ve genel başarı farkı

`test_intent.py`, geliştirilen davranışların bozulmadığını kontrol eden 48 cümlelik bir kritik regresyon testidir.

Final durumda:

```text
48/48 doğru
Kaynak: makine_ogrenmesi
```

sonucu elde edilmiştir.

Bu sonuç **genel model doğruluğunun %100 olduğu anlamına gelmez**. Kritik test, belirli önemli örneklerin doğru yönlendirildiğini gösterir. Genel performans için bağımsız 495 cümlelik test kümesindeki Macro F1 değeri esas alınmalıdır:

```text
Bağımsız Test Macro F1: 0,7566
```

---

## 7. Proje klasör yapısı

```text
LocalAgent/
│
├── main.py
├── classifier.py
├── intent_classifier.py
├── intent_examples.py
├── prepare_data.py
├── prepare_intent_data.py
├── download_massive.py
├── train.py
├── train_intent.py
├── test_intent.py
├── requirements.txt
├── README.md
│
├── data/
│   ├── raw/
│   │   ├── tum_kitaplar.csv
│   │   └── massive_tr/
│   │       ├── massive_tr_train.csv
│   │       └── massive_tr_test.csv
│   │
│   └── processed/
│       ├── kitaplar_egitim.csv
│       ├── niyet_egitim.csv
│       ├── niyet_bagimsiz_test.csv
│       └── niyet_veri_raporu.txt
│
├── models/
│   ├── kitap_kategori_modeli.joblib
│   └── niyet_siniflandirici.joblib
│
└── reports/
    ├── confusion_matrix.png
    ├── en_iyi_model_metrikleri.json
    ├── model_karsilastirma.png
    ├── model_sonuclari.csv
    ├── siniflandirma_raporu.txt
    ├── niyet_confusion_matrix.png
    ├── niyet_en_iyi_model_metrikleri.json
    ├── niyet_hata_analizi.csv
    ├── niyet_model_karsilastirma.png
    ├── niyet_model_sonuclari.csv
    └── niyet_siniflandirma_raporu.txt
```

`archive_old` klasörü geliştirme yedeklerini içerir ve final teslim paketine eklenmemelidir.

`.venv` klasörü de teslim paketine eklenmemelidir.

---

## 8. Kurulum

PowerShell terminalini proje klasöründe aç:

```powershell
cd C:\Users\merve\Documents\LocalAgent
```

Sanal ortam oluştur:

```powershell
python -m venv .venv
```

PowerShell için geçici çalıştırma izni ver ve ortamı etkinleştir:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Paketleri yükle:

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

---

## 9. Hazır modellerle hızlı çalıştırma

`models` klasöründeki iki `.joblib` dosyası mevcutsa modeli yeniden eğitmeye gerek yoktur.

Programı başlat:

```powershell
python main.py
```

Programdan çıkmak için:

```text
çıkış
```

yazılabilir. Boş giriş de programı kapatır.

---

## 10. Projeyi sıfırdan yeniden üretme

Final projede gerekli ham ve işlenmiş veri dosyaları bulunduğu için standart kullanımda veri indirmek gerekmez.

### 10.1. Kitap verisini yeniden hazırla

```powershell
python prepare_data.py
```

### 10.2. Kitap kategori modelini yeniden eğit

```powershell
python train.py
```

### 10.3. Niyet verisini yeniden oluştur

```powershell
python prepare_intent_data.py
```

### 10.4. Niyet modelini yeniden eğit

```powershell
python train_intent.py
```

### 10.5. Kritik testi çalıştır

```powershell
python test_intent.py
```

### 10.6. Uygulamayı başlat

```powershell
python main.py
```

Tam yeniden üretim sırası:

```powershell
python prepare_data.py
python train.py
python prepare_intent_data.py
python train_intent.py
python test_intent.py
python main.py
```

---

## 11. MASSIVE verisini yeniden indirme

`data/raw/massive_tr` altındaki CSV dosyaları final projede zaten bulunur. Bu nedenle normal kullanımda aşağıdaki adım gerekli değildir.

Veri kaynağını yeniden indirmek gerekirse:

```powershell
python download_massive.py
```

Bu işlem internet bağlantısı gerektirir. İndirilen Parquet dosyalarını okumak için `pyarrow` kullanılır. Ana uygulama ve model çıkarımı internet gerektirmez.

Dış veri kaynaklarının kullanım ve lisans koşulları, akademik teslim öncesinde ilgili kaynak sayfalarından ayrıca kontrol edilmelidir.

---

## 12. Dosyaların görevleri

| Dosya | Görev |
|---|---|
| `main.py` | Kitap arama, bağlam, güven kontrolü ve kullanıcı arayüzü |
| `classifier.py` | Kitap kategori modelini yükleme ve tahmin |
| `intent_classifier.py` | Niyet modelini yükleme ve saf ML tahmini |
| `intent_examples.py` | Yerel niyet eğitim/test cümleleri |
| `prepare_data.py` | Kitap eğitim verisini temizleme ve dengeleme |
| `prepare_intent_data.py` | 33 sınıflı niyet verisini oluşturma |
| `download_massive.py` | MASSIVE Türkçe verisini isteğe bağlı indirme |
| `train.py` | Kitap kategori modellerini karşılaştırma ve eğitme |
| `train_intent.py` | Niyet modellerini karşılaştırma ve eğitme |
| `test_intent.py` | 48 cümlelik saf ML kritik regresyon testi |
| `models/` | Eğitilmiş yerel modeller |
| `reports/` | Model karşılaştırmaları, metrikler ve hata analizleri |

---

## 13. Raporlar

Kitap kategori modeli raporları:

```text
reports/model_sonuclari.csv
reports/en_iyi_model_metrikleri.json
reports/siniflandirma_raporu.txt
reports/confusion_matrix.png
reports/model_karsilastirma.png
```

Niyet modeli raporları:

```text
reports/niyet_model_sonuclari.csv
reports/niyet_en_iyi_model_metrikleri.json
reports/niyet_siniflandirma_raporu.txt
reports/niyet_confusion_matrix.png
reports/niyet_model_karsilastirma.png
reports/niyet_hata_analizi.csv
```

---

## 14. Bilinen sınırlamalar

- Sistem üretken bir büyük dil modeli değildir.
- Cevaplar yerel veri, sınıflandırma sonucu ve güvenli şablonlarla üretilir.
- Kitap açıklamaları yayınevi tanıtım metni olabilir; tam olay özeti olmayabilir.
- Aynı isimli eserlerde kullanıcıdan yazar veya sıra seçimi istenebilir.
- Kısa ve belirsiz sorularda model düşük güven üretebilir.
- Düşük güvenli doğru niyetler de güvenlik nedeniyle uygulanmayabilir.
- Veri setinde bulunmayan kitaplar hakkında bilgi verilmez.
- Güncel internet verisine erişilmez.
- Kritik test başarısı genel doğrulukla karıştırılmamalıdır.

---

## 15. Tekrarlanabilirlik

Projede sabit rastgelelik değeri kullanılır:

```text
random_state = 42
```

Model karşılaştırmaları:

- dengeli sınıflar,
- stratified train-test ayrımı,
- 5-Fold Stratified Cross Validation,
- Macro F1 seçim ölçütü,
- bağımsız test verisi,
- eğitim-test metin çakışması kontrolü

ile yapılır.

Bağımsız test kümesi model seçimi için kullanılmaz; yalnızca seçilen modelin final değerlendirmesinde kullanılır.

---

## 16. Yapay zekâ kullanım açıklaması

Bu proje tek geliştirici tarafından hazırlanmıştır. Geliştirme sürecinde kod inceleme, hata ayıklama, mimari düzenleme ve dokümantasyon için üretken yapay zekâ desteğinden yararlanılmıştır.

Buna karşın final uygulamanın çalışma zamanında:

- hazır bir LLM,
- dış yapay zekâ API'si,
- çevrim içi sohbet modeli,
- OpenAI, Claude, Gemini, Ollama veya Qwen

kullanılmaz.

Final tahminleri, proje verileriyle eğitilen scikit-learn modelleri tarafından tamamen yerel olarak üretilir.
