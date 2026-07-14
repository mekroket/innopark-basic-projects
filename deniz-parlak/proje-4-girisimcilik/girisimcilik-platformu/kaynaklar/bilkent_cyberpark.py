import sys
import os
import re
import tempfile
sys.path.append(os.path.dirname(__file__))
from config import API_ADRESI

import requests
import certifi
from bs4 import BeautifulSoup

TARIH_DESENI = re.compile(r'^\d{1,2}\.\d{1,2}\.\d{4}$')

# ------------------------------------------------------------------
# SSL DÜZELTMESİ — www.cyberpark.com.tr eksik sertifika zinciri
# ------------------------------------------------------------------
# Sorun: cyberpark.com.tr sunucusu TLS el sıkışmasında SADECE kendi
# sertifikasını (leaf) gönderiyor, aradaki "Sectigo Public Server
# Authentication CA DV R36" ara sertifikasını GÖNDERMİYOR.
# Tarayıcılar bu eksik halkayı kendileri tamamladığı için sitede sorun
# görünmüyor, ama Python'ın requests kütüphanesi tamamlamıyor ve
# "CERTIFICATE_VERIFY_FAILED" hatası veriyor.
#
# Çözüm: Eksik ara sertifikayı aşağıya gömdük. calistir() çağrıldığında
# certifi'nin standart kök sertifika paketiyle bu ara sertifikayı
# birleştirip geçici bir "tam paket" dosyası oluşturuyoruz ve requests'e
# verify= ile onu veriyoruz. Böylece SSL doğrulaması KAPATILMADAN
# (verify=False YOK, güvenlik korunuyor) zincir tamamlanmış oluyor.
#
# Bu sertifika 21.03.2036'ya kadar geçerli. Site ileride sertifika
# sağlayıcısını değiştirirse (Sectigo dışına çıkarsa) bu bloğu
# güncellemek gerekebilir.
SECTIGO_ARA_SERTIFIKA = """-----BEGIN CERTIFICATE-----
MIIGTDCCBDSgAwIBAgIQOXpmzCdWNi4NqofKbqvjsTANBgkqhkiG9w0BAQwFADBf
MQswCQYDVQQGEwJHQjEYMBYGA1UEChMPU2VjdGlnbyBMaW1pdGVkMTYwNAYDVQQD
Ey1TZWN0aWdvIFB1YmxpYyBTZXJ2ZXIgQXV0aGVudGljYXRpb24gUm9vdCBSNDYw
HhcNMjEwMzIyMDAwMDAwWhcNMzYwMzIxMjM1OTU5WjBgMQswCQYDVQQGEwJHQjEY
MBYGA1UEChMPU2VjdGlnbyBMaW1pdGVkMTcwNQYDVQQDEy5TZWN0aWdvIFB1Ymxp
YyBTZXJ2ZXIgQXV0aGVudGljYXRpb24gQ0EgRFYgUjM2MIIBojANBgkqhkiG9w0B
AQEFAAOCAY8AMIIBigKCAYEAljZf2HIz7+SPUPQCQObZYcrxLTHYdf1ZtMRe7Yeq
RPSwygz16qJ9cAWtWNTcuICc++p8Dct7zNGxCpqmEtqifO7NvuB5dEVexXn9RFFH
12Hm+NtPRQgXIFjx6MSJcNWuVO3XGE57L1mHlcQYj+g4hny90aFh2SCZCDEVkAja
EMMfYPKuCjHuuF+bzHFb/9gV8P9+ekcHENF2nR1efGWSKwnfG5RawlkaQDpRtZTm
M64TIsv/r7cyFO4nSjs1jLdXYdz5q3a4L0NoabZfbdxVb+CUEHfB0bpulZQtH1Rv
38e/lIdP7OTTIlZh6OYL6NhxP8So0/sht/4J9mqIGxRFc0/pC8suja+wcIUna0HB
pXKfXTKpzgis+zmXDL06ASJf5E4A2/m+Hp6b84sfPAwQ766rI65mh50S0Di9E3Pn
2WcaJc+PILsBmYpgtmgWTR9eV9otfKRUBfzHUHcVgarub/XluEpRlTtZudU5xbFN
xx/DgMrXLUAPaI60fZ6wA+PTAgMBAAGjggGBMIIBfTAfBgNVHSMEGDAWgBRWc1hk
lfmSGrASKgRieaFAFYghSTAdBgNVHQ4EFgQUaMASFhgOr872h6YyV6NGUV3LBycw
DgYDVR0PAQH/BAQDAgGGMBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0lBBYwFAYI
KwYBBQUHAwEGCCsGAQUFBwMCMBsGA1UdIAQUMBIwBgYEVR0gADAIBgZngQwBAgEw
VAYDVR0fBE0wSzBJoEegRYZDaHR0cDovL2NybC5zZWN0aWdvLmNvbS9TZWN0aWdv
UHVibGljU2VydmVyQXV0aGVudGljYXRpb25Sb290UjQ2LmNybDCBhAYIKwYBBQUH
AQEEeDB2ME8GCCsGAQUFBzAChkNodHRwOi8vY3J0LnNlY3RpZ28uY29tL1NlY3Rp
Z29QdWJsaWNTZXJ2ZXJBdXRoZW50aWNhdGlvblJvb3RSNDYucDdjMCMGCCsGAQUF
BzABhhdodHRwOi8vb2NzcC5zZWN0aWdvLmNvbTANBgkqhkiG9w0BAQwFAAOCAgEA
YtOC9Fy+TqECFw40IospI92kLGgoSZGPOSQXMBqmsGWZUQ7rux7cj1du6d9rD6C8
ze1B2eQjkrGkIL/OF1s7vSmgYVafsRoZd/IHUrkoQvX8FZwUsmPu7amgBfaY3g+d
q1x0jNGKb6I6Bzdl6LgMD9qxp+3i7GQOnd9J8LFSietY6Z4jUBzVoOoz8iAU84OF
h2HhAuiPw1ai0VnY38RTI+8kepGWVfGxfBWzwH9uIjeooIeaosVFvE8cmYUB4TSH
5dUyD0jHct2+8ceKEtIoFU/FfHq/mDaVnvcDCZXtIgitdMFQdMZaVehmObyhRdDD
4NQCs0gaI9AAgFj4L9QtkARzhQLNyRf87Kln+YU0lgCGr9HLg3rGO8q+Y4ppLsOd
unQZ6ZxPNGIfOApbPVf5hCe58EZwiWdHIMn9lPP6+F404y8NNugbQixBber+x536
WrZhFZLjEkhp7fFXf9r32rNPfb74X/U90Bdy4lzp3+X1ukh1BuMxA/EEhDoTOS3l
7ABvc7BYSQubQ2490OcdkIzUh3ZwDrakMVrbaTxUM2p24N6dB+ns2zptWCva6jzW
r8IWKIMxzxLPv5Kt3ePKcUdvkBU/smqujSczTzzSjIoR5QqQA6lN1ZRSnuHIWCvh
JEltkYnTAH41QJ6SAWO66GrrUESwN/cgZzL4JLEqz1Y=
-----END CERTIFICATE-----
"""

