export const profile = {
  name: "Emre Çancıoğlu",
  roles: ["Yazılım Geliştirici.", "Dijital Dönüşüm Uzmanı.", "Serbest Çalışan."],
  title: "Yazılım Geliştirici | Dijital Dönüşüm Uzmanı.",
  shortBio:
    "Endüstriyel sistemleri IIoT, bulut bilişim ve veri analitiği gibi ileri teknolojilerle geliştirme ve optimize etme konusunda 6 yılı aşkın deneyime sahip, dinamik ve sonuç odaklı bir Kıdemli Operasyonel Teknolojiler Mühendisiyim.",
  longBio:
    "Dijital dönüşüm girişimlerine liderlik etme, operasyonel verimlilikte ölçülebilir iyileştirmeler sağlama ve modern otomasyon sistemlerinin entegrasyonu yoluyla maliyetleri azaltma konusunda uzmanım. Full-stack geliştirme (Node.js, React), bulut altyapısı (AWS, Kubernetes) ve endüstri protokolleri (OPC UA, MQTT, Kafka) konularında yetkinim. İş zekâsını yönlendirme, veri harmonizasyonu ve ölçeklenebilir çözümler oluşturma konusunda deneyimliyim. Harekete geçmeyi önceleyen güçlü bir iletişimciyim; karmaşık sorunları çözmek ve üretim performansını artırmak için teknolojiden yararlanma konusunda tutkuluyum.",
  birthday: "1995-08-10",
  website: "www.emrecancioglu.com",
  phone: "+90 536 702 43 66",
  city: "İzmir/Türkiye",
  degree: "Yüksek Lisans",
  email: "emrecancioglu7@gmail.com",
  freelance: "Müsait",
  quote: "Dünyada görmek istediğiniz değişim siz olun.",
  social: {
    linkedin: "https://www.linkedin.com/in/emrecancioglu/",
    github: "https://github.com/emrecancioglu7",
  },
  resumePdfUrl: "/pdf/Resume_EmreCANCIOGLU.pdf",
} as const;

export const skillCategories = [
  { name: "DevOps", skills: ["AWS", "Docker", "Kubernetes", "Rancher", "Terraform", "Jenkins", "NGINX", "MS IIS", "PM2", "Git"] },
  { name: "Programlama", skills: ["JavaScript", "Node.js", "Python", "PLC (Ladder Logic, Structured Text)"] },
  { name: "Front-end", skills: ["Redux", "React", "HTML5"] },
  { name: "Back-end", skills: ["Node.js", "Express.js", "Django", "REST API", "Kafka", "MS SQL", "MongoDB", "PostgreSQL"] },
  {
    name: "Aşina Olduğum Alanlar",
    skills: [
      "Bulut Bilişim",
      "Web Sunucuları ve Yük Dengeleme",
      "Olay Güdümlü Mimari",
      "İş Zekâsı",
      "Veri Analitiği",
      "Yapay Zekâ / ML",
      "Birleşik Ad Uzayı (UNS)",
      "Dijital İkiz",
      "Endüstriyel Protokoller",
      "Çevik Metodoloji",
    ],
  },
  { name: "Kişisel Beceriler", skills: ["Problem Çözme", "İşbirliği", "Proje Yönetimi", "Harekete Geçme Odaklılığı"] },
] as const;

export const awards = [
  { title: "Cevdet İnci Teşvik Ödülleri", date: "Ara 2024", place: "İzmir/TÜRKİYE", items: ["1. Sıra", "İnovasyon Özel Ödülü"] },
  { title: "İnci GS Yuasa Yıldızları", date: "Eki 2024", place: "Manisa/TÜRKİYE", items: ["1. Sıra"] },
  { title: "Cevdet İnci Teşvik Ödülleri", date: "Ara 2023", place: "İzmir/TÜRKİYE", items: ["1. Sıra"] },
] as const;

