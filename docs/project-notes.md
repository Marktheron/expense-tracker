# Expense Tracker - Project Notes

## Overview
Personal/home expense tracking app built to replace Google Sheets. Focus on detailed line-item tracking with minimal friction for data entry.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + React + TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Charts**: Recharts
- **Icons**: Lucide React
- **Dates**: date-fns

## Key Design Decisions

### Data Model
```
Transaction (one shopping trip/receipt)
├── date, merchant, notes
└── LineItems (individual products)
    ├── description
    ├── amount
    └── category
```

This allows **split transactions** - one grocery trip can have items across multiple categories (Food, Household, Toiletries).

### Category Accordion UI
Instead of selecting a category for each line item (tedious for 20+ items), the entry form groups by category:
- Click category to expand
- Add all items for that category
- Move to next category
- Much faster for bulk entry

### No Budgets (Initially)
Deliberately excluded budget-setting features. Goal is first to understand spending patterns, then potentially add budgets later based on real data.

## Pages & Features

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/` | Monthly overview, charts, recent transactions |
| Add Expense | `/transactions/new` | Category accordion entry form |
| Transactions | `/transactions` | Search, filter, expand to see items |
| Reports | `/reports` | Period selection, spending trends, category breakdown |
| Settings | `/settings` | Manage categories (add/delete/colors) |

## Default Categories
Groceries, Fuel, Medical, Household, Toiletries, Transport, Utilities, Entertainment, Clothing, Dining Out, Subscriptions, Other

## Running the App

```bash
# Development
npm run dev

# Build for production
npm run build
npm start

# Database commands
npx prisma studio    # Visual database browser
npx prisma migrate dev --name <name>  # Create migration
npx tsx prisma/seed.ts  # Re-seed categories
```

## File Structure
```
src/
├── app/
│   ├── api/           # API routes (categories, transactions, stats)
│   ├── reports/
│   ├── settings/
│   ├── transactions/
│   └── page.tsx       # Dashboard
├── components/
│   ├── Dashboard.tsx
│   ├── TransactionForm.tsx   # Category accordion UI
│   ├── TransactionList.tsx
│   ├── Reports.tsx
│   ├── CategoryManager.tsx
│   └── Navigation.tsx
├── lib/
│   └── db.ts          # Prisma client
└── generated/
    └── prisma/        # Generated Prisma client
prisma/
├── schema.prisma      # Database schema
├── seed.ts            # Category seed data
└── dev.db             # SQLite database file
```

## Future Ideas (Discussed)
- Currency format options
- CSV export for backup
- Mobile UX refinements
- Date/merchant auto-complete
- Budget tracking (once spending patterns understood)

## Database Location
SQLite database stored at `dev.db` in project root. Easy to backup - just copy this file.

---

## Conversation Log

### Initial Requirements (Session 1)
- **Platform**: Web app (accessible from mobile browser)
- **Experience level**: Experienced developer, new to React/Next.js
- **Key features wanted**: Quick entry, categories, reports/visualizations
- **Data storage**: Self-hosted (access from mobile)
- **Entry method**: Manual (receipts too inconsistent for scanning)

### Design Decisions Discussed
- **Categories**: Single level (Groceries, Fuel, Medical, etc.) - not hierarchical
- **Line items**: Each receipt contains individual products with prices
- **Category accordion UI**: Instead of selecting category per item, expand a category section and add items within it - much faster for bulk entry
- **Budgets**: Not implementing initially - first understand spending patterns, then maybe add later
- **Currency**: ZAR (South African Rand)

### Deployment Discussion
- Want mobile access from outside home network
- Can't pay for VPS currently
- **Recommended solution**: Tailscale (free) - creates private network between devices
- Alternative: Cloudflare Tunnel (free, public URL)

### Future Enhancements Discussed
- CSV export for backup
- Mobile UX tweaks based on testing
- Date/merchant auto-complete
- Budget tracking (later, once patterns understood)

---
*Created: April 2026*
*Built with Claude Code*
