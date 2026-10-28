# 🎨 AI-Bot Frontend (`AI-Bot-FE`)

Production-ready, responsive, glassmorphic dark-theme Frontend for the Rathinam College AI Assistant & Data Sync Platform.

---

## 🌟 Highlights

- **Modern Glassmorphic Dark UI**: Custom-tailored dark theme with subtle gradients, CSS glass cards, and micro-animations.
- **Interactive Chat Assistant**: Streaming response bubbles with markdown rendering, copy buttons, and timestamped messaging.
- **Real-Time Data Sync Badges**: Live indicators tracking `[ Inserted ]`, `[ Updated ]`, and `[ Skipped ]` differential upserts.
- **SQLite Data Inspector Modal**: Integrated view for exploring synchronized records across connected enterprise apps (CCTV, Food Tracker, Transport).
- **SQL Backup Uploader**: In-browser backup file upload and database restoration workflow.
- **Test Runner Bar**: Quick simulated testing tools for 401 token refresh and service failovers.

---

## 📁 Repository Structure

```
.
├── index.html        # Primary HTML interface (Chatbot, Refresh Sync, SQLite Inspector, Test Runner)
├── css/
│   └── style.css     # Glassmorphic dark-theme styles, responsive flex/grid layouts, animations
├── js/
│   └── app.js        # Dynamic UI logic, real-time metrics, streaming chat, modal management
├── .gitignore        # Git ignore rules
└── README.md         # Frontend documentation
```

---

## 🚀 Getting Started

### 1. Standalone / Live Preview
You can preview the interface directly using any static web server:
```bash
# Using Python
python -m http.server 3000

# Using Node / npx serve
npx serve .
```

### 2. Integration with Chatbot Backend
When served with the backend FastAPI service:
- The UI is served at `http://127.0.0.1:8000/`
- Connects directly to backend endpoints:
  - `POST /api/chat` - AI chat ground-truth answers
  - `POST /api/refresh` - Refresh point sync engine
  - `GET /api/metrics` - Live SQLite database statistics
  - `POST /api/upload-sql-backup` - SQL dump ingestion

