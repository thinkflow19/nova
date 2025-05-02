# Nova API Backend

Backend API for Nova - Turn your documents into an AI assistant.

## Tech Stack

- FastAPI (Python 3.10+)
- Supabase (Postgres + Auth)
- AWS S3 (Storage)
- Pinecone (Vector DB)
- OpenAI GPT-4-turbo (LLM)
- Stripe (Payments)

## Setup

1. Clone the repository
2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

5. Fill in the environment variables in `.env`

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

## License

MIT 