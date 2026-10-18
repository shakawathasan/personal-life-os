# Personal Life OS 🌿

> **All-in-One Personal Workspace with University Notebook, Google Drive, AI Tools, and Aesthetic Glassmorphism UI**

An offline-first, mobile-responsive workspace uniting Cornell lecture notes, legal case briefs, PDF & screenshot OCR, Google Drive cloud backups, study flashcards (spaced repetition), voice transcription, and personal productivity in a clean, glassmorphism interface.

---

## 📱 How to Install on Your Android Phone

Personal Life OS is configured as a **Progressive Web App (PWA)**, meaning you can install it on your Android phone immediately without an app store, or generate an installable `.apk` file using Google's official tools.

### Option 1: Instant Installation (Recommended — No build needed)

1. Open your live app URL on your phone's browser (**Google Chrome** on Android):
   ```
   https://ais-pre-juvrbartbkqvg5bp2da5ho-291540299328.asia-northeast1.run.app
   ```
2. Tap the **Three Dots Menu (⋮)** in the top right corner of Chrome.
3. Tap **"Install app"** or **"Add to Home screen"**.
4. Tap **Install**.
5. The **Personal Life OS** icon will appear on your phone home screen and app drawer. It launches in full-screen standalone mode with offline caching and microphone support!

---

### Option 2: Generate a Native Android APK (`.apk`)

To generate an installable `.apk` package file for Android:

#### Method A: Using PWABuilder (Fastest, 1-Click APK Generator)
1. Visit [PWABuilder.com](https://www.pwabuilder.com/).
2. Paste your live App URL:
   `https://ais-pre-juvrbartbkqvg5bp2da5ho-291540299328.asia-northeast1.run.app`
3. Click **Start**.
4. Click **Package for Android**.
5. Download your signed **`.apk` / `.aab`** file and transfer it to your phone.

#### Method B: Using Google Bubblewrap CLI (Official Trusted Web Activity)
```bash
# 1. Install Google Bubblewrap CLI
npm install -g @bubblewrap/cli

# 2. Initialize project from your live web app manifest
bubblewrap init --manifest="https://ais-pre-juvrbartbkqvg5bp2da5ho-291540299328.asia-northeast1.run.app/manifest.json"

# 3. Build signed APK
bubblewrap build
```
This generates `app-release-signed.apk` ready to install on any Android device via `adb install` or file transfer.

---

## 🐙 How to Upload to GitHub

Follow these steps to push this complete project to your GitHub account:

### 1. Create a New Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Name your repository (e.g., `personal-life-os`).
3. Leave **"Initialize this repository with a README"** **UNCHECKED** (we already have one).
4. Click **Create repository**.

### 2. Push Your Code to GitHub
Open your terminal in the project directory and run:

```bash
# Set your remote repository URL (replace YOUR_USERNAME and YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/personal-life-os.git

# Verify branch is main
git branch -M main

# Push all files
git push -u origin main
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js (v18 or higher)
- npm or bun

### Setup
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/personal-life-os.git
cd personal-life-os

# Install dependencies
npm install

# Start development server (Frontend + Backend on Port 3000)
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:
```env
# Optional: Google Gemini AI API Key for study synthesis & AI copilot
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Development / App Port
PORT=3000
```

---

## 🛠 Features Summary

- **University Notebook**: Rich text editor, Cornell lecture notes (cues, notes, synthesis), Legal Case Briefs, Statute Organizer.
- **Google Drive Sync**: Real-time upload, full JSON workspace backups, and offline queue.
- **Document Vault**: PDF viewer, screenshot intelligence, and OCR extraction.
- **Study Center**: Spaced repetition flashcards (`Again`, `Hard`, `Good`, `Easy`), practice quizzes, and bilingual vocabulary bank (English & Bangla).
- **Voice Studio**: In-browser audio recording, speech-to-text transcription, and automated lecture note conversion.
- **AI Workspace**: Gemini 2.5 Flash academic copilot with one-click "Save to Notebook".
- **Productivity Suite**: Personal finance, subscription manager, Pomodoro timer, private journal, and bookmarks.
- **Universal Capture & Search**: Accessible anywhere via `Cmd/Ctrl+K` and `Cmd/Ctrl+N`.
- **Aesthetic Glassmorphism UI**: Forest green (`#23483F`), warm ivory (`#FAF8F3`), muted sage, and champagne accents with complete dark mode support.
