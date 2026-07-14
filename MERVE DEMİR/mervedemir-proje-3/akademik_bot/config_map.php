<?php
// ============================================================
// config_map.php — Tüm Üniversiteler ve Fakülte Stratejileri
// ============================================================

return [

// ASBU - GÜNCEL xpath stratejisi
    'asbu' => [
        'tip'           => 'dom',
        'universite_id' => 1,
        'fakulteler'    => [
            ['İlahiyat', 'https://if.asbu.edu.tr/tr/akademik-kadro'],
            ['İletişim', 'https://ilef.asbu.edu.tr/tr/akademik-kadro'],
            ['Hukuk', 'https://hf.asbu.edu.tr/tr/akademik-kadro'],
            ['Siyasal Bilgiler', 'https://sbf.asbu.edu.tr/tr/akademik-kadro'],
            ['Sosyal ve Beşeri Bilimler', 'https://stf.asbu.edu.tr/tr/akademik-personel'],
            ['Sosyal Bilimler Enstitüsü', 'https://sbb.asbu.edu.tr/tr/akademik-kadro'],
            ['Yabancı Diller Fakültesi', 'https://ydf.asbu.edu.tr/tr/akademik-kadro'],
            ['Yabancı Diller Yüksekokulu', 'https://ydyo.asbu.edu.tr/tr/akademik-kadro'],
        ],
        // Yeni seçici: 'view-content' içindeki satırları bul
        'kart_xpath'    => '//div[contains(@class,"view-content")]//tr[td]',
        'isim_xpath'    => './/td[2]',      
        'unvan_xpath'   => './/td[1]',      
        'eposta_xpath'  => './/td[4]//a',   
        'telefon_xpath' => './/td[5]',      
        'bolum_xpath'   => './/td[3]',      
    ],
    // 2. KAYSERİ ÜNİVERSİTESİ
    'kayseri' => [
        'tip'           => 'dom',
        'universite_id' => 2,
        'fakulteler'    => [
            ['Fen Edebiyat',       'https://fenitalimarasbilimler.kayseri.edu.tr/akademik-personel'],
            ['Mühendislik',        'https://muhendislik.kayseri.edu.tr/akademik-personel'],
            ['İktisadi İdari',     'https://iibf.kayseri.edu.tr/akademik-personel'],
        ],
        'kart_xpath'    => '//table[contains(@class,"table")]//tr[position()>1]',
        'isim_xpath'    => './/td[1]',
        'unvan_xpath'   => './/td[2]',
        'eposta_xpath'  => './/td[3]',
        'telefon_xpath' => './/td[4]',
        'bolum_xpath'   => './/td[5]',
    ],

    // 3. AHBV (Ankara Hacı Bayram Veli)
    'ahbv' => [
        'tip'           => 'dom',
        'universite_id' => 3,
        'fakulteler'    => [
            ['Fen Edebiyat',       'https://www.ahbv.edu.tr/birimler/fakulteler/fen-edebiyat-fakultesi/akademik-kadro'],
            ['Hukuk',              'https://www.ahbv.edu.tr/birimler/fakulteler/hukuk-fakultesi/akademik-kadro'],
            ['İktisadi İdari',     'https://www.ahbv.edu.tr/birimler/fakulteler/iktisadi-ve-idari-bilimler-fakultesi/akademik-kadro'],
            ['Güzel Sanatlar',     'https://www.ahbv.edu.tr/birimler/fakulteler/guzel-sanatlar-fakultesi/akademik-kadro'],
        ],
        'kart_xpath'    => '//table//tr[position()>1]',
        'isim_xpath'    => './/td[2]',
        'unvan_xpath'   => './/td[1]',
        'eposta_xpath'  => './/a[contains(@href,"mailto:")]|.//td[4]',
        'telefon_xpath' => './/td[5]',
        'bolum_xpath'   => '',
    ],

    // 4. NEVŞEHİR HACI BEKTAŞ VELİ
    'nevsehir' => [
        'tip'           => 'dom',
        'universite_id' => 4,
        'fakulteler'    => [
            ['Fen Edebiyat',       'https://fenedebiyat.nevsehir.edu.tr/akademik-personel/'],
            ['İktisadi İdari',     'https://iibf.nevsehir.edu.tr/akademik-personel/'],
            ['Güzel Sanatlar',     'https://gst.nevsehir.edu.tr/akademik-personel/'],
            ['Mühendislik',        'https://muhendislik.nevsehir.edu.tr/akademik-personel/'],
        ],
        'kart_xpath'    => '//table//tr[position()>1]',
        'isim_xpath'    => './/td[1]',
        'unvan_xpath'   => './/td[2]',
        'eposta_xpath'  => './/a[contains(@href,"mailto:")]',
        'telefon_xpath' => './/td[4]',
        'bolum_xpath'   => './/td[3]',
    ],

    // 5. BİLKENT
    'bilkent' => [
        'tip'           => 'dom',
        'universite_id' => 5,
        'fakulteler'    => [
            ['Fen Edebiyat',       'https://www.bilkent.edu.tr/~stars/faculty.php?dept=FASA'],
            ['Mühendislik',        'https://www.bilkent.edu.tr/~stars/faculty.php?dept=ENG'],
            ['İktisadi ve İdari',  'https://www.bilkent.edu.tr/~stars/faculty.php?dept=MAN'],
        ],
        'kart_xpath'    => '//div[contains(@class,"faculty-member")]',
        'isim_xpath'    => './/strong/a',
        'unvan_xpath'   => './/span[contains(@class,"title")]',
        'eposta_xpath'  => './/a[contains(@href,"mailto:")]',
        'telefon_xpath' => './/span[contains(@class,"phone")]',
        'bolum_xpath'   => '',
    ],

    // 6. YOZGAT BOZOK
    'bozok' => [
        'tip'           => 'dom',
        'universite_id' => 6,
        'fakulteler'    => [
            ['Fen Edebiyat',       'https://fenedebiyat.bozok.edu.tr/akademik-kadromuz'],
            ['İktisadi İdari',     'https://iibf.bozok.edu.tr/akademik-kadromuz'],
            ['Mühendislik',        'https://muhendislik.bozok.edu.tr/akademik-kadromuz'],
            ['Hukuk',              'https://hukuk.bozok.edu.tr/akademik-kadromuz'],
        ],
        'kart_xpath'    => '//table//tr[position()>1]',
        'isim_xpath'    => './/td[1]',
        'unvan_xpath'   => './/td[2]',
        'eposta_xpath'  => './/td[3]',
        'telefon_xpath' => './/td[4]',
        'bolum_xpath'   => '',
    ],

    // 7. TED ÜNİVERSİTESİ
    'ted' => [
        'tip'           => 'dom',
        'universite_id' => 7,
        'fakulteler'    => [
            ['Eğitim',             'https://education.tedu.edu.tr/faculty'],
            ['Mühendislik',        'https://engineering.tedu.edu.tr/faculty'],
            ['İktisadi İdari',     'https://economics.tedu.edu.tr/faculty'],
        ],
        'kart_xpath'    => '//div[contains(@class,"faculty-card") or contains(@class,"staff-item")]',
        'isim_xpath'    => './/h3|.//h4|.//div[contains(@class,"name")]',
        'unvan_xpath'   => './/span[contains(@class,"title") or contains(@class,"unvan")]',
        'eposta_xpath'  => './/a[contains(@href,"mailto:")]',
        'telefon_xpath' => './/span[contains(@class,"phone") or contains(@class,"tel")]',
        'bolum_xpath'   => './/span[contains(@class,"dept") or contains(@class,"bolum")]',
    ],

    // 8. BURSA ULUDAĞ
    'uludag' => [
        'tip'           => 'dom',
        'universite_id' => 8,
        'fakulteler'    => [
            ['Tıp',                'https://tip.uludag.edu.tr/akademik-personel'],
            ['Hukuk',              'https://hukuk.uludag.edu.tr/akademik-personel'],
            ['Mühendislik',        'https://muhendislik.uludag.edu.tr/akademik-personel'],
            ['Fen Edebiyat',       'https://fenedebiyat.uludag.edu.tr/akademik-personel'],
            ['İktisadi İdari',     'https://iibf.uludag.edu.tr/akademik-personel'],
        ],
        'kart_xpath'    => '//div[contains(@class,"personel-card") or contains(@class,"akademik-personel")]//div[contains(@class,"item")]|//table//tr[position()>1]',
        'isim_xpath'    => './/h3|.//td[1]',
        'unvan_xpath'   => './/span[@class="unvan"]|.//td[2]',
        'eposta_xpath'  => './/a[contains(@href,"mailto:")]',
        'telefon_xpath' => './/span[@class="tel"]|.//td[4]',
        'bolum_xpath'   => './/td[3]',
    ],

    // 9. KTO KARATAY (Özel Kart ve Popover Nitelik Yapısı)
    'kto' => [
        'tip'           => 'dom',
        'universite_id' => 9,
        'fakulteler'    => [
            ['Hukuk', 'https://www.karatay.edu.tr/tr/fakulte/hukuk-fakultesi/akademik-ve-idari-kadro'],
            ['Sağlık Bilimleri', 'https://www.karatay.edu.tr/tr/fakulte/saglik-bilimleri-fakultesi/akademik-ve-idari-kadro'],
            ['Mühendislik ve Doğa Bilimleri', 'https://www.karatay.edu.tr/tr/fakulte/muhendislik-ve-doga-bilimleri-fakultesi/akademik-ve-idari-kadro'],
            ['İktisadi ve İdari Bilimler', 'https://www.karatay.edu.tr/tr/fakulte/iktisadi-idari-ve-sosyal-bilimler-fakultesi/akademik-ve-idari-kadro'],
            ['Güzel Sanatlar ve Tasarım', 'https://www.karatay.edu.tr/tr/fakulte/guzel-sanatlar-ve-tasarim-fakultesi/akademik-ve-idari-kadro'],
            ['Tıp', 'https://www.karatay.edu.tr/tr/fakulte/tip-fakultesi/akademik-ve-idari-kadro'],
            ['Uygulamalı Bilimler Yüksekokulu', 'https://www.karatay.edu.tr/tr/fakulte/uygulamali-bilimler-yuksekokulu/akademik-ve-idari-kadro'],
            ['Yabancı Diller Yüksekokulu', 'https://www.karatay.edu.tr/tr/fakulte/yabanci-diller-yuksekokulu/akademik-ve-idari-kadro'],
            ['Karatay Meslek Yüksekokulu', 'https://www.karatay.edu.tr/tr/fakulte/karatay-meslek-yuksekokulu/akademik-ve-idari-kadro'],
            ['Sağlık Hizmetleri MYO', 'https://www.karatay.edu.tr/tr/fakulte/saglik-hizmetleri-meslek-yuksekokulu/akademik-ve-idari-kadro'],
            ['Ticaret ve Sanayi MYO', 'https://www.karatay.edu.tr/tr/fakulte/ticaret-ve-sanayi-meslek-yuksekokulu/akademik-ve-idari-kadro'],
        ],
        'kart_xpath'    => '//div[contains(@class,"staff")]',
        'isim_xpath'    => './/div[contains(@class,"staffName")]',
        'unvan_xpath'   => './/div[contains(@class,"staffInfo")]',
        // E-posta ve telefon verisi gizli attributelerden (data-bs-content) çekiliyor
        'eposta_xpath'  => './/a[contains(@data-bs-content, "@")]/@data-bs-content',
        'telefon_xpath' => './/a[.//i[contains(@class,"fa-phone")]]/@data-bs-content',
        'bolum_xpath'   => './/p[contains(@class,"font-weight-normal")]',
    ],

  // 10. ESKİŞEHİR TEKNİK (ESTÜ)
    'estu' => [
        'tip'           => 'dom',
        'universite_id' => 10,
        'fakulteler'    => [
            ['Bilgisayar ve Bilişim Bilimleri', 'https://bbbf.eskisehir.edu.tr/tr/Icerik/Detay/akademik-kadro'],
            ['Fen', 'https://fen.eskisehir.edu.tr/tr/Icerik/Detay/akademik-kadro-4'],
            ['Havacılık ve Uzay Bilimleri', 'https://hubf.eskisehir.edu.tr/tr/Icerik/Detay/akademik-kadro-2'],
            ['Mimarlık ve Tasarım', 'https://mtf.eskisehir.edu.tr/tr/Icerik/Detay/akademik-kadro-2'],
            ['Mühendislik', 'https://mf.eskisehir.edu.tr/tr/Icerik/Detay/akademik-kadro-2-2'],
            ['Spor Bilimleri', 'https://sporbilimleri.eskisehir.edu.tr/tr/Icerik/Detay/akademik-kadro'],
            ['Yabancı Diller Yüksekokulu', 'https://ydyo.eskisehir.edu.tr/tr/Icerik/Detay/akademik-personel'],
            ['Bilişim Teknolojileri MYO', 'https://btmyo.eskisehir.edu.tr/tr/Icerik/Detay/akademik-kadro'],
            ['Porsuk MYO', 'https://pmyo.eskisehir.edu.tr/tr/Icerik/Detay/akademik-kadro'],
            ['Ulaştırma MYO', 'https://umyo.eskisehir.edu.tr/tr/Icerik/Detay/akademik-kadro'],
        ],
        // Her bir hücre (td) bir akademisyeni temsil ediyor
        'kart_xpath'    => '//td[.//a[contains(@href, "akademik.eskisehir.edu.tr")]]',
        'isim_xpath'    => './/a[contains(@href, "akademik.eskisehir.edu.tr")]',
        'unvan_xpath'   => './/a[contains(@href, "akademik.eskisehir.edu.tr")]',
        // E-posta alanı geçici olarak URL linkini alacak
        'eposta_xpath'  => './/a[contains(@href, "akademik.eskisehir.edu.tr")]/@href',
        'telefon_xpath' => '',
        'bolum_xpath'   => './/small | .//span[contains(@style, "font-size: 11")]',
    ],

    // 11. MUDANYA
    'mudanya' => [
        'tip'           => 'dom',
        'universite_id' => 11,
        'fakulteler'    => [
            ['İletişim',           'https://iletisim.mudanya.edu.tr/akademik-kadro/'],
            ['İşletme',            'https://isletme.mudanya.edu.tr/akademik-kadro/'],
        ],
        'kart_xpath'    => '//div[contains(@class,"team-member") or contains(@class,"akademisyen")]|//table//tr[position()>1]',
        'isim_xpath'    => './/h3|.//h4|.//td[1]',
        'unvan_xpath'   => './/span[@class="title"]|.//td[2]',
        'eposta_xpath'  => './/a[contains(@href,"mailto:")]',
        'telefon_xpath' => './/td[3]',
        'bolum_xpath'   => '',
    ],

    // 12. AKDENİZ
    'akdeniz' => [
        'tip'           => 'dom',
        'universite_id' => 12,
        'fakulteler'    => [
            ['Tıp',                'https://tip.akdeniz.edu.tr/akademik-personel'],
            ['Hukuk',              'https://hukuk.akdeniz.edu.tr/akademik-personel'],
            ['Mühendislik',        'https://muhendislik.akdeniz.edu.tr/akademik-personel'],
            ['Fen Edebiyat',       'https://fenedebiyat.akdeniz.edu.tr/akademik-personel'],
            ['İktisadi İdari',     'https://iibf.akdeniz.edu.tr/akademik-personel'],
        ],
        'kart_xpath'    => '//div[contains(@class,"personel") or contains(@class,"akademisyen")]|//table//tr[position()>1]',
        'isim_xpath'    => './/td[2]|.//h3',
        'unvan_xpath'   => './/td[1]|.//span[@class="unvan"]',
        'eposta_xpath'  => './/a[contains(@href,"mailto:")]',
        'telefon_xpath' => './/td[4]',
        'bolum_xpath'   => './/td[3]',
    ],
// 11. EGE ÜNİVERSİTESİ - YENİ TASARIM (div tabanlı kartlar)
'ege' => [
    'tip'           => 'dom',
    'universite_id' => 11, // Kendi sistemindeki doğru ID'yi kontrol et
    'fakulteler'    => [
        ['Çeşme Turizm', 'https://turizm.ege.edu.tr/tr-4094/akademik_kadro.html'],
        ['Coğrafya', 'https://cografya.ege.edu.tr/tr-1094/akademik_kadro.html'],
        ['Amerikan Kültürü', 'https://ake.ege.edu.tr/tr-4189/akademik_kadro.html'],
        ['İngiliz Dili', 'https://englishlit.ege.edu.tr/tr-3574/akademik_kadro.html'],
        ['Felsefe', 'https://felsefe.ege.edu.tr/tr-2341/akademik_kadro.html'],
        ['Sosyoloji', 'https://sosyoloji.ege.edu.tr/tr-1646/akademik_kadro.html'],
        ['Mütercim-Tercümanlık', 'https://translation.ege.edu.tr/tr-3605/akademik_kadro.html'],
        ['Mühendislik Fakültesi', 'https://muhfak.ege.edu.tr/tr-23987/akademik_kadro.html'],
        ['Elektrik-Elektronik', 'https://electronics.ege.edu.tr/tr-3643/akademik_yapi.html'],
        ['Deri Mühendisliği', 'https://deri.ege.edu.tr/tr-4516/akademik_kadro.html'],
        ['Tekstil Mühendisliği', 'https://textile.ege.edu.tr/tr-19715/tekstil_muhendisligi_akademik_yapisi.html'],
        ['Tıp Fakültesi', 'https://med.ege.edu.tr/tr-10047/akademik_kadro.html'],
        ['Spor Bilimleri', 'https://sporbilimleri.ege.edu.tr/tr-6824/akademik_kadro.html'],
        ['Su Ürünleri', 'https://egefish.ege.edu.tr/tr-21918/akademik_kadro.html'],
        ['Eczacılık', 'https://eczacilik.ege.edu.tr/tr-8000/akademik_kadro.html'],
        ['Fen Fakültesi', 'https://fen.ege.edu.tr/tr-8623/akademik_kadromuz.html'],
        ['İktisadi ve İdari Bilimler', 'https://iibf.ege.edu.tr/tr-8096/akademik_kadro.html'],
        ['Güzel Sanatlar', 'https://gstmf.ege.edu.tr/tr-7952/akademik_kadro.html'],
    ],
    'kart_xpath'    => '//div[contains(@class,"personel-card")]',
    'isim_xpath'    => './/div[contains(@class,"personel-name")]',
    'unvan_xpath'   => '', // PHP içindeki unvan_ayir fonksiyonu halledecek
    'eposta_xpath'  => './/a[contains(@href, "mailto:")]',
    'telefon_xpath' => './/div[contains(@class,"personel-info") and contains(., "Tel")]',
    'bolum_xpath'   => './/div[contains(@class,"personel-title")] | .//em',
],

// 11b. EGE ÜNİVERSİTESİ - ESKİ TASARIM (table tabanlı kadro listeleri)
'ege_eski' => [
    'tip'           => 'dom',
    'universite_id' => 11, // ege ile AYNI üniversite id'si olmalı
    'fakulteler'    => [
        ['Eğitim Fakültesi', 'https://egitim.ege.edu.tr/tr-3487/idari_personel.html'],
        // 'Biyomühendislik' ve 'Diş Hekimliği' URL'leri eksik/hatalı görünüyor,
        // doğru sayfa yolunu tarayıcıdan teyit edip buraya ekle:
        // ['Biyomühendislik', 'https://biyomuhendislik.ege.edu.tr/tr-XXXX/akademik_kadro.html'],
        // ['Diş Hekimliği', 'https://dent.ege.edu.tr/tr-23048/akademik_kadro.html'],
    ],
    // Sadece "kadro/personel" sınıflı tablolarla sınırla — sayfadaki her tabloyu alma
    'kart_xpath'    => '//table[contains(@class,"kadro") or contains(@class,"personel") or contains(@class,"table")]//tr[td]',
    'isim_xpath'    => './/td[2]',
    'unvan_xpath'   => '', // unvan_ayir fonksiyonu isimden ayıracak
    'eposta_xpath'  => './/td[contains(., "@")]',
    'telefon_xpath' => './/td[last()]',
    'bolum_xpath'   => '', // eski tablo yapısında genelde bölüm sütunu yok
],
    // 14. İTÜ (JSON API Yapısı)
    'itu' => [
        'tip'           => 'json_api',
        'universite_id' => 14,
        'api_base'      => 'https://www.itu.edu.tr/tr/akademik/akademisyenler',
        'api_params'    => ['format' => 'json'],
        'json_isim'     => 'AdSoyad',
        'json_unvan'    => 'Unvan',
        'json_eposta'   => 'Email',
        'json_telefon'  => 'Telefon',
        'json_bolum'    => 'Bolum',
        'json_fakulte'  => 'Fakulte',
        'birimler'      => [
            ['İnşaat Fakültesi',           '1'],
            ['Elektrik-Elektronik',        '2'],
            ['Mimarlık',                   '3'],
            ['Fen-Edebiyat',               '4'],
            ['İşletme',                    '5'],
        ],
    ],

    // 15. ANKARA ÜNİVERSİTESİ
    'ankara' => [
        'tip'           => 'dom',
        'universite_id' => 15,
        'fakulteler'    => [
            ['Dil Tarih Coğrafya', 'https://dtcf.ankara.edu.tr/akademik/akademik-personel/'],
            ['Hukuk',              'https://hukuk.ankara.edu.tr/akademik/akademik-personel/'],
            ['Siyasal Bilgiler',   'https://sbe.ankara.edu.tr/akademik/akademik-personel/'],
            ['Tıp',                'https://tip.ankara.edu.tr/akademik/akademik-personel/'],
            ['Eczacılık',          'https://eczacilik.ankara.edu.tr/akademik/akademik-personel/'],
        ],
        'kart_xpath'    => '//div[contains(@class,"akademisyen") or contains(@class,"staff-item") or contains(@class,"person-card")]',
        'isim_xpath'    => './/h2|.//h3|.//strong[@class="isim"]',
        'unvan_xpath'   => './/span[@class="unvan"]|.//p[contains(@class,"title")]',
        'eposta_xpath'  => './/a[contains(@href,"mailto:")]',
        'telefon_xpath' => './/span[contains(@class,"tel")]',
        'bolum_xpath'   => './/span[contains(@class,"bolum")]',
    ],

    // 16. GAZİ ÜNİVERSİTESİ
    'gazi' => [
        'tip'           => 'dom',
        'universite_id' => 16,
        'fakulteler'    => [
            ['Diş Hekimliği',     'https://dishekimligi.gazi.edu.tr/personel'],
            ['Eczacılık',         'https://eczacilik.gazi.edu.tr/personel'],
            ['Eğitim',            'https://egitim.gazi.edu.tr/personel'],
            ['Fen Edebiyat',      'https://fenedebiyat.gazi.edu.tr/personel'],
            ['Hukuk',             'https://hukuk.gazi.edu.tr/personel'],
            ['İktisadi ve İdari', 'https://iibf.gazi.edu.tr/personel'],
            ['Mühendislik',       'https://muhendislik.gazi.edu.tr/personel'],
            ['Tıp',               'https://tip.gazi.edu.tr/personel'],
        ],
        'kart_xpath'    => '//table[contains(@class,"personel")]//tr[position()>1]',
        'isim_xpath'    => './/td[1]',
        'unvan_xpath'   => './/td[2]',
        'eposta_xpath'  => './/td[3]//a[contains(@href,"mailto:")]',
        'telefon_xpath' => './/td[4]',
        'bolum_xpath'   => './/td[5]',
    ],

];