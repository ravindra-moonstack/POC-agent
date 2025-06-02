# Profiler - AI Customer Intelligence Platform

A modern, responsive web application for relationship managers to manage client interactions and insights powered by AI.

## Features

- 📊 Dashboard with key metrics and insights
- 👥 Client management and profiling
- 📝 Meeting reports with AI-generated insights
- 📱 Responsive design for desktop and mobile
- 🎨 Modern UI with purple and white theme
- 🔒 Secure authentication and data handling

## Tech Stack

- **Framework:** React + Vite
- **UI Library:** Material-UI (MUI)
- **State Management:** React Query + Zustand
- **Routing:** React Router
- **Styling:** MUI Theme + SCSS
- **Charts:** Recharts
- **Icons:** Material Icons
- **HTTP Client:** Axios

## Getting Started

### Prerequisites

- Node.js 16.x or later
- npm 7.x or later

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd profiler-frontend/web
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

### Building for Production

1. Create a production build:

   ```bash
   npm run build
   ```

2. Preview the production build:
   ```bash
   npm run preview
   ```

## Project Structure

```
/src
├── /components          # Reusable UI components
├── /pages              # Page components
├── /services           # API service layer
├── /hooks             # Custom React hooks
├── /utils             # Helper functions
├── /styles            # Global styles and theme
├── /layouts           # Layout components
├── /store             # State management
└── /types             # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=your_api_url_here
```

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## License

This project is licensed under the MIT License.
