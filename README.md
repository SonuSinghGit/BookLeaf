# BookLeaf Publishing — Author Support & Operations Communication Portal

An enterprise-ready Full-Stack MERN application designed for **BookLeaf Publishing** to handle author communication at scale. It features dedicated **Author-Facing** and **Admin-Facing** interfaces powered by real-time updates and an intelligent **BookLeaf Knowledge Base & AI-Drafting Engine**.

---

## 🌟 Architecture & Features Summary

### 1. Author Portal (`frontend/`)
- **Authentication**: Email/Password Sign-In & Registration with JWT token handling and input validation.
- **My Books**: Comprehensive dashboard displaying all author's books, real-time sales copies, gross royalty earned, royalty paid out, pending royalties, ISBNs, print partners, platform availability badges (Amazon India, Flipkart, etc.), and graceful handling of edge cases (e.g. books in production with null MRP / 0 sales).
- **Submit Support Query**: Clean ticket creation form with book dropdown selector (or *"General / Account Level"*), subject line, detailed description field, and file attachment support (photos of misprints, documents).
- **My Tickets & Real-Time Thread**: Interactive ticket list with status badges (`Open`, `In Progress`, `Resolved`, `Closed`), priority badges, and category tags. Features live conversation threads where admin responses and author replies update in **real time** without page refreshes.
- **Author Profile & Payout Settings**: Allows authors to update contact details and linked bank account (Account Number, IFSC Code, Bank Name) for quarterly royalty transfers.

### 2. Admin Portal (`admin-dashboard/` & embedded in `frontend/`)
- **Ticket Queue Desk**: Centralized queue of all tickets across all authors with multi-parameter filtering:
  - **Status Filter**: `All`, `Open`, `In Progress`, `Resolved`, `Closed`
  - **Category Filter**: `Royalty & Payments`, `ISBN & Metadata Issues`, `Printing & Quality`, `Distribution & Availability`, `Book Status & Production Updates`, `General Inquiry`
  - **Priority Filter**: `Critical`, `High`, `Medium`, `Low`
  - **Smart Sorting**: `⚡ Most Urgent First` (automatically flags Critical & High unresolved tickets with visual alert indicators), `⏳ Oldest Unresolved`, and `Newest First`.
  - **Search Bar**: Instant keyword lookup across ticket numbers, subjects, author names, and books.
- **AI-Powered Auto-Classification & Score**: Automatically classifies queries into the 6 categories and assigns priority based on severity. Admins can override both at any time with a single click.
- **AI-Drafted Response Engine**: Contextual draft responses generated according to the **BookLeaf Knowledge Base** and **Empathetic Tone Guidelines** (explaining the 80/20 profit split, quarterly cycles, ₹1,000 threshold, reprint turnaround, etc.). Admins can click *"Insert into Response Box"* to review and customize the draft before sending.
- **Ticket Management**: Update status, assign tickets to oneself or team members, and compose official responses.
- **Internal Ops Notes**: Private team notes section completely hidden from the author view.
- **Authors & Catalog Inspector**: Tabular overview of all authors and titles with aggregated sales and royalty totals.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express 5, MongoDB / Mongoose, JWT (`jsonwebtoken`), `bcryptjs`, `cookie-parser`, `cors`, `socket.io`.
- **Frontend & Admin**: React 18, Vite, **React Hook Form** (`react-hook-form`), **TanStack React Query** (`@tanstack/react-query`), Tailwind CSS v4, Lucide Icons, `socket.io-client`.
- **Database**: MongoDB (Local or MongoDB Atlas).
- **Theme**: Clean minimalist white aesthetic with crisp typography, subtle gray borders, and accessible color badges.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://127.0.0.1:27017` (or MongoDB Atlas connection string in `.env`)

### Step 1: Backend Setup & Database Seeding

```bash
# Navigate to backend directory
cd backend

# Install dependencies (already installed)
npm install

# Seed the database with the provided BookLeaf sample dataset (10 authors, 18 books, and starter tickets)
npm run seed

# Start backend server (starts on http://localhost:5000 with Socket.io)
npm start
# or node src/index.js
```

