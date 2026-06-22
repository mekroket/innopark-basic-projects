# 🚀 InnoPark Stajyer Geliştirici Havuzu

Bu depo (repository), stajyerlerin staj dönemi boyunca geliştireceği tüm projeleri, teknik ödevleri ve çalışmaları tek bir merkezi sistemde toplamak amacıyla oluşturulmuştur. Staj süresince üretilen tüm kaynak kodlar bu havuz altında arşivlenecektir.

## 📂 Klasör Yapısı ve Düzen

Deponun düzenini korumak ve projelerin karışmasını engellemek adına **her stajyerin kendi adına bir ana klasörü bulunmalıdır.** Geliştirilen projeler, bu kişisel klasörlerin altında projenin amacına uygun alt klasörler açılarak yüklenmelidir.

Takip edilmesi gereken klasör hiyerarşisi:

```text
innopark-basic-projects/
├── .gitignore
├── README.md
├── [adiniz-soyadiniz]/            <-- Kişisel ana klasörünüz (Örn: ahmet-yilmaz)
│   ├── proje-1-tanisma/           <-- Proje / Ödev klasörü
│   │   ├── index.html
│   │   └── style.css
│   └── proje-2-backend-api/
│       ├── server.js
│       └── package.json
└── [diger-stajyer-klasoru]/
⚠️ Temel Çalışma Kuralları
🚫 Doğrudan main Dalına Push Yapmak Yasaktır: Tüm kod geliştirmeleri ve dosya eklemeleri kişisel branch'ler (dallar) üzerinden ilerlemelidir. main dalına doğrudan atılan push'lar engellenecektir.

🤖 Yapay Zeka Politikası: Aksi belirtilmediği sürece, temel programlama mantığının ve problem çözme yeteneğinin gelişmesi adına hazır AI kod asistanlarının kullanımı yasaktır. Çözümler için resmi dokümantasyonlar ve Stack Overflow gibi teknik platformlar kaynak alınmalıdır.

📝 Commit Mesaj Standartları: Kod değişiklikleri kaydedilirken açıklayıcı ifadeler kullanılmalıdır. (Örn: git commit -m "feat: login ekranı arayüzü tamamlandı").

👨‍💻 Git İş Akışı ve Kod Yükleme Adımları
Projelerinizi depoya güvenli bir şekilde eklemek için aşağıdaki adımları sırasıyla uygulayınız:

1. Depoyu Bilgisayarınıza Klonlayın (İlk Seferde)
Bash
git clone [https://github.com/mekroket/innopark-basic-projects.git](https://github.com/mekroket/innopark-basic-projects.git)
cd innopark-basic-projects
2. Güncel Kodu Çekin (Her Yeni Çalışmaya Başladığınızda)
Kendi yerel ortamınızın güncel kalması için çalışmaya başlamadan önce ana daldaki kodları çekin:

Bash
git checkout main
git pull origin main
3. Yeni Bir Çalışma Dalı (Branch) Oluşturun
Yapacağınız çalışma için kendi adınızı içeren yeni bir dal açın ve o dala geçiş yapın:

Bash
git checkout -b feature/adiniz-proje-adi
4. Kodunuzu Kendi Klasörünüze Ekleyin
Geliştirdiğiniz projeyi, yalnızca size ait olan [adiniz-soyadiniz] klasörünün altında oluşturduğunuz alt klasöre ekleyin. Diğer klasörlere müdahale etmeyiniz.

5. Değişiklikleri Kaydedin (Commit)
Bash
git add .
git commit -m "feat: [proje-adi] geliştirmeleri tamamlandı"
6. Dalınızı GitHub'a Gönderin (Push)
Bash
git push origin feature/adiniz-proje-adi
7. Pull Request (PR) Oluşturun
GitHub web arayüzü üzerinden main dalına bir Pull Request gönderin. Gönderilen kodlar incelendikten sonra onaylanarak ana projeye dahil edilecektir.
