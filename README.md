# 🚀 Amazon Web Service (AWS) Cloud Resume

This project contains a walkthrough of the steps I took to complete the **#TheCloudResumeChallenge** and what I’ve learned from this experience. Below is the **AWS Cloud Architecture** for my project.

---

## 🌍 What is Cloud Resume Challenge?
[The Cloud Resume Challenge](https://cloudresumechallenge.dev/) is a multi-step resume project that helps build and demonstrate fundamental cloud skills.

## 🏗 AWS Cloud Architecture Diagram
![Architecture Diagram](/images/diagram.jpg)

---

## 🔹 Getting Started  
I initially looked for **HTML, CSS, and JavaScript** resume templates but found them hard to customize. Instead, I decided to build my own resume website using **YouTube tutorials**.  
> 📝 *Tip:* Learning the basics of HTML, CSS, and JavaScript along the way is more valuable than just using templates.

---

## 📌 Step 1: Setting Up the Frontend Website  
✅ Built the **resume website** and stored the code in a **GitHub repository**.  
✅ Hosted the website using **AWS S3**.  
✅ Registered a **custom domain** and configured **AWS Route 53**.  
✅ Used **AWS Certificate Manager** to manage **SSL/TLS certificates**.  
✅ Set up **AWS CloudFront** as a Content Delivery Network (CDN) for performance.

---

## 🔹 Step 2: Setting Up the Backend Infrastructure  
💡 **Why do we need a backend?**  
To display a **visitor count** on my resume website, I used:  
- **AWS DynamoDB** for storing visitor data.  
- **AWS Lambda** (Python) to update and retrieve visitor count.  

---

## 🔗 Step 3: Connecting Frontend with Backend  
To securely connect the frontend and backend:  
- Used **AWS API Gateway** to create an HTTP API.  
- Ensured **DynamoDB and Lambda** are not directly exposed to the internet.  

---

## 🚀 Step 4: CI/CD Integration  
To automate deployments, I created two **CI/CD workflows** in **GitHub Actions**:  
1. 🛠 **Deploy new files** to the **S3 bucket**.  
2. 🚀 **Invalidate CloudFront cache** to refresh the website content.

---

## 🏗 Step 5: Infrastructure as Code (IaC)  
Manually creating AWS resources was **time-consuming**.  
✅ Used **Terraform** to automate deployment and deletion of cloud infrastructure.  

---

### 📚 What I Learned  
This challenge gave me **hands-on experience** with AWS and **improved my cloud knowledge**. If you're a beginner, I highly recommend trying **#TheCloudResumeChallenge!** 🎯  

---

## 🔧 Services Used  

| Service               | Purpose                              |
|-----------------------|--------------------------------------|
| 🌐 **S3**              | Static website hosting              |
| 🚀 **CloudFront**      | CDN for performance                 |
| 🔒 **Certificate Manager** | SSL/TLS security                   |
| ⚙️ **Lambda**          | Serverless function for API calls  |
| 📊 **DynamoDB**       | NoSQL database for visitor count   |
| 🛠 **GitHub Actions**  | CI/CD automation                   |
| 📜 **Terraform**      | Infrastructure as Code (IaC)       |

---

🎯 **Next Steps:** I plan to integrate **monitoring & logging** (CloudWatch) and explore **serverless frameworks** like AWS SAM.  
