# Nova Project Setup and Management

This guide explains how to set up and manage the Nova project using the provided build script.

## Prerequisites

- Python 3.12
- Node.js and npm
- lsof (for port management)

## Setup Instructions

1. Make the build script executable:
   ```bash
   chmod +x build.sh
   ```

2. Create a `.env` file in the `backend` directory using the `.env.sample` as a template:
   ```bash
   cp backend/.env.sample backend/.env
   ```
   Then edit the `backend/.env` file with your actual API keys and configuration values.

3. Run the initial setup:
   ```bash
   ./build.sh setup
   ```
   This will:
   - Check for Python 3.12
   - Create a virtual environment
   - Install backend dependencies
   - Install frontend dependencies

## Usage

### Start both frontend and backend servers
```bash
./build.sh start
```
This command will:
1. Kill any processes running on ports 8000 (backend) and 3000 (frontend)
2. Start the backend server on port 8000
3. Start the frontend server on port 3000
4. Wait for Ctrl+C to gracefully shut down both services

### Start only the backend server
```bash
./build.sh backend
```

### Start only the frontend server
```bash
./build.sh frontend
```

### Kill running services
```bash
./build.sh kill
```
This will terminate any processes running on ports 8000 and 3000.

### Show help
```bash
./build.sh help
```

## Environment Variables

The backend requires certain environment variables to be set in the `backend/.env` file. These include:

- Supabase credentials
- OpenAI API keys
- Vector database configuration
- AWS credentials (if using S3 for storage)
- Stripe keys (if using payments)

## Single Terminal Management

The build script is designed to run both frontend and backend servers from a single terminal. When you press Ctrl+C, it will gracefully shut down both services.

## Troubleshooting

If you encounter issues:

1. Check if the required Python and Node.js versions are installed
2. Verify that all environment variables are correctly set
3. Check the logs for any error messages
4. Try killing existing processes manually if automatic port clearing fails:
   ```bash
   lsof -i:8000 -t | xargs kill -9
   lsof -i:3000 -t | xargs kill -9
   ``` 