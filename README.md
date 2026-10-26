# SiteWatch: Website Monitoring & Change Detection System 🛡️

**SiteWatch** is a full-stack website monitoring platform built using **React.js, Node.js, Express.js, MongoDB, Axios, Cheerio, node-cron, Nodemailer, and Tailwind CSS**. It empowers users to monitor publicly accessible web pages, automatically scrape target content, compute granular line-by-line differences, schedule periodic checks, and dispatch real-time email alerts.

---

## 🛠️ Technology Stack & Purpose

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | **React.js + Tailwind CSS** | Real-time dashboard, website management, interactive visual diff viewer, and metrics |
| **Backend** | **Node.js + Express.js** | Modular REST APIs, scraping pipelines, diff engine, and application logic |
| **Database** | **MongoDB (Mongoose)** | Stores user accounts, monitored URLs, page snapshots, change logs, and alert records |
| **Web Scraping** | **Axios + Cheerio** | High-performance content extraction, CSS selector targeting, and SHA-256 hashing |
| **Scheduling** | **node-cron** | Automated background recurring checks with configurable intervals (1m, 5m, 15m, 1h, etc.) |
| **Notifications** | **Nodemailer** | HTML email alerts containing change summaries and diff snippets (with Ethereal preview support) |
| **Authentication**| **JWT + Bcrypt.js** | Secure token-based authentication with bcrypt password hashing |

---

## 🚀 Key Features

1. **Intelligent Content Scraping & Hashing**:
   - Uses Axios with custom User-Agent headers, timeout guards, and latency measurement.
   - Cleans HTML via Cheerio (strips noisy `<script>`, `<style>`, `<svg>`).
   - Supports targeted monitoring via specific **CSS Selectors** (e.g. `#price-card`, `.article-content`, `h1`) or full document body.
   - Computes cryptographic SHA-256 hashes to instantly detect updates without redundant overhead.

2. **Granular Visual Diff Engine**:
   - Compares previous page snapshots with newly scraped content using the `diff` library.
   - Computes lines added (`+`), lines removed (`-`), total percentage changed, and diff chunks.
   - Provides an interactive **Unified & Side-by-Side Visual Diff Inspector** with green additions and red removals.

3. **Background Job Scheduling (node-cron)**:
   - Configurable check intervals per monitor: `1m`, `5m`, `15m`, `30m`, `1h`, `6h`, `24h`.
   - Batch concurrency management to ensure reliable, non-blocking background checks.
   - Manual on-demand **"Check Now"** trigger for immediate feedback.

4. **Alert Notification System (Nodemailer)**:
   - Modern, responsive HTML email templates with detection summary, snippet diff, and dashboard link.
   - Auto-configures an Ethereal test inbox for local testing with direct email preview links, or connects to custom SMTP.
   - Integrated **In-App Dispatched Alerts Inbox** to review all sent alerts inside the dashboard.

5. **Built-in Interactive Sandbox Playground**:
   - Includes a live simulated web target (`/api/sandbox/page`) allowing you to simulate price drops, out-of-stock events, or custom text changes with a single click, then watch SiteWatch detect the diff instantly!

6. **Instant Explorer Demo Access**:
   - One-click instant login pre-seeded with live monitors (Sandbox E-Commerce, Hacker News, GitHub Status).

---

## 📁 Project Architecture

```
SiteWatch/
├── client/                     # React.js Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Navigation, scheduler indicator, alert bell
│   │   │   ├── StatsOverview.jsx       # Real-time metrics cards
│   │   │   ├── MonitorCard.jsx         # Card with status, latency, diff & check triggers
│   │   │   ├── AddMonitorModal.jsx     # Monitor creation with live scraper test
│   │   │   ├── DiffViewerModal.jsx     # Side-by-side & unified diff viewer
│   │   │   ├── SandboxPlayground.jsx   # Interactive test laboratory
│   │   │   ├── NotificationDrawer.jsx  # Dispatched alerts & test email sender
│   │   │   └── AuthModal.jsx           # Sign in, registration & instant demo
│   │   ├── context/
│   │   │   └── AuthContext.jsx         # JWT authentication state
│   │   ├── services/
│   │   │   └── api.js                  # Axios client with interceptors
│   │   ├── App.jsx                     # Dashboard orchestrator
│   │   ├── index.css                   # Tailwind styles, glassmorphism, diff styling
│   │   └── main.jsx
│   └── package.json
│
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                   # Mongoose connection with MongoMemoryServer fallback
│   │   ├── middleware/
│   │   │   └── authMiddleware.js       # JWT bearer token verification
│   │   ├── models/
│   │   │   ├── User.js                 # User accounts & preferences
│   │   │   ├── Monitor.js              # Monitored URLs, selector, interval, status
│   │   │   ├── Snapshot.js             # Historical captures & content hashes
│   │   │   ├── ChangeLog.js            # Granular diff records & line counts
│   │   │   └── NotificationLog.js      # Alert dispatch history & preview links
│   │   ├── routes/
│   │   │   ├── authRoutes.js           # Register, login, demo, me
│   │   │   ├── monitorRoutes.js        # CRUD, check, toggle, diffs, preview scrape
│   │   │   ├── notificationRoutes.js   # Dispatched alerts & test email sender
│   │   │   └── sandboxRoutes.js        # Dynamic web page target & simulator
│   │   ├── services/
│   │   │   ├── scraperService.js       # Axios + Cheerio scraper & SHA-256 hasher
│   │   │   ├── diffService.js          # Line-by-line diff computation & snippet builder
│   │   │   ├── notificationService.js  # Nodemailer transporter & HTML email generator
│   │   │   └── schedulerService.js     # node-cron task runner
│   │   └── server.js                   # Express application entrypoint
│   ├── .env                            # Environment configuration
│   └── package.json
│
├── package.json                # Root package with concurrently runner
└── README.md
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js** (v18+ or v20+)
- **MongoDB** (Local instance or MongoDB Atlas. If none is installed, the backend will automatically spin up an embedded high-performance in-memory MongoDB instance so you can run immediately without setup!)

### 2. Install Dependencies
Run from the root directory:
```bash
npm run install:all
```

Or individually:
```bash
# In server directory
cd server
npm install

# In client directory
cd ../client
npm install
```

### 3. Start Both Backend & Frontend Concurrently
From the root directory, run:
```bash
npm run dev
```

- **Frontend Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **Sandbox Target**: `http://localhost:5000/api/sandbox/page`

---

## 🧪 Testing Change Detection in 30 Seconds

1. Open `http://localhost:5173` in your browser.
2. Click **"Launch Instant Demo"** or **"Explore Demo"** on the login modal.
3. Switch to the **"Interactive Sandbox"** tab in the top navigation.
4. Click **"Simulate Price Drop (₹1,49,900 → ₹1,19,900)"**.
5. Click **"Trigger Scrape & View Instant Diff"**.
6. Watch the side-by-side diff highlight additions in **green** and removals in **red**, with notification delivery logged!
