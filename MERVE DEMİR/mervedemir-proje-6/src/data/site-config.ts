// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Site Configuration — Tüm içerikler buradan düzenlenebilir
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const siteConfig = {
  // ── SEO & Meta ──────────────────────────────────
  meta: {
    title: "Merve Demir | Yapay Zeka Operatörü — Portföy",
    description:
      "Merve Demir'in kişisel portföy sitesi. Yapay zeka, veri bilimi, makine öğrenmesi ve yaratıcı dijital deneyimler üzerine projeler.",
    lang: "tr",
  },

  // ── Navbar ──────────────────────────────────────
  navbar: {
    logo: {
      name: "M.Demir",
      subtitle: "Yapay Zeka Operatörü",
    },
    links: [
      { label: "Ana Sayfa", href: "#hero" },
      { label: "Hakkımda", href: "#hakkimda" },
      { label: "Projeler", href: "#projeler" },
      { label: "Yetenekler", href: "#yetenekler" },
      { label: "Deneyim", href: "#deneyim" },
      { label: "İletişim", href: "#iletisim" },
    ],
    cta: {
      label: "Bana Ulaş",
      href: "#iletisim",
    },
  },

  // ── Hero Section ────────────────────────────────
  hero: {
    greeting: "Hoş Geldin,",
    prefix: "Ben",
    name: "Merve Demir",
    subtitle: "Yapay Zeka Operatörü",
    description:
      "Yapay zeka, veri bilimi ve yazılım geliştirme alanlarında çalışan; estetik, teknoloji ve anlamı bir araya getiren dijital deneyimler üretiyorum.",
    buttons: {
      primary: {
        label: "Projelerimi İncele",
        href: "#projeler",
      },
      secondary: {
        label: "Benim Hakkımda",
        href: "#hakkimda",
      },
    },
    video: {
      src: "/videos/hero-bg.mp4",
      poster: "/images/hero-bg.png",
    },
  },

  // ── About Section ───────────────────────────────
  about: {
    eyebrow: "Hakkımda",
    title: "Yapay zeka, veri ve tasarımı aynı hikayede buluşturuyorum.",
    description:
      "Ben Merve Demir. Yapay zeka, makine öğrenmesi, veri bilimi ve yaratıcı dijital arayüzler üzerine projeler geliştiriyorum. Amacım yalnızca çalışan sistemler üretmek değil; aynı zamanda estetik, anlaşılır ve kullanıcıya değer katan deneyimler tasarlamak.",
    highlights: [
      "Yapay zeka destekli uygulamalar",
      "Makine öğrenmesi ve veri analizi",
      "Kişisel portföy ve yaratıcı web arayüzleri",
      "Araştırma, modelleme ve proje dokümantasyonu",
    ],
  },

  // ── Projects Section ────────────────────────────
  projects: [
    {
      title: "Kitap Büyücüsü",
      category: "Yapay Zeka Destekli Hikaye Deneyimi",
      description:
        "Eski bir kitabın sayfalarından farklı dünyalara açılan, kullanıcıyı büyülü ve etkileşimli bir hikaye yolculuğuna çıkaran yapay zeka destekli anlatı projesi.",
      longDescription:
        "Kütüphane, eski kitap, ışınlanma ve farklı dönemlere geçiş fikri üzerine kurulan bu proje; kullanıcıya kişiselleştirilmiş, büyülü ve görsel olarak güçlü bir hikaye deneyimi sunmayı hedefler.",
      tags: ["Yapay Zeka", "Hikaye", "Etkileşimli Deneyim", "Prompt"],
      featured: true,
    },
    {
      title: "Communities & Crime Suç Oranı Tahminleme Modeli",
      category: "Makine Öğrenmesi / Veri Bilimi",
      description:
        "UCI Communities and Crime veri seti kullanılarak demografik ve sosyo-ekonomik değişkenlerden mahallelerin suç riski seviyesini tahmin eden makine öğrenmesi modeli.",
      longDescription:
        "Projede eksik veri temizleme, ortalama ile doldurma, standartlaştırma, PCA, LDA, SVM, GridSearchCV ve 5-Fold Cross Validation adımları kullanılarak veri sızıntısını önleyen pipeline mimarisiyle modelleme yapılmıştır.",
      tags: ["Python", "SVM", "PCA", "LDA", "GridSearchCV"],
      featured: true,
    },
    {
      title: "Galaxy Bus",
      category: "Yapay Zeka Destekli Uzay Lojistiği",
      description:
        "Gezegenler arası yardım ağı fikriyle geliştirilen; kriz analizi, sinyal gecikmesi yönetimi ve otonom uzay lojistiği üzerine kurgulanan fütüristik platform.",
      longDescription:
        "GALAXY BUS, 2165 yılında gezegenler arası sinyal gecikmesini aşmak için tasarlanmış; Google Gemini AI ile kriz analizi yapan ve Firebase ile gerçek zamanlı veri akışı sağlayan bir uzay lojistiği ve acil durum yönetimi konseptidir.",
      tags: ["Gemini AI", "Firebase", "Uzay Lojistiği", "Kriz Yönetimi"],
      featured: true,
    },
    {
      title: "Akademisyen Rehberi",
      category: "AI Akademik Asistan",
      description:
        "Literatür taraması, makale özetleme, kaynak yönetimi ve araştırma planlama süreçlerini destekleyen yapay zeka tabanlı akademik yardımcı.",
      longDescription:
        "Akademik süreçleri hızlandırmak için araştırmacılara kaynak düzenleme, özet çıkarma, literatür planlama ve çalışma akışı oluşturma konularında yardımcı olan yapay zeka destekli asistan fikridir.",
      tags: ["Yapay Zeka", "Akademik Araştırma", "Özetleme", "Kaynak Yönetimi"],
      featured: false,
    },
    {
      title: "Kişisel Web Sitesi Tasarımı",
      category: "Portfolio / UI Tasarım",
      description:
        "Yeşil tonlarda, büyülü orman atmosferinde, premium ve sinematik görünüme sahip kişisel portföy web sitesi tasarımı.",
      longDescription:
        "Next.js tabanlı, video arka planlı, cam efektli navbar, büyülü orman atmosferi, ateş böcekleri, sis, ışık huzmeleri ve premium serif tipografiyle hazırlanan kişisel marka arayüzü.",
      tags: ["Next.js", "React", "UI Design", "Animasyon"],
      featured: false,
    },
  ],

  // ── Skills Section ──────────────────────────────
  skills: [
    "Yapay Zeka",
    "Makine Öğrenmesi",
    "Derin Öğrenme",
    "Veri Bilimi",
    "Python",
    "React",
    "Next.js",
    "Firebase",
    "Prompt Engineering",
    "UI Tasarım",
  ],

  // ── Experience Section ──────────────────────────
  experience: [
    {
      title: "Yapay Zeka Operatörü",
      description:
        "Yapay zeka araçlarını kullanarak yaratıcı içerikler, veri odaklı projeler, arayüz fikirleri ve otomasyon çözümleri üretme.",
    },
    {
      title: "Veri Bilimi ve Makine Öğrenmesi",
      description:
        "Veri ön işleme, modelleme, boyut indirgeme, model optimizasyonu ve performans değerlendirme süreçleriyle proje geliştirme.",
    },
    {
      title: "Yaratıcı Web Tasarımı",
      description:
        "Kişisel marka, portföy arayüzü, görsel atmosfer, animasyon ve kullanıcı deneyimi odaklı modern web tasarımları oluşturma.",
    },
  ],

  // ── Contact Section ─────────────────────────────
  contact: {
    title: "Birlikte çalışalım.",
    description:
      "Yapay zeka, veri bilimi, yaratıcı web tasarımı veya portföy projeleri için benimle iletişime geçebilirsin.",
    email: "",
    buttonLabel: "Mesaj Gönder",
  },

  // ── Social Bar ──────────────────────────────────
  social: [
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/merve-demir-241722404/",
      icon: "linkedin",
    },
    {
      name: "GitHub",
      href: "https://github.com/mdmerinos",
      icon: "github",
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/mervedmrdemir/",
      icon: "instagram",
    },
    {
      name: "Email",
      href: "mervedmrdemir42@gmail.com",
      icon: "email",
    },
  ],

  // ── Scroll Indicator ────────────────────────────
  scrollIndicator: {
    text: "Aşağı Kaydır",
  },
} as const;

export type SiteConfig = typeof siteConfig;