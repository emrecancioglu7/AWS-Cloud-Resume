export const profile = {
  name: "Emre Çancıoğlu",
  roles: ["Digitalization & AI Supervisor.", "Industrial Automation Expert.", "Software Developer."],
  title: "Digitalization & AI Supervisor | Industrial Automation.",
  shortBio:
    "Results-driven Digitalization & AI Supervisor with over 9 years of experience leading digital transformation and applied-AI initiatives on the industrial production floor — currently overseeing OT digitalization and AI strategy across 3 manufacturing facilities.",
  longBio:
    "Managing a 2-person engineering team, coordinating across 10+ cross-functional departments, and leading the company-wide AI Ambassador program. Delivers measurable impact through predictive maintenance, computer-vision-based safety systems (contributing to 4 consecutive years of zero workplace accidents in the areas where they were deployed), GenAI-powered automation, and energy & sustainability analytics. Deep hands-on expertise with PLC, SCADA, and industrial protocols (OPC UA, MQTT, Profinet), balanced with strong software/cloud and leadership capability (Node.js, React, Azure/AWS, Kubernetes). Recognized with multiple 1st-place finishes and an Innovation Special Award across İnci Holding's group companies, and the author of 4 scientific publications in applied machine learning and industrial automation.",
  birthday: "1995-08-10",
  website: "www.emrecancioglu.com",
  phone: "+90 536 702 43 66",
  city: "İzmir/Türkiye",
  degree: "Master",
  email: "emrecancioglu7@gmail.com",
  freelance: "Available",
  quote: "Be the change that you want to see in the world.",
  social: {
    linkedin: "https://www.linkedin.com/in/emrecancioglu/",
    github: "https://github.com/emrecancioglu7",
  },
  resumePdfUrl: "/pdf/Resume_EmreCANCIOGLU.pdf",
} as const;

export const highlights = [
  { metric: "9+", label: "Years Experience" },
  { metric: "3", label: "Facilities" },
  { metric: "2", label: "Person Team" },
  { metric: "57%", label: "Cost Reduction" },
  { metric: "4", label: "Publications" },
  { metric: "6", label: "Awards" },
] as const;

export const skillCategories = [
  {
    name: "OT Systems",
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
      "VLAN Segmentation",
      "Industrial Firewalls",
      "IEC 62443",
    ],
  },
  {
    name: "AI & Data",
    skills: [
      "Predictive Maintenance",
      "Computer Vision",
      "Machine Learning",
      "Deep Learning",
      "GenAI/LLM Automation (RAG, n8n, Copilot, GPT, Claude)",
      "MLOps",
      "Edge Computing",
      "ETL/Stream Processing",
      "SPC",
      "Grafana",
      "Power BI",
      "Data Analytics",
    ],
  },
  { name: "Leadership", skills: ["Team Leadership & Mentoring", "Cross-functional Collaboration", "Project & Budget Management", "Bias for Action"] },
  {
    name: "DevOps",
    skills: ["Azure", "AWS", "Docker", "Kubernetes", "Rancher", "Terraform", "Jenkins", "GitHub Actions", "NGINX", "MS IIS", "PM2", "Git"],
  },
  {
    name: "Development",
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
  { name: "Languages", skills: ["Turkish (Native)", "English (Professional)"] },
] as const;

export const awardsNote =
  "Cevdet İnci Incentive Awards are held across İnci Holding's group companies (5 sister companies, 9+ facilities); İnci GS Yuasa Stars is company-specific.";

export const awards = [
  { title: "Sustainability Business Awards", date: "2025", place: "İstanbul/TÜRKİYE", items: ["Finalist (Technology & AI Category)"] },
  { title: "Cevdet İnci Incentive Awards", date: "2025", place: "İzmir/TÜRKİYE", items: ["1st Place"] },
  { title: "İnci GS Yuasa Stars", date: "2025", place: "Manisa/TÜRKİYE", items: ["3rd Place"] },
  { title: "Cevdet İnci Incentive Awards", date: "2024", place: "İzmir/TÜRKİYE", items: ["1st Place", "Innovation Special Award"] },
  { title: "İnci GS Yuasa Stars", date: "2024", place: "Manisa/TÜRKİYE", items: ["1st Place"] },
  { title: "Cevdet İnci Incentive Awards", date: "2023", place: "İzmir/TÜRKİYE", items: ["1st Place"] },
] as const;

