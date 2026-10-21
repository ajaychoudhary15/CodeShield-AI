# 🛡️ CodeShield AI

**AI-Powered Code Security Scanner & Vulnerability Analyzer**

CodeShield AI is a web-based tool designed to help developers identify potential security vulnerabilities in their code and improve code quality. It combines code scanning with AI-powered suggestions to help developers understand security issues and generate corrected code.

## 🚀 Features

- **🔍 Code Security Scanning** — Scan submitted code for potential security vulnerabilities.
- **🤖 AI-Powered Code Fixer** — Generate AI-assisted code corrections using Groq.
- **⚠️ Vulnerability Detection** — Identify potential security risks and problematic code patterns.
- **💡 Fix Suggestions** — Get recommendations to improve code security and quality.
- **🖥️ Interactive Web Interface** — A user-friendly interface for submitting and analyzing code.
- **🔌 REST API** — Backend endpoints for health checks, code scanning, and AI-assisted fixes.

## 🛠️ Tech Stack

**Frontend**
- React.js
- Vite
- JavaScript
- CSS

**Backend**
- Node.js
- Express.js
- REST API

**AI Integration**
- Groq API
- AI-powered code correction

## 📂 Project Structure

```text
CodeShield-AI/
├── server/
│   ├── index.js
│   ├── scanner.js
│   ├── package.json
│   └── .env.example
├── src/
├── public/
├── index.html
├── package.json
├── .gitignore
└── README.md
```

*Note: The structure above is illustrative. Update it if your actual project uses a different frontend folder layout.*

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/CodeShield-AI.git
cd CodeShield-AI
```

### 2. Install Frontend Dependencies

Open a terminal in the frontend directory containing `package.json` and run:

```bash
npm install
```

### 3. Configure the Backend

Open another terminal:

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory and add your Groq API key:

```env
GROQ_API_KEY=your_groq_api_key
PORT=5000
```

Replace `your_groq_api_key` with your own API key. **Never upload your `.env` file or API key to GitHub.**

### 4. Start the Backend

From the `server` directory, run:

```bash
node index.js
```

The backend should start at:

```text
http://localhost:5000
```

### 5. Start the Frontend

In a separate terminal, navigate to the frontend directory and run:

```bash
npm run dev
```

Open the local URL displayed in your terminal, usually:

```text
http://localhost:5173
```

## 🔗 API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend health |
| POST | `/api/scan` | Analyze submitted code |
| POST | `/api/fix` | Request AI-assisted code correction |

## 🔐 Security Notes

- Keep API keys and other secrets in environment variables.
- Never commit `.env` files or credentials to version control.
- Review AI-generated fixes before using them in production.
- Treat scan results as assistance, not a guarantee that code is free of vulnerabilities.

## 🎯 Project Goal

The goal of CodeShield AI is to make code security analysis more accessible by combining automated scanning with AI-assisted code correction in a single web application.

## 🔮 Future Improvements

- Support for additional programming languages.
- More comprehensive security rules.
- Detailed vulnerability reports with severity levels.
- Downloadable scan reports.
- Integration with development workflows and CI/CD pipelines.

## 👨‍💻 Author

**Ajay Tomar**

- GitHub: [@ajaychoudhary15](https://github.com/ajaychoudhary15)
- LinkedIn: [Ajay Tomar](https://linkedin.com/in/ajay-tomar-509a29385)

---

⭐ If you find this project useful, consider giving the repository a star.