export const publications = [
  {
    title: "Ar-Ge ve İnovasyon",
    date: "Ara 2024",
    place: "Celal Bayar Üniversitesi, Manisa/TÜRKİYE",
    role: "Yazar | Araştırmacı",
    topic: "Endüstri 4.0 ve IIoT için Veri Entegrasyonu: MQTT, OPC UA ve Node.js ile Birleşik Ad Uzayı Tabanlı Dijital Dönüşüm",
    url: "https://drive.google.com/file/d/1ivfaVjw6XqgFRJAQo3pBvQmMTUhmbsgr/view?usp=sharing",
  },
  {
    title: "Kariyer Günleri",
    date: "May 2023",
    place: "Katip Çelebi Üniversitesi, İzmir/TÜRKİYE",
    role: "Konuşmacı",
    topic: "Öğrencileri Sektör Liderleriyle Buluşturarak Bilgi ve Fırsat Sağlamak",
    url: "https://drive.google.com/file/d/1ZALfm7lulleyhJFwW07I3UpTTDJ8onWq/view?usp=sharing",
  },
  {
    title: "International Conference of Applied Sciences, Engineering, and Mathematics",
    date: "Eki 2021",
    place: "International Balkan University, MAKEDONYA",
    role: "Yazar | Araştırmacı",
    topic: "Poincaré Grafiği Ölçümlerinden k-En Yakın Komşu Yöntemi Kullanılarak Süreç Kontrol Sistemlerinde Arıza Tespiti ve Teşhisi.",
    url: "https://drive.google.com/file/d/1ZPOH-EiYq5hWN7-3n2Lljo759LFpQRs1/view?usp=sharing",
  },
  {
    title: "Human-Computer Interaction Optimization and Robotic Applications",
    date: "Haz 2021",
    place: "Online, TÜRKİYE",
    role: "Yazar | Araştırmacı",
    topic: "Poincaré Grafiği Ölçümlerinden Makine Öğrenmesi Yöntemleri Kullanılarak Süreç Kontrol Sistemlerinde Arıza Tespiti ve Teşhisi.",
    url: "https://drive.google.com/file/d/1Z7KmRMDIiHNtQE6XNgA1lG3MkYo-7Zpp/view?usp=sharing",
  },
  {
    title: "International Medical Device Conference",
    date: "Eyl 2020",
    place: "Antalya, TÜRKİYE",
    role: "Yazar | Araştırmacı",
    topic: "Uzun Süreli ve Kısa Süreli Bellek Tabanlı Kalp Atış Hızı Analizi ve Sınıflandırması.",
    url: "https://drive.google.com/file/d/1ZHOTCGskb33IGZGYQ3Ekqhd1twpte5GM/view?usp=sharing",
  },
] as const;

export const certifications = [
  { title: "Kalite Yönetimi ve İyileştirme", field: "Hata Türleri ve Etkileri Analizi | İstatistiksel Süreç Kontrolü | Problem Çözme Teknikleri" },
  { title: "Veri Yönetimi ve Analizi", field: "SQL Veritabanı Yönetimi" },
  { title: "Otomasyon ve Kontrol Sistemleri", field: "S7-1200 ile PLC Programlama" },
] as const;

