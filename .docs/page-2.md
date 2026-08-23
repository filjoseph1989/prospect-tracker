I have created **ProspectPulse** — a dedicated tracking application in [`prospect-tracker`](prospect-tracker) designed specifically for appointment setting across your [100 UK residential property prospects](Copy%20of%20UK_residential_property_automation_prospects_100.xlsx%20-%20100%20Prospects%20%281%29.csv).

---

### 🌐 Access the App

The app is currently running live at:
👉 **[http://localhost:4000](http://localhost:4000)**

---

### ✨ Key Features Built for Multi-Contact Appointment Setting

1. **Multi-Stakeholder Coordination per Company**:
   - Accounts with multiple executives (e.g. **Centrick** with *Pete Williamson, James Ackrill, Phil Johns*; **EweMove** with *Craig Blake, Mo Ahmed, Al Delgado, Ben Brind*; **Rendall & Rittner**, **Hunters**) have each person tracked individually.
   - **LinkedIn Outreach Channel**: 1-click open profile URL, status tracking (`Not Started`, `Pending Request`, `Connected`, `InMail Sent`, `Replied`), and setter assignment (`Fil`, `Panu`, etc.).
   - **Email Outreach Channel**: 1-click email copy & `mailto:` launch, multi-step email statuses (`Not Sent`, `Sent`, `Follow-up 1`, `Follow-up 2`, `Replied`, `Bounced`), and setter assignment.
   - **Appointment Tracking**: Track progress from `Not Booked` → `In Discussion` → `🎯 Appointment Booked`.
   - **Add More Stakeholders**: Add new decision-makers to any account anytime.

2. **Dedicated Multi-Contact Focus View**:
   - Switch to **Multi-Contact Focus** to view and coordinate outreach across companies with 2+ decision makers so team members never collide and every stakeholder is reached.

3. **All Prospects Table with Inline Quick-Actions**:
   - Search by company, contact name, email, or automation opportunities.
   - Filter by Priority (**A / B / C**) and channel status (e.g. *LinkedIn Connected*, *Email Sent*, *Multi-Contact Only*, *Uncontacted*).
   - Expand rows to manage all stakeholders directly without opening extra windows.

4. **Pipeline Kanban Board**:
   - Move accounts across stages: `To Research` → `Ready for Outreach` → `LinkedIn Pending` → `Email Sent / Multi` → `In Discussion` → `🎯 Booked`.

5. **Speed Outreach Flow (Queue Mode)**:
   - Click **Speed Outreach** (or press `←` / `→`) to step through prospects one-by-one with full company intelligence, automation angles, and one-click contact actions.

6. **Outreach Scripts & Email Templates**:
   - Built-in customizable templates tailored for UK Property Managers (Tenant triage, maintenance automation, BTR scalability, LinkedIn connection notes, follow-up value bumps).

7. **Instant Persistence & CSV Export**:
   - All updates are saved instantly and can be downloaded back to CSV using the **Export CSV** button.

---

### 🛠️ Terminal Commands

To start the app again in the future:

```bash
cd /Users/fil/Fil/prospect-tracker
node server/index.js
```
*(Or run `npm run dev` to launch in development mode with live reload at `http://localhost:3000`)*