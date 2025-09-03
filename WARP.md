# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

UserQMS is a queue management system built with Next.js 15, TypeScript, and Supabase. It allows companies to manage services and customer queues, with support for bookings, walk-ins, and real-time queue tracking. The app features both customer-facing service discovery and business management interfaces.

## Development Commands

### Core Development
```bash
# Start development server with turbopack
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

### Testing and Debugging
```bash
# Test a single component or page
pnpm dev
# Then navigate to specific routes like /services, /company/[id], etc.

# Check build output
pnpm build

# Validate TypeScript
npx tsc --noEmit
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **UI Components**: Radix UI primitives with custom styling
- **State Management**: React hooks and context
- **Authentication**: Custom auth hook with localStorage

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── company/[id]/      # Company detail pages
│   ├── services/          # Service listing and details
│   ├── usercategory/[categoryId]/  # Category-filtered services
│   └── layout.tsx         # Root layout with fonts
├── components/            # Reusable React components
│   ├── ui/               # shadcn/ui components
│   └── *.tsx             # Feature components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and API
└── types/               # TypeScript type definitions
```

### Database Architecture (Supabase)
The app uses several key tables:
- `companies` - Business entities with services
- `services` - Individual services offered by companies
- `providers` - Service providers/staff members  
- `service_providers` - Many-to-many linking table
- `queue_entries` - Customer queue items
- `global_categories` - Service categories
- `global_locations` - Available locations

### Key Components

**Core Pages**:
- `Homepage` - Landing page with service discovery
- `ServiceCategoriesPage` - Browse services by category  
- `ServicesListPage` - Filterable service listings
- `ServiceDetailPage` - Individual service booking

**Business Logic**:
- `api.ts` - Supabase database operations
- `useAuth.ts` - Authentication state management
- `company-context.tsx` - Company data context

**UI Components**:
- shadcn/ui components in `components/ui/`
- Custom components like `ServiceCard`, `FilterNav`
- Booking dialogs: `BookServiceDialog`, `JoinQueueDialog`

### Data Flow
1. **Service Discovery**: Users browse services via categories or search
2. **Filtering**: `FilterNav` applies location, category, and search filters
3. **Booking**: Service details page offers booking or queue joining
4. **Queue Management**: Real-time queue status and position tracking

### Authentication
- Custom hook-based auth with localStorage persistence
- Support for different user roles (customers vs business owners)
- Company-specific data access patterns

## Environment Setup

Required environment variables in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Key Patterns

### Component Organization
- UI components use shadcn/ui patterns with Radix primitives
- Business logic components separate data fetching from presentation
- Consistent use of TypeScript interfaces from `types/index.ts`

### Data Fetching
- Supabase client operations in `lib/api.ts`
- Complex joins for related data (companies with services and providers)
- Error handling with try/catch and console logging

### Routing
- App Router with dynamic routes: `[id]`, `[servicesId]`, `[categoryId]`
- Query parameters for filtering and company context
- Link prefetching for performance

### Styling
- Tailwind CSS v4 with custom configuration
- shadcn/ui component variants using `class-variance-authority`
- Consistent spacing and color schemes

## Common Development Tasks

### Adding New Services
1. Update types in `types/index.ts` if needed
2. Add database operations in `lib/api.ts`
3. Create/update UI components
4. Add routing in `app/` directory

### Database Schema Changes  
1. Update Supabase schema
2. Update TypeScript types in `types/index.ts`
3. Update API functions in `lib/api.ts`
4. Update related components

### UI Component Development
1. Use shadcn/ui patterns and Radix primitives
2. Follow existing component structure in `components/ui/`
3. Maintain accessibility standards with proper ARIA attributes
4. Use Tailwind classes consistently with existing patterns
