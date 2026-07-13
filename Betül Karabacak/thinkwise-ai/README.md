# 🧭 ThinkWise AI — Intelligent Decision Agent

Kendi eğitilmiş makine öğrenmesi modeliyle çalışan, kişilik tarzına göre
karar veremediğin konularda sana özel yönlendirme sunan, tamamen local
çalışan bir sohbet asistanı.

## Proje Amacı

Kullanıcı ya kendinden/düşünce tarzından bahsediyor ya da karar veremediği
bir konuyu (kıyafet, kariyer, ilişki, tatil, alışveriş, yemek, kişisel
bakım vb.) anlatıyor. Sistem, yazdığı serbest metni analiz ederek 4 eksenli
bir kişilik profili tahmin ediyor (İçe/Dışa Dönük, Sezgisel/Gerçekçi,
Düşünen/Hisseden, Yargılayan/Algılayan — Myers-Briggs/MBTI teorisine
dayanır) ve bu profile göre sorduğu karar konusuna özel, kişiselleştirilmiş
bir yönlendirme üretiyor.

Amaç, kullanıcıya hazır bir cevap dayatmak değil; karar verme tarzını ona
yansıtarak kendi doğal eğilimine güvenmesini sağlamak.

## Veri Seti

**(MBTI) Myers-Briggs Personality Type Dataset** (Kaggle)
- 8.675 satır, iki sütun: `type` (16 kişilik tipinden biri) ve `posts`
  (kullanıcının forum paylaşımları, `|||` ile ayrılmış)
- Veri setinde ciddi sınıf dengesizliği var (bazı tipler binlerce örnek,
  bazıları yalnızca birkaç yüz örnek içeriyor)

## Yöntem

### Veri temizleme ve sızıntı önleme
- Metin küçük harfe çevrildi, URL'ler ve özel karakterler temizlendi.
- **Veri sızıntısı düzeltmesi:** paylaşımların içinde kullanıcının kendi tipini
  yazdığı durumlar tespit edildi (örn. "enfp and intj moments" gibi), bu 16
  tip ismi regex ile metinden çıkarıldı. Aksi halde model gerçek yazım
  tarzını değil, doğrudan tip ismini ezberleyebilirdi.

