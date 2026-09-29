// One entry per publication, each rendered as its own page at /publications/<slug> (see
// src/pages/Publication.tsx) with Google Scholar citation_* tags and ScholarlyArticle JSON-LD
// (src/seo/site.ts). Titles, authors, venues and abstracts are copied from the published versions
// — keep them verbatim, including the journal's own spelling. The resume section's short
// per-language summaries live in content.{en,tr}.ts and link here by slug.
//
// Links always point at the official copy (DOI, journal, proceedings book); nothing is re-hosted
// here. `#page=N` opens a multi-paper PDF directly at the paper's first page.

export type Author = { name: string; orcid?: string; self?: boolean };

export type Publication = {
  slug: string;
  /** Title as published, in the paper's own language. */
  title: string;
  /** The paper's own English title when the published title is Turkish. */
  titleEn?: string;
  language: "en" | "tr";
  authors: Author[];
  kind: "journal" | "proceedings" | "abstract";
  venue: string;
  /** Extra venue context shown under the venue, e.g. the conference a journal paper came from. */
  venueNote?: string;
  volume?: string;
  issue?: string;
  firstPage?: string;
  lastPage?: string;
  publisher?: string;
  isbn?: string;
  doi?: string;
  /** Google Scholar wants YYYY/MM/DD; shorter forms (YYYY/MM, YYYY) are allowed. */
  date: string;
  displayDate: string;
  place: string;
  /** Official copy of the paper. */
  url?: string;
  urlLabel?: string;
  license?: string;
  abstractEn?: string;
  abstractTr?: string;
  keywords: string[];
};

const EMRE: Author = { name: "Emre Çancıoğlu", orcid: "0000-0002-9918-4668", self: true };
const SAHIN: Author = { name: "Savaş Şahin", orcid: "0000-0003-2065-6907" };
const ISLER: Author = { name: "Yalçın İşler", orcid: "0000-0002-2150-4756" };

