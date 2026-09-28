export const profile = {
  name: "Emre Çancıoğlu",
  roles: ["Dijitalleşme ve Yapay Zeka Ekip Lideri.", "Endüstriyel Otomasyon Uzmanı.", "Yazılım Geliştirici."],
  title: "Dijitalleşme ve Yapay Zeka Ekip Lideri | Endüstriyel Otomasyon.",
  shortBio:
    "Endüstriyel üretim sahasında dijital dönüşüm ve uygulamalı yapay zeka girişimlerine liderlik eden, 9 yılı aşkın deneyime sahip sonuç odaklı bir Dijitalleşme ve Yapay Zeka Ekip Lideriyim; şu anda 3 üretim tesisinde OT dijitalleşmesi ve yapay zeka stratejisini yürütüyorum.",
  longBio:
    "2 kişilik bir mühendislik ekibini yönetiyor, 10'dan fazla fonksiyon/departmanla koordinasyon sağlıyor ve şirket çapındaki AI Elçileri programına liderlik ediyorum. Kestirimci bakım, bilgisayarlı görü tabanlı güvenlik sistemleri (uygulandığı alanlarda 4 yıl kesintisiz sıfır iş kazası), GenAI destekli otomasyon ve enerji & sürdürülebilirlik analitiği ile ölçülebilir etki sağlıyorum. PLC, SCADA ve endüstriyel protokoller (OPC UA, MQTT, Profinet) konusundaki derin uygulamalı uzmanlığımı güçlü yazılım/bulut ve liderlik yetkinlikleriyle (Node.js, React, Azure/AWS, Kubernetes) dengeliyorum. İnci Holding grup şirketleri çapında çoklu birincilik ve bir İnovasyon Özel Ödülü kazandım; uygulamalı makine öğrenmesi ve endüstriyel otomasyon alanında 4 bilimsel yayınım bulunuyor.",
  birthday: "1995-08-10",
  website: "emrecancioglu.com",
  phone: "+90 536 702 43 66",
  city: "İzmir/Türkiye",
  degree: "Yüksek Lisans",
  email: "emrecancioglu7@gmail.com",
  freelance: "Müsait",
  quote: "Dünyada görmek istediğiniz değişim siz olun.",
  social: {
    linkedin: "https://www.linkedin.com/in/emrecancioglu/",
    github: "https://github.com/emrecancioglu7",
    orcid: "https://orcid.org/0000-0002-9918-4668",
  },
  resumePdfUrl: "/pdf/Resume_EmreCANCIOGLU_TR.pdf",
} as const;

export const seo = {
  title: "Emre Çancıoğlu | Dijitalleşme ve Yapay Zeka Ekip Lideri",
  description:
    "Endüstriyel otomasyonda 9+ yıl: 3 üretim tesisinde OT dijitalleşmesi, kestirimci bakım, bilgisayarlı görü ile iş güvenliği ve GenAI otomasyonu yöneten ekip lideri.",
  locale: "tr_TR",
  ogImage: "/og/og-tr.png",
  ogImageAlt: "Emre Çancıoğlu — Dijitalleşme ve Yapay Zeka Ekip Lideri, Endüstriyel Otomasyon",
  employer: "İnci GS Yuasa",
  university: "İzmir Katip Çelebi Üniversitesi",
  country: "Türkiye",
} as const;

export const highlights = [
  { metric: "9+", label: "Yıl Deneyim" },
  { metric: "3", label: "Tesis" },
  { metric: "2", label: "Kişilik Ekip" },
  { metric: "%57", label: "Maliyet Azaltımı" },
  { metric: "4", label: "Yayın" },
  { metric: "6", label: "Ödül" },
] as const;

