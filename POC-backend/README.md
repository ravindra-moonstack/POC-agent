# Profiler - AI Customer Intelligence System

Profiler is an advanced AI-powered system that helps Relationship Managers (RMs) deeply understand their clients by combining public data, meeting notes, investments, and contextual cues to generate comprehensive 360° customer profiles.

## 🌟 Features

- **Data Consolidation**: Automatically fetches and consolidates customer data from multiple sources
- **Meeting Intelligence**: Transcribes and analyzes client meetings for insights and sentiment
- **Investment Analysis**: Tracks and analyzes customer investment patterns and preferences
- **Dynamic Profiling**: Generates rich customer profiles with both static and dynamic parameters
- **PYC Scoring**: Calculates comprehensive customer profiling scores
- **Mobile & Web Access**: Full-featured mobile app for RMs and admin dashboard

## 🛠 Technology Stack

- **Backend**: Node.js + TypeScript + Express.js
- **Database**: PostgreSQL with Prisma ORM
- **AI/ML**: OpenAI GPT-4 and Whisper APIs
- **Queue Processing**: BullMQ + Redis
- **Mobile App**: React Native
- **Web Dashboard**: React/Next.js
- **Authentication**: JWT-based RBAC

## 📋 Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6
- OpenAI API Key
- LinkedIn API Key (optional)
- CIBIL API Key (optional)

## 🚀 Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/profiler.git
   cd profiler
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Initialize the database:

   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## 🏗 Project Structure

```
/profiler
│
├── /agents               # Autonomous logic per function
├── /core                # Core profiling logic
├── /data_sources        # External data source connectors
├── /utils               # Utility functions
├── /ui                  # User interfaces
│   ├── /mobile         # React Native RM app
│   └── /web           # Admin dashboard
├── /config             # Configuration files
├── /tests              # Unit tests
└── /prisma             # Database schema and migrations
```

## 🔒 Security & Compliance

- All profile data is encrypted at rest
- Secure audio file storage
- User data consent tracking
- Role-based access control
- Audit logging for all operations

## 📱 Mobile App Features

- Voice/text meeting capture
- Customer profile search
- Timeline view
- Meeting report generation

## 🖥 Web Dashboard Features

- Full profile management
- Investment tracking
- Interaction history
- RM performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 and Whisper APIs
- LinkedIn for professional data access
- CIBIL for credit information
