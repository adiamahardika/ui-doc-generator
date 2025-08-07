# Doc Generator Frontend

A modern React/Next.js application for generating documentation from GitHub repositories using AI-powered analysis. Built with TypeScript, Tailwind CSS, and shadcn/ui components.

## Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout with auth provider
│   ├── page.tsx                 # Login page (root)
│   ├── login.tsx                # Login component
│   ├── dashboard/               # Repository browser
│   │   ├── loading.tsx         # Loading UI
│   │   └── page.tsx            # Dashboard page
│   ├── files/                   # File explorer and documentation generator
│   │   ├── loading.tsx         # Loading UI
│   │   └── page.tsx            # Files page
│   ├── profile/                 # User profile management
│   │   └── page.tsx            # Profile page
│   └── register/                # User registration
│       └── page.tsx            # Registration page
├── components/                   # Reusable components
│   ├── branch-selector.tsx      # GitHub branch selection
│   ├── file-content-viewer.tsx  # File content display
│   ├── file-tree.tsx           # Repository file tree
│   ├── github-token-dialog.tsx  # GitHub token management
│   ├── layout-wrapper.tsx       # Page layout wrapper
│   ├── navbar-new.tsx          # Modern navigation bar
│   ├── navbar.tsx              # Navigation bar
│   ├── protected-route.tsx      # Authentication guard
│   ├── sidebar.tsx             # Sidebar navigation
│   ├── theme-provider.tsx       # Theme management
│   └── ui/                     # shadcn/ui components
│       ├── accordion.tsx
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── select.tsx
│       └── ... (30+ UI components)
├── contexts/                     # React contexts
│   └── auth-context.tsx        # Authentication state management
├── hooks/                       # Custom React hooks
│   ├── use-mobile.tsx          # Mobile detection hook
│   └── use-toast.ts            # Toast notifications
├── lib/                         # Utility libraries
│   ├── auth.ts                 # Authentication utilities
│   ├── github-token.ts         # GitHub token management
│   ├── pdf-generator.tsx       # PDF generation with React-PDF
│   └── utils.ts                # General utilities
├── public/                      # Static assets
│   ├── placeholder-logo.png
│   ├── placeholder-user.jpg
│   └── images/
├── styles/                      # Additional styles
│   └── globals.css
├── .env.local                   # Environment variables
├── components.json              # shadcn/ui configuration
├── next.config.mjs             # Next.js configuration
├── package.json                # Dependencies and scripts
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## Features

### 🔐 **Authentication System**

- JWT-based authentication with refresh tokens
- Secure login and registration flows
- Protected routes with authentication guards
- User profile management
- Persistent authentication state

### 🐙 **GitHub Integration**

- GitHub personal access token management
- Repository browsing and search
- Branch selection and switching
- File tree navigation
- Real-time GitHub username validation
- Repository metadata display (stars, forks, language)

### 📄 **Document Generation**

- AI-powered documentation generation using OpenAI
- Multi-file selection and processing
- Support for various programming languages
- Real-time generation progress tracking
- PDF export with professional formatting
- ZIP download for multiple generated documents

### 🎨 **Modern UI/UX**

- Built with shadcn/ui component library
- Responsive design with Tailwind CSS
- Dark/light theme support
- Toast notifications
- Loading states and error handling
- Accessible design patterns

### 📱 **Responsive Design**

- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly interactions
- Progressive web app capabilities

## Tech Stack

### **Core Framework**
- **Next.js 15.2.4** - React framework with App Router
- **React 19** - UI library with latest features
- **TypeScript 5** - Type safety and developer experience

### **Styling & UI**
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons
- **next-themes** - Theme management

### **State Management**
- **React Context** - Authentication and global state
- **React Hook Form** - Form handling and validation
- **Zod** - Schema validation

### **Document Processing**
- **@react-pdf/renderer** - PDF generation
- **jsPDF** - Fallback PDF generation
- **JSZip** - ZIP file creation
- **react-markdown** - Markdown rendering

### **Development Tools**
- **ESLint** - Code linting
- **Autoprefixer** - CSS vendor prefixes
- **PostCSS** - CSS processing

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
pnpm install
# or
npm install
# or
yarn install
```

### 2. Set Up Environment

Create a `.env.local` file:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# GitHub API (optional for direct calls)
NEXT_PUBLIC_GITHUB_API_URL=https://api.github.com
```

