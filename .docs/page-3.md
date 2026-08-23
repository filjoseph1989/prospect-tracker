# 📋 ProspectPulse — Complete Built Functionality & Feature Inventory

This document details all functional capabilities, modules, views, API endpoints, and workflow features built into **ProspectPulse** (`/Users/fil/Fil/prospect-tracker`).

---

## 1. Multi-Stakeholder Account & Contact Architecture

- **Independent Multi-Contact Tracking**:
  - Supports multiple decision makers per company (Founders, CEOs, MDs, Operations Directors, CTOs).
  - Individual contact entities with name, role, direct email, alternative emails, LinkedIn profile URLs, setter assignees, timestamps, and notes.
- **Dedicated Outreach Channels per Contact**:
  - **LinkedIn Channel**:
    - 1-click external link to open LinkedIn profile.
    - Status lifecycle tracking (`Not Started`, `Not Connected`, `Pending`, `Connected`, `InMail Sent`, `Replied`).
    - Assigned Setter tracking (`Fil`, `Panu`, `Team`).
    - Date tracking for last LinkedIn contact.
  - **Email Channel**:
    - 1-click email copy to clipboard with real-time checkmark feedback.
    - 1-click `mailto:` launch with pre-filled subject and body.
    - Status lifecycle tracking (`Not Sent`, `Sent`, `Follow-up 1`, `Follow-up 2`, `Replied`, `Bounced`).
    - Assigned Setter tracking (`Fil`, `Panu`, `Team`).
    - Date tracking for last email sent.
  - **Appointment Setting Funnel**:
    - Direct status mapping per contact (`Not Booked` → `In Discussion` → `🎯 Appointment Booked` → `Not a Fit`).
- **Dynamic Stakeholder Management**:
  - 1-click **Add Decision Maker** to any company directly from Table View, Multi-Contact View, Speed Outreach Queue, or Company Modal.
  - Contact deletion with confirmation protection.
  - Contact-specific research notes editor with inline expand/collapse.

---

## 2. Multi-View Modes & Interface Workflows

### A. All Prospects (Interactive Table View)
- **Expandable Accordion Rows**:
  - Expand/collapse individual companies to view and manage all underlying contact cards and research notes without navigating away.
  - Global **Expand All** and **Collapse All** controls.
- **Multi-Column Sorting**:
  - Sort ascending/descending by Rank, Company Name, Priority, Contacts Count, or Pipeline Stage.
- **Pagination**:
  - 25 prospects per page with active page counters and navigation.
- **Inline Quick Actions**:
  - Pipeline stage dropdown selector with color-coded stage pills.
  - 1-click Pitch Script Generator button (`Sparkles` icon).
  - 1-click Edit Account modal button.
  - Direct links to company websites.

### B. Multi-Contact Focus View
- **Multi-Thread Matrix**:
  - Dedicated focus mode displaying only accounts with 2+ decision makers.
  - Header metric showing total high-value accounts and total decision makers.
- **Multi-Outreach Coordination**:
  - Aggregated badges showing live counts of Connected, Pending, and Emailed contacts per company.
  - **Copy All Emails**: 1-click copy for all contact emails in a comma-separated format for batch CC/BCC outreach.
  - Side-by-side contact cards to coordinate outreach between setters (e.g. Fil on LinkedIn, Panu on Email).

### C. Pipeline Kanban Board
- **Visual Drag/Select Workflow**:
  - 6 pipeline columns: `To Research`, `Ready for Outreach`, `LinkedIn Pending`, `Email Sent / Multi`, `In Discussion`, `🎯 Booked`.
  - Column counter badges reflecting real-time prospect volume per stage.
  - Account cards showing rank, priority, revenue, employee count, contact status summaries, and direct move dropdowns.
  - 1-click access to open Pitch Templates directly from any Kanban card.

### D. Speed Outreach Flow (Queue Mode)
- **Focused 1-by-1 Execution**:
  - Sequential outreach runner to power through accounts without distraction.
  - Full company intelligence displayed: revenue, employee count, business model, website.
  - Prominent display of automation hooks and research notes.
  - Full inline contact cards for rapid LinkedIn opening and email dispatching.
- **Keyboard Navigation**:
  - Left Arrow (`←`) and Right Arrow (`→`) for fast navigation between prospects.
  - `Escape` key to close.

---

## 3. Real-Time KPI Dashboard & Filtering Toolbar

