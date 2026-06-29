<div align="center">
  <img src="https://via.placeholder.com/150x150.png?text=SkillSwap+Logo" alt="SkillSwap Logo" width="120" />
  <h1>🚀 SkillSwap — Freelance Micro-Task Platform</h1>
  <p><em>A modern, fast, and secure marketplace connecting clients with skilled freelancers for micro-tasks.</em></p>

  [![Live Preview](https://img.shields.io/badge/Live_Preview-View_Website-blue?style=for-the-badge&logo=vercel)](https://taskhive-eight-phi.vercel.app/)
</div>

---

## 📌 Project Overview
SkillSwap is a marketplace website where clients can post small, simple tasks (like making a logo, writing an article, or fixing a CSS bug) and freelancers can apply to finish them. It serves as a simpler, faster alternative to platforms like Fiverr or Freelancer.com, tailored for quick, one-time jobs. 

The platform connects people who need quick help with freelancers looking for easy opportunities to showcase their work and make money.

---

## 🔗 Useful Links
- **🌍 Live Website:** [TaskHive / SkillSwap](https://taskhive-eight-phi.vercel.app/)
- **💻 Client (Frontend) Repository:** [skillswap-client](https://github.com/username/skillswap-client)
- **⚙️ Server (Backend) Repository:** [skillswap-server](https://github.com/username/skillswap-server)

---

## 🔑 Admin Credentials
To explore the Admin Dashboard and its management capabilities, you can log in using these credentials:
- **Email:** `admin1@taskhive.com`
- **Password:** `admin1@taskhive.com`

> **Note:** The Admin Dashboard allows you to manage users, monitor tasks, and review all Stripe transaction histories.

---

## ✨ Best Features
- **🛡️ Secure & Role-Based Authentication:** Multi-role system (`Client`, `Freelancer`, `Admin`) backed by BetterAuth (Credential + Google OAuth) and JWT cookies.
- **💳 Integrated Stripe Payments:** Secure, seamless checkout experiences. Clients must pay via Stripe before work officially starts.
- **📊 Advanced Dashboards:** Specialized, private workspaces tailored for each user role to manage tasks, proposals, and earnings efficiently.
- **🔍 Smart Data Handling:** Backend-driven server-side pagination, real-time title search, and category filtering.
- **📱 Beautiful & Responsive UI/UX:** Built with Tailwind CSS, Shadcn UI, and smooth Framer Motion animations for a premium feel on any device.

---

## 🛠️ Technology Stack

### Frontend (Client)
![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white) ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
- **Framework:** Next.js (v16), React (v19)
- **Styling:** Tailwind CSS (v4), Shadcn UI, Radix UI
- **Animations:** Framer Motion
- **Auth & Payments:** Better-Auth, Stripe.js

### Backend (Server)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB) ![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white) ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
- **Framework:** Express.js (v5)
- **Database:** MongoDB
- **Security:** JSON Web Tokens (JWT), jose-cjs, Cookie-Parser, CORS
- **Payments:** Stripe SDK

---

## ⚙️ Environment Variables (.env)

To run this project locally, you need to configure the following environment variables.

### Client (`.env.local`)
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SERVER_URL=http://localhost:8000
MONGODB_URI=your_mongodb_connection_string
BETTER_AUTH_SECRET=your_better_auth_secret_key
BETTER_AUTH_URL=http://localhost:3000

# Stripe
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=your_stripe_publishable_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Server (`.env`)
```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
CLIENT_URL=http://localhost:3000

# JWT Secrets
JWT_SECRET=your_jwt_secret_key
```

---

## 🚀 How to Run Locally

1. **Clone the Repositories**
   ```bash
   git clone https://github.com/username/skillswap-client.git
   git clone https://github.com/username/skillswap-server.git
   ```

2. **Install Dependencies**
   Navigate to both `skillswap-client` and `skillswap-server` directories and run:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   - Create `.env.local` in the `skillswap-client` folder.
   - Create `.env` in the `skillswap-server` folder.
   - Fill in the variables based on the templates above.

4. **Start the Development Servers**
   - In the Server terminal:
     ```bash
     npm run dev  # or node index.js
     ```
   - In the Client terminal:
     ```bash
     npm run dev
     ```

5. **Open your Browser**
   Navigate to `http://localhost:3000` to view the application!
