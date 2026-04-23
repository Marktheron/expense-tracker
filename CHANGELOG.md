# Changelog

## 2026-04-23

### Features
- **Vitality Cashback Tracking**
  - V toggle button on line items (only shows at Checkers)
  - Auto-remembers products marked as Vitality-qualifying
  - Auto-toggles for recognized products when typing
  - Dashboard card shows projected 25% cashback
  - Brand color: #EC1B5B

- **Dashboard Improvements**
  - Spending Pace stat (ahead/behind vs same point last month)
  - Top Products sorted by quantity purchased (not price)
  - Top 10 products with count in brackets e.g. "Milk (3)"
  - Simple up/down arrows with 3px stroke (replaced trend arrows)
  - Category icons moved after merchant name in recent transactions

- **Categories**
  - Added "Debt" category with Landmark icon
  - Custom category ordering (Groceries first, then Medical, etc.)
  - Larger category icons (h-6 w-6)

### UI/UX
- Cursor pointer on all interactive elements site-wide
- Reduced transaction list padding (py-4 to py-2)
- Simplified merchant autocomplete (removed template auto-fill, kept dropdown)
- Category icons appear after merchant name in transaction lists
- Smaller Vitality button (w-5 h-5)

### Bug Fixes
- Fixed delete not persisting (now deletes immediately, undo re-creates)
- Fixed vitalityQualifying not loading when editing transactions

### Tech Stack
- Next.js 16 with App Router
- Tailwind CSS v4
- Prisma with SQLite (libsql adapter)
- Lucide React icons (https://lucide.dev/icons)

### Next Steps
- Deploy to Vercel or similar
- Set up production database