export const experience = [
  {
    title: "Kıdemli Operasyonel Teknolojiler (OT) Mühendisi",
    date: "Ara 2022 - Halen",
    company: "İnci GS Yuasa, Manisa/TÜRKİYE",
    bullets: [
      "ISA95 standartlarına dayalı bir Birleşik Ad Uzayı (UNS) uygulayarak üretim çevrim sürelerini kısalttı; geliştirilmiş üretim verimiyle ölçülen %19'luk bir operasyonel verimlilik artışı sağladı.",
      "OPC UA, MQTT ve Kafka ile altyapı optimizasyonu yaparak gerçek zamanlı veri akışını iyileştirdi, veri güvenilirliğinde %14'lük bir artış sağladı; bu da müşteri şikâyetlerine yanıt süresinde %90'lık bir iyileşmeye yol açtı.",
      "Kurşun-asit akü üretimi için Grafana ve Node.js ile gerçek zamanlı panolar tasarlayarak üretim anomalilerinin daha hızlı tespit edilmesini sağladı ve üretim izleme gecikmelerini %32 azalttı.",
      "OT/ICS sistemlerini modernize ederek ve otomasyon teknolojilerini entegre ederek maliyet tasarrufu sağlayan dijital dönüşüm girişimlerine liderlik etti; genel giderlerdeki düşüşle yansıyan %57'lik bir operasyonel maliyet azalması sağladı.",
    ],
  },
  {
    title: "Yazılım Geliştirme Lideri",
    date: "Oca 2022 - Kas 2022",
    company: "DVD Valves, Manisa/TÜRKİYE",
    bullets: [
      "Akıllı sulama vanaları için Node.js ve React kullanarak gömülü sistemler ve web servisi entegrasyonunu yöneten bir TEYDEB projesine ($200k fonlama) liderlik etti; raporlama ve muhasebe hizmetleri verimliliğinde %22'lik bir iyileşme sağladı.",
      "Sulama için kontrol sistemleri geliştirdi; DCS kullanarak optimize edilmiş sistem yanıt süreleriyle kanıtlanan %18'lik bir verimlilik artışı sağladı.",
    ],
  },
  {
    title: "Yazılım Geliştirme Mühendisi",
    date: "Tem 2019 - Ara 2021",
    company: "DVD Valves, Manisa/TÜRKİYE",
    bullets: [
      "Focas kütüphanesiyle IIoT sistemlerini entegre etti; gelişmiş gerçek zamanlı görünürlükle kanıtlanan %48'lik bir CNC izleme doğruluğu artışı sağladı.",
      "CNC, PLC ve web servislerinden gelen sinyalleri analiz ederek OEE analiz araçlarını optimize etti, verimliliği %12 artırdı ve makine boşta kalma sürelerini en aza indirdi.",
    ],
  },
  {
    title: "Yarı Zamanlı Yazılım Geliştirme Mühendisi",
    date: "Tem 2018 - Tem 2019",
    company: "DVD Valves, Manisa/TÜRKİYE",
    bullets: ["PLC ve HMI ile kaynak sürecini otomatikleştirerek üretim çevrimini 3x hızlandırdı; bu, kısalan çevrim süresiyle doğrulandı."],
  },
  {
    title: "Yarı Zamanlı Proje Mühendisi",
    date: "Tem 2017 - Tem 2018",
    company: "DIMES, Manisa/TÜRKİYE",
    bullets: ["PLC ve HMI ile kaynak sürecini otomatikleştirerek üretim çevrimini 3x hızlandırdı; bu, kısalan çevrim süresiyle doğrulandı."],
  },
] as const;

export const education = [
  {
    title: "Elektrik & Elektronik Mühendisliği Yüksek Lisansı",
    date: "Eyl 2019 - Haz 2022",
    school: "Katip Çelebi Üniversitesi, İzmir/TÜRKİYE",
    coursework: "İstatistiksel Süreç Kontrolü | Veri Toplama ve Kontrol | Uygulamalı Makine Öğrenmesi | Yapay Sinir Ağları.",
    thesis: "İstatistiksel Analize Dayalı Poincaré Grafiği ve Makine Öğrenmesi Kullanılarak Tennessee Eastman Sürecinin Arıza Tespiti ve Teşhisi.",
  },
  {
    title: "Elektrik & Elektronik Mühendisliği Lisansı",
    date: "Eyl 2014 - Tem 2019",
    school: "Katip Çelebi Üniversitesi, İzmir/TÜRKİYE",
    coursework: "Süreç Kontrolü ve Enstrümantasyon | Mühendislikte Optimizasyon | Endüstriyel Otomasyon | Sinyaller ve Sistemler.",
    thesis: "Programlanabilir Lojik Kontrolör Tabanlı İnsan-Makine Arayüzü Kontrollü Silindirik Kaynak ve Parlatma Makinesi Tasarımı.",
  },
] as const;

