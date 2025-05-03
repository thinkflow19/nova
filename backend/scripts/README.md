# Database Scripts for Python App Backend

This directory contains scripts for setting up and managing the database for the Python application.

## Files

- `optimized_schema.sql`: The complete database schema including tables, indexes, policies, and triggers
- `setup_db.py`: Python script to initialize the database by applying the schema

## Setup Instructions

### Prerequisites

- Python 3.9+
- Supabase project with admin access
- `.env` file in the backend directory with Supabase credentials

### Setting Up the Database

To set up a fresh database:

```bash
# Navigate to the backend directory
cd backend

# Activate your virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run the setup script
python scripts/setup_db.py
```

### Resetting the Database

To reset the database (drops all tables and recreates them):

```bash
python scripts/setup_db.py --reset
```

**Warning**: This will delete all data in the database. Use with caution.

## Schema Overview

The database schema includes the following main tables:

1. `user_profiles`: Extended user profiles beyond auth.users
2. `projects`: Projects created by users
3. `documents`: Document metadata (content stored in vector database)
4. `chat_sessions`: Chat sessions linked to projects
5. `chat_messages`: Individual chat messages
6. `shared_objects`: Tracks sharing of objects between users

Each table is protected with Row Level Security (RLS) policies to ensure users can only access their own data or data that has been explicitly shared with them.

## Modification

If you need to modify the schema:

1. Edit `optimized_schema.sql`
2. Run the setup script with the `--reset` flag (if needed)
3. Update the database service code in `app/services/database_service.py` to match any changes

## Archive

The `archive` directory contains older schema versions and scripts that are no longer in use. These are kept for reference purposes only. 