### Step 2: Author Portal Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Author Portal opens on http://localhost:5173
```

### Step 3: Admin Dashboard Setup

You have **two convenient options** to test the Admin Portal:

#### Option A: Dedicated Standalone Admin App
```bash
# In a separate terminal, navigate to admin-dashboard
cd admin-dashboard

# Install dependencies
npm install

# Run admin dashboard
npm run dev
# Admin Dashboard opens on http://localhost:5174
```

#### Option B: Seamless Switcher in Author Portal
Open `http://localhost:5173` and click the **"Admin Dashboard"** button in the top navigation bar to access the full admin suite without running a second Vite process.

---

## 🔑 Test Credentials (Pre-Seeded)

### Admin Account
| Role | Email | Password |
|---|---|---|
| **BookLeaf Operations Admin** | `admin@bookleaf.com` | `admin123` |

### Sample Authors (Pre-seeded with real books & royalties)
| Author Name | Email | Password | Books |
|---|---|---|---|
| **Priya Sharma** | `priya.sharma@email.com` | `password123` | *Whispers of the Ganges*, *The Saffron Diaries* |
| **Rohit Kapoor** | `rohit.kapoor@email.com` | `password123` | *Code & Karma*, *Startup Sutra* |
| **Ananya Reddy** | `ananya.reddy@email.com` | `password123` | *Between Two Temples* |
| **Vikram Joshi** | `vikram.joshi@email.com` | `password123` | *Debugging Life*, *The Last Monsoon* |
| **Meera Nair** | `meera.nair@email.com` | `password123` | *Cardamom & Chaos*, *Letters from Lakshadweep* |
| **Sneha Kulkarni** | `sneha.kulkarni@email.com` | `password123` | *The Algorithm of Love*, *Ctrl+Alt+Delete My Ex*, *Midnight in Mysore (In Production)* |
| **Kavita Deshmukh** | `kavita.deshmukh@email.com` | `password123` | *Raising Roots (In Production)*, *The Nagpur Notebooks* |

*Note: The login screen includes 1-click autofill buttons for Priya Sharma, Rohit Kapoor, and Admin.*

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Create a new author account (`name`, `email`, `password`, `phone`, `city`).
- `POST /api/auth/login`: Authenticate author or admin (`email`, `password`). Returns JWT token & profile.
- `GET /api/auth/me`: Get current authenticated user details (Protected).
- `PATCH /api/auth/profile`: Update author phone, city, or bank account details (Protected).
- `GET /api/auth/authors`: Retrieve all authors with aggregated book count and royalty summaries (Admin only).
- `GET /api/auth/stats`: Retrieve queue KPI metrics (Total, Open, In Progress, Resolved, Critical, High) (Admin only).

### Books (`/api/books`)
- `GET /api/books/my-books`: Retrieve authenticated author's books and aggregated royalty calculations (Protected).
- `GET /api/books/all`: Search and filter catalog books across authors (Admin only).
- `GET /api/books/:id`: Retrieve single book details.

### Support Tickets (`/api/tickets`)
- `POST /api/tickets`: Create a support ticket. Automatically classifies category and priority score, and generates initial AI draft response (Protected).
- `GET /api/tickets/my-tickets`: Get all tickets submitted by author (Protected; internal notes and admin AI metadata stripped).
- `GET /api/tickets`: Retrieve all tickets with filters (`status`, `category`, `priority`, `search`, `sortBy`) (Admin only).
- `GET /api/tickets/:id`: Get full ticket thread with messages and internal notes (Protected).
- `PATCH /api/tickets/:id/status`: Update status (`Open`, `In Progress`, `Resolved`, `Closed`) (Admin only).
- `PATCH /api/tickets/:id/classification`: Override AI category and priority (Admin only).
- `PATCH /api/tickets/:id/assign`: Assign ticket to an admin (Admin only).
- `POST /api/tickets/:id/internal-notes`: Add private internal note (Admin only).
- `POST /api/tickets/:id/messages`: Post a response/reply to the ticket thread (Author or Admin).
- `POST /api/tickets/:id/ai-draft`: Regenerate contextual AI draft response (Admin only).