### 3. Run Development Server

```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
pnpm build
pnpm start
# or
npm run build
npm start
```

## Core Components

### Authentication Flow

1. **Login/Registration** - User authentication with email and GitHub username
2. **Protected Routes** - Automatic redirection for unauthenticated users
3. **Token Management** - Automatic token refresh and logout on expiry

### GitHub Integration Workflow

1. **Token Setup** - Secure GitHub token storage and validation
2. **Repository Browser** - Browse and search user repositories
3. **File Explorer** - Navigate repository structure with branch selection
4. **File Selection** - Multi-select files for documentation generation

### Documentation Generation Process

1. **File Selection** - Choose files from repository tree
2. **AI Processing** - Send files to OpenAI for documentation generation
3. **Progress Tracking** - Real-time status updates
4. **Export Options** - Download as PDF or ZIP

## Key Features in Detail

### GitHub Repository Browser

- **Search and Filter**: Find repositories by name or description
- **Repository Metadata**: Display stars, forks, language, and last update
- **Pagination**: Handle large repository lists efficiently
- **Branch Selection**: Switch between repository branches

### File Management System

- **Interactive File Tree**: Collapsible folder structure
- **File Preview**: View file contents before selection
- **Batch Selection**: Select multiple files for processing
- **Language Detection**: Automatic programming language identification

### AI Documentation Generation

- **Multi-file Processing**: Handle up to 5 files simultaneously
- **Progress Tracking**: Real-time generation status
- **Error Handling**: Graceful failure recovery
- **Format Support**: Various programming languages supported

### PDF Generation

- **Professional Layout**: Clean, readable document format
- **Syntax Highlighting**: Code blocks with proper formatting
- **Table of Contents**: Auto-generated navigation
- **Metadata Inclusion**: File information and generation details

## API Integration

The frontend communicates with the backend through RESTful APIs:

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/register` - User registration

### GitHub Endpoints
- `GET /api/github/repositories` - Fetch user repositories
- `GET /api/github/repository/{name}` - Get repository details
- `GET /api/github/repository/{name}/branches` - Get repository branches

### Documentation Endpoints
- `POST /api/openai/generate-documentation` - Generate documentation

## Environment Configuration

### Development
- Hot reload enabled
- Source maps for debugging
- Verbose error messages

### Production
- Optimized builds
- Minified assets
- Performance monitoring

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Traditional Hosting

```bash
npm run build
npm start
```

## Development Guidelines

### Component Structure
- Use TypeScript for all components
- Follow shadcn/ui patterns
- Implement proper error boundaries
- Add loading states for async operations

### State Management
- Use React Context for global state
- Keep component state local when possible
- Implement proper cleanup in useEffect

### API Integration
- Use the auth utility for authenticated requests
- Implement proper error handling
- Add loading states for API calls

### Styling
- Use Tailwind CSS utility classes
- Follow responsive design principles
- Maintain consistent spacing and typography

## Security Features

1. **JWT Token Security**: Secure token storage and automatic refresh
2. **API Request Authentication**: All API calls include authentication headers
3. **Route Protection**: Unauthenticated users redirected to login
4. **GitHub Token Security**: Secure token storage and validation
5. **Input Validation**: Form validation with Zod schemas

## Performance Optimizations

1. **Code Splitting**: Automatic route-based code splitting
2. **Image Optimization**: Next.js automatic image optimization
3. **Lazy Loading**: Components loaded on demand
4. **Caching**: Efficient API response caching
5. **Bundle Analysis**: Built-in bundle analyzer

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow TypeScript best practices
2. Use existing UI components from shadcn/ui
3. Implement proper error handling
4. Add loading states for async operations
5. Write meaningful commit messages
6. Test on multiple devices and browsers

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Check `NEXT_PUBLIC_API_URL` in `.env.local`
   - Ensure backend server is running

2. **GitHub Integration Issues**
   - Verify GitHub token permissions
   - Check token expiration

3. **Build Errors**
   - Clear `.next` directory
   - Delete `node_modules` and reinstall

## License

MIT License
