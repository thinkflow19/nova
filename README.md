# Cursor Python Project

A Python backend with Next.js frontend application that uses OpenAI for embeddings and chat, Supabase for database and authentication, and Pinecone for vector storage.

## Features

- FastAPI backend with async processing
- Next.js frontend with Tailwind CSS
- Supabase integration for authentication and database
- OpenAI API integration for embeddings and chat
- Pinecone vector database for document storage and retrieval
- Document processing and RAG (Retrieval Augmented Generation) capabilities

## Setup and Installation

### Prerequisites

- Python 3.9+ for backend
- Node.js 18+ for frontend
- Supabase account
- OpenAI API key
- Pinecone account

### Environment Variables

Create a `.env` file in the backend directory:

```
# OpenAI
OPENAI_API_KEY=your_openai_api_key
DEFAULT_CHAT_MODEL=gpt-3.5-turbo

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
SUPABASE_POSTGRES_PASSWORD=your_db_password

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=your_pinecone_index_name
```

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Database Setup

The project uses a database for data storage. The setup is handled by vendor-agnostic scripts that work with PostgreSQL, SQLite, and MySQL.

> ⚠️ **Note**: The database setup is typically a one-time operation for initial project setup. Running the setup script on an existing database should be safe as it uses `IF NOT EXISTS` clauses, but it's recommended to back up your data first.

You can set up the database in two ways:

1. During initial project setup with `./setup.sh` or `.\setup.ps1` (recommended for new installations)

2. Directly using the database setup scripts:
   ```bash
   # For Linux/macOS
   ./setup.sh --db-setup
   
   # For Windows
   .\setup.ps1 -DbSetup
   
   # Or run the Python script directly
   cd scripts
   pip install -r requirements.txt
   python db_setup/create_tables.py --db-type postgres
   ```

For more details on database configuration, see `scripts/README.md`.

## OpenAI SDK

This project uses the OpenAI SDK v1.x, which has a different interface compared to v0.x. The main differences are:
- The v1.x SDK no longer requires `await` for API calls (they are synchronous now)
- The response structure is different, but the code has been updated to handle this

## Development

### Backend Structure

- `app/main.py`: Application entry point
- `app/routers/`: API routes
- `app/models/`: Data models
- `app/schemas/`: Pydantic schemas
- `app/services/`: Business logic modules
- `app/utils/`: Utility functions

### Frontend Structure

- `app/`: Pages and routes
- `components/`: Reusable React components
- `contexts/`: React contexts
- `utils/`: Utility functions

## Testing

Run backend tests:

```bash
cd backend
pytest
```

## Production Deployment

For production deployment:

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Run the backend:
   ```bash
   cd backend
   uvicorn app.main:app
   ```

## License

MIT