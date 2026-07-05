export const uiText = {
  en: {
    nav: {
      toggleMenu: "Toggle menu",
      lightMode: "Light Mode",
      darkMode: "Dark Mode",
      switchLanguage: "Switch language",
      links: [
        { href: "#hero", label: "Home", icon: "home" },
        { href: "#about", label: "About", icon: "user" },
        { href: "#resume", label: "Resume", icon: "file" },
        { href: "#services", label: "Services", icon: "stack" },
      ],
    },
    hero: {
      imA: "I'm a",
      resumeButton: "Resume",
    },
    about: {
      title: "About",
      description: "This section highlights my dedication to driving digital transformation and enhancing operational efficiency.",
      fields: {
        birthday: "Birthday",
        website: "Website",
        phone: "Phone",
        city: "City",
        age: "Age",
        degree: "Degree",
        email: "Email",
        freelance: "Freelance",
      },
    },
    skills: {
      title: "Skills",
      description:
        "My skills encompass a wide range of expertise in digital transformation, operational optimization, and the implementation of advanced technological solutions.",
    },
    resume: {
      title: "Resume",
      description:
        "My resume highlights my expertise in delivering impactful solutions that accelerate digital transformation and enhance operational efficiency.",
      honorsAwards: "Honors & Awards",
      presentationsPublications: "Presentations & Publications",
      certifications: "Certifications",
      professionalExperience: "Professional Experience",
      education: "Education",
      topic: "Topic",
      field: "Field",
      coursework: "Coursework",
      thesis: "Thesis",
    },
    services: {
      title: "Services",
      description:
        "In my areas of expertise, innovative and comprehensive services are provided to enhance digital transformation and operational efficiency.",
    },
    footer: {
      viewsPrefix: "Views",
      viewsError: "Couldn't read views.",
      copyright: "© Copyright | All Rights Reserved.",
      designedBy: "Designed by",
      hostedOn: "Hosted on AWS",
    },
    scrollTop: "Scroll to top",
  },
  tr: {
    nav: {
      toggleMenu: "Menüyü aç/kapat",
      lightMode: "Açık Mod",
      darkMode: "Koyu Mod",
      switchLanguage: "Dili değiştir",
      links: [
        { href: "#hero", label: "Ana Sayfa", icon: "home" },
        { href: "#about", label: "Hakkımda", icon: "user" },
        { href: "#resume", label: "Özgeçmiş", icon: "file" },
        { href: "#services", label: "Hizmetler", icon: "stack" },
      ],
    },
    hero: {
      imA: "Ben bir",
      resumeButton: "Özgeçmiş",
    },
    about: {
      title: "Hakkımda",
      description: "Bu bölüm, dijital dönüşümü ilerletme ve operasyonel verimliliği artırma konusundaki adanmışlığımı öne çıkarıyor.",
      fields: {
        birthday: "Doğum Tarihi",
        website: "Web Sitesi",
        phone: "Telefon",
        city: "Şehir",
        age: "Yaş",
        degree: "Derece",
        email: "E-posta",
        freelance: "Serbest Çalışma",
      },
    },
    skills: {
      title: "Beceriler",
      description:
        "Becerilerim; dijital dönüşüm, operasyonel optimizasyon ve ileri teknolojik çözümlerin hayata geçirilmesi konularında geniş bir uzmanlık yelpazesini kapsıyor.",
    },
    resume: {
      title: "Özgeçmiş",
      description:
        "Özgeçmişim, dijital dönüşümü hızlandıran ve operasyonel verimliliği artıran etkili çözümler sunma konusundaki uzmanlığımı öne çıkarıyor.",
      honorsAwards: "Ödüller",
      presentationsPublications: "Sunumlar & Yayınlar",
      certifications: "Sertifikalar",
      professionalExperience: "Profesyonel Deneyim",
      education: "Eğitim",
      topic: "Konu",
      field: "Alan",
      coursework: "Ders İçeriği",
      thesis: "Tez",
    },
    services: {
      title: "Hizmetler",
      description:
        "Uzmanlık alanlarımda, dijital dönüşümü ve operasyonel verimliliği artırmak için yenilikçi ve kapsamlı hizmetler sunuyorum.",
    },
    footer: {
      viewsPrefix: "Görüntülenme",
      viewsError: "Görüntülenme sayısı okunamadı.",
      copyright: "© Telif Hakkı | Tüm Hakları Saklıdır.",
      designedBy: "Tasarım",
      hostedOn: "AWS üzerinde barındırılıyor",
    },
    scrollTop: "Yukarı çık",
  },
} as const;

export type UiText = (typeof uiText)["en"];
