# FastAPI Backend with Supabase Auth

This is the backend API for the Python application with FastAPI and Supabase authentication.

## Features

- FastAPI REST API
- Supabase Integration
  - Authentication (JWT)
  - PostgreSQL Database
- User profile management
- Token handling
- Secure password reset flow

## Setup

### Prerequisites

- Python 3.9+
- Supabase account and project

### Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```
   cd backend
   ```
3. Create a virtual environment:
   ```
   python -m venv venv
   ```
4. Activate the virtual environment:
   - On Windows:
     ```
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```
     source venv/bin/activate
     ```
5. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
6. Create a `.env` file in the backend directory with the following variables:
   ```
   # Server configuration
   HOST=0.0.0.0
   PORT=8000
   ENVIRONMENT=development
   API_PREFIX=/api
   FRONTEND_URL=http://localhost:3000

   # Supabase configuration
   SUPABASE_URL=https://your-supabase-project.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   SUPABASE_JWT_SECRET=your-supabase-jwt-secret
   ```
   
   Replace the placeholders with your actual Supabase project details.

## Running the API

Run the development server:

```
python -m app.main
```

Or use uvicorn directly:

```
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

## API Documentation

Once the server is running, you can access the auto-generated API documentation:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/signin` - Sign in a user
- `POST /api/auth/refresh-token` - Refresh authentication token
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/signout` - Sign out current user

### User Profile

- `GET /api/auth/me` - Get current user profile
- `PATCH /api/auth/me` - Update current user profile

## Development

### Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py               # FastAPI application entry point
│   ├── routers/              # API route definitions
│   │   ├── __init__.py
│   │   ├── auth.py           # Authentication endpoints
│   │   └── ...               # Other endpoint modules
│   ├── services/             # Business logic & services
│   │   ├── __init__.py
│   │   ├── database_service.py  # Database operations
│   │   ├── dependencies.py      # FastAPI dependencies
│   │   └── ...               # Other services
│   └── models/               # Data models
│       ├── __init__.py
│       └── ...               # Pydantic models
├── .env                      # Environment variables (not in repo)
├── .env.sample              # Sample environment file
├── requirements.txt          # Dependencies
└── README.md                 # This file
```

## Testing

Run tests using pytest:

```
pytest
```

## Tech Stack

- FastAPI (Python 3.10+)
- Supabase (Postgres + Auth)
- AWS S3 (Storage)
- Pinecone (Vector DB)
- OpenAI GPT-4-turbo (LLM)
- Stripe (Payments)

## Development

Run the development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000 with interactive documentation at http://localhost:8000/docs

## API Structure

- `/api/signup` - Register new user
- `/api/login` - Login and get JWT token
- `/api/project` - Project (bot) management
- `/api/doc` - Document upload and management
- `/api/embed` - Document embedding
- `/api/chat` - RAG-based chat
- `/api/payment` - Stripe payment integration

## Deployment

### Railway

1. Create a Railway account
2. Create a new project
3. Add all the environment variables from `.env`
4. Deploy using GitHub repository

## Storage Integration

### Supabase Storage

The application uses Supabase Storage for document management with the following features:

- Multiple upload methods:
  - Presigned URL upload (primary method)
  - Direct upload via API endpoint
  - Fallback methods if primary fails
- Support for Supabase's 50MB file limit on free tier
- Public bucket configuration for easier access
- Multiple download strategies for reliable document processing

### Document Upload Flow

The document upload process follows these steps:

1. Frontend requests a presigned upload URL from the backend
2. Backend creates a document record and generates a presigned URL
3. Frontend uploads the file directly to Supabase Storage
4. Frontend confirms the upload with the backend
5. Backend processes the document (extraction, chunking, embedding)

If the presigned URL approach fails, the system falls back to direct upload via the API.

### Storage Service Design

The application implements a storage service abstraction that supports multiple providers:

- Supabase Storage (default)
- AWS S3 (alternative)

The storage service uses dependency injection and follows the strategy pattern to allow seamless switching between providers.

## License

MIT 