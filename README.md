# 🍅 TomatoFlow — Self-Hosted Pomodoro Timer

**TomatoFlow** is a modern, beautiful, self-hosted Pomodoro timer designed for personal productivity. The project is fully containerized with **Docker** and features a frontend built on **Vue 3 (Vite + Tailwind CSS v4)** and a backend built on **Node.js (Express + Socket.io)** backed by a **PostgreSQL** database.

---

## ✨ Features

*   **🔄 Server-Side Synchronization (WebSockets)**:
    The timer state is kept and managed entirely on the server. You can close your browser tab, shut down your computer, or reload the page, and the timer will keep ticking. Upon opening the app again, the timer state is instantly synchronized across all connected browser tabs.
*   **🎨 Premium Dynamic UI**:
    A sleek glassmorphic dashboard with smooth theme transitions depending on the current phase:
    *   `Focus Session` — Warm Coral/Rose theme
    *   `Short Break` — Calm Emerald Green theme
    *   `Long Break` — Deep Indigo Blue theme
*   **🎹 Synthesized Sound Alerts**:
    Uses the browser's native **Web Audio API** to synthesize audio chimes directly in code (positive upward chords when completing work, relaxed downward chords when completing breaks). No static audio files to fetch or fail loading.
*   **📊 GitHub-Style Contribution Calendar**:
    A compact grid representing the last 5 weeks (approx. 1 month) showing your daily Pomodoro focus consistency. Features weekend styling (dashed borders for rest days) and a distinct ring-highlight for the current day.
*   **📋 Task Management**:
    Create tasks, assign estimated Pomodoros (🍅), select a task for active focus, and check off completed items.
*   **⚙️ Settings Panel**:
    Easily customize work/break interval lengths using range sliders, and toggle automation features like auto-starting breaks or next focus sessions.

---

## 🛠️ Tech Stack

*   **Frontend**: Vue 3 (Composition API / `<script setup>`), Vite, Tailwind CSS v4, Socket.io-client, Axios, Lucide Icons.
*   **Backend**: Node.js, Express, Socket.io, pg (node-postgres), dotenv.
*   **Database**: PostgreSQL 15.
*   **Infrastructure**: Docker, Docker Compose.

---

## 🚀 Quick Start

To run the project locally, you will need **Docker** and **Docker Compose** installed.

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/tomato-flow.git
    cd tomato-flow
    ```

2.  **Start the containers**:
    ```bash
    docker compose up --build -d
    ```

3.  **Access the application**:
    *   **User Interface**: [http://localhost:5174](http://localhost:5174)
    *   **Backend API**: [http://localhost:3000](http://localhost:3000)

---

## 📂 Project Structure

```
pomodoro/
├── docker-compose.yml       # Docker Compose orchestration file
├── backend/                 # Node.js + Express backend service
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js         # Express HTTP endpoints & Socket.io handlers
│       ├── db.js            # PostgreSQL connection & schema bootstrapper
│       └── timer.js         # Server-side timer state machine
└── frontend/                # Vue 3 + Tailwind v4 frontend service
    ├── Dockerfile
    ├── package.json
    ├── index.html
    ├── src/
    │   ├── main.js
    │   ├── App.vue          # Core application layout
    │   ├── store.js         # Reactive app store & Audio synthesizer
    │   ├── index.css        # Tailwind v4 directives & color transition variables
    │   └── components/
    │       ├── Timer.vue    # Progress ring circular SVG countdown
    │       ├── TaskList.vue # Tasks CRUD list
    │       ├── Stats.vue    # Analytics cards & Contribution grid
    │       └── Settings.vue # Interval sliders & automation configurations
    └── vite.config.js
```

---

## ⚙️ Environment Variables

Default configuration variables are already declared in `docker-compose.yml`, but you can customize them if needed:

### Backend (`backend`)
*   `PORT`: Port for the API server (default is `3000`).
*   `DATABASE_URL`: Connection string for PostgreSQL database (`postgres://user:password@db:5432/dbname`).

### Frontend (`frontend`)
*   `VITE_API_URL`: Address of the backend server for APIs and WebSocket connection (default is `http://localhost:3000`).

---

## 🔒 Database Schema

Upon starting the backend server, the database tables are automatically initialized:
*   `tasks` — Stores lists of tasks, statuses, and pomodoro estimates.
*   `pomodoro_logs` — Keeps history of completed work and break sessions.
*   `settings` — Stores customized intervals and automatic trigger settings.
