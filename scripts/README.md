# Database and Utility Scripts

This directory contains various utility scripts for managing the application.

## Database Scripts

The `db_setup` directory contains vendor-agnostic database setup scripts:

### Creating Database Tables

> ⚠️ **Important**: The database setup scripts use `CREATE TABLE IF NOT EXISTS` to preserve existing tables and data. They should be safe to run on existing databases, but for production environments, always back up your data first.

```bash
cd scripts
pip install -r requirements.txt

# PostgreSQL (default)
python db_setup/create_tables.py --db-type postgres

# SQLite
python db_setup/create_tables.py --db-type sqlite

# MySQL
python db_setup/create_tables.py --db-type mysql
```

You can also run the database setup through the main project setup script:

```bash
# For Linux/macOS
./setup.sh --db-setup

# For Windows
.\setup.ps1 -DbSetup
```

### When to Run Database Setup

- **First-time setup**: When setting up the project for the first time
- **Schema changes**: After updating the schema in `schema.sql` (will only add new tables/columns)
- **New environment**: When setting up a new development or testing environment

**Do not run** on production databases without testing on a staging environment first.

### Environment Variables

The database scripts look for the following environment variables:

#### Common
- `DB_TYPE`: Database type (postgres, sqlite, mysql)

#### PostgreSQL
- `DB_HOST` or `POSTGRES_HOST`: Database host
- `DB_PORT` or `POSTGRES_PORT`: Database port (default: 5432)
- `DB_NAME` or `POSTGRES_DB`: Database name (default: postgres)
- `DB_USER` or `POSTGRES_USER`: Database user (default: postgres)
- `DB_PASSWORD` or `POSTGRES_PASSWORD`: Database password

#### Supabase (PostgreSQL)
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_POSTGRES_PASSWORD` or `SUPABASE_DB_PASSWORD`: Supabase database password

#### SQLite
- `SQLITE_PATH`: Path to SQLite database file (default: app.db)

#### MySQL
- `MYSQL_HOST` or `DB_HOST`: MySQL host
- `MYSQL_PORT` or `DB_PORT`: MySQL port (default: 3306)
- `MYSQL_USER` or `DB_USER`: MySQL user (default: root)
- `MYSQL_PASSWORD` or `DB_PASSWORD`: MySQL password
- `MYSQL_DATABASE` or `DB_NAME`: MySQL database name (default: app)

## Customizing the Schema

The database schema is defined in `db_setup/schema.sql`. You can modify this file to adjust the database structure as needed. 