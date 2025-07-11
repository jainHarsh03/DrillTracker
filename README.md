# 🏃‍♂️ Drill Tracker

A modern, professional drill tracking application built with Express.js backend and vanilla JavaScript frontend. Perfect for fitness enthusiasts, sports teams, and training organizations to track and manage their drill schedules.

## 🌟 Features

### Core Functionality
- **📋 Drill Management**: Create, read, update, and delete drill entries
- **📅 Interactive Calendar**: Visual drill scheduling with monthly navigation
- **📊 Statistics Dashboard**: Track completion rates and performance metrics
- **🔐 User Authentication**: Secure JWT-based authentication system
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **🎨 Modern UI**: Dark theme with smooth animations and gradients

### Technical Features
- **🚀 RESTful API**: Clean, documented API endpoints
- **🔒 Security**: Password hashing, JWT tokens, CORS protection
- **📈 Performance**: Optimized for fast loading and smooth interactions
- **🌐 Cloud Ready**: Configured for GCP Cloud Run deployment
- **📝 Comprehensive Logging**: Detailed error tracking and monitoring

## 🏗️ Architecture

```
drill-tracker/
├── 📁 backend/                 # Backend application code
│   └── 📁 src/                # Source code directory
│       ├── 📁 middleware/     # Express middleware functions
│       ├── 📁 models/         # MongoDB data models
│       └── � routes/         # API route handlers
├── 📁 frontend/               # Frontend application code
│   └── 📁 public/            # Static web assets
│       ├── index.html        # Complete Single Page Application (SPA)
│       └── 404.html          # Error page
├── 📄 server.js              # Main application server
├── 📄 package.json           # Dependencies and scripts
└── 📄 .env                   # Environment configuration
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 16.0.0
- **MongoDB** (local or Atlas)
- **npm** >= 8.0.0

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/drill-tracker.git
   cd drill-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - 🌐 Application: http://localhost:5000
   - � Health Check: http://localhost:5000/api/health
   - � Single Page App with integrated dashboard, authentication, and drill management

## 🌩️ Google Cloud Platform (GCP) Deployment

### Prerequisites
- GCP Account with billing enabled
- Google Cloud CLI installed and configured
- Docker installed (for local testing)

### Step 1: Prepare for Deployment

1. **Set up MongoDB Atlas**
   ```bash
   # Create a MongoDB Atlas cluster
   # Get connection string for production
   # Whitelist 0.0.0.0/0 for Cloud Run access
   ```

2. **Configure environment variables**
   ```bash
   # Create production .env file
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/drill-tracker
   JWT_SECRET=your-super-secure-jwt-secret
   ALLOWED_ORIGINS=https://your-app.run.app,https://your-domain.com
   ```

### Step 2: Deploy to Cloud Run

1. **Enable required APIs**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

2. **Create Dockerfile** (if not exists)
   ```dockerfile
   FROM node:16-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 8080
   CMD ["npm", "start"]
   ```

3. **Deploy to Cloud Run**
   ```bash
   # Build and deploy in one command
   gcloud run deploy drill-tracker \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars NODE_ENV=production \
     --set-env-vars MONGODB_URI="your-mongodb-uri" \
     --set-env-vars JWT_SECRET="your-jwt-secret"
   ```

4. **Configure custom domain** (optional)
   ```bash
   gcloud run domain-mappings create \
     --service drill-tracker \
     --domain your-domain.com \
     --region us-central1
   ```

### Step 3: Production Optimization

1. **Set up monitoring**
   - Enable Cloud Logging
   - Set up uptime checks
   - Configure alerting policies

2. **Security hardening**
   ```bash
   # Set specific allowed origins
   gcloud run services update drill-tracker \
     --set-env-vars ALLOWED_ORIGINS="https://your-domain.com"
   ```

3. **Performance optimization**
   - Enable CDN for static assets
   - Configure Cloud Storage for file uploads
   - Set up Cloud Load Balancing

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
GET  /api/auth/me          # Get current user
POST /api/auth/refresh     # Refresh JWT token
```

### Drill Management Endpoints
```
GET    /api/drills         # Get all user drills
POST   /api/drills         # Create new drill
GET    /api/drills/:id     # Get specific drill
PUT    /api/drills/:id     # Update drill
DELETE /api/drills/:id     # Delete drill
```

### System Endpoints
```
GET /api/health            # Health check endpoint
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | development | No |
| `PORT` | Server port | 5000 | No (GCP sets this) |
| `MONGODB_URI` | MongoDB connection string | localhost | Yes |
| `JWT_SECRET` | JWT signing secret | random | Yes |
| `ALLOWED_ORIGINS` | CORS allowed origins | localhost | Production only |

### Frontend Configuration

The frontend automatically adapts to the deployment environment:
- **Development**: Uses localhost API endpoints
- **Production**: Uses relative URLs for API calls

## 🛠️ Development

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests (placeholder)
npm run gcp:build  # Prepare for GCP build
npm run gcp:deploy # Deploy to GCP
```

### Code Structure

#### Backend (`server.js` and `src/`)
- **Express.js** server with middleware
- **MongoDB** with Mongoose ODM
- **JWT** authentication
- **CORS** configuration
- **Error handling** and logging

#### Frontend (`public/`)
- **Vanilla JavaScript** (no frameworks)
- **Modern CSS** with gradients and animations
- **Responsive design** with mobile support
- **Modular architecture** with separated concerns

### Coding Standards

- **ES6+** JavaScript features
- **Async/await** for asynchronous operations
- **Comprehensive error handling**
- **JSDoc** comments for all functions
- **Consistent naming conventions**
- **Security best practices**

## 🔒 Security Features

- **Password hashing** with bcryptjs
- **JWT token** authentication
- **CORS protection** with configurable origins
- **Input validation** on all endpoints
- **Error message sanitization** in production
- **Rate limiting** ready (can be added)

## 📊 Monitoring & Logging

### Local Development
- Console logging with emoji indicators
- Error stack traces for debugging
- Request/response logging

### Production (GCP)
- **Cloud Logging** integration
- **Health check** endpoint for monitoring
- **Error tracking** with stack traces
- **Performance monitoring** ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**Problem**: Database connection fails
```bash
# Solution: Check MongoDB URI and network connectivity
# For Atlas: Ensure IP whitelist includes 0.0.0.0/0
```

**Problem**: Authentication not working
```bash
# Solution: Check JWT_SECRET is set and consistent
# Verify token is being sent in Authorization header
```

**Problem**: CORS errors in production
```bash
# Solution: Set ALLOWED_ORIGINS environment variable
# Include your production domain
```

### Getting Help

- 📧 Email: support@drilltracker.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/drill-tracker/issues)
- 📖 Docs: [Wiki](https://github.com/your-org/drill-tracker/wiki)

## 🎯 Roadmap

- [ ] **Mobile App** - React Native implementation
- [ ] **Team Management** - Multi-user drill sharing
- [ ] **Analytics** - Advanced performance metrics
- [ ] **Integrations** - Fitness tracker synchronization
- [ ] **Notifications** - Email/SMS drill reminders
- [ ] **Export** - PDF reports and data export

---

**Built with ❤️ by the Drill Tracker Team**

*Ready for production deployment on Google Cloud Platform* 🌟