export const skillCategories = [
  {
    name: "OT Sistemleri",
    skills: [
      "PLC (Siemens, Allen-Bradley, Mitsubishi)",
      "SCADA",
      "DCS",
      "HMI",
      "MES",
      "OPC UA",
      "MQTT",
      "Modbus (TCP/RTU)",
      "Profinet",
      "EtherNet/IP",
      "CC-Link",
      "Kepware",
      "Unified Namespace",
      "Digital Twin",
      "ISA-95",
      "NAT",
      "VLAN Segmentasyonu",
      "Endüstriyel Firewall",
      "IEC 62443",
    ],
  },
  {
    name: "YZ & Veri",
    skills: [
      "Kestirimci Bakım",
      "Bilgisayarlı Görü",
      "Makine Öğrenmesi",
      "Derin Öğrenme",
      "GenAI/LLM Otomasyonu (RAG, n8n, Copilot, GPT, Claude)",
      "MLOps",
      "Edge Computing",
      "ETL/Stream Processing",
      "SPC",
      "Grafana",
      "Power BI",
      "Veri Analitiği",
    ],
  },
  { name: "Liderlik", skills: ["Ekip Liderliği & Mentorluk", "Fonksiyonlar Arası İşbirliği", "Proje & Bütçe Yönetimi", "Aksiyon Odaklılık"] },
  {
    name: "DevOps",
    skills: ["Azure", "AWS", "Docker", "Kubernetes", "Rancher", "Terraform", "Jenkins", "GitHub Actions", "NGINX", "MS IIS", "PM2", "Git"],
  },
  {
    name: "Yazılım",
    skills: [
      "Node.js",
      "Express.js",
      "Django",
      "FastAPI",
      "REST API",
      "Kafka",
      "React",
      "Redux",
      "JavaScript",
      "TypeScript",
      "Python",
      "MS SQL",
      "MongoDB",
      "PostgreSQL",
      "DynamoDB",
      "Elasticsearch",
    ],
  },
  { name: "Diller", skills: ["Türkçe (Anadil)", "İngilizce (Profesyonel)"] },
] as const;

export const awardsNote = "Cevdet İnci Teşvik Ödülleri, İnci Holding çapında (5 firma, 9+ fabrika) düzenlenir; İnci GS Yuasa Stars şirkete özeldir.";

export const awards = [
  { title: "Sustainability Business Awards", date: "2025", place: "İstanbul/TÜRKİYE", items: ["Finalist (Teknoloji & Yapay Zeka Kategorisi)"] },
  { title: "Cevdet İnci Teşvik Ödülleri", date: "2025", place: "İzmir/TÜRKİYE", items: ["Birincilik"] },
  { title: "İnci GS Yuasa Stars", date: "2025", place: "Manisa/TÜRKİYE", items: ["Üçüncülük"] },
  { title: "Cevdet İnci Teşvik Ödülleri", date: "2024", place: "İzmir/TÜRKİYE", items: ["Birincilik", "İnovasyon Özel Ödülü"] },
  { title: "İnci GS Yuasa Stars", date: "2024", place: "Manisa/TÜRKİYE", items: ["Birincilik"] },
  { title: "Cevdet İnci Teşvik Ödülleri", date: "2023", place: "İzmir/TÜRKİYE", items: ["Birincilik"] },
] as const;

export const publications = [
  {
    title: "13th International European Conference on Interdisciplinary Scientific Research",
    date: "May 2026",
    place: "Tiran, ARNAVUTLUK",
    role: "Yazar | Araştırmacı",
    topic:
      "Akü üretim hatlarında elektrik ve basınçlı hava tüketimini tahminleyen ML regresyon modelleri (XGBoost, LightGBM, GBM); kısa vadeli tahminlerde R² değeri 0.944'e kadar.",
  },
  {
    title: "R&D & Innovation 2024",
    date: "Ara 2024",
    place: "Manisa, TÜRKİYE",
    role: "Yazar | Araştırmacı",
    topic: "Endüstri 4.0 ve IIoT için Veri Entegrasyonu: MQTT, OPC UA ve Node.js ile Unified Namespace Tabanlı Dijital Dönüşüm.",
    url: "https://drive.google.com/file/d/1ivfaVjw6XqgFRJAQo3pBvQmMTUhmbsgr/view?usp=sharing",
  },
  {
    title: "Human-Computer Interaction Optimization and Robotic Applications",
    date: "Haz 2021",
    place: "TÜRKİYE",
    role: "Yazar | Araştırmacı",
    topic:
      "Poincaré Grafiği ölçümlerinden Makine Öğrenmesi (topluluk öğrenmesi) yöntemleriyle proses kontrol sistemlerinde hata tespiti ve teşhisi; Tennessee Eastman Sürecinde sınıflandırma doğruluğu %89,5.",
    url: "https://drive.google.com/file/d/1Z7KmRMDIiHNtQE6XNgA1lG3MkYo-7Zpp/view?usp=sharing",
  },
  {
    title: "International Medical Device Conference",
    date: "Eyl 2020",
    place: "Antalya, TÜRKİYE",
    role: "Yazar | Araştırmacı",
    topic:
      "Uzun-Kısa Vadeli Bellek (LSTM) Tabanlı Kalp Sesi Analizi ve Sınıflandırması: fonokardiyogram kayıtlarını Normal, Hırıltılı, Ekstrasistol ve Yapay kategorilerine %79,0 doğrulukla sınıflandıran bir LSTM modeli (Akıllı Sistemler ve Uygulamaları Dergisi, Cilt 3(1), 2020).",
    url: "https://drive.google.com/file/d/1ZHOTCGskb33IGZGYQ3Ekqhd1twpte5GM/view?usp=sharing",
  },
] as const;

