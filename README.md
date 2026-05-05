# THE CHOSE (ONYX V2) 🦅

> **TACTICAL PERFORMANCE MATRIX | BY ONYX SQUADRON**

**THE CHOSE** is an elite-tier tactical golf caddie application designed for high-performance players. Powered by the **Onyx Squadron** engine, it provides surgical precision in club selection, swing analysis, and course strategy.

---

### 🛡️ CORE CAPABILITIES

*   **AI Caddie Mentorship**: Access the wisdom of Adam, Antoni, Arnold, and Josh—four distinct AI personalities ranging from sage veteran to clinical analyst.
*   **Surgical Analysis**: Vision-powered analysis for swings, lies, and green reading.
*   **Tactical Advice**: Context-aware club suggestions based on distance, wind, terrain, and player form (Cold, Pur, Standard).
*   **Luxury Interface**: A technical, dark-mode aesthetic with hardware-accelerated feedback and minimalist data visualization.
*   **Biometric Integration**: Track and optimize performance through integrated health and swing data.

---

### 🛠️ TECH STACK

*   **Frontend**: React 19 + Vite + Tailwind CSS 4.
*   **Intelligence**: Google Gemini (3-Flash / 3.1-Flash-TTS) for advanced reasoning and voice interactions.
*   **Backend**: Firebase (Auth, Firestore) for real-time synchronization.
*   **Motion**: Framer Motion for high-end fluid transitions.

---

### 📂 PROJECT STRUCTURE

```text
├── src/
│   ├── App.tsx             <-- Your main logic here
│   ├── components/         <-- UI Components
│   ├── services/           <-- Gemini & Firebase Logic
│   └── constants.ts        <-- Course & Caddie data
├── firestore.rules         <-- Security rules
└── README.md
```

---

### 🚀 INSTALLATION & DEPLOYMENT

1.  **Environment Config**:
    Create a `.env.local` file with:
    ```env
    VITE_GEMINI_API_KEY=your_key_here
    ```

2.  **Vercel Deployment**:
    Lorsque vous déployez sur Vercel, ajoutez `VITE_GEMINI_API_KEY` dans vos variables d'environnement. Sans le préfixe `VITE_`, la clé ne sera pas accessible au navigateur.
2.  **Dependencies**:
    ```bash
    npm install
    ```
3.  **Execution**:
    ```bash
    npm run dev
    ```

---

### 📐 PHILOSOPHY: LUXURY TECHNICAL

Every interface choice in **THE CHOSE** follows the **Onyx Squad** design language:
*   **Primary Color**: Onyx Black (Background)
*   **Accent Color**: Gold (#c9964a)
*   **Typography**: Inter (UI), JetBrains Mono (Technical Data).
*   **Mood**: Calm, Authoritative, Decisive.

---

*Proprietary of Onyx Squadron - Tactical Performance Matrix v2.0*