export const publications = [
  {
    title: "13th International European Conference on Interdisciplinary Scientific Research",
    date: "May 2026",
    place: "Tirana, ALBANIA",
    role: "Writer | Researcher",
    topic:
      "ML regression models (XGBoost, LightGBM, GBM) forecasting electricity and compressed-air consumption on battery production lines, achieving R² up to 0.944 for short-term forecasts.",
  },
  {
    title: "R&D & Innovation 2024",
    date: "Dec 2024",
    place: "Manisa, TÜRKİYE",
    role: "Writer | Researcher",
    topic: "Data Integration for Industry 4.0 and IIoT: Unified Namespace-Based Digital Transformation with MQTT, OPC UA, and Node.js.",
    url: "https://drive.google.com/file/d/1ivfaVjw6XqgFRJAQo3pBvQmMTUhmbsgr/view?usp=sharing",
  },
  {
    title: "Human-Computer Interaction Optimization and Robotic Applications",
    date: "Jun 2021",
    place: "TÜRKİYE",
    role: "Writer | Researcher",
    topic:
      "Fault Detection and Diagnosis in Process Control Systems using Machine Learning (ensemble learning) Methods from Poincaré Plot Measurements, improving classification accuracy to 89.5% on the Tennessee Eastman Process.",
    url: "https://drive.google.com/file/d/1Z7KmRMDIiHNtQE6XNgA1lG3MkYo-7Zpp/view?usp=sharing",
  },
  {
    title: "International Medical Device Conference",
    date: "Sep 2020",
    place: "Antalya, TÜRKİYE",
    role: "Writer | Researcher",
    topic:
      "Long-Short Term Memory (LSTM)-Based Heart Sounds Analysis and Classification: an LSTM model classifying phonocardiogram recordings into Normal, Murmur, Extrasystole, and Artifact categories with 79.0% accuracy (Journal of Intelligent Systems and Applications, Vol. 3(1), 2020).",
    url: "https://drive.google.com/file/d/1ZHOTCGskb33IGZGYQ3Ekqhd1twpte5GM/view?usp=sharing",
  },
] as const;

export const certifications = [
  { title: '"Geleceği Sahipleniyoruz" Ciddi Oyunlar™ ile Geleceği Sahiplenen İnovasyon Projeleri', issuer: "41 North Business School", date: "Jul 2026" },
  { title: '"Geleceği Sahipleniyoruz" Blackbox Business Challenge™', issuer: "41 North Business School", date: "Jun 2026" },
  { title: "ISO 9001:2015 & IATF 16949:2016 Training", issuer: "KALMER Kalite Yönetim Merkezi", date: "Feb 2023" },
  { title: "ISO 9001:2015, ISO 14001:2015, ISO 45001:2018", issuer: "N-Sistem", date: "Nov 2021" },
  { title: "Hydraulics & Pneumatics Development and Adaptation Training (64 hours)", issuer: "Manisa Yunusemre Halk Eğitim Merkezi", date: "Feb 2020" },
  { title: "Database Management – SQL Development and Adaptation Training (56 hours)", issuer: "Manisa Yunusemre Halk Eğitim Merkezi", date: "Dec 2019" },
  { title: "Computer-Aided Design (AutoCAD) (160 hours)", issuer: "İzmir Halk Eğitim Merkezi", date: "Dec 2017" },
  { title: "Programmable Logic Control (PLC) (296 hours)", issuer: "İzmir Halk Eğitim Merkezi", date: "Dec 2017" },
] as const;