export const certifications = [
  { title: '"Geleceği Sahipleniyoruz" Ciddi Oyunlar™ İle Geleceği Sahiplenen İnovasyon Projeleri', issuer: "41 North Business School", date: "Tem 2026" },
  { title: '"Geleceği Sahipleniyoruz" Blackbox Business Challenge™', issuer: "41 North Business School", date: "Haz 2026" },
  { title: "ISO 9001:2015 & IATF 16949:2016 Eğitimi", issuer: "KALMER Kalite Yönetim Merkezi", date: "Şub 2023" },
  { title: "ISO 9001:2015, ISO 14001:2015, ISO 45001:2018", issuer: "N-Sistem", date: "Kas 2021" },
  { title: "Hidrolik-Pnömatik Geliştirme ve Uyum Eğitimi (64 saat)", issuer: "Manisa Yunusemre Halk Eğitim Merkezi", date: "Şub 2020" },
  { title: "Veri Tabanı Yönetimi – SQL Geliştirme ve Uyum Eğitimi (56 saat)", issuer: "Manisa Yunusemre Halk Eğitim Merkezi", date: "Ara 2019" },
  { title: "Bilgisayar Destekli Proje Çizimi (AutoCAD) (160 saat)", issuer: "İzmir Halk Eğitim Merkezi", date: "Ara 2017" },
  { title: "Programlanabilir Lojik Kontrol (PLC) (296 saat)", issuer: "İzmir Halk Eğitim Merkezi", date: "Ara 2017" },
] as const;

