Here is a breakdown of how data is currently handled across the application:

---

### 1. Storage & Persistence (Source of Truth)
- **Primary Database File**: [`data/prospects.json`](data/prospects.json)
  - All 100 prospect records, their decision makers, stages, setter activity, and DeepSeek links are stored in this JSON database on disk.
- **Initial Ingestion / Seeding**: [`server/db.js`](server/db.js)
  - Reads [`Prospects.csv`](Prospects.csv) and merges external intelligence links from [`list.text`](list.text).
  - Automatically structures companies, extracts contact emails/LinkedIn handles, cleans data, and writes the initial [`data/prospects.json`](data/prospects.json).

---

### 2. Backend REST API Layer ([`server/index.js`](server/index.js))
An Express server (running on port `4000` with Vite proxying requests to `/api`) manages read/write operations:

| Endpoint | Method | What it does |
| :--- | :--- | :--- |
| `/api/prospects` | `GET` | Reads and returns all prospects from `data/prospects.json`. |
| `/api/prospects/:id` | `PUT` | Updates company stage (`To Do`, `In Review`, `Qualified`, `Disqualified`), setter (`workedBy`), and `lastContactDate`. Saves directly to disk. |
| `/api/prospects/:id/contacts` | `POST` | Appends a new decision maker, auto-removes placeholder contacts (`"Key Contact (To Identify)"`), and persists to JSON. |
| `/api/prospects/:id/contacts/:contactId` | `PUT` | Updates outreach status (email sent, LinkedIn status, appointment booked). |
| `/api/prospects/:id/contacts/:contactId` | `DELETE` | Deletes a contact from the company. |
| `/api/export/csv` | `GET` | Converts the current live database into an updated `.csv` download. |

---

### 3. Frontend Data Flow & State Management ([`src/App.jsx`](src/App.jsx))
- **Initial Load**: On page load, `useEffect` triggers `fetch('/api/prospects')` and sets the React `prospects` state.
- **Optimistic UI Updates**: When you move a company to another page or add a contact, the UI updates **instantaneously** in local state while asynchronously sending the `PUT`/`POST` request to the backend. If an error occurs, it rolls back and shows a notification toast.
- **Client-side Categorization & Tab Counts (`useMemo`)**:
  - Dynamically splits companies into the **4 stages**:
    1. `📋 To Do`
    2. `⚡ In Review`
    3. `🎯 Qualified`
    4. `🚫 Disqualified`
    5. `📁 All`
- **Instant Search Filter**: Filters across company name, business model, decision maker name/role/email, and notes without requiring additional network requests.
- **Modal Sync ([`src/components/CompanyDetailModal.jsx`](src/components/CompanyDetailModal.jsx))**:
  - Receives selected prospect data and shares the same `handleMoveStage` and `handleAddContact` functions. Any change made in the modal instantly reflects in the main card feed and persists to disk.

---

### 4. Data Structure per Company (Example)
```json
{
  "id": "comp_3",
  "rank": 3,
  "name": "Zenith Property Management",
  "website": "https://www.zenithpm.co.uk",
  "deepseekUrl": "https://chat.deepseek.com/a/chat/s/...",
  "businessModel": "Residential blocks/BTR",
  "revenue": "£7.3m",
  "employees": "200 staff",
  "priority": "A",
  "stage": "To Do",
  "workedBy": "Fil",
  "lastContactDate": "2026-08-28",
  "contacts": [
    {
      "id": "contact_3_1_8492",
      "name": "John Doe",
      "role": "Managing Director",
      "email": "john@zenithpm.co.uk",
      "linkedinUrl": "https://linkedin.com/in/johndoe"
    }
  ]
}
```