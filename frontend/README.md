# ERP Frontend

Modern React + TypeScript frontend for the ERP system.

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Zustand** - State management
- **Axios** - HTTP client
- **TanStack Query** - Server state management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend server running on `http://localhost:4000`

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── ui/          # Base UI components (Button, Input, Card, etc.)
│   └── layout/      # Layout components (DashboardLayout)
├── pages/           # Page components
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   └── Accounts.tsx
├── store/           # Zustand stores
│   └── authStore.ts
├── lib/             # Utilities and helpers
│   ├── api.ts       # Axios instance with interceptors
│   └── utils.ts     # Helper functions
├── types/           # TypeScript type definitions
│   └── index.ts
├── App.tsx          # Main app component with routing
└── main.tsx         # Entry point
```

## Features

### Implemented

- ✅ Authentication (Login/Logout)
- ✅ Protected routes
- ✅ Dashboard with stats
- ✅ Chart of Accounts listing with filters
- ✅ Responsive sidebar navigation
- ✅ Modern UI with Tailwind CSS

### Planned

- 🔄 Journal Entries management
- 🔄 Customer/Supplier management
- 🔄 Invoice creation and management
- 🔄 Bill creation and management
- 🔄 Financial reports
- 🔄 Bank reconciliation
- 🔄 Tax management

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:4000/api
```

## Default Credentials

```
Tenant Code: DEFAULT
Email: admin@erp.local
Password: Admin123!
```

## API Integration

The frontend communicates with the backend API through Axios. The API client is configured in `src/lib/api.ts` with:

- Automatic JWT token injection
- 401 redirect to login
- Base URL configuration

## Styling

This project uses Tailwind CSS with a custom design system:

- CSS variables for theming
- Dark mode support (planned)
- Responsive design
- Accessible components
