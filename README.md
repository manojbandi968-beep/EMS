# EventSphere - Modern Full-Stack Event Management System (EMS)

A comprehensive, production-ready Event Management Platform built with **React 18, Vite, TypeScript, Tailwind CSS, Express, and Supabase (PostgreSQL, Auth & Storage)**.

---

## 🌟 Key Features

### 👤 User & Attendee Experience
* **Event Discovery**: Real-time keyword search, category filtering, and detailed modal views.
* **Authentication**: Email/password registration and login backed by Supabase Auth and synced profile data.
* **Event Ticketing & RSVP**:
  * One-click RSVP with automatic generation of unique ticket passes (e.g. `TKT-XXXX-XXXX`).
  * Strict capacity limits preventing over-booking.
  * Real-time seat updates and duplicate registration prevention per user.
* **Attendee Profile & Ticket Management**:
  * Dedicated "My Registrations" view showing active event passes.
  * Easy registration cancellation with immediate seat release.

### 🛡️ Admin Management Console
* **Platform Analytics & KPIs**: Live dashboard metrics tracking total events, total registrations, active attendees, and categories.
* **Event Lifecycle Management**: Create, edit, and delete events with date pickers, category tagging, and capacity control.
* **Banner Uploads via Supabase Storage**:
  * Direct image uploads via the admin modal with instant previews before saving.
  * Public CDN asset serving backed by the `event-banners` Supabase Storage bucket.
* **Attendee Audit Table**: Real-time table viewing all registrations across the platform with attendee contact info and ticket IDs.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Axios, React Router v6 |
| **Backend** | Node.js, Express, TypeScript, Multer, CORS, dotenv |
| **Database & Auth** | Supabase (PostgreSQL, Supabase Auth, Row Level Security, Storage Buckets) |

---

## 📁 Project Structure

```
event-management-system/
├── client/                      # React + Vite TypeScript frontend
│   ├── src/
│   │   ├── api/                 # Axios API client configured with Bearer tokens
│   │   ├── components/          # Reusable UI components (Modals, Nav, Cards, Admin)
│   │   ├── context/             # AuthContext integrating Supabase Auth
│   │   ├── pages/               # HomePage, AdminPage, ProfilePage, LoginPage, RegisterPage
│   │   └── types/               # TypeScript interfaces (Event, Registration, User)
│   ├── package.json
│   └── vite.config.ts
├── server/                      # Express TypeScript backend
│   ├── src/
│   │   ├── config/              # Supabase admin client initialization & storage setup
│   │   ├── controllers/         # Event, registration, category & admin controllers
│   │   ├── middleware/          # Bearer JWT verification & requireAdmin authorization
│   │   ├── routes/              # Express API route modules
│   │   └── server.ts            # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── test_e2e_full.mjs            # End-to-end automated verification script
├── .gitignore                   # Root gitignore excluding secrets and build artifacts
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js** v18+ (tested on v24)
* **npm** or **pnpm**
* A **Supabase** project with PostgreSQL and Storage enabled.

### 2. Database Schema (Supabase)
Ensure the following tables exist in your Supabase project:
* `profiles` (`id` uuid PK refs `auth.users`, `email` text, `full_name` text, `role` text, `created_at` timestamptz)
* `categories` (`id` uuid PK, `name` text, `slug` text, `description` text)
* `events` (`id` uuid PK, `title` text, `description` text, `banner_url` text, `location` text, `start_date` timestamptz, `end_date` timestamptz, `capacity` int, `registered_count` int, `category_id` uuid refs `categories`)
* `registrations` (`id` uuid PK, `event_id` uuid refs `events`, `user_id` uuid refs `profiles`, `ticket_code` text, `status` text, `registered_at` timestamptz)

### 3. Server Setup
```bash
cd server
npm install
cp .env.example .env
# Fill in PORT, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and CLIENT_URL
npm run dev
```
The server will run on `http://localhost:5000`.

### 4. Client Setup
```bash
cd ../client
npm install
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_API_BASE_URL
npm run dev
```
The client will be accessible at `http://localhost:5173`.

---

## 🔒 Security Best Practices
* Sensitive `SUPABASE_SERVICE_ROLE_KEY` is kept exclusively on the server and is never exposed to the client.
* All admin mutations and dashboard queries are protected by role verification middleware (`profiles.role === 'admin'`).
* All image uploads are restricted by MIME type to prevent malicious file uploads.

---

## 📜 License
MIT
