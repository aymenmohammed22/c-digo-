# Overview

The project is a comprehensive Arabic food delivery system called "السريع ون" (Sarie One) built with modern web technologies. It consists of three main applications: a customer-facing app for ordering food, an admin dashboard for system management, and a driver app for delivery management. The system supports Arabic language with RTL (right-to-left) text direction and includes features like real-time order tracking, restaurant management, special offers, and payment processing.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React 18** with TypeScript for type safety and modern development
- **Vite** as the build tool and development server for fast development
- **Tailwind CSS** for responsive, utility-first styling with Arabic RTL support
- **Wouter** for client-side routing instead of React Router for smaller bundle size
- **TanStack Query** for efficient server state management and caching
- **Radix UI** components for accessible and customizable UI elements

## Backend Architecture
- **Express.js** server with TypeScript for API endpoints
- **PostgreSQL** as the primary database with Drizzle ORM for type-safe database operations
- **bcrypt** for password hashing and authentication security
- **Session-based authentication** with JWT tokens for admin and driver access
- **RESTful API design** with standardized error handling and response formats

## Data Storage Design
The database schema includes:
- **Users and Addresses**: Customer account management with multiple delivery addresses
- **Restaurants and Categories**: Restaurant listings with categorization and operational hours
- **Menu Items**: Product catalog with pricing, availability, and special offers
- **Orders**: Complete order lifecycle tracking with status updates
- **Admin Users**: Separate authentication system for administrators and drivers
- **UI Settings**: Dynamic configuration for feature toggles and interface customization

## Authentication and Authorization
- **Multi-tier authentication**: Separate login systems for customers, drivers, and administrators
- **Role-based access control**: Different permissions for admin vs driver accounts
- **Session management**: Secure token-based sessions with expiration handling
- **Password security**: Encrypted password storage with bcrypt hashing

## Key Design Patterns
- **Context API**: React contexts for global state management (Cart, Auth, Theme, Location)
- **Custom hooks**: Reusable logic encapsulation for common operations
- **Component composition**: Modular UI components with clear separation of concerns
- **Repository pattern**: Database abstraction layer with unified interface
- **Error boundary handling**: Graceful error handling with user-friendly messages

# External Dependencies

## Database Services
- **PostgreSQL**: Primary database hosted on Render with connection pooling
- **Drizzle ORM**: Type-safe database operations with migration support

## Development and Build Tools
- **Vite**: Development server and build tool with HMR
- **TypeScript**: Static type checking for both frontend and backend
- **ESBuild**: Fast JavaScript bundling for production builds

## UI and Styling
- **Tailwind CSS**: Utility-first CSS framework with custom Arabic configuration
- **Radix UI**: Headless component library for accessibility
- **Lucide React**: Icon library for consistent iconography
- **Google Fonts**: Arabic font support (Noto Sans Arabic)

## State Management and Data Fetching
- **TanStack Query**: Server state management with caching and synchronization
- **React Context**: Client-side state management for cart, authentication, and settings

## Authentication and Security
- **bcrypt**: Password hashing for secure authentication
- **crypto**: UUID generation and session token creation
- **CORS**: Cross-origin resource sharing configuration

## Geolocation Services
- **Browser Geolocation API**: User location detection for delivery services
- **Location permissions**: Graceful handling of location access requests

## Production and Deployment
- **Node.js**: Server runtime environment
- **Express.js**: Web application framework
- **Environment variables**: Configuration management for database URLs and secrets
- **Session management**: Secure session storage and validation