# 🚀 Quick Start Guide

## Run the Application

```bash
# 1. Install dependencies (if not already done)
npm install --legacy-peer-deps

# 2. Start development server
npm run dev

# 3. Open in browser
# Visit: http://localhost:3000
```

## What You'll See

### Dashboard (Default View)
- 4 metric cards showing system stats
- Water pumping system diagram

### Assets
- 5 equipment cards (3 pumps + 2 motors)
- Search and filter controls
- Detailed specifications for each item

### Operations
- Real-time pump status (Running/Stopped)
- Current operational readings
- Color-coded status indicators

### Stock & Maintenance
- **Inventory Tab**: Spare parts table with 6 items
- **Maintenance History Tab**: 4 maintenance records
- **Stock Alerts Tab**: Low stock warnings

### Reports
- Performance metrics
- Export options (PDF, Excel, CSV)
- Date range and equipment filters

## Navigation

- Click sidebar items to switch between modules
- All navigation is instant (client-side)
- Active module highlighted in teal

## Data

All data is currently sample data from `lib/sample-data.ts`:
- 5 equipment entries (P-001, P-002, P-003, M-001, M-002)
- 3 operational readings
- 6 spare parts
- 4 maintenance records

## Customization

### Change Colors
Edit `styles/globals.css`:
```css
--color-primary: var(--color-teal-500);  /* Change this */
```

### Add Equipment
Edit `lib/sample-data.ts`:
```typescript
technical_data: [
  {
    pump_id: "P-004",
    pump_type: "Centrifugal",
    // ... add more fields
  }
]
```

### Add New Module
1. Add nav item in sidebar (app/page.tsx, line ~40)
2. Add conditional render block (app/page.tsx, after line ~470)
3. Follow existing module pattern

## Troubleshooting

### Build errors?
```bash
rm -rf .next node_modules
npm install --legacy-peer-deps
npm run build
```

### Icons not showing?
Check that Font Awesome CSS is loaded in `app/layout.tsx`

### Styling issues?
Verify `styles/globals.css` exists and is imported in layout

## Next Steps

1. **Connect to API**: Replace sample data with real API calls
2. **Add Forms**: Implement Add Equipment/Work Order modals
3. **Charts**: Add Chart.js for Operations/Reports visualizations
4. **Auth**: Add user authentication
5. **Database**: Connect to your backend database

## Need Help?

- Check `README.md` for full documentation
- See `MIGRATION_COMPLETE.md` for technical details
- Review original files in `website/` directory

---

**Ready to develop!** 🎉
