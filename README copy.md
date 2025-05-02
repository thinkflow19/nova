# Nova - Private AI-Powered Chatbots from Documents

Nova is a SaaS platform that allows users to create private, branded AI chatbots from their uploaded documents using RAG (Retrieval-Augmented Generation) and OpenAI's GPT-4-turbo.

## Features

- **Document Upload**: PDF, DOCX, TXT files up to 5MB
- **Private Chatbot**: Secure access to your information
- **Customizable Branding**: Colors and tone
- **Embeddable Widget**: Add your chatbot to any website
- **Comprehensive Analytics**: Track usage patterns
- **Enterprise-Grade Security**: Data never shared
- **Lifetime Deal**: $249 one-time payment

## Tech Stack

### Frontend
- Next.js 14
- TailwindCSS
- Vercel (Hosting)

### Backend
- FastAPI (Python 3.10+)
- Supabase (Postgres + Auth)
- AWS S3 (Storage)
- Pinecone (Vector DB)
- OpenAI GPT-4-turbo (LLM)
- Stripe (Payments)
- Railway (Hosting)

## Project Structure

```
/nova
  /frontend     # Next.js frontend
  /backend      # FastAPI backend
```

## Getting Started

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Then edit .env with your credentials
uvicorn app.main:app --reload
```

Backend API will be running at http://localhost:8000

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local  # Then edit with your credentials
npm run dev
```

Frontend will be available at http://localhost:3000

## Deployment

### Backend Deployment (Railway)

1. Create a Railway account
2. Create a new project
3. Add all the environment variables from `.env`
4. Deploy using GitHub repository

### Frontend Deployment (Vercel)

1. Create a Vercel account
2. Import your repository
3. Add environment variables
4. Deploy

## License

MIT 