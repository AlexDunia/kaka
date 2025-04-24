# Event Management API Specification

This document outlines the API endpoints that will be implemented in Laravel to support the event management system.

## Base URL

All endpoints are relative to: `http://localhost:8000/api/`

## Authentication

Most endpoints require authentication using Laravel Sanctum. Include the bearer token in the Authorization header:

```
Authorization: Bearer {token}
```

Public endpoints are marked as such.

## Error Handling

All endpoints return appropriate HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Validation Error
- 500: Server Error

Error responses follow this format:

```json
{
  "message": "Error description",
  "errors": {
    "field_name": ["Error message for this field"]
  }
}
```

## Endpoints

### Events

#### Get All Events

```
GET /events
```

Query Parameters:

- `page`: Page number for pagination (default: 1)
- `per_page`: Items per page (default: 10, max: 50)
- `sort_by`: Field to sort by (default: 'created_at')
- `order`: Sort order ('asc' or 'desc', default: 'desc')

Response:

```json
{
  "data": [
    {
      "id": 1,
      "title": "Event Title",
      "description": "Event description",
      "category": "music",
      "subCategories": ["sub1", "sub7"],
      "date": "2024-08-15T16:00:00.000Z",
      "location": "Event location",
      "mainImage": "url/to/main/image.jpg",
      "bannerImage": "url/to/banner/image.jpg",
      "price": 150.0,
      "totalTickets": 5000,
      "availableTickets": 2000,
      "featured": true,
      "organizer": "Organizer name",
      "duration": "3 days",
      "ticketTypes": [...],
      "faqs": [...],
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/events?page=1",
    "last": "http://localhost:8000/api/events?page=5",
    "prev": null,
    "next": "http://localhost:8000/api/events?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 5,
    "path": "http://localhost:8000/api/events",
    "per_page": 10,
    "to": 10,
    "total": 50
  }
}
```

#### Get Event by ID

```
GET /events/{id}
```

Response:

```json
{
  "data": {
    "id": 1,
    "title": "Event Title",
    "description": "Event description",
    "category": "music",
    "subCategories": ["sub1", "sub7"],
    "date": "2024-08-15T16:00:00.000Z",
    "location": "Event location",
    "mainImage": "url/to/main/image.jpg",
    "bannerImage": "url/to/banner/image.jpg",
    "price": 150.0,
    "totalTickets": 5000,
    "availableTickets": 2000,
    "featured": true,
    "organizer": "Organizer name",
    "duration": "3 days",
    "ticketTypes": [
      {
        "name": "Early Bird",
        "price": 120.0,
        "quantity": 1000,
        "description": "Limited time offer",
        "salesEndDate": "2024-07-15",
        "salesEndTime": "23:59",
        "isFeatured": true
      }
    ],
    "faqs": [
      {
        "question": "What's included in the ticket price?",
        "answer": "Your ticket includes entry to all stages and performances."
      }
    ],
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get Events by Category

```
GET /events/category/{category}
```

Query Parameters: Same as Get All Events

Response: Same format as Get All Events

#### Get Featured Events

```
GET /events/featured
```

Query Parameters: Same as Get All Events

Response: Same format as Get All Events

#### Search Events

```
GET /events/search
```

Query Parameters:

- `q`: Search query
- Pagination parameters same as Get All Events

Response: Same format as Get All Events

#### Create Event

```
POST /events
```

Request body:

```json
{
  "title": "Event Title",
  "description": "Event description",
  "category": "music",
  "subCategories": ["sub1", "sub7"],
  "date": "2024-08-15T16:00:00.000Z",
  "location": "Event location",
  "price": 150.0,
  "totalTickets": 5000,
  "organizer": "Organizer name",
  "duration": "3 days",
  "featured": true,
  "ticketTypes": [
    {
      "name": "Early Bird",
      "price": 120.0,
      "quantity": 1000,
      "description": "Limited time offer",
      "salesEndDate": "2024-07-15",
      "salesEndTime": "23:59",
      "isFeatured": true
    }
  ],
  "faqs": [
    {
      "question": "What's included in the ticket price?",
      "answer": "Your ticket includes entry to all stages and performances."
    }
  ]
}
```

Note: For mainImage and bannerImage, use multipart/form-data and upload as files

Response:

```json
{
  "data": {
    "id": 1,
    "title": "Event Title",
    "description": "Event description",
    ...
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Event created successfully"
}
```

#### Update Event

```
PUT /events/{id}
```

Request body: Same as Create Event

Response:

```json
{
  "data": {
    "id": 1,
    "title": "Updated Event Title",
    "description": "Updated event description",
    ...
    "updated_at": "2024-01-02T00:00:00.000Z"
  },
  "message": "Event updated successfully"
}
```

#### Delete Event

```
DELETE /events/{id}
```

Response:

```json
{
  "message": "Event deleted successfully"
}
```

### Categories

#### Get All Categories

```
GET /categories
```

Response:

```json
{
  "data": [
    {
      "id": "music",
      "name": "Music"
    },
    {
      "id": "comedy",
      "name": "Comedy"
    },
    ...
  ]
}
```

### Subcategories

#### Get All Subcategories

```
GET /subcategories
```

Response:

```json
{
  "data": [
    {
      "id": "sub1",
      "name": "Workshop",
      "categoryId": "education"
    },
    {
      "id": "sub2",
      "name": "Conference",
      "categoryId": "business"
    },
    ...
  ]
}
```

#### Get Subcategories by Category

```
GET /categories/{categoryId}/subcategories
```

Response:

```json
{
  "data": [
    {
      "id": "sub1",
      "name": "Workshop",
      "categoryId": "education"
    },
    ...
  ]
}
```

## Laravel Implementation

To implement this API in Laravel, you'll need:

1. **Models**:

   - Event
   - Category
   - Subcategory
   - TicketType
   - Faq

2. **Controllers**:

   - EventController
   - CategoryController
   - SubcategoryController

3. **Resources**:

   - EventResource/EventCollection
   - CategoryResource/CategoryCollection
   - SubcategoryResource/SubcategoryCollection

4. **Migrations** for all tables

5. **Validation** using Form Requests

6. **File Storage** for image uploads using Laravel's Storage facade

7. **Authentication** with Laravel Sanctum

## Database Schema

### events

- id (bigint, auto-increment)
- title (string)
- description (text)
- category (string)
- date (datetime)
- location (string)
- main_image (string) - file path
- banner_image (string) - file path
- price (decimal)
- total_tickets (integer)
- available_tickets (integer)
- featured (boolean)
- organizer (string)
- duration (string)
- created_at (timestamp)
- updated_at (timestamp)

### categories

- id (string) - primary key
- name (string)

### subcategories

- id (string) - primary key
- name (string)
- category_id (string) - foreign key to categories

### event_subcategory

- event_id (bigint) - foreign key to events
- subcategory_id (string) - foreign key to subcategories

### ticket_types

- id (bigint, auto-increment)
- event_id (bigint) - foreign key to events
- name (string)
- price (decimal)
- quantity (integer)
- description (text)
- sales_end_date (date, nullable)
- sales_end_time (time, nullable)
- is_featured (boolean)

### faqs

- id (bigint, auto-increment)
- event_id (bigint) - foreign key to events
- question (string)
- answer (text)
