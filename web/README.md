# Cypher of Healing Web Frontend

Modern, responsive React frontend for the CypherOfHealing platform.

## Features

### 🎨 Design
- **World-class UI/UX** with Tailwind CSS
- **Beautiful animations** using Framer Motion
- **Responsive design** for all devices
- **Dark/Light mode ready** with custom color system
- **Typography** with serif headings and sans-serif body

### 📍 Pages
- **Home**: Hero section with call-to-action
- **Booking** (The Chair): Service booking with calendar & date selection
- **Shop** (The Vault): Product catalog with categories
- **Academy** (The Academy): Course listings with levels
- **Events** (The Stage & Inner Circle): Event discovery & registration
- **Authentication**: Login page with error handling

### 🔧 Tech Stack
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Smooth animations
- **Zustand** - State management (Auth & Cart)
- **React Router** - Client-side navigation
- **Axios** - HTTP client

## Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check
```

## Project Structure

```
web/
├── src/
│   ├── components/        # Reusable components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Layout.tsx
│   ├── pages/            # Page components
│   │   ├── HomePage.tsx
│   │   ├── BookingPage.tsx
│   │   ├── StorePage.tsx
│   │   ├── AcademyPage.tsx
│   │   ├── EventsPage.tsx
│   │   └── LoginPage.tsx
│   ├── stores/           # Zustand stores
│   │   ├── auth.ts
│   │   └── cart.ts
│   ├── lib/              # Utilities
│   │   └── api.ts
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
└── package.json
```

## Features & Best Practices

### ✨ UI/UX Excellence
- Smooth page transitions & micro-interactions
- Consistent color palette (Primary: Gold, Dark: Charcoal)
- Accessible form inputs & buttons
- Loading states & error handling
- Mobile-first responsive design

### 🔒 State Management
- Authentication with JWT tokens
- Shopping cart with local persistence
- Zustand for minimal, efficient state

### 🎯 Performance
- Code splitting via Vite
- Lazy loading for routes
- Optimized images & assets
- Type safety with TypeScript

### 📱 Responsive
- Mobile-first design
- Desktop navigation with mobile hamburger menu
- Grid layouts that adapt to screen size
- Touch-friendly buttons and interactions

## API Integration

The frontend proxies API requests to the backend:
- Dev: `http://localhost:8787/api`
- Requests auto-include JWT token from localStorage
- Auto-redirects to login on 401 errors

## Customization

### Colors
Edit `tailwind.config.js` to customize the color palette

### Fonts
Currently using:
- **Merriweather** (serif) - headings
- **Inter** (sans-serif) - body text

### Animations
Framer Motion variants control entrance/hover animations

## Future Enhancements

- [ ] Dark mode toggle
- [ ] Search functionality
- [ ] Filtering & sorting
- [ ] Product reviews
- [ ] User dashboard
- [ ] Payment integration
- [ ] Email notifications
- [ ] Analytics tracking