### Problem ayrıştırma
16 sınıflı doğrudan bir sınıflandırma yerine (bu, ilk denemede sadece
%40-49 doğruluk verdi ve ciddi overfitting gösterdi — Random Forest'ta
eğitim doğruluğu %99,99 iken test doğruluğu %44'e düşüyordu), problem 4
ayrı **ikili** sınıflandırma görevine bölündü (I/E, N/S, T/F, J/P). Bu,
gerçek MBTI/kişilik testi metodolojisinin de kullandığı bir yaklaşım ve
sonuçları belirgin şekilde iyileştirdi.

### Özellik çıkarımı
TF-IDF vektörleştirme: `max_features=10000`, `ngram_range=(1,2)`, `min_df=3`
(hocanın istediği 10.000-100.000 parametre aralığına uygun).

### Model eğitimi ve karşılaştırma
Her eksen için 3 farklı algoritma eğitilip karşılaştırıldı:
Logistic Regression, Random Forest (`class_weight="balanced"`), SVM
(Linear, `CalibratedClassifierCV` ile olasılık tahmini eklendi). En iyi
model, macro F1 skoruna göre otomatik seçildi. Veri, `train_test_split`
ile `stratify=y` kullanılarak %80/%20 oranında bölündü (sınıf dengesini
korumak için).

### Overfitting kontrolü
Her model için eğitim ve test doğruluğu karşılaştırıldı; büyük fark
(Random Forest'ta olduğu gibi) overfitting işareti olarak değerlendirildi
ve daha dengeli sonuç veren modeller tercih edildi.

## Sonuçlar

| Eksen | En iyi model | Doğruluk |
|---|---|---|
| İçe Dönük / Dışa Dönük (I/E) | Logistic Regression | %75,9 |
| Sezgisel / Gerçekçi (N/S) | Logistic Regression | %79,8 |
| Düşünen / Hisseden (T/F) | SVM (Linear) | %81,1 |
| Yargılayan / Algılayan (J/P) | Logistic Regression | %69,2 |

Confusion matrix grafikleri: `model/confusion_matrices.png`
Detaylı metrikler: `model/metrics.json`

## Sistem Mimarisi

- `model/train_model.py` — veri hazırlama, eğitim, model karşılaştırma, kayıt
- `model/saved/` — eğitilmiş 4 model + TF-IDF vektörleştirici (`.joblib`)
- `backend/app.py` — Flask API (tamamen local, dış servise bağlanmaz)
  - `/predict` — metni analiz edip kişilik tahmini + karara özel yönlendirme döner
  - `/model-info` — model performans metrikleri
  - `/charts/<file>` — confusion matrix grafiği
- `backend/cli_chat.py` — aynı modeli kullanan terminal (komut satırı) sürümü
- `frontend/index.html` — sohbet tarzı web arayüzü (tek dosya, HTML/CSS/JS)

### Karar konusu tespiti (kural tabanlı katman)

`/predict` endpoint'i, kullanıcının hangi konuda karar veremediğini basit
anahtar kelime eşleşmesiyle tespit ediyor (giyim, kariyer, ilişki, tatil,
alışveriş, yemek, kişisel bakım, genel). Bu kısım makine öğrenmesi değil,
kural tabanlı bir mantık katmanı — kişilik tahminini (ML) belirli bir
kararla (kural tabanlı eşleştirme) birleştirerek kişiye özel bir cevap
üretiyor. Bu ayrım şeffaflık için burada özellikle belirtiliyor.

## Nasıl Çalıştırılır

```
pip install flask scikit-learn pandas joblib matplotlib seaborn

# Modeli eğit (zaten eğitilmiş modeller model/saved/ içinde mevcut)
python model/train_model.py

# Web arayüzü + API
python backend/app.py
# Tarayıcıda: http://localhost:8000

# Terminal sürümü
python backend/cli_chat.py
```

## Dış AI Bağımlılığı

Proje **hiçbir dış yapay zeka API'sine** (OpenAI, Gemini, Claude, DeepSeek
vb.) bağlı değildir. Tüm tahminler, bu proje kapsamında sıfırdan eğitilmiş
scikit-learn modelleriyle, tamamen kullanıcının kendi bilgisayarında
çalışır.

## Sınırlamalar (Dürüst Kapsam)

- Bu proje eğitim amaçlıdır; klinik/bilimsel bir kişilik testi değildir,
  ciddi kararlar için tek başına referans alınmamalıdır.
- Kısa metinlerde (15 karakterden az) güvenilir tahmin yapılamaz, bu
  yüzden sistem kullanıcıyı daha fazla yazmaya yönlendirir.
- Model, İngilizce forum paylaşımlarıyla eğitildi; Türkçe girişlerde
  performansı test edilmemiştir.
- Karar konusu tespiti (kıyafet, kariyer vb.) kural tabanlıdır, makine
  öğrenmesi değildir — bu şeffaf şekilde belirtilmiştir.

## Yapay Zeka Kullanım Açıklaması

Bu proje geliştirilirken bir yapay zeka asistanından (Claude) adım adım
rehberlik alındı — kod, mimari ve yaklaşım önerileri asistan tarafından
sunuldu, ancak tüm kodun yazılması, çalıştırılması, test edilmesi ve
hata ayıklaması öğrenci tarafından bizzat yapıldı. Bu, hocanın "harici AI
bağımlılığı olmayacak" kuralına aykırı değildir çünkü bu kural, projenin
**çalışma zamanında** (kullanıcı sistemi kullanırken) dış bir AI servisine
bağlı olmamasıyla ilgilidir — geliştirme sürecinde öğrenme amaçlı rehberlik
alınması ayrı bir konudur.