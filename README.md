<p align="center">
  <img src="https://img.shields.io/badge/AI-Powered-blueviolet?style=for-the-badge&logo=google&logoColor=white" alt="AI Powered"/>
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/MongoDB-6.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
</p>

<h1 align="center">🚀 AI Smart Resume Evaluation System</h1>

<p align="center">
  <strong>An intelligent resume analysis platform powered by Google Gemini AI</strong>
</p>

<p align="center">
  Get instant, detailed feedback on your resume • Match against job descriptions • Improves the job search success
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📄 **Resume Upload** | Upload PDF/DOC resumes with automatic text extraction |
| 🤖 **AI Analysis** | Comprehensive analysis powered by Google Gemini 2.0 Flash |
| 📊 **Scoring System** | Overall Resume Score + ATS Optimization Score (0-100) |
| 🎯 **Job Matching** | Compare resume against job descriptions for fit analysis |
| 💡 **Actionable Tips** | Specific, evidence-based improvement suggestions |
| 🔐 **Secure Auth** | JWT authentication with email OTP verification |
| 📱 **Responsive UI** | Modern React frontend with clean design |

---

## 🏗️ Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **AI:** Google Gemini 2.0 Flash API
- **Auth:** JWT + bcrypt
- **Logging:** Winston
- **Validation:** express-validator

### Frontend
- **Framework:** React 18
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Styling:** CSS3

---

## 💡 Gemini API Note

> [!IMPORTANT]
> This project uses **Google Gemini AI** for resume analysis. The AI prompts are comprehensive and require a good number of tokens to generate detailed, consistent results.

**Recommendations:**
- **For Testing:** The free Gemini tier works but has strict rate limits. You may need to wait between requests. Use the paid Gemini API tier for reliable, uninterrupted performance with multiple users.

Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- MongoDB 6+ ([Download](https://www.mongodb.com/try/download/community) or use [Atlas](https://www.mongodb.com/atlas))
- Google Gemini API Key ([Get one free](https://aistudio.google.com/app/apikey))
- Gmail App Password (for OTP emails)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/kushalgowda7/AI-Smart-Resume-Evaluation.git
cd AI-Smart-Resume-Evaluation
```

### 2️⃣ Install Dependencies

```bash
# Install root dependencies (concurrently)
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 3️⃣ Configure Environment Variables

Create `backend/.env` file:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/airesumedb

# JWT Secret (use a strong random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Gmail SMTP Configuration (for OTP emails)
GMAIL_EMAIL=your_email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
```

> [!NOTE]
> **Getting Gmail App Password:**
> 1. Enable 2-Step Verification on your Google Account
> 2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
> 3. Generate a new App Password for "Mail"

### 4️⃣ Start MongoDB

```bash
# If using local MongoDB
mongod

# Or if using MongoDB as a service (Windows)
net start MongoDB
```

### 5️⃣ Run the Application

```bash
# From the root directory
npm start
```

This starts both:
- **Backend:** http://localhost:5000
- **Frontend:** http://localhost:3000

### 6️⃣ Test the Health Endpoint

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "uptime": 12.345,
  "environment": "development"
}
```

---

<p align="center">
  Made with ❤️ by Kushal S
</p>

