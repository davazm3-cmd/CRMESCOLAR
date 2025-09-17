# CRM Educativo - Sistema de Gestión para Instituciones

## Overview

This is a comprehensive CRM system specifically designed for educational institutions (K-12 to universities). The system manages the complete student prospect lifecycle from initial contact through enrollment, with role-based dashboards for Directors, Managers, and Educational Advisors. The platform includes advanced features like communication management, campaign analytics, public enrollment forms, and automated admissions processes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for development and build tooling
- **UI Library**: Radix UI primitives with shadcn/ui components for consistent design system
- **Styling**: Tailwind CSS with custom design tokens for educational branding
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Authentication**: Passport.js with local strategy and session-based auth
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful endpoints with role-based access control
- **File Structure**: Shared schema between frontend and backend for type consistency

### Database Design
- **Primary Tables**: Users (directors/managers/advisors), Prospects, Communications, Campaigns, Admissions Documents, Payments, Public Forms
- **Key Relationships**: Prospects linked to advisors, communication history tracking, campaign attribution
- **Data Flow**: Prospect lifecycle from registration → contact → appointment → documents → admission → enrollment

### Role-Based Dashboard System
- **Director Dashboard**: Executive metrics, enrollment trends, advisor performance comparisons, campaign ROI analysis
- **Manager Dashboard**: Team oversight, advisor rankings, conversion tracking, operational metrics
- **Advisor Dashboard**: Personal prospect pipeline, communication tools, appointment management, individual performance

### Communication Integration
- **Multi-Channel Support**: Phone calls, WhatsApp, email, in-person meetings
- **Activity Tracking**: Duration, outcomes, follow-up scheduling
- **Automation Ready**: Foundation for automated reminders and status updates

### Public Forms System
- **Dynamic Form Builder**: Customizable fields per education level (primary/secondary/prep/university)
- **Public URLs**: Shareable links for marketing campaigns with tracking
- **Lead Capture**: Automatic prospect creation from form submissions

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL (serverless Postgres)
- **Authentication**: Express sessions with Passport.js local strategy
- **Email Service**: SendGrid for transactional emails
- **File Storage**: Planned integration for document uploads

### Payment Processing
- **Stripe**: Complete integration for enrollment payments and billing
- **PayPal**: Secondary payment option with server SDK integration

### Development Tools
- **Build System**: Vite with TypeScript support and hot module replacement
- **Database Management**: Drizzle Kit for migrations and schema management
- **Code Quality**: ESLint and TypeScript for type safety
- **Deployment**: Replit-optimized with development banners and error overlays

### UI/UX Libraries
- **Component Library**: Radix UI primitives for accessibility
- **Icons**: Lucide React icon set
- **Drag & Drop**: dnd-kit for Kanban-style prospect management
- **Charts**: Recharts for analytics visualization
- **Animations**: CSS transitions with Tailwind utilities

### Planned Integrations
- **SMS/WhatsApp**: Planned for automated communications
- **Calendar Systems**: For appointment scheduling integration
- **Export Tools**: CSV/Excel/PDF generation for reports
- **Analytics**: Enhanced tracking and reporting capabilities