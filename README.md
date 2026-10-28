# Inearly - India-First AI Mental Wellness Platform

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.115-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Privacy](https://img.shields.io/badge/Compliance-DPDP%20Act%202023-blue)](#privacy--compliance-posture)

**Inearly** is a culturally nuanced, privacy-first AI mental wellness platform engineered for the Indian context. It integrates radical data minimization principles, strict user consent lifecycle management, and ephemeral conversation modes.

---

## 1. Monorepo Structure

```
inearly/
├── backend/                     # Python FastAPI Service
│   ├── app/
│   │   ├── api/v1/endpoints/   # Versioned API routes (health, chat, consent)
│   │   ├── core/config.py      # Pydantic v2 application settings
│   │   └── main.py             # App initialization & security headers middleware
│   ├── requirements.txt        # Backend dependencies
│   └── .env.example            # Backend env template
│
├── frontend/                    # Next.js 16 (App Router + TypeScript + Tailwind CSS)
│   ├── src/
│   │   └── app/
│   │       ├── api/health/     # Next.js API route (/api/health)
│   │       ├── globals.css     # Global styling & Tailwind CSS
│   │       ├── layout.tsx      # Root layout
│   │       └── page.tsx        # Inearly landing experience & telemetry status
│   ├── package.json
│   └── .env.example            # Frontend env template
│
├── supabase/                    # Database Migrations & Schemas
│   ├── migrations/
│   │   └── 20261027000000_init_inearly_schema.sql # 5 core tables, RLS, DPDP triggers
│   └── README.md
│
├── .env.example                 # Root configuration reference
├── .gitignore
└── README.md
```

---

## 2. Privacy & Compliance Posture (DPDP Act 2023)

| Principle | Implementation in Inearly |
| :--- | :--- |
| **Zero Direct PII** | No real names, phone numbers, email addresses, or national IDs in core tables. |
| **Pseudonymization** | Users operate under non-identifying screen handles/pseudonyms. |
| **Data Minimization** | Coarse demographic bands (`13-17`, `18-24`, `25-34`, `35-49`, `50+`) instead of precise birthdates. |
| **Revocable Consent** | Granular consent tracking table (`consents`) recording grant & withdrawal timestamps per purpose. |
| **Encrypted Messages** | Zero plaintext message storage; envelope encryption payload or zero-knowledge vault references. |
| **Automated Purging** | Default 30-day retention with scheduled pruning routines (`prune_expired_conversations()`). |
| **Tentative Tagging** | AI-inferred concern tags are explicitly flagged `tentative` until confirmed by the user. |

---

## 3. Database Schema Overview

The database contains 5 core tables with Row-Level Security (RLS) enabled:

1. **`users`**: `id` (UUID PK), `age_band` (coarse band), `pseudonym`, `created_at`.
2. **`consents`**: `id` (UUID PK), `user_id` (FK), `purpose`, `version`, `granted_at`, `withdrawn_at`.
3. **`conversations`**: `id` (UUID PK), `user_id` (FK), `mode` (`'listen'` | `'plan'`), `created_at`, `retention_expiry`.
4. **`messages`**: `id` (UUID PK), `conversation_id` (FK), `role` (`'user'` | `'assistant'`), `encrypted_content_or_reference`, `timestamp`.
5. **`concern_tags`**: `id` (UUID PK), `conversation_id` (FK), `category`, `tentative_flag` (BOOLEAN), `user_confirmed` (BOOLEAN).

---

## 4. Quickstart Guide

### Prerequisites
- Node.js 18+ (Tested on v22)
- Python 3.10+ (Tested on 3.13)
- Supabase account or local Supabase CLI

### Backend Setup
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\Activate.ps1 | Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```
- Health Check: `http://localhost:8000/health`
- Detailed Telemetry: `http://localhost:8000/api/v1/health`
- Swagger Docs: `http://localhost:8000/docs`

### Frontend Setup
```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```
- Web Application: `http://localhost:3000`
- Health Check: `http://localhost:3000/api/health`
