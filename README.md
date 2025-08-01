# AI-Enhanced Meeting Transcription and Analysis Tool

Organizations frequently conduct meetings, often recording them for later review. However, navigating through lengthy audio files is inefficient and impractical. Users need a streamlined solution that filters audio, differentiates speakers, accurately transcribes conversations, and offers intelligent interaction with the content. This tool aims to leverage AI technologies, specifically utilizing the OpenAI API or equivalent services, to enhance usability, comprehension, and information retrieval from meeting recordings.

## 🚀 Features

- **Audio Upload & Processing**: Drag-and-drop interface for audio file uploads with support for multiple formats (MP3, WAV, M4A, FLAC, OGG) up to 100MB
- **Direct OpenAI Integration**: Raw audio files processed directly through OpenAI Whisper API for cost optimization
- **AI Transcription**: OpenAI Whisper-powered transcription with high accuracy and meeting-focused prompting
- **Speaker Diarization**: Automatic speaker identification and separation using segment analysis
- **Intelligent Querying**: Ask questions about meeting content using GPT-4
- **Real-time Status**: Live updates on processing status
- **Modern UI**: Glassmorphism design with responsive layouts

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  React Frontend │    │   Laravel API    │    │   OpenAI API    │
│  (TypeScript)   │◄──►│    (PHP 8.2)     │◄──►│ (Whisper + GPT) │
│  + WebSocket    │    │  + Queue System  │    └─────────────────┘
└─────────────────┘    └──────────────────┘
                               │
                               ▼
                        ┌──────────────┐    ┌─────────────────┐
                        │ PostgreSQL   │    │     Redis       │
                        │   Database   │    │ Cache + Queues  │
                        └──────────────┘    └─────────────────┘
```

## 🛠️ Technology Stack

### Backend
- **Laravel 12** - Modern PHP web framework
- **PostgreSQL** - Primary database for data persistence
- **Redis** - Caching and queue management
- **Laravel Horizon** - Queue monitoring dashboard
- **Laravel Reverb** - WebSocket server for real-time updates
- **OpenAI API** - Whisper for transcription, GPT-4 for intelligent querying

### Frontend
- **React 19** - Latest React with modern features
- **TypeScript 5.6** - Type-safe development
- **Vite** - Fast build tool and development server
- **Laravel Echo + Pusher** - Real-time WebSocket connections

### Infrastructure
- **Docker** - Containerization for consistent development
- **Docker Compose** - Multi-service orchestration
- **GitHub Actions** - CI/CD pipeline automation

## 📋 Prerequisites

- **Docker** and **Docker Compose**
- **OpenAI API Key** (for transcription and querying)
- **Git** for version control
- **Node.js 22+** (for local development)
- **PHP 8.2+** (for local development)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd meeting-audio-studio
```

### 2. Environment Setup
```bash
# Copy environment file
cd backend
cp .env.example .env

# Add your OpenAI API key and configure Reverb WebSocket
# Edit .env with your settings:
# OPENAI_API_KEY=your_openai_api_key_here
# REVERB_APP_KEY=your_app_key
# REVERB_APP_SECRET=your_app_secret
# DB_PASSWORD=your_secure_password
```

### 3. Start with Docker
```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 4. Database Setup
```bash
# Run migrations (after containers are running)
docker-compose exec backend php artisan migrate
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **API Documentation**: http://localhost:8000/api/docs
- **WebSocket Server**: ws://localhost:8081
- **Horizon Dashboard**: http://localhost:8082

## 📊 API Endpoints

### Audio Management (v1)
- `GET /api/v1/audio-files` - List all audio files
- `POST /api/v1/audio-files` - Upload new audio file
- `GET /api/v1/audio-files/config` - Get upload configuration
- `GET /api/v1/audio-files/{id}` - Get audio file details
- `GET /api/v1/audio-files/{id}/download` - Download audio file
- `GET /api/v1/audio-files/{id}/stream` - Stream audio file
- `GET /api/v1/audio-files/{id}/transcript` - Get transcript for audio file

### Chunked Upload Support
- `POST /api/v1/audio-files/chunked/initialize` - Initialize chunked upload
- `POST /api/v1/audio-files/chunked/upload` - Upload chunk
- `POST /api/v1/audio-files/chunked/finalize/{uploadId}` - Finalize upload
- `GET /api/v1/audio-files/chunked/status/{uploadId}` - Get upload status
- `DELETE /api/v1/audio-files/chunked/cancel/{uploadId}` - Cancel upload

