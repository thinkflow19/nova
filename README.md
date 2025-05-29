# Nova AI - Next-Generation AI Chat Interface

A production-ready, full-stack AI chat interface that rivals ChatGPT and Google Gemini. Built with modern technologies including FastAPI (Python), Next.js 14 (TypeScript), Supabase, OpenAI, and Pinecone.

## 🚀 Features

### 🤖 Advanced AI Capabilities
- **Multiple AI Models**: GPT-4, Claude, and other cutting-edge models
- **Real-time Streaming**: Live response streaming with typing indicators
- **Context Awareness**: Intelligent conversation memory and context handling
- **Custom AI Settings**: Per-project model configuration and parameters

### 📁 Document Intelligence
- **File Upload & Analysis**: Support for PDF, DOCX, TXT, MD, and more
- **Vector Search**: Semantic document search with Pinecone
- **Document Chat**: Ask questions about uploaded documents
- **Batch Processing**: Handle multiple documents simultaneously

### 🎙️ Voice & Media
- **Voice Recording**: Built-in voice recorder with waveform visualization
- **Audio Processing**: Voice-to-text and text-to-voice capabilities
- **File Attachments**: Drag-and-drop file uploads with progress tracking
- **Media Preview**: Image and document previews in chat

### 🏗️ Project Management
- **Project Organization**: Group conversations by projects
- **Session Management**: Persistent chat sessions with search
- **Collaboration**: Share projects and conversations
- **Custom Settings**: Per-project AI model and parameter configuration

### 🎨 Modern UI/UX
- **Dual Themes**: Dark neo-futuristic and light elegant themes
- **Glass Morphism**: Modern blur effects and transparency
- **Smooth Animations**: 60fps animations with stagger effects
- **Responsive Design**: Mobile-first approach with touch optimization
- **Accessibility**: WCAG compliant with keyboard navigation

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL with Supabase
- **Vector DB**: Pinecone for semantic search
- **AI Integration**: OpenAI API, Anthropic Claude
- **Authentication**: JWT with refresh tokens
- **File Storage**: Supabase Storage
- **Real-time**: Server-Sent Events for streaming

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS with CSS Variables
- **State Management**: Zustand
- **UI Components**: Radix UI primitives
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios with interceptors
- **Animations**: Framer Motion

### Infrastructure
- **Deployment**: Docker containers
- **Database**: PostgreSQL 15+
- **Caching**: Redis (optional)
- **Monitoring**: Structured logging
- **Security**: CORS, rate limiting, input validation

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm
- **Python** 3.11+ and pip
- **PostgreSQL** 15+ (or Supabase account)
- **Git** for version control

### Required API Keys

You'll need accounts and API keys for:

