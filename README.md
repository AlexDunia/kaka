# Event Management System

A modern event management system built with Vue 3 and Laravel. The frontend is powered by Vue 3 with Pinia for state management, and it's designed to work with a Laravel 12 backend API.

## Features

- Create and manage events
- Browse events by category
- Search for events
- Featured events showcase
- Ticket management
- Image uploads
- FAQs
- Responsive design with Tailwind CSS

## Architecture

The application follows a clean architecture with:

- Vue 3 frontend (Composition API)
- Pinia for state management
- Vite for build tooling
- Backend-ready API service layer (currently using localStorage)
- Laravel 12 compatible API specification

## Project Setup

### Frontend Installation

```bash
# Clone the repository
git clone <repository-url>
cd event-management-system

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Configuration

Create a `.env` file in the root directory:

```
VITE_API_URL=http://localhost:8000/api
```

## Using localStorage (Current Implementation)

The application is currently configured to use localStorage for data persistence. This allows for development and testing without requiring a backend.

In `src/services/eventService.js`, the variable `USE_LOCAL_STORAGE` is set to `true`:

```javascript
const USE_LOCAL_STORAGE = true // Set to false when ready to use backend API
```

## Switching to Laravel Backend

To switch from localStorage to the Laravel backend:

1. Set up the Laravel backend according to the API specification in `docs/api-spec.md`
2. Set `USE_LOCAL_STORAGE` to `false` in `src/services/eventService.js`
3. Ensure the `VITE_API_URL` environment variable is correctly set

## Laravel Backend Setup

### Requirements

- PHP 8.3+
- Composer
- PostgreSQL
- Laravel 12

### Installation

```bash
# Create a new Laravel project
composer create-project laravel/laravel event-api

# Navigate to the project directory
cd event-api

# Install Sanctum for API authentication
composer require laravel/sanctum

# Publish Sanctum configuration
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# Run migrations
php artisan migrate
```

### Database Configuration

Configure your `.env` file with PostgreSQL credentials:

```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=event_management
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

### API Implementation

The API endpoints should follow the specification in `docs/api-spec.md`. This includes:

1. Controllers for events, categories, and subcategories
2. Models with relationships
3. Resources for JSON transformation
4. Migrations for database schema
5. Authentication using Laravel Sanctum
6. Storage configuration for image uploads

## File Structure

```
├── docs/
│   └── api-spec.md          # API specification for Laravel backend
├── public/
│   └── images/              # Static images
├── src/
│   ├── assets/              # Static assets
│   ├── components/          # Vue components
│   ├── pages/               # Vue pages/views
│   ├── router/              # Vue Router configuration
│   ├── services/            # API services
│   │   └── eventService.js  # Event API service (localStorage/backend)
│   ├── stores/              # Pinia stores
│   │   └── events.js        # Event store
│   └── main.js              # Vue app entry point
├── .env                     # Environment variables
├── package.json             # Dependencies and scripts
└── vite.config.js           # Vite configuration
```

## Development Notes

### Data Flow

1. User interactions in Vue components call methods from Pinia stores
2. Pinia stores call the service layer methods
3. Service layer either:
   - Uses localStorage (current implementation)
   - Makes API requests to the Laravel backend (when switched)
4. Data is returned to the stores and components

### Image Handling

- In localStorage mode, images are stored as base64 strings
- In API mode, images will be uploaded as multipart/form-data and stored on the server

## Deployment

### Frontend

```bash
# Build for production
npm run build

# Deploy the dist directory
```

### Backend

```bash
# Configure .env for production
php artisan config:cache
php artisan route:cache

# Deploy to your server
```

## Contributors

- [Your Name](https://github.com/your-username)

## License

MIT