export const services = [
  {
    icon: "cloud-check",
    title: "Dijital Dönüşüm ve Operasyonel Verimlilikte Uzmanlık",
    description:
      "IIoT, bulut bilişim ve veri analitiği gibi ileri teknolojilerle endüstriyel sistemleri optimize etme konusunda geniş deneyim. Operasyonel verimliliği artırmak, maliyetleri düşürmek ve veri güvenilirliğini yükseltmek için dijital dönüşüm girişimlerine liderlik edilir. Etkili iş sonuçları elde etmek için otomasyon sistemlerinin entegrasyonu ve MQTT, OPC UA, Kafka gibi teknolojilerden yararlanma konusunda uzmanlık sağlanır.",
  },
  {
    icon: "code",
    title: "Full-Stack Geliştirme ve Bulut Altyapısında Yetkinlik",
    description:
      "Node.js, React ve Redux konusunda yetkinlikle full-stack geliştirme hizmeti sunulur. AWS, Kubernetes ve Docker kullanılarak bulut tabanlı çözümler tasarlanır ve dağıtılır. Hem endüstriyel hem de iş uygulamaları için ölçeklenebilir REST API'ler, gerçek zamanlı panolar ve olay güdümlü mimariler oluşturulur; modern endüstriyel protokoller kullanılarak sistemler birlikte çalışabilirliği ve verimliliği artıracak şekilde entegre edilir.",
  },
  {
    icon: "cpu",
    title: "Büyük Ölçekli Dijital Projelerde Liderlik",
    description:
      "Web tabanlı dijital izlenebilirlik sistemlerinin geliştirilmesinde liderlik sağlanır; bu sistemler izlenebilirliği artırır ve raporlama süresini azaltarak önemli maliyet tasarrufları sağlar. SAP S/4 HANA, Enerji Yönetim Sistemleri, PLC'ler ve IIoT cihazlarının entegrasyonu yönetilir; karmaşık, çok disiplinli projelerde güçlü liderlik ve teknik uzmanlık sergilenir.",
  },
  {
    icon: "award",
    title: "İnovasyonda Tanınmış Başarılar ve Ödüller",
    description:
      "Cevdet İnci Teşvik Ödülleri'nde 1. Sıra ve İnovasyon Özel Ödülü ile İnci GS Yuasa Yıldızları Ödülü gibi prestijli ödüller dahil olmak üzere, inovasyon ve dijital dönüşüme yaptığı önemli katkılardan dolayı tanınma kazanılmıştır. Bu başarılar, mükemmelliğe ve sektörel etkiye yönelik istikrarlı bir bağlılığı yansıtmaktadır.",
  },
  {
    icon: "book",
    title: "Araştırma ve Yayınlarda Düşünce Liderliği",
    description:
      "Birleşik ad uzayı tabanlı dijital dönüşüm, makine öğrenmesi ile arıza tespiti ve yapay zekâ destekli kalp atış hızı analizi gibi konularda araştırma katkıları sağlanır. Akademik araştırma ile sektör uygulamaları arasındaki bağlantıyı güçlendirmek amacıyla uluslararası konferanslarda ve sektör etkinliklerinde sunumlar yapılır.",
  },
  {
    icon: "server",
    title: "İleri Teknik Beceriler ve Problem Çözme Uzmanlığı",
    description:
      "DevOps araçlarında (AWS, Docker, Kubernetes, Terraform), arka uç teknolojilerinde (Node.js, Django, MongoDB) ve ön uç çatılarında (React, Redux) ileri düzey teknik uzmanlık sağlanır. Karmaşık endüstriyel ve iş sorunlarına ölçeklenebilir, yenilikçi çözümler sunmak için JavaScript, Python ve PLC alanında yetkin programlama uygulanır; işbirliği ve problem çözme kültürü desteklenir.",
  },
] as const;