export const experience = [
  {
    title: "Digitalization & AI Supervisor",
    date: "Jan 2026 - Present",
    company: "İnci GS Yuasa / İnci Akü, Manisa/TÜRKİYE",
    bullets: [
      "Leading OT digitalization and applied-AI strategy across 3 production facilities; managing a 2-person engineering team and coordinating across 10+ cross-functional departments. Delivered 15+ process-improvement projects since taking on the role.",
      "Scaled the OT data integration backbone to 300+ managed data channels and database connections (up from ~200) across PLC, SCADA, MES, and historian systems — integrating 36 new production lines/machines in 2026 alone (furnaces, mills, assembly, filling, and welding stations), surpassing the year's 20% connectivity target to reach 25.76% facility-wide machine coverage, and building a self-service OPC UA-based alerting platform that lets any user configure real-time custom alarms across all connected machines.",
      "Grew the applied-AI portfolio to 4 active predictive-maintenance/quality models and 25 AI-driven automation projects, including RAG-based knowledge systems and GenAI/multi-agent workflows (n8n, Microsoft Copilot, GPT, Claude) that cut day-long reporting cycles down to seconds; leading the AI Ambassador (AI Elçileri) program, driving every department to build and own its own AI agent.",
      "Deployed real-time air-quality/particulate monitoring in areas with high lead-dust exposure, contributing to a 58.62% reduction in workers' blood lead levels; also added real-time anomaly detection on production/utility systems that helped prevent a potential fire incident.",
      "Integrated two YOLO-based computer-vision safety models: AI-ODS, which auto-stops robots when a person enters their work envelope, and AI-FDS, which uses real-time light-projection warnings to prevent forklift-pedestrian and forklift-forklift collisions at blind spots — sustaining zero workplace accidents for 4 consecutive years in the areas where they were deployed.",
      "Retrofitted 200+ electricity, water, and natural-gas meters to remote-reading, built the underlying database, and launched an energy dashboard visualizing machine-level consumption, per-unit-product energy use, and carbon footprint — integrated with SAP and preparing the facility for ISO 50001 certification.",
      "Built a compressed-air leak anomaly-detection algorithm fusing compressor pressure data, real-time MES production signals, and SAP machine-level production-confirmation data, enabling early leak intervention and reducing compressor energy consumption.",
      "Added ML-based energy forecasting driven by planned production volumes (XGBoost, LightGBM, GBM regression, R² up to 0.944), co-authored as peer-reviewed research at the 13th International European Conference on Interdisciplinary Scientific Research (Tirana, Albania, May 2026).",
    ],
  },
  {
    title: "Senior Operational Technologies (OT) Engineer",
    date: "Dec 2022 - Dec 2025",
    company: "İnci GS Yuasa / İnci Akü, Manisa/TÜRKİYE",
    bullets: [
      "Architected a Unified Namespace (UNS) unifying SAP, MES, and PLC/SCADA/DCS-based shop-floor equipment — over OPC UA, MQTT, Kafka, Profinet, EtherNet/IP, and CC-Link — with energy analyzers and third-party systems, establishing the facility's digital twin; led a 20-person team to give every battery full-lifecycle process and test traceability from raw material to shipment.",
      "Led the design and rollout of the OT network architecture; ran 80+ structured cybersecurity and disaster-recovery operations across VLAN segmentation, NAT, and industrial firewalls aligned to the ISA-95/Purdue model and IEC 62443 to safeguard production continuity and data security.",
      "Built a 46-channel, 156-database backbone (MS SQL, MongoDB, PostgreSQL) spanning all 3 production facilities on a custom Node.js/React/Redux/TypeScript stack with ETL/stream-processing pipelines, automating entirely manual shop-floor workflows to lift operational efficiency 19% and data reliability 14%, and cutting OEM/AFM customer data-request turnaround by 90%.",
      "Delivered end-to-end visibility via Power BI and custom dashboards showing real-time machine data, per-unit test results, and real-time SPC-based anomaly alerts — further strengthening the digital twin and powering the Digital Product Passport; accelerated reporting by 60%, saving $156K annually.",
    ],
  },
  {
    title: "Software Development / Automation Lead",
    date: "Jan 2022 - Nov 2022",
    company: "DVD Valves, Manisa/TÜRKİYE",
    bullets: [
      "Developed a PLC-controlled hydraulic butterfly valve control system with a Modbus TCP-based SCADA platform for international water projects (Italy: 8×Ø700mm, Dubai: 2×Ø1400/Ø1500mm, Colombia: 2×Ø700mm); completed FAT/SAT testing. Brought development in-house instead of outsourcing, cutting costs by 30% ($80k saved).",
      "As project lead overseeing the ~₺3.5M TÜBİTAK TEYDEB 1501 budget, led a 3-person core team (coordinating cross-departmental contributors across the project's 9+-person team) building the embedded software and desktop/mobile applications for the pre-charge and ultrasonic metering modules of a smart irrigation hydrant system, cutting unit cost by ~68% versus the outsourced solution and bringing after-sales technical support fully in-house.",
      "TÜBİTAK 2209-B industrial consultant (smart agricultural valve project, No. 119B412103138): added LoRa-based remote meter reading.",
    ],
  },
  {
    title: "Software Development / Automation Engineer",
    date: "Jul 2018 - Dec 2021",
    company: "DVD Valves, Manisa/TÜRKİYE",
    bullets: [
      "Designed two autonomous welding robots with PLC/HMI control to deliver a robust, high-quality weld in a sealing-critical zone, cutting welding cycle time by 60% and reducing sealing-related quality defects by 23%.",
      "Enabled real-time monitoring via the Focas library for CNC machines and OPC UA for PLC-based equipment, with REST API-based data collection and historical data logging.",
      "Modernized outdated, manually-operated control panels and revised PLC software for 10+ production-floor machines (blower test systems, sealing test units with an MS SQL-based desktop application, rubber press, sizing, polishing robot, saw, radial drill, and sandblasting), upgrading their automation level.",
      "Enabled real-time, cross-department visibility into production and maintenance operations through MES and ERP integration.",
    ],
  },
  {
    title: "Part-Time Project Engineer",
    date: "Jul 2017 - Jun 2018",
    company: "DİMES, İzmir/TÜRKİYE",
    bullets: [
      "Transitioned a fully manual PET bottle production line to a fully autonomous conveyor system, designing the PLC-based control panel.",
      "Developed PLC-SCADA software for mixing tank control, enabling full traceability and digitizing reporting and quality processes, supporting faster detection and root-cause analysis of quality deviations.",
    ],
  },
] as const;