### Transcript Operations (v1)
- `GET /api/v1/transcripts/{id}` - Get transcript details
- `POST /api/v1/transcripts/{id}/queries` - Query transcript with AI

### System
- `GET /api/health` - API health status
- `GET /api/docs` - API documentation

## 🔧 Development Setup

### Manual Development (without Docker)

#### Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve --port=8000
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Environment Variables

#### Backend (.env)
```bash
APP_NAME="Meeting Audio Studio"
APP_ENV=local
APP_DEBUG=true

# Database Configuration
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=meeting_audio_studio
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
CACHE_STORE=redis
QUEUE_CONNECTION=redis

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# WebSocket Configuration (Laravel Reverb)
REVERB_APP_ID=your_app_id
REVERB_APP_KEY=your_app_key
REVERB_APP_SECRET=your_app_secret
REVERB_HOST=localhost
REVERB_PORT=8081
REVERB_SCHEME=http
```

#### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000/api
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8081
VITE_REVERB_SCHEME=http
VITE_PUSHER_APP_KEY=your_app_key
```

## 📁 Project Structure

```
meeting-audio-studio/
├── .github/                        # GitHub workflows and configuration
│   └── workflows/
│       └── ci.yml                  # CI/CD pipeline configuration
├── backend/                        # Laravel API application
│   ├── app/
│   │   ├── Abstracts/              # Abstract classes and interfaces
│   │   ├── Constants/              # Application constants
│   │   ├── Exceptions/             # Custom exception classes
│   │   ├── Http/                   # HTTP layer (Controllers, Middleware, Requests)
│   │   │   └── Controllers/Api/V1/ # Versioned API controllers
│   │   ├── Models/                 # Eloquent models
│   │   ├── Providers/              # Service providers
│   │   ├── Repositories/           # Data access repositories
│   │   └── Services/               # Business logic services
│   ├── bootstrap/                  # Application bootstrap files
│   ├── config/                     # Configuration files
│   │   ├── database.php            # Database configuration
│   │   ├── horizon.php             # Queue monitoring configuration
│   │   ├── reverb.php              # WebSocket configuration
│   │   └── openai.php              # OpenAI API configuration
│   ├── database/
│   │   ├── migrations/             # Database migrations
│   │   ├── factories/              # Model factories
│   │   └── seeders/                # Database seeders
│   ├── public/                     # Public assets and entry point
│   ├── resources/                  # Views, CSS, JS resources
│   ├── routes/
│   │   ├── api.php                 # API routes (versioned)
│   │   ├── web.php                 # Web routes
│   │   └── channels.php            # WebSocket channel routes
│   ├── storage/                    # Storage directories
│   ├── tests/                      # PHPUnit tests
│   ├── vendor/                     # Composer dependencies
│   ├── composer.json               # Composer configuration
│   ├── Dockerfile                  # Backend Docker configuration
│   └── artisan                     # Laravel command-line interface
├── frontend/                       # React TypeScript application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/         # Reusable React components
│   │   │   ├── contexts/           # React Context providers
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   ├── layouts/            # Layout components
│   │   │   ├── pages/              # Page components
│   │   │   ├── services/           # API service functions
│   │   │   ├── types/              # TypeScript type definitions
│   │   │   ├── utils/              # Utility functions
│   │   │   └── App.tsx             # Main App component
│   │   ├── assets/                 # Static assets (CSS, images)
│   │   ├── lib/                    # Library utilities and configurations
│   │   ├── sdk/                    # SDK integrations
│   │   └── main.tsx                # Application entry point
│   ├── build/                      # Production build output
│   ├── public/                     # Static public assets
│   ├── package.json                # NPM configuration
│   ├── tsconfig.json               # TypeScript configuration
│   ├── vite.config.ts              # Vite build configuration
│   ├── eslint.config.js            # ESLint configuration
│   ├── tailwind.config.js          # Tailwind CSS configuration
│   └── Dockerfile                  # Frontend Docker configuration
├── scripts/                        # Build and deployment scripts
├── docker-compose.yml              # Multi-service Docker orchestration
├── Makefile                        # Development shortcuts
└── README.md                       # This file
```

## 🔄 Processing Flow

1. **Upload**: User uploads audio file via drag-and-drop interface with support for chunked uploads for large files
2. **Validation**: Laravel validates file type, size, and MIME type with comprehensive format support
3. **Queue Processing**: Large files are processed asynchronously using Redis queues with real-time status updates
4. **Storage**: File stored securely with metadata tracking and backup management
5. **Direct Transcription**: Audio sent directly to OpenAI Whisper API with optimized prompting for meetings
6. **AI Enhancement**: OpenAI handles transcription, speaker identification, and content analysis
7. **Real-time Updates**: WebSocket notifications keep users informed of processing progress
8. **Intelligent Querying**: GPT-4 powered Q&A system with contextual understanding of meeting content

## 🎨 UI Features

- **Modern Glassmorphism Design**: Contemporary frosted glass aesthetic with smooth animations
- **Chunked Upload Support**: Large file uploads with progress tracking and resume capability
- **Real-time WebSocket Updates**: Live processing status and notifications
- **Speaker Visualization**: Clear speaker identification with timeline visualization
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Progressive Loading**: Smooth loading states with skeleton screens
- **Dark/Light Mode**: Adaptive theme support for user preference

## 🔒 Security

- **Comprehensive File Validation**: Multi-layer validation for file types, sizes, and content
- **Chunked Upload Security**: Secure handling of large file uploads with integrity checks
- **API Versioning**: Structured API versioning for backward compatibility and security
- **Environment Isolation**: Secure environment variable management
- **CORS Configuration**: Properly configured cross-origin resource sharing
- **Input Sanitization**: All user inputs are validated and sanitized
- **WebSocket Security**: Secure real-time communication channels

## 🐛 Troubleshooting

### Common Issues

1. **OpenAI API Key Missing**
   ```bash
   # Add to .env file
   OPENAI_API_KEY=your_key_here
   ```

2. **Database Connection Issues**
   ```bash
   # Check all services are running
   docker-compose ps
   # Restart if needed
   docker-compose restart postgres
   ```

3. **WebSocket Connection Failed**
   ```bash
   # Check Reverb configuration in .env
   REVERB_HOST=localhost
   REVERB_PORT=8081
   # Restart backend service
   docker-compose restart backend
   ```

4. **Queue Processing Issues**
   ```bash
   # Check Redis is running
   docker-compose ps redis
   # View Horizon dashboard
   open http://localhost:8082
   ```

5. **Large File Upload Problems**
   ```bash
   # Check chunked upload status via API
   curl http://localhost:8000/api/v1/audio-files/chunked/status/{uploadId}
   ```

6. **Frontend Build Issues**
   ```bash
   # Clear node modules and reinstall
   docker-compose exec frontend rm -rf node_modules
   docker-compose exec frontend npm install
   ```

## 📈 Scaling Considerations

- **Horizontal Scaling**: Multi-container deployment with load balancing
- **Queue Optimization**: Redis cluster setup for high-throughput processing
- **File Storage**: Cloud storage integration (AWS S3, Google Cloud Storage)
- **CDN Integration**: Content delivery network for static assets
- **API Rate Limiting**: OpenAI API usage optimization and rate limiting
- **Caching Strategy**: Multi-layer caching with Redis for improved performance
- **WebSocket Scaling**: Multiple Reverb instances for concurrent connections
- **Database Optimization**: Read replicas and connection pooling
- **Monitoring**: Application performance monitoring and logging

## Testing

This project includes comprehensive local testing capabilities that mirror the GitHub Actions CI/CD pipeline.

### Quick Testing
```bash
# Validate setup
make validate-setup

# Interactive testing menu
make test

# Test specific components
make test-frontend     # React, TypeScript, ESLint, Vitest
make test-backend      # PHP, Laravel tests, Composer
make test-docker       # Container builds
make test-security     # Trivy vulnerability scan
make test-integration  # Full stack integration

# Run all tests
make test-all

# GitHub Actions simulation
make test-act
```

### Manual Testing
```bash
# Direct script usage
./scripts/test-ci-local.sh                    # Interactive menu
./scripts/test-ci-local.sh frontend           # Frontend only
./scripts/test-ci-local.sh all                # All tests
./scripts/test-ci-local.sh act frontend       # Act simulation
```

For detailed testing documentation, see [LOCAL_TESTING.md](LOCAL_TESTING.md) and [scripts/README.md](scripts/README.md).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for Whisper and GPT APIs
- **Laravel Team** for the excellent framework and ecosystem
- **React Team** for the modern frontend library
- **Docker** for containerization solutions
- **Vite** for fast build tooling
- **Tailwind CSS** for utility-first styling

---

## 📞 Support

For support, email support@meetingaudiostudio.com or create an issue in this repository.
