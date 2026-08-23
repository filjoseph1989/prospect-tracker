# 🎯 ProspectPulse — UK Residential Property Appointment Setting Tracker

A dedicated, fast web application built to streamline and track appointment setting outreach across 100 UK residential property automation prospects.

---

## 🚀 Key Features

### 1. Multi-Stakeholder Account Tracking
- **Multi-Contact Coordination**: Handles accounts with multiple key executives (e.g. Centrick with Pete Williamson, James Ackrill, Phil Johns; EweMove with Craig Blake, Mo Ahmed, Al Delgado, Ben Brind).
- **Independent Channels per Contact**:
  - **LinkedIn Channel**: 1-click open profile URL, status tracking (`Not Started`, `Pending Request`, `Connected`, `InMail Sent`, `Replied`), assignee tracking (`Fil`, `Panu`, etc.).
  - **Email Channel**: 1-click copy email, 1-click mail client launch, status tracking (`Not Sent`, `Sent`, `Follow-up 1`, `Follow-up 2`, `Replied`, `Bounced`), setter attribution.
  - **Appointment Funnel**: `Not Booked` → `In Discussion` → `🎯 Appointment Booked`.
- **Add / Edit Contacts**: Add new decision makers to any company with 1 click.

### 2. Multi-View Modes
- **All Prospects (Table View)**: Expandable company rows, instant search, priority filtering (A/B/C), inline status toggles, automation opportunity highlights.
- **Multi-Contact Focus Matrix**: A dedicated view exclusively showcasing accounts with multiple decision makers to coordinate multi-threaded outreach.
- **Pipeline Kanban Board**: Move prospects between `To Research`, `Ready for Outreach`, `LinkedIn Pending`, `Email Sent`, `In Discussion`, and `🎯 Appointment Booked`.
- **Speed Outreach Flow**: 1-by-1 focused queue to rapidly power through outreach with keyboard shortcuts (`←` / `→`).

### 3. Built-In UK Property Outreach Scripts & Templates
- 6 pre-crafted scripts tailored specifically for UK residential property managers (maintenance triage, 24/7 tenant query resolution, viewing automation):
  - Cold Email #1: Operational Bottlenecks & Maintenance Triage
  - Cold Email #2: BTR & Portfolio Scalability
  - LinkedIn Connection Note (Under 300 chars, high acceptance)
  - LinkedIn DM (Post-acceptance value offer)
  - Email Follow-Up #1 (Value bump)
  - Email Follow-Up #2 (Permission to close the loop)
- Dynamic variable insertion for `{CompanyName}`, `{FirstName}`, `{BusinessModel}`, `{LikelyAutomationSnippet}`.

### 4. Data Persistence & Export
- Local persistent storage with zero-latency updates.
- One-click **Export to CSV** (matching the original column schema).
- One-click **Export JSON Backup**.
- **Reset to CSV** option to restore initial data anytime.

---

## 🏃‍♂️ How to Run

### Quick Start (Server + Built App)
```bash
cd /Users/fil/Fil/prospect-tracker
node server/index.js
```
Open **[http://localhost:4000](http://localhost:4000)** in your browser.

### Development Mode (with Live Reloading)
```bash
cd /Users/fil/Fil/prospect-tracker
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.