_sertifika_paketi_yolu = None


def sertifika_paketi():
    """certifi'nin kök sertifikaları + eksik Sectigo ara sertifikasını
    birleştirip geçici bir dosyaya yazar, dosyanın yolunu döndürür.
    Aynı çalıştırma içinde tekrar tekrar dosya oluşturmamak için yolu
    modül seviyesinde saklar."""
    global _sertifika_paketi_yolu
    if _sertifika_paketi_yolu and os.path.exists(_sertifika_paketi_yolu):
        return _sertifika_paketi_yolu

    yol = os.path.join(tempfile.gettempdir(), "cyberpark_ca_paketi.pem")
    with open(certifi.where(), "r", encoding="utf-8") as f:
        kokler = f.read()
    with open(yol, "w", encoding="utf-8") as f:
        f.write(kokler)
        f.write("\n")
        f.write(SECTIGO_ARA_SERTIFIKA)

    _sertifika_paketi_yolu = yol
    return yol


def tam_tarihi_getir(link):
    """Detay sayfasındaki tüm <p> etiketlerini tarar, tarih formatına (GG.A.YYYY)
    uyan metni bulur. Bu sayfada tarih hiçbir özel class taşımadığı için,
    class aramak yerine desen (regex) aramak daha güvenilir."""
    try:
        response = requests.get(link, headers={"User-Agent": "Mozilla/5.0"},
                                verify=sertifika_paketi(), timeout=30)
        soup = BeautifulSoup(response.text, "lxml")
        for p in soup.find_all("p"):
            metin = p.text.strip()
            if TARIH_DESENI.match(metin):
                return metin
        return ""
    except requests.exceptions.RequestException:
        return ""


def calistir():
    url = "https://www.cyberpark.com.tr/haberler"
    ana_adres = "https://www.cyberpark.com.tr"

    # timeout=30: site bazı sunucu IP'lerinden yavaş/ulaşılamaz olabiliyor,
    # sonsuza kadar bekleyip tüm taramayı kilitlemesin diye sınır koyduk.
    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"},
                            verify=sertifika_paketi(), timeout=30)
    soup = BeautifulSoup(response.text, "lxml")

    kartlar = soup.find_all("div", class_="panel panel-default")
    gonderilen = 0

    for kart in kartlar:
        link_etiketi = kart.find("a")
        baslik_kutusu = kart.find("div", class_="icn")

        if not link_etiketi or not baslik_kutusu:
            continue

        baslik_etiketi = baslik_kutusu.find("p")
        if not baslik_etiketi:
            continue

        baslik = baslik_etiketi.text.strip()
        link = ana_adres + link_etiketi.get("href", "").strip()

        if not baslik or not link:
            continue

        tam_tarih = tam_tarihi_getir(link)

        veri = {
            "Title": baslik,
            "Link": link,
            "Category": "cyberpark-haber",
            "Source": "bilkent-cyberpark",
            "DataDate": tam_tarih
        }

        try:
            cevap = requests.post(API_ADRESI, json=veri)
            if cevap.status_code == 200:
                gonderilen += 1
            else:
                print(f"Gönderilemedi ({cevap.status_code}): {baslik}")
        except requests.exceptions.ConnectionError:
            print("API'ye bağlanılamadı — backend çalışıyor mu kontrol et.")
            return

    print(f"[bilkent-cyberpark] {gonderilen} kayıt API'ye gönderildi.")


if __name__ == "__main__":
    calistir()
