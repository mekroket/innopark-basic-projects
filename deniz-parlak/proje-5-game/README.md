# CALLISTO MALİKANESİ: SON HİZMETÇİ

> "Bu malikane hizmetçilerini asla kovmaz... Onları saklar."

Stardew Valley tarzı top-down 2D pixel **korku** oyunu.
Vanilla JavaScript + HTML5 Canvas — framework yok, build aracı yok, npm yok.

## Nasıl çalıştırılır

Tarayıcı `fetch` ile TMX dosyalarını okuduğu için dosyayı çift tıklamak yerine
küçük bir yerel sunucuyla açın:

```bash
cd "Callisto Malikanesi"
python -m http.server 8000
# tarayıcıda: http://localhost:8000
```

(VS Code Live Server ya da başka herhangi bir statik sunucu da olur.)

## Kontroller

| Tuş | İşlev |
|---|---|
| **WASD** | Hareket |
| **E** | Etkileşim |
| **SPACE** | Diyalog ilerlet / QTE / seçim onayı |
| **ESC** | Duraklat |

## Debug komutları (tarayıcı konsolu — F12)

```js
game.debug.list()                    // tüm sahne id'leri
game.debug.goto('corridor_night2')   // istediğin sahneye atla
game.debug.collision = true          // geçilmez alanları kırmızı göster
game.debug.flags()                   // hikaye bayrakları
```

### Sahne sırası

`prologue → entrance → tour_dining → tour_corridor → room_night1 → day1 →
room_night2 → corridor_night2 → room_after_rescue → day2 → room_night3 →
day3_office → lord_wing → lord_study → room_final → chase → basement →
tunnel → escape → epilogue → finale`

## Dosya yapısı

```
index.html            kabuk + diyalog paneli CSS'i (DOM overlay)
js/
├── main.js           oyun döngüsü, sahne yöneticisi, kamera, ışık/efekt, debug
├── scenes.js         TÜM sahneler + hikaye scriptleri (diyaloglar senaryo.md'den)
├── maps.js           TMX yükleme + render + collision (+ kod-içi oda kurucular)
├── player.js         Evelyn: WASD, collision, LPC animasyon, ayak sesi
├── npc.js            NPC sınıfı (waypoint yürüyüşü, silüet modu)
├── dialogue.js       Stardew tarzı panel, typewriter, voice senkronu, seçim/not/metin akışı
├── jumpscare.js      triggerJumpscare(opts) + QTE sistemi
├── audio.js          music / sfx / voice kanalları (eksik dosya = sessiz devam)
└── ui.js             hazır PNG ekranlar (menü, pause, game over, credits...)
```

## Bilinmesi gerekenler

- **Eksik asset oyunu kırmaz.** Ses bulunamazsa sessiz devam eder, görsel
  bulunamazsa renkli placeholder çizilir. Voice dosyaları standart
  `id.mp3` adındadır (adlar 9 Temmuz'da toplu temizlendi); yükleyici
  `id.mp3`, `id.ogg`, `id.wav` sırasıyla dener.
- **Checkpoint:** her sahne başı. Game over sonrası "TEKRAR DENE" son sahne
  başından devam ettirir.
- **Game over durumları:** QTE başarısızlığı (2. gece), yemek salonundaki boş
  sandalyeye oturmak, tünelde arkaya bakmak (S/A tuşu veya geriye yürümek).
- **Kural sistemi:** 1. gece odadan çıkış engellidir (evelyn_004), 2. gece
  hikaye gereği serbesttir.
- **Collision ayarı:** geçilmez tile listesi `js/maps.js` içindeki
  `SOLID_GIDS`; sahneye özel blokaj/delik için sahnenin `solids` / `opens`
  dikdörtgenleri (`js/scenes.js`).
- **Opsiyonel SFX'ler** (`assets/audio/sfx/` içine eklenince otomatik devreye girer):
  `child_crying_loop.mp3` (1.-2. gece ağlama; kaynağa yaklaştıkça yükselir),
  `door_knock.mp3` (kapı tıklamaları; yoksa sentez), `clock_chime.mp3`
  (gece başı 12 vuruş; dosya <3sn ise 12 kez çalınır, uzunsa tek sekans kabul edilir).
- **Oda görselleri (backgroundImage):** `assets/maps/rooms/<isim>.png`
  eklenirse o oda TMX yerine bu görselle çizilir (canvas'a sığdırılır).
  İsimler ve solids ayarı: `js/scenes.js` başındaki `ROOM_BG` tablosu
  (oda, ofis, lord_odasi, tunel, giris_holu, yemek_salonu, koridor, avlu, bodrum).
  Collision görselleştirme aynen çalışır: `game.debug.collision = true`.
- **Eksik seslendirme listesi:** `missing_voice_lines.md` (38 kayıt; adlar hazır).
