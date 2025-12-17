# Job Spark AI – Frontend

This is the frontend application for the **Job Preparation AI Platform**.  
It provides an interactive user interface for job search, resume analysis, interview preparation, and AI-powered workflows.

---

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

---

## Prerequisites

Make sure you have the following installed:

- Node.js (v18 or later recommended)
- npm (comes with Node.js)

Check installation:
node -v
npm -v





## Getting Started (Local Development)

### 1️⃣ Clone the repository

git clone https://github.com/Arpitbanait/Job-Preparation-Agent.git
cd Job-Preparation-Agent/frontend/job-spark-ai



### 2️⃣ Install dependencies

npm install



### 3️⃣ Start the development server

npm run dev



### 4️⃣ Open in browser

Once the server starts, open:

http://localhost:5173


(The port may vary slightly — check the terminal output.)

---

## Project Structure

job-spark-ai/
├── public/
├── src/
│ ├── components/
│ ├── pages/
│ ├── hooks/
│ ├── services/
│ └── main.tsx
├── index.html
├── package.json
├── tailwind.config.ts
└── vite.config.ts


## Backend Integration

This frontend is designed to work with a **FastAPI backend**.

Make sure the backend server is running (default):

http://localhost:8000


API calls from the frontend will interact with backend endpoints for:
- Job search
- Resume analysis
- Interview preparation
- AI summaries

---

## Available Scripts

- `npm run dev` – Start development server
- `npm run build` – Build for production
- `npm run preview` – Preview production build locally

---

## Build for Production

npm run build



The optimized build will be generated in the `dist/` folder.

---

## Notes

- Environment variables (if any) should be added using `.env` files.
- Do not commit sensitive keys to the repository.

---

## Author

**Arpit Banait**  
GitHub: https://github.com/Arpitbanait  
LinkedIn: https://www.linkedin.com/in/arpit-banait-350238283/

