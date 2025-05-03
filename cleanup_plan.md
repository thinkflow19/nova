# Revised Cleanup Plan

## Directory Structure
```
cursor-python/
├── README.md                  # Main project documentation
├── backend/                   # Backend Python code
│   ├── app/                   # FastAPI application
│   │   ├── main.py            # Entry point
│   │   ├── routers/           # API routes
│   │   ├── models/            # Data models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   └── utils/             # Utilities
│   ├── requirements.txt       # Dependencies
│   └── tests/                 # Backend tests
├── frontend/                  # Next.js frontend
│   ├── app/                   # Pages and routes
│   ├── components/            # React components
│   ├── contexts/              # React contexts
│   ├── utils/                 # Utilities
│   ├── public/                # Static assets
│   ├── package.json           # Dependencies
│   └── README.md              # Frontend documentation
├── scripts/                   # Deployment and utility scripts
│   ├── db_setup/              # Database setup scripts
│   │   ├── create_tables.py   # Vendor-agnostic database setup
│   │   ├── migrations/        # Database migrations
│   │   └── schema.sql         # SQL schema definitions
│   └── requirements.txt       # Script dependencies
└── docs/                      # Documentation folder
    ├── STYLE_GUIDE.md         # Coding style guidelines
    ├── SUPABASE_INTEGRATION.md # Supabase integration details
    └── development_guide.md   # Development documentation
```

## Files to Delete
- Temporary and duplicate files (.DS_Store, etc.)
- Duplicate scripts (keeping only the most robust versions)
- Binary files not needed for source code (executables, etc.)

## Files to Consolidate
- Test files should be moved to backend/tests/
- Setup scripts should be consolidated into scripts/db_setup

## Files to Keep
- All MD documentation files (will be moved to docs/)
- Database scripts (make vendor-agnostic)
- Backend Python code
- Frontend Next.js code
- Essential requirements files

## Vendor Agnostic Database Approach
- Create an abstract database interface
- Implement specific adapters (Supabase, PostgreSQL, SQLite)
- Use environment variables to configure the database connection
- Provide migrations that work across different database systems 