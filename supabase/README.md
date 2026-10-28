# Inearly Supabase PostgreSQL Database Architecture

## 1. Overview & Data Minimization Principles (DPDP Act 2023)

Inearly is architected as an **India-First AI Mental Wellness Platform**. Because mental wellness records are sensitive personal data under India's **Digital Personal Data Protection (DPDP) Act, 2023**, our database schema enforces strict privacy-by-design and data minimization principles:

- **Zero Direct PII:** Real names, email addresses, phone numbers, and national identifiers (e.g. Aadhaar) are never stored in core platform tables.
- **Pseudonymization:** Users are assigned non-identifying monikers/pseudonyms.
- **Coarse Demographic Granularity:** Age is captured exclusively as broad bands (`13-17`, `18-24`, `25-34`, `35-49`, `50+`) rather than precise birthdates.
- **Purpose-Specific & Revocable Consent:** Granular tracking of user consent grants and withdrawals per purpose (e.g. `ai_conversation`, `crisis_detection`) with immutable timestamps.
- **Envelope-Encrypted Message Payloads:** Messages store zero raw mental health transcripts; records contain application/envelope encrypted payloads or zero-knowledge vault references.
- **Automated Lifecycle Expiry:** Sessions feature built-in `retention_expiry` timestamps (defaulting to 30 days) and automated hard-deletion routines (`prune_expired_conversations()`).
- **Tentative vs User-Confirmed AI Categorization:** AI-inferred concern tags (e.g. anxiety, workplace burnout) are tagged `tentative_flag = true` and `user_confirmed = false` to prevent biased or clinical mislabeling without explicit user confirmation.

---

## 2. Table Specifications & Relations

```
               +-------------------+
               |       users       |
               +-------------------+
               | id (PK, UUID)     |
               | age_band (TEXT)   |
               | pseudonym (TEXT)  |
               | created_at        |
               +-------------------+
                         |
           +-------------+-------------+
           |                           |
           v                           v
  +------------------+       +-------------------+
  |     consents     |       |   conversations   |
  +------------------+       +-------------------+
  | id (PK, UUID)    |       | id (PK, UUID)     |
  | user_id (FK)     |       | user_id (FK)      |
  | purpose (TEXT)   |       | mode ('listen'|   |
  | version (TEXT)   |       |       'plan')     |
  | granted_at       |       | created_at        |
  | withdrawn_at     |       | retention_expiry  |
  +------------------+       +-------------------+
                                       |
                         +-------------+-------------+
                         |                           |
                         v                           v
               +-------------------+       +--------------------+
               |     messages      |       |    concern_tags    |
               +-------------------+       +--------------------+
               | id (PK, UUID)     |       | id (PK, UUID)      |
               | conversation_id   |       | conversation_id    |
               | role ('user'|     |       | category (TEXT)    |
               |       'assistant')|       | tentative_flag     |
               | encrypted_content |       | user_confirmed     |
               | timestamp         |       +--------------------+
               +-------------------+
```

### Table Definitions

1. **`users`**
   - `id` (`UUID`, Primary Key, `gen_random_uuid()`)
   - `age_band` (`TEXT`, check constraint: `13-17`, `18-24`, `25-34`, `35-49`, `50+`)
   - `pseudonym` (`TEXT`, non-identifying screen alias)
   - `created_at` (`TIMESTAMPTZ`, UTC)
   - `updated_at` (`TIMESTAMPTZ`, UTC)

2. **`consents`**
   - `id` (`UUID`, Primary Key)
   - `user_id` (`UUID`, Foreign Key -> `users.id` ON DELETE CASCADE)
   - `purpose` (`TEXT`, explicit consent reason, e.g., `ai_interaction`, `crisis_support`)
   - `version` (`TEXT`, policy version)
   - `granted_at` (`TIMESTAMPTZ`, UTC)
   - `withdrawn_at` (`TIMESTAMPTZ`, nullable, DPDP withdrawal tracking)

3. **`conversations`**
   - `id` (`UUID`, Primary Key)
   - `user_id` (`UUID`, Foreign Key -> `users.id` ON DELETE CASCADE)
   - `mode` (`conversation_mode`: `'listen'` or `'plan'`)
   - `created_at` (`TIMESTAMPTZ`, UTC)
   - `retention_expiry` (`TIMESTAMPTZ`, default `now() + INTERVAL '30 days'`)

4. **`messages`**
   - `id` (`UUID`, Primary Key)
   - `conversation_id` (`UUID`, Foreign Key -> `conversations.id` ON DELETE CASCADE)
   - `role` (`message_role`: `'user'` or `'assistant'`)
   - `encrypted_content_or_reference` (`TEXT`, encrypted blob or secure reference)
   - `timestamp` (`TIMESTAMPTZ`, UTC)

5. **`concern_tags`**
   - `id` (`UUID`, Primary Key)
   - `conversation_id` (`UUID`, Foreign Key -> `conversations.id` ON DELETE CASCADE)
   - `category` (`TEXT`, e.g., `academic_stress`, `anxiety`, `burnout`, `relationships`)
   - `tentative_flag` (`BOOLEAN`, default `true`)
   - `user_confirmed` (`BOOLEAN`, default `false`)
   - `created_at` (`TIMESTAMPTZ`, UTC)

---

## 3. Applying Migrations

### Via Supabase CLI:
```bash
supabase db push
```

### Via Supabase SQL Editor:
Copy and paste the contents of `migrations/20261027000000_init_inearly_schema.sql` into the SQL Editor in your Supabase dashboard and execute.