export const publicationList: Publication[] = [
  {
    slug: "energy-forecasting-battery-production-2026",
    title:
      "Machine Learning–Assisted Monitoring and Data Acquisition System for Electricity and Compressed Air Consumption Forecasting in Battery Production Lines",
    language: "en",
    authors: [{ name: "Egehan Özaydın", orcid: "0009-0009-4137-6518" }, EMRE, SAHIN],
    kind: "proceedings",
    venue: "13th International European Conference on Interdisciplinary Scientific Research — Proceedings Book",
    firstPage: "392",
    lastPage: "401",
    publisher: "Liberty Academic Publishers",
    isbn: "979-8-89695-446-0",
    date: "2026/06/13",
    displayDate: "May 25–26, 2026",
    place: "Tirana, Albania",
    url: "https://www.eucongress.org/_files/ugd/8f4327_0625909f99ad4ff7ac587a9a1fd87003.pdf#page=453",
    urlLabel: "Proceedings book (PDF, opens at the paper)",
    license: "CC BY-NC 4.0",
    abstractEn:
      "This study presents the development of machine learning-based regression models that can perform short-term consumption forecasting using hourly electricity and compressed air consumption data, production confirmation records, downtime data and weather parameters obtained from production lines. The datasets obtained from different sources were merged in time, outliers were removed, missing data analysed, and the dataset made suitable for model training through appropriate filling and interpolation. Subsequently, features based on lag values, moving averages, difference variables, cyclical time variables and production/downtime information were extracted. Four different forecasting problems were then addressed using these features, including 1-hour and 24-hour prediction models for both electricity and compressed air consumption. Regression algorithms such as SVR, Gradient Boosting Machine, LightGBM, XGBoost, KNN and Random Forest were trained and compared. The developed models were evaluated using metrics such as RMSE and R2, and their practicality was evaluated through testing in a factory environment. This study is expected to contribute to the improvement of energy consumption prediction at the factory, better planning of resource allocation, and optimisation of related operational procedures.",
    abstractTr:
      "Bu çalışma, üretim hatlarından elde edilen saatlik elektrik ve basınçlı hava tüketim verileri, üretim onay kayıtları, arıza süresi verileri ve hava durumu parametrelerini kullanarak kısa vadeli tüketim tahmini yapabilen, makine öğrenimi tabanlı regresyon modellerinin geliştirilmesini sunmaktadır. Farklı kaynaklardan elde edilen veri kümeleri zamansal olarak birleştirilmiş, uç değerler çıkarılmış, eksik veriler analiz edilmiş ve uygun doldurma ve enterpolasyon yöntemleri ile veri kümesi model eğitimi için uygun hale getirilmiştir. Ardından, gecikme değerleri, hareketli ortalamalar, fark değişkenleri, döngüsel zaman değişkenleri ve üretim/kesinti bilgilerine dayalı özellikler çıkarılmıştır. Daha sonra bu özellikler kullanılarak, hem elektrik hem de basınçlı hava tüketimi için 1 saatlik ve 24 saatlik tahmin modelleri dahil olmak üzere dört farklı tahmin problemi ele alınmıştır. SVR, Gradient Boosting Machine, LightGBM, XGBoost, KNN ve Random Forest gibi regresyon algoritmaları eğitilmiş ve karşılaştırılmıştır. Geliştirilen modeller, RMSE ve R2 gibi metrikler kullanılarak değerlendirildi ve pratiklikleri fabrika ortamında yapılan testlerle değerlendirildi. Bu çalışmanın, fabrikadaki enerji tüketimi tahminlerinin iyileştirilmesine, kaynak tahsisinin daha iyi planlanmasına ve ilgili operasyonel prosedürlerin optimizasyonuna katkıda bulunması beklenmektedir.",
    keywords: ["Machine Learning", "Regression Models", "Energy Consumption Forecasting", "Electricity Consumption", "Compressed Air Consumption", "Time Series Forecasting"],
  },
  {
    slug: "unified-namespace-mqtt-opc-ua-2024",
    title: "Endüstri 4.0 ve IoT İçin Veri Entegrasyonu: MQTT, OPC UA ve Node.js ile Unified Namespace Tabanlı Dijital Dönüşüm",
    titleEn: "Data Integration for Industry 4.0 and IoT: Unified Namespace-Based Digital Transformation with MQTT, OPC UA and Node.js",
    language: "tr",
    authors: [EMRE, { name: "Onuralp Kazım Tümer" }],
    kind: "abstract",
    venue: "VI. Ulusal Üniversite-Sanayi İş Birliği, Ar-Ge ve İnovasyon Kongresi — Bildiri Özetleri Kitabı",
    firstPage: "7",
    lastPage: "7",
    publisher: "Manisa Celal Bayar Üniversitesi",
    date: "2024/12/17",
    displayDate: "December 17–18, 2024",
    place: "Manisa, Türkiye",
    url: "https://argeinv.mcbu.edu.tr/kongrelerimiz/altinci/ozet/ozet.pdf#page=44",
    urlLabel: "Abstract book (PDF, opens at the abstract)",
    abstractTr:
      "Endüstri 4.0 ve Endüstriyel Nesnelerin İnterneti (IoT), üretim süreçlerini dönüştüren, verilerin hızlı ve etkili bir biçimde işlenmesini mümkün kılan bir devrimin kapılarını aralamaktadır. Bu yenilikçi teknolojiler, üretim hatlarında dijitalleşme ve otomasyon süreçlerini hızlandırarak, verimliliği artırmak ve daha akıllı üretim sistemleri oluşturmak adına büyük fırsatlar sunmaktadır. Bu çalışmada, üretim makineleri arasındaki iletişimi ve veri entegrasyonunu optimize etmek için UNS (Unified Namespace) mimarisinin kullanımı ele alınmaktadır. UNS mimarisi, makineler ve uygulamalar arasındaki doğrudan bağlantıyı ortadan kaldırarak, esnek ve ölçeklenebilir bir yapı sunar. Bu yapı, dikey entegrasyon sağlayarak farklı üretim aşamalarındaki sistemlerin verimli bir şekilde iletişim kurmasına olanak tanır. Ayrıca, bu mimari sayesinde canlı makine izleme yapılabilir, proses yeterliliği değerlendirilebilir ve yapay zekâ destekli analizlerle proses önceden tahmin edilebilir. MQTT (Message Queuing Telemetry Transport) ve OPC UA (Open Platform Communications Unified Architecture) protokollerinden yararlanarak, PLC (Programmable Logic Controller) cihazlarından alınan veriler bir Node.js tabanlı sistemde merkezi bir yapıya dönüştürülmekte, böylece verilerin hızlı bir şekilde analiz platformlarına aktarılması sağlanmaktadır. Sonuç olarak, UNS mimarisi ile üretim süreçleri dijital dönüşüm sürecine hızla uyum sağlamış olup firmamızda veri çekme hızı 126ms mertebesine düşürülüp, projenin dokunduğu üretim süreçlerinde operasyonel verimlilik %19 artış göstermiş ve stratejik hedeflere ulaşmaya yardımcı olmuştur. Bu çalışma ile, endüstriyel sistemlerin daha sürdürülebilir, esnek ve ölçeklenebilir hale gelmesi sağlanmıştır.",
    keywords: ["Unified Namespace", "Dikey Entegrasyon", "Dijital İkiz", "Yapay Zekâ"],
  },
  {
    slug: "fault-detection-poincare-ensemble-2021",
    title: "Poincare Çizimi Ölçümlerinden Topluluk Öğrenmesi Yöntemleri Kullanılarak Proses Kontrol Sistemlerinde Arıza Tespit ve Teşhisi",
    titleEn: "Fault Detection and Diagnosis on Process Control Systems Using Ensemble Learning Algorithms from Poincare Plot Measures",
    language: "tr",
    authors: [EMRE, SAHIN, ISLER],
    kind: "journal",
    venue: "Avrupa Bilim ve Teknoloji Dergisi (European Journal of Science and Technology)",
    venueNote: "Special Issue 26 — 3rd International Congress on Human-Computer Interaction, Optimization and Robotic Applications (HORA 2021), June 11–13, 2021",
    issue: "26",
    firstPage: "30",
    lastPage: "34",
    doi: "10.31590/ejosat.952761",
    date: "2021/07",
    displayDate: "July 2021",
    place: "Türkiye",
    url: "https://dergipark.org.tr/en/pub/ejosat/issue/62946/952761",
    urlLabel: "Article on DergiPark (open access)",
    abstractEn:
      "This study aimed to detect and classify 20 different malfunctions in an industrial facility that involves nonlinear processes from various chemical units. The IEEEDataPort online dataset, acquired from a large industrial plant, was used in this study. It contains measures from 52 process points in Tennessee Eastman Process with 20 different fault types. We extracted two commonly used nonlinear features from Poincare Plots for each measurement point. The statistically meaningful features, which show statistically significant differences among fault types with a significance of 5%, were selected from these features. Five distinct Ensemble Learner algorithms (Boosted Trees, Bagged Trees, Subspace Discriminant, Subspace KNN, and RUSBoosted Trees) discriminated the fault types using all features and the selected features only. The maximum classifier accuracies were 89.5% for both feature sets using the Subspace Discriminant method in this study. This performance is a comprehendible result among the results achieved in similar studies. On the other hand, ANOVA-based feature selection didn't result in a clear advantage to diagnose faults in such industrial process plants.",
    abstractTr:
      "Bu çalışmada, farklı kimyasal birimlere ait doğrusal olmayan süreçler içeren bir endüstriyel tesisteki 20 farklı arızanın tespiti ve sınıflandırılması yapılmıştır. Kullanılan veri seti büyük bir endüstriyel tesisten elde edilen IEEEDataPort çevrimiçi veri kümesidir. Tennessee Eastman Süreci olarak bilinen bu veri seti 20 farklı hata türü ile 52 işlem noktasından alınan ölçümleri içerir. Bu ölçümler üzerinden Poincare çizimleri elde edilerek her işlem noktası için sık kullanılan doğrusal olmayan öznitelikler çıkarılmıştır. Bu öznitelikler %5 istatistiksel anlamlılık düzeyinde tek yönlü ANOVA testine uygulanarak hata türleri arasında istatistiksel olarak anlamlı fark olduğunu gösterenler seçilmiştir. Hem tüm öznitelikler hem de sadece ANOVA ile seçilen öznitelikler beş farklı topluluk öğrenmesi algoritması (Boosted Trees, Bagged Trees, Subspace Discriminant, Subspace KNN ve RUSBoosted Trees) kullanılarak sınıflandırılmıştır. Bu çalışmada elde edilen en yüksek sınıflandırıcı doğruluğu Subspace Discriminant algoritması kulanılarak %89,5 olarak elde edilmiştir. Aynı verisetini kullanan benzer çalışmalarla kıyaslanabilir bir başarı düzeyine ulaşılmıştır. Öte yandan, ANOVA tabanlı öznitelik seçiminin bu tür endüstriyel proses tesislerinde arızaların teşhisinde bariz bir üstünlük sağlamadığı görülmüştür.",
    keywords: ["Tennessee Eastman Process System", "Fault Detection", "Fault Diagnosis", "Ensemble Learning", "Poincare Plot Measures", "One-Way ANOVA Test"],
  },
  {
    slug: "lstm-heart-sound-classification-2020",
    title: "Uzun-Kısa Vade Hafıza Tabanlı Kalp Ritmi Analizi ve Sınıflandırması",
    titleEn: "Heart Sounds Analysis and Classification Based on Long-Short Term Memory",
    language: "tr",
    authors: [EMRE, SAHIN, ISLER],
    kind: "journal",
    venue: "Akıllı Sistemler ve Uygulamaları Dergisi (Journal of Intelligent Systems with Applications)",
    venueNote: "Also presented at the 3rd International Conference on Medical Devices (ICMD 2020)",
    volume: "3",
    issue: "1",
    firstPage: "25",
    lastPage: "28",
    date: "2020",
    displayDate: "2020",
    place: "İzmir, Türkiye",
    url: "https://www.researchgate.net/profile/Yalcin-Isler-2/publication/357078829_Heart_Sounds_Analysis_and_Classification_Based_on_Long-Short_Term_Memory/links/61c338cdabcb1b520ad8e586/Heart-Sounds-Analysis-and-Classification-Based-on-Long-Short-Term-Memory.pdf",
    urlLabel: "Full text on ResearchGate (PDF)",
    abstractEn:
      "In this study, the development of an algorithm for the classification of heart sound phonocardiogram waveforms such as Normal, Murmur, Extrasystole, Artifact. By presenting the approach used for classification from a general machine learning application point of view, the types of classifiers used were detailed by comparing their features and their performance. The Long-Short Term Memory method which supports the classification of each cardiac cycle in sound recordings. In addition to the LSTM-based features, our method incorporates spectral features to summarize the characteristics of the entire sound recording.",
    abstractTr:
      "Bu çalışmada, kalp sesi fonokardiyogram dalga formlarının Normal, Hırıltılı, Ekstrasistol ve Yapay gibi kategorilere sınıflandırılma çalışması yapılmıştır. Sınıflandırma için kullanılan yaklaşımı genel bir makine öğrenimi uygulama bakış açısından sunarak, özellik çıkarma, performanslarını karşılaştırarak kullanılan sınıflandırıcıların türleri detaylandırıldı. Çalışmada kullanılan Uzun-Kısa Vadeli Hafıza (LSTM) metodu, ses kayıtlarındaki her bir kardiyak döngünün sınıflandırılmasını destekler. LSTM tabanlı özelliklere ek olarak, yöntemimiz tüm ses kayıtlarının özelliklerini özetlemek için spektral özellikler içerir.",
    keywords: ["Heart Sounds", "Classification", "LSTM", "RNN"],
  },
  {
    slug: "ecg-fpga-digital-filter-design-2020",
    title: "ECG Verisi İçin Alanda Programlanabilir Kapı Dizileri ve MATLAB Tabanlı Dijital Filtre Tasarımı ve Gerçeklemesi",
    titleEn: "Design and Implementation of Digital Filters for ECG Data Based on Field Programmable Gate Array and MATLAB",
    language: "tr",
    authors: [EMRE, { name: "Gökberk Çakıroğlu" }, { name: "Alkım Gökçen" }, { name: "Yılmaz Sefa Altanay" }],
    kind: "journal",
    venue: "Akıllı Sistemler ve Uygulamaları Dergisi (Journal of Intelligent Systems with Applications)",
    volume: "3",
    issue: "1",
    firstPage: "17",
    lastPage: "19",
    date: "2020",
    displayDate: "2020",
    place: "İzmir, Türkiye",
    abstractEn:
      "This study provides design and implementation of four digital filters (low pass, high pass, band pass and band stop) for ECG (electrocardiogram) data on FPGA with MATLAB™ by a serial communication. The study is conducted with using ECG data which is obtained from PhysioBank Database platform. SysGen (System Generator for DSP™) which is a toolbox for MATLAB™ is used for designing and implementing the digital filters. The aim of the study is to perform four different digital filters with various blocks on the SysGen Toolbox. The study then examines the results of four different digital filters.",
    abstractTr:
      "Bu çalışma, seri haberleşme yoluyla EKG (elektrokardiyografi) verileri için MATLAB™ ve FPGA kullanılarak dört dijital filtre (alçak geçiren, yüksek geçiren, bant geçiren, bant durdurma) tasarımını ve gerçekleşmesini sunar. Çalışma PhysioBank Veri Tabanı platformundan elde edilen EKG verileri kullanılarak gerçekleştirilmiştir. MATLAB™ için bir araç kutusu olan SysGen (System Generator for DSP™) dijital filtreleri tasarlamak ve uygulamak için kullanılır. Çalışmanın amacı, SysGen araç kutusunda çeşitli bloklar kullanılarak dört farklı dijital filtre gerçekleştirmektir. Çalışma daha sonra dört farklı dijital filtrenin sonuçlarını inceler.",
    keywords: ["ECG", "Filter", "FPGA", "MATLAB"],
  },
];

export const publicationsBySlug = new Map(publicationList.map((p) => [p.slug, p]));

export function publicationPath(slug: string) {
  return `/publications/${slug}`;
}

/** Page range as "30–34", or a single page. */
export function pageRange(p: Publication) {
  if (!p.firstPage) return undefined;
  return p.lastPage && p.lastPage !== p.firstPage ? `${p.firstPage}–${p.lastPage}` : p.firstPage;
}

/** APA-style reference line, used on the page's "Cite" block and in llms-full.txt. */
export function citation(p: Publication) {
  const authors = p.authors.map((a) => a.name).join(", ");
  const year = p.date.slice(0, 4);
  const vol = p.volume ? `, ${p.volume}${p.issue ? `(${p.issue})` : ""}` : p.issue ? `, (${p.issue})` : "";
  const pages = pageRange(p) ? `, ${p.kind === "journal" ? "" : "pp. "}${pageRange(p)}` : "";
  const doi = p.doi ? ` https://doi.org/${p.doi}` : "";
  return `${authors} (${year}). ${p.title}. ${p.venue}${vol}${pages}.${doi}`;
}