1. **Supabase** - Database and authentication
   - Create account at [supabase.com](https://supabase.com)
   - Create a new project
   - Get your project URL and anon key

2. **OpenAI** - AI model access
   - Create account at [openai.com](https://openai.com)
   - Generate API key from dashboard

3. **Pinecone** - Vector database
   - Create account at [pinecone.io](https://pinecone.io)
   - Create an index with 1536 dimensions
   - Get your API key and environment

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd nova
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/nova_db
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# AI Configuration
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Vector Database
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=nova-documents

# Security
SECRET_KEY=your_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Application
APP_NAME=Nova AI
APP_VERSION=1.0.0
DEBUG=True
CORS_ORIGINS=["http://localhost:3000"]

# File Upload
MAX_FILE_SIZE=25000000  # 25MB
ALLOWED_FILE_TYPES=["pdf","txt","md","docx","jpg","png","gif"]
```

### 3. Database Setup

```bash
# Run database migrations
python scripts/setup_database.py

# Or if using Supabase, run the SQL schema
# Copy the contents of backend/database/schema.sql to your Supabase SQL editor
```

### 4. Start Backend Server

```bash
# From backend directory
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend API will be available at `http://localhost:8000`

### 5. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

Edit the `.env.local` file:

```env
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1

# App Configuration
NEXT_PUBLIC_APP_NAME=Nova AI
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_VOICE_RECORDING=true
NEXT_PUBLIC_ENABLE_FILE_UPLOAD=true
NEXT_PUBLIC_ENABLE_DARK_MODE=true

# Development
NODE_ENV=development
```

### 6. Start Frontend Server

```bash
# From frontend directory
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 🔧 Development

### Running Both Services

You can run both backend and frontend simultaneously:

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Available Scripts

#### Backend Scripts
   ```bash
# Development
python -m uvicorn app.main:app --reload --port 8000

# Testing
python -m pytest
python -m pytest --cov=app tests/

# Database
python scripts/setup_database.py
python scripts/migrate.py

# Linting
black app/
isort app/
flake8 app/
```

#### Frontend Scripts
```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # TypeScript type checking

# Testing
npm run test            # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
```

## 📁 Project Structure

```
nova/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── core/              # Core configuration
│   │   │   ├── models/            # Database models
│   │   │   ├── services/          # Business logic
│   │   │   ├── utils/             # Utility functions
│   │   │   └── main.py            # FastAPI app
│   │   ├── tests/                 # Backend tests
│   │   ├── scripts/               # Setup scripts
│   │   ├── requirements.txt       # Python dependencies
│   │   └── .env.example          # Environment template
│   ├── frontend/                   # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/               # Next.js pages
│   │   │   ├── components/        # React components
│   │   │   ├── services/          # API services
│   │   │   ├── stores/            # State management
│   │   │   ├── types/             # TypeScript types
│   │   │   └── utils/             # Utility functions
│   │   ├── public/                # Static assets
│   │   ├── package.json           # Node dependencies
│   │   └── .env.example          # Environment template
│   ├── docs/                      # Documentation
│   ├── docker-compose.yml         # Docker configuration
│   └── README.md                  # This file
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
python -m pytest tests/ -v
python -m pytest --cov=app tests/
```

### Frontend Testing
```bash
cd frontend
npm run test
npm run test:coverage
```

## 🚢 Production Deployment

### Using Docker

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Environment Variables**
   Create a `.env.production` file with production values.

### Manual Deployment

#### Backend
   ```bash
   cd backend
pip install -r requirements.txt
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Frontend
```bash
cd frontend
npm run build
npm run start
```

## 🔒 Security

### Backend Security
- JWT authentication with refresh tokens
- Rate limiting on all endpoints
- Input validation with Pydantic
- CORS configuration
- SQL injection prevention
- File upload validation

### Frontend Security
- XSS protection with content sanitization
- CSRF protection with token validation
- Secure storage for sensitive data
- Input validation with Zod schemas
- API request authentication

## 📊 Performance

### Backend Optimizations
- Async/await for I/O operations
- Database connection pooling
- Response caching
- Efficient vector search
- Streaming responses

### Frontend Optimizations
- Code splitting and lazy loading
- Image optimization
- Bundle analysis
- React Query for caching
- Memoization for expensive operations

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Add tests** for new functionality
5. **Run the test suite**: `npm test` and `python -m pytest`
6. **Commit your changes**: `git commit -m 'Add amazing feature'`
7. **Push to the branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript strict mode for frontend
- Use Python type hints for backend
- Write tests for new features
- Update documentation
- Follow existing code style
- Ensure accessibility compliance

## 📝 API Documentation

Once the backend is running, you can access:

- **Interactive API Docs**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

## 🆘 Troubleshooting

### Common Issues

1. **Backend won't start**
   - Check Python version (3.11+ required)
   - Verify all environment variables are set
   - Ensure database is accessible
   - Check API keys are valid

2. **Frontend won't start**
   - Check Node.js version (18+ required)
   - Verify backend is running on port 8000
   - Check environment variables
   - Clear npm cache: `npm cache clean --force`

3. **Database connection issues**
   - Verify PostgreSQL is running
   - Check database credentials
   - Ensure database exists
   - Run migrations: `python scripts/setup_database.py`

4. **API key errors**
   - Verify OpenAI API key is valid
   - Check Pinecone configuration
   - Ensure Supabase keys are correct
   - Check API key permissions

### Getting Help

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Open a GitHub issue with detailed information
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community server (link in profile)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for providing advanced AI models
- **Anthropic** for Claude AI integration
- **Supabase** for backend-as-a-service
- **Pinecone** for vector database services
- **Vercel** for Next.js framework
- **FastAPI** for the excellent Python framework

---

**Nova AI** - Redefining the future of AI conversations 🚀

Built with ❤️ by the Nova AI Team