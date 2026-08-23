# 🏷️ Page 4: Outreach Status Markings & Workflow Lifecycle

This document specifies the status markings, workflow lifecycle, and dedicated navigation pages implemented in **ProspectPulse** (`/Users/fil/Fil/prospect-tracker`).

---

## 1. Overview & Core Navigation Pages

The application navigation is organized into **4 core workflow pages** to easily move companies through the pipeline:

1. **`📋 To Do`**
   - Active working queue holding uncontacted prospects.
   - When you finish working on a company and click `In Progress`, `Follow-Up`, or `Done`, it automatically moves out of this queue and the next company appears at the top.
2. **`⚡ In Progress`**
   - Holds prospects where outreach has been initiated (email sent or LinkedIn request sent).
3. **`⏳ Follow-Up`**
   - Holds prospects awaiting a follow-up touch (e.g. Follow-Up #1 or #2).
4. **`✅ Done`**
   - Holds completed prospects (appointment booked, qualified, or closed).
5. **`📁 All`**
   - Full unfiltered directory of all 100 prospects.

---

## 2. 4-Stage Status Taxonomy

| Workflow Page | Stage Marking | Action Trigger |
|---|---|---|
| **`📋 To Do`** | `To Do` | Default initial state for untouched prospects. |
| **`⚡ In Progress`** | `In Progress` | Cold outreach initiated (Email or LinkedIn). |
| **`⏳ Follow-Up`** | `Follow-Up` | No reply after initial contact; queued for follow-up sequence. |
| **`✅ Done`** | `Done` | Meeting booked, outreach sequence completed, or finalized. |

---

## 3. Metadata Stamping on Move

Whenever a company is moved between pages:
- **`stage`**: Updated to `To Do`, `In Progress`, `Follow-Up`, or `Done`.
- **`workedBy`**: Setter attribution (`Fil`, `Panu`, `Team`).
- **`lastContactDate`**: ISO date of the move (e.g. `2026-08-23`).
- **`updatedAt`**: Real-time timestamp.

---

## 4. Single Company Detail View

Clicking into any company's title or the **`Detail View`** button opens its dedicated profile view with full contact details and direct page move buttons.
