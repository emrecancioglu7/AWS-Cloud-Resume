export const profile = {
  name: "Emre Çancıoğlu",
  roles: ["Software Developer.", "Digital Transformation Expert.", "Freelancer."],
  title: "Software Developer | Digital Transformation Expert.",
  shortBio:
    "Dynamic and results-driven Senior Operational Technologies Engineer with over 6 years of experience in developing and optimizing industrial systems through advanced technologies like IIoT, cloud computing, and data analytics.",
  longBio:
    "Expertise in leading digital transformation initiatives, achieving measurable improvements in operational efficiency, and reducing costs through the integration of modern automation systems. Proficient in full-stack development (Node.js, React), cloud infrastructure (AWS, Kubernetes), and industry protocols (OPC UA, MQTT, Kafka). Adept at driving business intelligence, data harmonization, and creating scalable solutions. Strong communicator with a bias for action and a passion for leveraging technology to solve complex problems and enhance production performance.",
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

export const skillCategories = [
  { name: "DevOps", skills: ["AWS", "Docker", "Kubernetes", "Rancher", "Terraform", "Jenkins", "NGINX", "MS IIS", "PM2", "Git"] },
  { name: "Programming", skills: ["JavaScript", "Node.js", "Python", "PLC (Ladder Logic, Structured Text)"] },
  { name: "Front-end", skills: ["Redux", "React", "HTML5"] },
  { name: "Back-end", skills: ["Node.js", "Express.js", "Django", "REST API", "Kafka", "MS SQL", "MongoDB", "PostgreSQL"] },
  {
    name: "Familiar",
    skills: [
      "Cloud Computing",
      "Web Servers & Load Balancing",
      "Event-Driven Architecture",
      "Business Intelligence",
      "Data Analytics",
      "ML/AI",
      "Unified Namespace",
      "Digital Twin",
      "Industrial Protocols",
      "Agile",
    ],
  },
  { name: "Soft", skills: ["Problem Solving", "Collaboration", "Project Management", "Bias for Action"] },
] as const;

export const awards = [
  { title: "Cevdet İnci Incentive Awards", date: "Dec 2024", place: "İzmir/TÜRKİYE", items: ["1st Place", "Innovation Special Award"] },
  { title: "İnci GS Yuasa Stars", date: "Oct 2024", place: "Manisa/TÜRKİYE", items: ["1st Place"] },
  { title: "Cevdet İnci Incentive Awards", date: "Dec 2023", place: "İzmir/TÜRKİYE", items: ["1st Place"] },
] as const;

export const publications = [
  {
    title: "R&D & Innovation",
    date: "Dec 2024",
    place: "Celal Bayar University, Manisa/TÜRKİYE",
    role: "Writer | Researcher",
    topic: "Data Integration for Industry 4.0 and IIoT: Unified Namespace-Based Digital Transformation with MQTT, OPC UA, and Node.js",
    url: "https://drive.google.com/file/d/1ivfaVjw6XqgFRJAQo3pBvQmMTUhmbsgr/view?usp=sharing",
  },
  {
    title: "Career Days",
    date: "May 2023",
    place: "Katip Celebi University, İzmir/TÜRKİYE",
    role: "Speaker",
    topic: "Connecting Students with Industry Leaders for Insights and Opportunities",
    url: "https://drive.google.com/file/d/1ZALfm7lulleyhJFwW07I3UpTTDJ8onWq/view?usp=sharing",
  },
  {
    title: "International Conference of Applied Sciences, Engineering, and Mathematics",
    date: "Oct 2021",
    place: "International Balkan University, MACEDONIA",
    role: "Writer | Researcher",
    topic: "Fault Detection and Diagnosis in Process Control Systems using k-Nearest Neighbor Method from Poincaré Plot Measurements.",
    url: "https://drive.google.com/file/d/1ZPOH-EiYq5hWN7-3n2Lljo759LFpQRs1/view?usp=sharing",
  },
  {
    title: "Human-Computer Interaction Optimization and Robotic Applications",
    date: "Jun 2021",
    place: "Online, TÜRKİYE",
    role: "Writer | Researcher",
    topic: "Fault Detection and Diagnosis in Process Control Systems using Machine Learning Methods from Poincaré Plot Measurements.",
    url: "https://drive.google.com/file/d/1Z7KmRMDIiHNtQE6XNgA1lG3MkYo-7Zpp/view?usp=sharing",
  },
  {
    title: "International Medical Device Conference",
    date: "Sep 2020",
    place: "Antalya, TÜRKİYE",
    role: "Writer | Researcher",
    topic: "Long-Term and Short-Term Memory-Based Heart Rate Analysis and Classification.",
    url: "https://drive.google.com/file/d/1ZHOTCGskb33IGZGYQ3Ekqhd1twpte5GM/view?usp=sharing",
  },
] as const;

export const certifications = [
  { title: "Quality Management and Improvement", field: "Failure Modes and Effects Analysis | Statistical Process Control | Problem-Solving Techniques" },
  { title: "Data Management and Analysis", field: "SQL Database Management" },
  { title: "Automation and Control Systems", field: "PLC Programming with S7-1200" },
] as const;

export const experience = [
  {
    title: "Senior Operational Technologies (OT) Engineer",
    date: "Dec 2022 - Current",
    company: "İnci GS Yuasa, Manisa/TÜRKİYE",
    bullets: [
      "Accomplished 19% increase in operational efficiency by reducing production cycle times, as measured by improved production throughput, through the implementation of a Unified Namespace (UNS) based on ISA95 standards.",
      "Achieved 14% improvement in data reliability by enhancing real-time data flow through the infrastructure optimization with OPC UA, MQTT, and Kafka, which also led to a 90% improvement in the response time to customer complaints.",
      "Reduced production monitoring delays by 32%, as indicated by faster identification of production anomalies, by designing real-time dashboards in Grafana and Node.js for lead-acid battery manufacturing.",
      "Led cost-saving digital transformation initiatives, achieving a 57% reduction in operational expenses, as reflected by decreased overhead costs, by modernizing OT/ICS systems and integrating automation technologies.",
    ],
  },
  {
    title: "Software Development Lead",
    date: "Jan 2022 - Nov 2022",
    company: "DVD Valves, Manisa/TÜRKİYE",
    bullets: [
      "Led a TEYDEB project ($200k funding) managing embedded systems and web service integration for smart irrigation hydrants, using Node.js and React, resulting in 22% improvement in reporting and accounting services efficiency.",
      "Developed control systems for irrigation, improving efficiency by 18% using DCS, as demonstrated by optimized system response times.",
    ],
  },
  {
    title: "Software Development Engineer",
    date: "Jul 2019 - Dec 2021",
    company: "DVD Valves, Manisa/TÜRKİYE",
    bullets: [
      "Integrated IIoT systems with the Focas library, improving CNC monitoring accuracy by 48%, as evidenced by enhanced real-time visibility.",
      "Optimized OEE analysis tools, increasing efficiency by 12%, by analyzing signals from CNC, PLC, and web services, leading to minimized machine idle times.",
    ],
  },
  {
    title: "Part-Time Software Development Engineer",
    date: "Jul 2018 - Jul 2019",
    company: "DVD Valves, Manisa/TÜRKİYE",
    bullets: ["Achieved 3x faster production cycle by automating the welding process with PLC and HMI, as realized by shortened cycle time."],
  },
  {
    title: "Part-Time Project Engineer",
    date: "Jul 2017 - Jul 2018",
    company: "DIMES, Manisa/TÜRKİYE",
    bullets: ["Achieved 3x faster production cycle by automating the welding process with PLC and HMI, as realized by shortened cycle time."],
  },
] as const;

export const education = [
  {
    title: "MSc. in Electrical & Electronics Engineering",
    date: "Sep 2019 - Jun 2022",
    school: "Katip Celebi University, İzmir/TÜRKİYE",
    coursework: "Statistical Process Control | Data Acquisition and Control | Applied Machine Learning | Artificial Neural Networks.",
    thesis: "Fault Detection and Diagnosis of the Tennessee Eastman Process Using Poincaré Plot and ML Based on Statistical Analysis.",
  },
  {
    title: "BSc. in Electrical & Electronics Engineering",
    date: "Sep 2014 - Jul 2019",
    school: "Katip Celebi University, İzmir/TÜRKİYE",
    coursework: "Process Control and Instrumentation | Optimization in Engineering | Industrial Automation | Signals and Systems.",
    thesis: "Design of a Cylindrical Welding and Polishing Machine with Programmable Logic Controller-Based Human-Machine Interface Control.",
  },
] as const;

export const services = [
  {
    icon: "cloud-check",
    title: "Expertise in Digital Transformation and Operational Efficiency",
    description:
      "Extensive experience in optimizing industrial systems through advanced technologies such as IIoT, cloud computing, and data analytics. Digital transformation initiatives are led to improve operational efficiency, reduce costs, and enhance data reliability. Expertise is provided in integrating automation systems and leveraging technologies like MQTT, OPC UA, and Kafka to deliver impactful business outcomes.",
  },
  {
    icon: "code",
    title: "Proficiency in Full-Stack Development and Cloud Infrastructure",
    description:
      "Full-stack development expertise is offered with proficiency in Node.js, React, and Redux. Cloud-based solutions are designed and deployed using AWS, Kubernetes, and Docker. Scalable REST APIs, real-time dashboards, and event-driven architectures are created for both industrial and business applications, with systems integrated to enhance interoperability and efficiency using modern industrial protocols.",
  },
  {
    icon: "cpu",
    title: "Leadership in Large-Scale Digital Projects",
    description:
      "Leadership is provided in the development of web-based digital traceability systems, which improve traceability and reduce reporting time, leading to significant cost savings. Integration of SAP S/4 HANA, Energy Management Systems, PLCs, and IIoT devices is managed, demonstrating strong leadership and technical expertise in complex, multi-disciplinary projects.",
  },
  {
    icon: "award",
    title: "Recognized Achievements and Awards in Innovation",
    description:
      "Recognition is received for significant contributions to innovation and digital transformation, including prestigious awards such as 1st Place and the Innovation Special Award at the Cevdet İnci Incentive Awards, as well as the İnci GS Yuasa Stars Award. These achievements reflect a consistent commitment to excellence and industry impact.",
  },
  {
    icon: "book",
    title: "Thought Leadership in Research and Publications",
    description:
      "Research contributions are made on topics such as unified namespace-based digital transformation, fault detection with machine learning, and AI-driven heart rate analysis. Presentations are delivered at international conferences and industry events, fostering the connection between academic research and industry practices.",
  },
  {
    icon: "server",
    title: "Advanced Technical Skills and Problem-Solving Expertise",
    description:
      "Advanced technical expertise is provided in DevOps tools (AWS, Docker, Kubernetes, Terraform), back-end technologies (Node.js, Django, MongoDB), and front-end frameworks (React, Redux). Proficient programming in JavaScript, Python, and PLC is applied to deliver scalable, innovative solutions to complex industrial and business challenges, fostering collaboration and problem-solving.",
  },
] as const;