export const experience = [
  {
    title: "Dijitalleşme ve Yapay Zeka Ekip Lideri",
    date: "Oca 2026 - Devam Ediyor",
    company: "İnci GS Yuasa / İnci Akü, Manisa/TÜRKİYE",
    bullets: [
      "3 üretim tesisinde OT dijitalleşmesi ve uygulamalı yapay zeka stratejisine liderlik ediyor; 2 kişilik bir mühendislik ekibini yönetiyor ve 10'dan fazla fonksiyon/departmanla koordinasyon sağlıyor. Göreve başladığından bu yana 15+ süreç iyileştirme projesi teslim etti.",
      "OT veri entegrasyon altyapısını PLC, SCADA, MES ve historian sistemleri genelinde 300+ yönetilen veri kanalı ve veritabanı bağlantısına büyüttü (önceki seviyenin yaklaşık 1,5 katı) — 2026 yılında 36 yeni üretim hattı/makine (fırınlar, değirmenler, montaj, dolum ve kaynak istasyonları) entegre etti, yılın %20 bağlantı hedefini aşarak tesis genelinde %25,76 makine kapsamına ulaştı ve herhangi bir kullanıcının tüm bağlı makineler için gerçek zamanlı özel alarmlar yapılandırabildiği, kendi kendine hizmet veren OPC UA tabanlı bir uyarı platformu kurdu.",
      "Uygulamalı yapay zeka portföyünü 4 aktif kestirimci bakım/kalite modeline ve 25 yapay zeka destekli otomasyon projesine büyüttü; günlerce süren raporlama döngülerini saniyelere indiren RAG tabanlı bilgi sistemleri ile GenAI/çoklu ajan iş akışları (n8n, Microsoft Copilot, GPT, Claude) dahil; tüm departmanların kendi yapay zeka ajanlarını oluşturmasını sağlayan AI Elçileri programını yürütüyor.",
      "Kurşun tozu maruziyeti yüksek alanlarda gerçek zamanlı hava kalitesi/partikül izlemesi kurarak çalışanların kandaki kurşun seviyesinin %58,62 oranında azaltılmasına katkı sağladı; ayrıca potansiyel bir yangın olayını önlemeye yardımcı olan gerçek zamanlı anomali tespiti devreye aldı.",
      "YOLO tabanlı iki bilgisayarlı görü güvenlik modeli entegre etti: robot çalışma alanına insan girdiğinde robotu otomatik durduran AI-ODS ve kör noktalarda forklift-yaya ile forklift-forklift çarpışmalarını gerçek zamanlı ışık projeksiyonu uyarılarıyla önleyen AI-FDS — uygulandığı alanlarda 4 yıl kesintisiz sıfır iş kazası sağlandı.",
      "200+ elektrik, su ve doğal gaz sayacını uzaktan okumalı sayaçlara çevirdi, altyapı veritabanını kurdu ve makine bazlı enerji tüketimini, birim ürün başına enerji tüketimini ve karbon ayak izini görselleştiren bir enerji dashboard'u geliştirdi — SAP ile entegre ederek tesisi ISO 50001 sertifikasyonuna hazırladı.",
      "Kompresör basınç verisi, MES'ten gelen anlık üretim bilgisi ve SAP'den makine bazlı üretim teyit verilerini birleştiren bir hava kaçağı anomali tespit algoritması geliştirdi; erken müdahale ile kompresör enerji tüketimini azalttı.",
      "Planlanan üretim miktarlarına dayalı ML tabanlı enerji tahminlemesi ekledi (XGBoost, LightGBM, GBM regresyonu, R² değeri 0.944'e kadar); bu çalışma 13. Uluslararası Avrupa Disiplinlerarası Bilimsel Araştırmalar Konferansı'nda hakemli araştırma olarak yayınlandı (Tiran, Arnavutluk, Mayıs 2026).",
    ],
  },
  {
    title: "Kıdemli Operasyonel Teknolojiler (OT) Mühendisi",
    date: "Ara 2022 - Ara 2025",
    company: "İnci GS Yuasa / İnci Akü, Manisa/TÜRKİYE",
    bullets: [
      "SAP, MES ve PLC/SCADA/DCS tabanlı saha ekipmanlarını — OPC UA, MQTT, Kafka, Profinet, EtherNet/IP ve CC-Link üzerinden — enerji analizörleri ve üçüncü parti sistemlerle birleştiren bir Unified Namespace (UNS) mimarisi kurarak fabrikanın dijital ikizini oluşturdu; 20 kişilik bir ekibe liderlik ederek her akünün hammaddeden sevkiyata kadar tüm süreç ve test verilerini izlenebilir hale getirdi.",
      "OT ağ mimarisinin tasarım ve devreye alma sürecine liderlik etti; VLAN segmentasyonu, NAT ve endüstriyel firewall'lar üzerinde üretim sürekliliğini ve veri güvenliğini sağlamak için ISA-95/Purdue modeli ve IEC 62443 uyumlu 80+ yapılandırılmış siber güvenlik ve felaket kurtarma işlemi yürüttü.",
      "3 fabrikada 46 veri kanalı ve 156 veritabanından (MS SQL, MongoDB, PostgreSQL) oluşan altyapıyı özel bir Node.js/React/Redux/TypeScript yazılım yığını ve ETL/stream-processing hatlarıyla kurarak tamamen manuel olan saha iş akışlarını otonomlaştırdı; operasyonel verimliliği %19, veri güvenilirliğini %14 artırdı ve OEM/AFM müşterilerinin veri isteklerine yanıt süresini %90 iyileştirdi.",
      "Gerçek zamanlı makine verisi, birim ürün bazlı test sonuçları ve SPC tabanlı anomali uyarılarını gösteren Power BI raporları ve özel dashboard'larla uçtan uca izlenebilirlik sağladı — fabrikanın dijital ikizini güçlendirdi ve Digital Product Passport'unu besledi; raporlama süresini %60 hızlandırdı, yıllık $156K tasarruf sağladı.",
    ],
  },
  {
    title: "Yazılım Geliştirme / Otomasyon Lideri",
    date: "Oca 2022 - Kas 2022",
    company: "Doğuş Vana, Manisa/TÜRKİYE",
    bullets: [
      "İtalya (8 adet Ø700mm), Dubai (2 adet Ø1400/Ø1500mm) ve Kolombiya (2 adet Ø700mm) için PLC kontrollü, Modbus TCP haberleşmeli bir SCADA sistemiyle hidrolik kelebek vana kontrolü geliştirdi; FAT/SAT testlerini tamamladı. Sistemi dışarıdan tedarik etmek yerine kurum içinde geliştirerek maliyetleri %30 azalttı (~1,5 milyon ₺ tasarruf).",
      "TÜBİTAK TEYDEB 1501'in ~3,5M ₺ bütçesinden sorumlu proje yürütücüsü olarak 3 kişilik çekirdek ekibi yönetti (farklı departmanlardan katkıyla 9+ kişilik ekibi koordine etti); akıllı sulama hidrantı sisteminin ön yükleme ve ultrasonik sayaç modülleri için gömülü yazılım ile masaüstü/mobil uygulamalar geliştirdi, dışarıdan tedarik edilen çözüme kıyasla birim maliyeti ~%68 azalttı ve satış sonrası teknik desteği tamamen şirket içine taşıdı.",
      "TÜBİTAK 2209-B akıllı tarımsal vana projesi (No: 119B412103138) kapsamında sanayi danışmanlığı yaparak sayaçlara LoRa tabanlı uzaktan okuma özelliği kazandırdı.",
    ],
  },
  {
    title: "Yazılım Geliştirme / Otomasyon Mühendisi",
    date: "Tem 2018 - Ara 2021",
    company: "Doğuş Vana, Manisa/TÜRKİYE",
    bullets: [
      "PLC/HMI kontrollü iki otonom kaynak robotu tasarladı; sızdırmazlık açısından kritik bir bölgede sağlam ve kaliteli bir kaynak süreci sağladı, kaynak döngü süresini %60 kısaltıp sızdırmazlık kaynaklı kalite hatalarını %23 azalttı.",
      "Focas kütüphanesi ile CNC tezgahlarında, OPC UA ile PLC tabanlı makinelerde gerçek zamanlı izleme yaptı; REST API tabanlı veri toplama ve tarihsel veri tutma altyapısını kurdu.",
      "Üretim sahasındaki 10+ makinenin (blower test sistemi, MS SQL uygulamalı sızdırmazlık test ünitesi, kauçuk pres, boy tamamlama, polisaj robotu, testere, radyal matkap, kumlama vb.) eski, manuel panolarını yeniledi ve PLC yazılımlarını revize ederek otomasyon seviyelerini artırdı.",
      "MES ve ERP entegrasyonu ile üretim ve bakım süreçlerinin gerçek zamanlı, departmanlar arası takibini sağladı.",
    ],
  },
  {
    title: "Yarı Zamanlı Proje Mühendisi",
    date: "Tem 2017 - Haz 2018",
    company: "DİMES, İzmir/TÜRKİYE",
    bullets: [
      "PET şişe üretim hattını tamamen manuel kontrolden tam otonom bir konveyör sistemine dönüştürdü; PLC tabanlı kontrol panosunu tasarladı.",
      "Karıştırma tankları için PLC-SCADA yazılımı geliştirerek tam izlenebilirlik sağladı, raporlama ve kalite süreçlerini dijitalleştirdi; kalite sapmalarının daha hızlı tespit ve kök neden analizini mümkün kıldı.",
    ],
  },
] as const;