- **Interactive Metric Cards**:
  - **Total Prospects**: Total companies, total contacts, and Priority A/B/C breakdown.
  - **Multi-Contact Accounts**: Count of accounts with multiple stakeholders (click to jump to Multi-Contact view).
  - **LinkedIn Outreach**: Total active touches, pending requests, and connected network.
  - **Email Outreach**: Sent volume, follow-ups, and active replies.
  - **Booked Appointments**: Confirmed meetings and active discussions with highlighted gradient badge.
- **Instant Search & Query Engine**:
  - Live full-text search across company names, business models, automation opportunities, research notes, contact names, emails, roles, and contact notes.
  - 1-click search clear.
- **Filter Toolbar**:
  - Priority filter: `ALL`, `Priority A`, `Priority B`, `Priority C`.
  - Status / Channel filters: `All`, `Multi-Contact Only`, `Email Sent`, `LinkedIn Connected`, `LinkedIn Pending`, `Uncontacted`.

---

## 4. UK Property Outreach Scripts & Pitch Templates

- **6 Built-in Property Management Pitch Scripts**:
  1. **Cold Email #1**: Operational Bottlenecks & Maintenance Triage (Focus on 24/7 tenant queries, maintenance ticket auto-routing).
  2. **Cold Email #2**: BTR & Portfolio Scalability (Scaling units without linear headcount increase).
  3. **LinkedIn Connection Note**: Concise pitch tailored to stay under LinkedIn's 300-character limit for high acceptance.
  4. **LinkedIn DM / InMail**: Post-acceptance value proposition focusing on 80% response time reduction.
  5. **Email Follow-Up #1**: Value Add & Case Example with contextual automation problem highlights.
  6. **Email Follow-Up #2 (Breakup)**: Polite loop closure and future check-in permission.
- **Dynamic Variable Interpolation**:
  - Auto-populates `{FirstName}`, `{CompanyName}`, `{BusinessModel}`, and `{LikelyAutomationSnippet}` with the selected company and contact data.
- **One-Click Actions**:
  - 1-click **Copy Script** (copies both Subject and Body).
  - 1-click **Copy Subject Only**.
  - 1-click **Open in Mail Client** with pre-filled subject and body encoded via `mailto:`.

---

## 5. Account & Decision Maker Modal Management

- **Company Edit & Creation**:
  - Modal to update Company Name, Priority (A/B/C), Stage, Website, Revenue status, Employee count, Business Model, Automation Opportunities, and Research Notes.
  - **Add New Prospect** flow to create custom accounts into the database with automatic rank assignment.
- **Stakeholder Creation & Editing**:
  - Add new decision makers with Name, Role, Email, and LinkedIn profile URLs.
  - Delete obsolete or inaccurate contacts with instant sync across all views.

---

## 6. Backend API & Data Persistence Layer

- **RESTful API Service (`server/index.js`)**:
  - `GET /api/prospects` — Fetch all prospects with full contact relationships.
  - `GET /api/prospects/:id` — Fetch single company by rank or ID.
  - `PUT /api/prospects/:id` — Update company attributes.
  - `POST /api/prospects/:id/contacts` — Add new contact to company.
  - `PUT /api/prospects/:id/contacts/:contactId` — Update contact status, channel attributes, or notes.
  - `DELETE /api/prospects/:id/contacts/:contactId` — Delete contact from company.
  - `GET /api/stats` — Real-time aggregation of outreach statistics and priority distribution.
  - `GET /api/export/csv` — Export complete dataset to downloadable CSV matching original schema.
  - `GET /api/export/json` — Export complete JSON database backup.
  - `POST /api/reset` — Reset database by re-parsing the original 100 prospects CSV file.
- **Automatic Stage Computation**:
  - Intelligent server-side stage progression engine: evaluates all contact statuses and auto-updates company stage (e.g. transitioning to `Multi-Channel Outreach`, `LinkedIn Connected`, or `Appointment Booked`).
- **Data Integrity & Robust CSV Parsing (`server/db.js`)**:
  - Parses multi-line executive names, multi-line emails, and LinkedIn links.
  - Smart fuzzy association linking individual emails and LinkedIn links to corresponding stakeholder names.
  - Cleans qualification prefixes (`MIRPM`, `MNAEA`, `MRICS`, `BSc`, `Hons`).
  - Atomic file writes using temp file swapping to prevent database corruption.

---

## 7. Operational & Technical Architecture

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React Icons |
| **Backend** | Node.js, Express.js |
| **Data Engine** | `csv-parse`, `csv-stringify`, Local JSON Persistence |
| **Build & Deploy** | Pre-built SPA served directly by Express server on port `4000`, with Vite dev server on port `3000` |
| **Data Set** | 100 UK Residential Property Automation Prospects |
