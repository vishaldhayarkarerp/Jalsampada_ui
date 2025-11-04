# JALSAMPADA - Next.js

A professional JALSAMPADA built with Next.js 15, TypeScript, and matching the exact design from the original HTML/CSS/JS website.

## ✨ Features

- **Dashboard**: Real-time overview with metric cards showing active pumps, flow rate, low stock alerts, and maintenance info
- **Assets**: Equipment specifications for pumps and motors with detailed technical information
- **Operations**: Live monitoring of pump status and current operational readings
- **Stock & Maintenance**: Comprehensive inventory management and maintenance history tracking
- **Reports**: Analytics and data export capabilities
- **Responsive Design**: Optimized layout with fixed header and sidebar navigation

## 🎨 Design System

- Custom design system with extensive CSS variables for theming
- Teal/blue color scheme matching original design
- Font Awesome icons for consistent iconography
- Beautiful gradient headers and smooth transitions
- Professional card-based layouts

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install --legacy-peer-deps
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) to see the application

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main application page with all modules
├── components/
│   └── ui/                 # Reusable UI components (buttons, cards, tables)
├── lib/
│   ├── utils.ts           # Utility functions
│   └── sample-data.ts     # Sample data matching original app.js
├── styles/
│   └── globals.css        # Complete design system from original style.css
├── types/
│   └── app-data.ts        # TypeScript interfaces
└── website/                # Original HTML/CSS/JS reference files
    ├── index.html
    ├── style.css
    └── app.js
```

## 🎯 Key Components

### Header
- Blue gradient header with water icon and branding
- User info display in top right
- Fixed positioning at 60px height

### Sidebar
- Fixed 250px width sidebar
- 5 navigation items with Font Awesome icons:
  - Dashboard
  - Assets  
  - Operations
  - Stock & Maintenance
  - Reports
- Active state with teal background

### Dashboard Module
- 4 metric cards showing key system stats
- System overview image
- Real-time calculations from operation data

### Assets Module
- Grid of equipment cards (3 columns on desktop)
- Blue gradient headers
- Search and filter functionality
- Detailed specifications for each pump/motor

### Operations Module
- 2-column layout: pump status list + current readings
- Real-time status indicators (Running/Stopped)
- Color-coded status items

### Stock & Maintenance Module
- 3 tabs: Inventory, Maintenance History, Stock Alerts
- Full-width data table for spare parts
- Maintenance records with detailed breakdowns
- Low stock alerts with warning icons

### Reports Module
- Filter controls for date range and equipment
- Performance metrics display
- Export buttons (PDF, Excel, CSV)

## 📊 Data Structure

The application uses TypeScript interfaces matching the original app.js:

- **TechnicalData**: Equipment specifications
- **OperationData**: Real-time operational readings
- **SparePart**: Inventory items
- **MaintenanceRecord**: Maintenance history

All data is stored in `lib/sample-data.ts` and can be easily replaced with API calls.

## 🎨 Styling

The CSS is copied directly from the original `website/style.css` and includes:

- Complete design system with CSS variables
- Light/dark mode support (via prefers-color-scheme)
- Perplexity-inspired color palette
- Responsive breakpoints
- Custom form controls with styled select dropdowns
- Status indicators with semantic colors
- Card and button components
- Animation utilities

## 🔧 Customization

### Colors
Edit CSS variables in `styles/globals.css`:
- `--color-primary`: Main teal color
- `--color-background`: Page background
- `--color-surface`: Card backgrounds
- `--color-text`: Main text color

### Data
Replace sample data in `lib/sample-data.ts` with your backend API calls or database queries.

### Modules
Add new modules by:
1. Adding a nav item in the sidebar
2. Creating a new conditional render block in `app/page.tsx`
3. Following the existing module structure

## 📱 Responsive Behavior

- Desktop: Full sidebar + main content layout
- Mobile (< 768px): Collapsible sidebar, stacked layouts

## 🔐 Production Considerations

For production deployment:

1. **API Integration**: Replace sample data with real API calls
2. **Authentication**: Add user login/session management
3. **Database**: Connect to your database for persistent storage
4. **Validation**: Add form validation for user inputs
5. **Error Handling**: Implement comprehensive error boundaries
6. **Loading States**: Add loading indicators for async operations
7. **Testing**: Add unit and integration tests

## 🛠️ Technologies

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Font Awesome**: Icon library
- **CSS Variables**: Dynamic theming
- **React Hooks**: State management

## 📄 License

ISC

## 🙏 Credits

Design and original implementation based on reference website files.