export const education = [
  {
    title: "MSc. in Electrical & Electronics Engineering",
    date: "Sep 2019 - Jun 2022",
    school: "İzmir Katip Çelebi University, İzmir/TÜRKİYE",
    gpa: "3.64/4.00 (100% English-Medium Program)",
    coursework: "Statistical Process Control | Data Acquisition and Control | Applied Machine Learning | Artificial Neural Networks.",
    thesis: "Fault Detection and Diagnosis of the Tennessee Eastman Process Using Statistical Analysis and Machine Learning Methods from Poincaré Plot Measurements.",
  },
  {
    title: "BSc. in Electrical & Electronics Engineering",
    date: "Sep 2014 - Jul 2019",
    school: "İzmir Katip Çelebi University, İzmir/TÜRKİYE",
    gpa: "3.14/4.00 (100% English-Medium Program)",
    coursework: "Process Control and Instrumentation | Optimization in Engineering | Industrial Automation | Signals and Systems.",
    thesis: "Design of a Cylindrical Welding and Polishing Machine with PLC-Based HMI Control.",
  },
] as const;

export const services = [
  {
    icon: "cpu",
    title: "OT Digitalization & Unified Namespace",
    description:
      "End-to-end OT data integration across PLC, SCADA, MES, historian, and SAP systems over OPC UA, MQTT, Kafka, Profinet, EtherNet/IP, and CC-Link. Unified Namespace architectures and digital twins that give full process and test traceability, backed by secure OT networks aligned to ISA-95/Purdue and IEC 62443.",
  },
  {
    icon: "cloud-check",
    title: "Applied AI & GenAI Automation",
    description:
      "Predictive-maintenance and quality models, RAG-based knowledge systems, and GenAI/multi-agent workflows (n8n, Microsoft Copilot, GPT, Claude) that turn day-long reporting cycles into seconds. Leading the company-wide AI Ambassador program so every department builds and owns its own AI agent.",
  },
  {
    icon: "server",
    title: "Computer Vision for Workplace Safety",
    description:
      "YOLO-based safety systems such as robot auto-stop when a person enters the work envelope and light-projection warnings against forklift collisions at blind spots — contributing to 4 consecutive years of zero workplace accidents where deployed, alongside real-time air-quality and anomaly monitoring.",
  },
  {
    icon: "book",
    title: "Energy & Sustainability Analytics",
    description:
      "Remote-reading meter retrofits, machine-level energy dashboards with per-unit consumption and carbon footprint, compressed-air leak detection, and ML-based energy forecasting from planned production volumes — integrated with SAP and supporting ISO 50001 readiness.",
  },
  {
    icon: "code",
    title: "Full-Stack Development & Cloud",
    description:
      "Custom Node.js/React/Redux/TypeScript platforms with ETL/stream-processing pipelines, REST APIs, and real-time dashboards, deployed on Azure/AWS with Docker, Kubernetes, Terraform, and CI/CD — bridging the shop floor and the cloud.",
  },
  {
    icon: "award",
    title: "Recognized Innovation & Research",
    description:
      "Multiple 1st-place finishes and an Innovation Special Award at the Cevdet İnci Incentive Awards, İnci GS Yuasa Stars awards, and a Sustainability Business Awards finalist spot (Technology & AI). Author of 4 scientific publications in applied machine learning and industrial automation.",
  },
] as const;
