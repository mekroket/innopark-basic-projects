# EKSİK SESLENDİRME RAPORU
*Güncelleme — 9 Temmuz 2026. Dosya adları toplu temizlendi (tümü `id.mp3`).
Evelyn'in 32 kaydı, marla_001 ve katheryne_010/011/012 klasöre eklendi ve oyunda çalıyor.*

## Hâlâ eksik / sorunlu: 3 dosya

| ID | Sahne | Konuşan | Durum / Metin |
|---|---|---|---|
| **lord_002** | Lord'un odası | Lord Callisto | ⚠️ **DOSYA BOZUK (0 bayt)** — yeniden dışa aktarılmalı. Metin: "(döner. Yakışıklı. Kusursuz. Gülümsüyor.) Yalan söylerken burnunuz kızarıyor. Anneniz üç yıl önce ölmüş. Başvurunuzda yazıyordu." |
| bruno_001 | 1. Gün (mutfak) | Bruno | Hmph. *(bruno_grunt.mp3 sfx'i yedek olarak çalıyor)* |
| whispers_final | Final | Koro (düzinelerce ses) | "Ev asla bırakmaz." *(şimdilik 3 whisper sfx üst üste bindiriliyor)* |

Dosyalar `assets/audio/voice/` içine `bruno_001.mp3`, `whispers_final.mp3`,
`lord_002.mp3` adlarıyla atıldığı anda otomatik çalar — kod değişikliği gerekmez.

## Bilgi: Voice ID'si olmayan anlatım satırları

Seslendirme planlanmamış atmosfer/anlatım satırları (istenirse `js/scenes.js`
içinde ilgili `voice: null` alanına ID yazmak yeterli): gün başlıkları
(— 1./2./3. GÜN —), Bruno bıçak anlatımları, koridor/bodrum/şafak betimlemeleri,
Evelyn'in "Bu koku...", "Bu koridor farklı...", "Bu kapı turda yoktu...",
"Kapının altından kan sızıyor..." iç sesleri ve epilog metin akışı
(theodore_006 hariç — o mevcut ve çalıyor).