export const education = [
  {
    title: "Elektrik-Elektronik Mühendisliği Yüksek Lisans",
    date: "Eyl 2019 - Haz 2022",
    school: "İzmir Katip Çelebi Üniversitesi, İzmir/TÜRKİYE",
    gpa: "4.00 üzerinden 3,64 (%100 İngilizce Bölüm)",
    coursework: "İstatistiksel Proses Kontrol | Veri Toplama ve Kontrol | Uygulamalı Makine Öğrenmesi | Yapay Sinir Ağları.",
    thesis: "Poincaré Grafiği ve İstatistiksel Analize Dayalı ML ile Tennessee Eastman Sürecinin Hata Tespiti ve Teşhisi.",
  },
  {
    title: "Elektrik-Elektronik Mühendisliği Lisans",
    date: "Eyl 2014 - Tem 2019",
    school: "İzmir Katip Çelebi Üniversitesi, İzmir/TÜRKİYE",
    gpa: "4.00 üzerinden 3,14 (%100 İngilizce Bölüm)",
    coursework: "Proses Kontrol ve Enstrümantasyon | Mühendislikte Optimizasyon | Endüstriyel Otomasyon | Sinyaller ve Sistemler.",
    thesis: "PLC Tabanlı İnsan-Makine Arayüzü Kontrolü ile Silindirik Kaynak ve Parlatma Makinesi Tasarımı.",
  },
] as const;

