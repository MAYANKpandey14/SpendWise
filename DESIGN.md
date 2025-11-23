# Phase 1: Feature Brainstorm

| Feature | Description | Priority | UI Component | Data Model | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Expense CRUD** | Add, edit, delete, view expenses. | High (MVP) | FormModal, Card | `Expense` table | Can create/edit/delete; persists to storage. |
| **Responsive Layout** | Mobile bottom nav, Desktop sidebar. | High (MVP) | Layout, Navbar | N/A | resizing window adapts layout seamlessy. |
| **Expense List & Filter** | Filter by category, date range. | High (MVP) | FilterBar, VirtualList | `Expense` (query) | Filter reduces list count correctly. |
| **Categories** | Default categories + custom ones. | High (MVP) | Select, Badge | `Category` table | Expenses map to categories visually. |
| **Budgets & Alerts** | Visual progress bar for category limits. | Med | ProgressBar, Card | `Budget` table | Progress bar turns red > 90%. |
| **Reports** | Pie/Bar charts for spending. | Med | Recharts, DatePicker | Aggregation | Charts render correct totals. |
| **Receipt Upload** | Attach image to expense. | Med | FileInput, Modal | `receipt_url` | Image displays on detail view. |
| **AI Receipt Scan** | Gemini API to extract details. | Med | Button "Scan" | Gemini Prompt | Auto-fills form fields from image. |
| **Export** | CSV export of visible data. | Low | Button | N/A | Downloaded file matches filter. |

# Phase 2: Design & Architecture

## Tech Stack
*   **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide React (Icons).
*   **State:** React Context API + LocalStorage (for persistent demo) / Hooks.
*   **Charts:** Recharts.
*   **AI:** Google GenAI SDK (Gemini 2.5 Flash for speed).
*   **Routing:** React Router (HashRouter).

## Data Schema (TypeScript Interfaces)
```typescript
interface Expense {
  id: string;
  amount: number;
  currency: string;
  categoryId: string;
  date: string; // ISO
  merchant: string;
  description?: string;
  receiptUrl?: string; // Base64 or URL
  createdAt: number;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Budget {
  categoryId: string;
  limit: number;
}
```

## Responsive Strategy
*   **Mobile (< 768px):** Navigation fixed at bottom. List view is compact cards.
*   **Desktop (>= 768px):** Navigation fixed sidebar (left). List view is table or grid. Dashboard uses 3-column grid.

## AI Integration
*   **Action:** User selects image.
*   **Process:** Image -> Base64 -> Gemini API (`gemini-2.5-flash`) -> JSON extraction.
*   **Result:** Pre-fills Amount, Merchant, Date, Category fields in the Add form.
