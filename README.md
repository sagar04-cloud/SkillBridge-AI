# 🗺️ SkillBridge AI

**Bridging the gap between your current skills and your dream career with Artificial Intelligence.**

SkillBridge AI is a high-performance career guidance platform that leverages the power of Google's Gemini 2.x models to provide objective, data-driven career roadmap generation. By analyzing your resume against a target job role, it identifies critical skill gaps and provides a step-by-step learning path to help you land your next role.

---

## ✨ Key Features

-   **🔍 Intelligent Gap Analysis** – Detailed comparison of your resume against industry standards for your target role.
-   **📊 Visual Skill Matrix** – Dynamic charts visualizing technical, soft, and tool-based skill levels using [Recharts](https://recharts.org/).
-   **🛣️ 6-Phase Learning Roadmap** – A structured, week-by-week plan to acquire missing competencies.
-   **📚 Curated Resources** – Direct links to high-quality courses, documentation, and articles tailored to your roadmap.
-   **🛠️ Portfolio-Ready Projects** – Personalized project recommendations with difficulty levels and technology stacks.
-   **✨ Premium User Experience** – A sleek, glassmorphic dashboard with smooth animations and a responsive design.

---

## 🛠️ Tech Stack

-   **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
-   **AI Engine:** [Google Gemini API](https://ai.google.dev/) (Optimized for Gemini 2.5 Flash)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Data Visualization:** [Recharts](https://recharts.org/)
-   **Icons:** Lucide-style React Icons

---

## 🚀 Getting Started

Follow these steps to get the project running locally on your machine.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18.x or higher)
-   [NPM](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/sagar04-cloud/SkillBridge-AI.git
    cd SkillBridge-AI
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure local environment:**
    Create a `.env.local` file in the root directory and add your Gemini API Key:
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

4.  **Launch the development server:**
    ```bash
    npm run dev
    ```

---

## ⚙️ Configuration

The application uses a prioritized list of Gemini models to ensure reliability:
1. `gemini-2.5-flash` (Primary)
2. `gemini-2.5-pro`
3. `gemini-2.0-flash`
4. `gemini-1.5-pro`

---

## 🤝 Contact & Support

This project is maintained by **Sagar U**. Feel free to reach out for collaborations or questions!

-   **LinkedIn:** [linkedin.com/in/sagar-u/](https://www.linkedin.com/in/sagar-u/)
-   **Email:** [sagaru.works@gmail.com](mailto:sagaru.works@gmail.com)
-   **Portfolio:** [Sagar's Portfolio](https://github.com/sagar04-cloud)

---

Developed with ❤️ by **SkillBridge**