export const services = [
  {
    icon: "cpu",
    title: "OT Dijitalleşmesi ve Unified Namespace",
    description:
      "PLC, SCADA, MES, historian ve SAP sistemleri arasında OPC UA, MQTT, Kafka, Profinet, EtherNet/IP ve CC-Link üzerinden uçtan uca OT veri entegrasyonu. Tam süreç ve test izlenebilirliği sağlayan Unified Namespace mimarileri ve dijital ikizler; ISA-95/Purdue ve IEC 62443 uyumlu güvenli OT ağlarıyla desteklenir.",
  },
  {
    icon: "cloud-check",
    title: "Uygulamalı Yapay Zeka ve GenAI Otomasyonu",
    description:
      "Kestirimci bakım ve kalite modelleri, RAG tabanlı bilgi sistemleri ve günlerce süren raporlama döngülerini saniyelere indiren GenAI/çoklu ajan iş akışları (n8n, Microsoft Copilot, GPT, Claude). Her departmanın kendi yapay zeka ajanını oluşturduğu şirket çapındaki AI Elçileri programına liderlik.",
  },
  {
    icon: "server",
    title: "İş Güvenliği için Bilgisayarlı Görü",
    description:
      "Robot çalışma alanına insan girdiğinde otomatik duruş ve kör noktalarda forklift çarpışmalarına karşı ışık projeksiyonu uyarıları gibi YOLO tabanlı güvenlik sistemleri — uygulandığı alanlarda 4 yıl kesintisiz sıfır iş kazasına katkı; gerçek zamanlı hava kalitesi ve anomali izleme ile birlikte.",
  },
  {
    icon: "book",
    title: "Enerji ve Sürdürülebilirlik Analitiği",
    description:
      "Uzaktan okumalı sayaç dönüşümleri, birim ürün başına tüketim ve karbon ayak izini gösteren makine bazlı enerji dashboard'ları, basınçlı hava kaçağı tespiti ve planlanan üretime dayalı ML tabanlı enerji tahminlemesi — SAP ile entegre, ISO 50001 hazırlığını destekler.",
  },
  {
    icon: "code",
    title: "Full-Stack Geliştirme ve Bulut",
    description:
      "ETL/stream-processing hatları, REST API'ler ve gerçek zamanlı dashboard'lar içeren özel Node.js/React/Redux/TypeScript platformları; Docker, Kubernetes, Terraform ve CI/CD ile Azure/AWS üzerinde dağıtılır — üretim sahası ile bulut arasında köprü kurar.",
  },
  {
    icon: "award",
    title: "Ödüllü İnovasyon ve Araştırma",
    description:
      "Cevdet İnci Teşvik Ödülleri'nde çoklu birincilik ve İnovasyon Özel Ödülü, İnci GS Yuasa Stars ödülleri ve Sustainability Business Awards (Teknoloji & Yapay Zeka) finalistliği. Uygulamalı makine öğrenmesi ve endüstriyel otomasyon alanında 4 bilimsel yayın.",
  },
] as const;