### Database Seeder (`/api/seed`)
- `POST /api/seed` or `GET /api/seed`: Reset and re-seed database with sample records and starter tickets.

---

## 🧠 AI Integration & Prompt Strategy

### 1. Knowledge Base Alignment
The AI service in `backend/src/services/aiService.js` strictly reflects BookLeaf's operational policies:
- **80/20 Royalty Split**: 80% net profit to the author (Net Profit = MRP - Printing - Platform Commission - Shipping).
- **Quarterly Payout Window**: Royalties calculated quarterly and paid within 45 days.
- **₹1,000 Threshold**: Accumulated royalties below ₹1,000 automatically roll over to the subsequent quarter.
- **ISBN Management**: Unique BookLeaf imprint ISBNs; data mismatches escalated as High Priority to the production team within 48 hours.
- **Print Quality**: Free replacement reprints for defective copies upon photographic proof; turnaround 5–7 business days.
- **Distribution Re-sync**: Resolving "Currently Unavailable" listings on Amazon/Flipkart within 24–48 hours.

### 2. Tone Guidelines
- Empathy first: Acknowledges author anxiety or frustration before explaining policies.
- Transparent & specific: Quotes numbers, payout cycles, and turnaround times rather than vague assurances.
- Clear next step: Closes with an actionable timeline or requested confirmation.

### 3. Graceful Degradation & Resilience
- **Offline / Zero-API-Key Operation**: The system comes equipped with an offline BookLeaf Knowledge Engine that generates high-fidelity, context-aware responses and accurate classification even if no LLM key is configured.
- **LLM Extension Ready**: An OpenAI or Anthropic key can be specified in `.env` (`OPENAI_API_KEY`) to dynamically enhance drafting without altering frontend contracts.

---

## 📝 1-Page Evaluation Write-Up

### Approach & Prioritisation
When building this solution, I prioritized **real-world usability** and **sound system architecture**:
1. **Author & Admin Workflow Completeness**: Rather than mock UI shells, both portals are fully functional with live state management, database persistence, and session preservation.
2. **Real-Time Responsiveness**: Authors and support staff should never need to refresh to see updates. We implemented a hybrid real-time architecture: WebSockets (`Socket.io`) for instantaneous push notifications plus an automatic 5-second polling fallback for firewall resilience.
3. **Data Integrity & Role-Based Access Control**: Strict middleware ensures authors only access their own data, and sensitive operational notes are filtered out before sending responses to authors.
4. **Edge-Case Resilience**: The application cleanly handles books in production (e.g. *Midnight in Mysore* with null MRP and unassigned ISBN), authors with zero payouts, and tickets below the ₹1,000 threshold.

### Trade-Offs Made
- **File Uploads**: Designed as a rich UI file picker (with file size, type validation, and preview chips) stored as metadata on the ticket. Actual cloud storage (AWS S3 / Cloudinary) was omitted to keep local setup free of external dependencies.
- **AI Integration**: Implemented a knowledge-base rule engine with structured LLM prompt handlers. This guarantees 100% testability out of the box without requiring recruiters to provide credit-card-backed API keys.

### Evolution to Production
If deploying this application to enterprise production at BookLeaf scale (processing 1,200+ monthly titles and 22,000+ catalog books):
1. **RAG (Retrieval-Augmented Generation)**: Vectorize the complete author knowledge base, contracts, and platform FAQ using Pinecone/pgvector with hybrid keyword + semantic search.
2. **Automated Platform Sync Webhooks**: Connect directly with Amazon SP-API and Flipkart Marketplace APIs to auto-resolve "Currently Unavailable" tickets and auto-update buy-box status.
3. **Queue & Background Workers**: Use BullMQ / Redis for processing outbound email notifications and AI classification jobs asynchronously.
4. **Audit Logging & SLA Tracking**: Add SLA timers (e.g., 24h first response time, 48h resolution) with automated escalation alerts to senior support managers.

