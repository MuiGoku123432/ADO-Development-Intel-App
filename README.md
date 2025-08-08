# ADO Development Intel App

[![Angular](https://img.shields.io/badge/Angular-17-dd0031.svg)](https://angular.io/)
[![Tauri](https://img.shields.io/badge/Tauri-v2-24c8d8.svg)](https://tauri.app/)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-20+-007ad9.svg)](https://primeng.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg)](https://www.typescriptlang.org/)

A powerful, ergonomic desktop application for Azure DevOps (ADO) management, built with Angular 17 and Tauri. Designed for developers and managers who need streamlined access to ADO workflows through an intuitive tabbed interface.

## 🎯 Project Purpose

**ADO Development Intel App** provides an ergonomic alternative to the Azure DevOps web interface, optimizing workflows for development teams through:

- **Desktop-native performance** with Tauri's lightweight architecture
- **Role-based interfaces** tailored for developers vs. managers
- **Integrated workflows** across work items, repositories, and pipelines
- **Natural language interactions** via MCP chatbot integration
- **Secure credential management** with environment-based authentication

### Target Users

- **Developers**: Task-focused views with detailed editing, code integration, and quick actions
- **Managers**: Overview dashboards, approval workflows, team metrics, and reporting

## ✨ Key Features

### 🗂️ Four Major Workflow Tabs
- **User Tab**: Personal productivity (My Tasks, History, Notifications)
- **ADO Tab**: Work item management (Work Items, Boards, Queries)
- **Repos Tab**: Repository handling (Repositories, Pull Requests, Commits/Branches)
- **Pipelines Tab**: CI/CD management (Builds, Releases, Analytics)

### 🔧 Technical Highlights
- **Angular 17** with standalone components and signals
- **PrimeNG 20+** for consistent, accessible UI components
- **Tauri v2** for secure, cross-platform desktop deployment
- **Environment-based API switching** (Mock vs Real ADO API)
- **Secure credential storage** via Tauri's Rust backend
- **Real-time loading states** with skeleton UI and progress indicators

### 🤖 MCP Chatbot Integration
- Natural language queries for ADO operations
- Context-aware suggestions based on current view
- Floating dialog interface for seamless interaction

## 📋 Prerequisites

### Required Software
- **Node.js** 18.0+ and npm 9.0+
- **Rust** 1.70+ and Cargo (for Tauri)
- **Angular CLI** 17.0+

```bash
# Verify installations
node --version    # Should be 18.0+
npm --version     # Should be 9.0+
rustc --version   # Should be 1.70+
ng version        # Should be 17.0+
```

### Azure DevOps Requirements
- Access to an Azure DevOps organization
- Personal Access Token (PAT) with required scopes:
  - ✅ **Work Items** (Read & Write)
  - ✅ **Code** (Read)
  - ✅ **Build** (Read)
  - ✅ **Project and Team** (Read)

## 🚀 Development Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd ADO-Development-Intel-App

# Install Node.js dependencies
npm install

# Install Tauri CLI (if not already installed)
npm install --global @tauri-apps/cli
```

### 2. Environment Configuration

Create your environment file from the template:

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your Azure DevOps credentials:

```env
# Your Azure DevOps organization name (not the full URL)
# Example: If your ADO URL is https://dev.azure.com/mycompany, use 'mycompany'
ADO_ORGANIZATION=your-organization-name

# Your Personal Access Token
# Generate from: Azure DevOps → User Settings → Personal Access Tokens
ADO_PAT=your-personal-access-token-here
```

> **🔒 Security Note**: The `.env` file is automatically ignored by Git and credentials are processed securely by Tauri's Rust backend.

### 3. Development Modes

The application supports two development modes:

#### Mock API Mode (Default)
Perfect for development and testing without hitting real ADO APIs:

```bash
npm run tauri:dev
```

This starts:
- Angular development server on `http://localhost:1420`
- Mock API server with sample data
- Tauri desktop application

#### Real API Mode
Connect to your actual Azure DevOps organization:

```bash
npm run tauri:dev:real
```

This starts:
- Angular in production configuration
- Direct connection to ADO REST API
- Tauri desktop application with live data

### 4. Verify Setup

1. The Tauri app window should open automatically
2. Check the browser console for initialization logs:
   ```
   🔧 Bootstrap starting - initializing Angular application
   ✅ Angular application bootstrapped successfully
   🚀 MainframeComponent initialized
   ```
3. In Real API mode, you should see:
   ```
   🔐 Successfully loaded ADO credentials for organization: your-org
   ✅ Auto-authentication successful: Your Name
   ```

## 🏭 Production Setup

### Building for Distribution

Create platform-specific installers:

```bash
# Build the complete Tauri application
npm run tauri:build
```

This generates:
- **Windows**: `.exe` installer in `src-tauri/target/release/bundle/`
- **macOS**: `.dmg` and `.app` in `src-tauri/target/release/bundle/`
- **Linux**: `.deb` and `.AppImage` in `src-tauri/target/release/bundle/`

### Production Environment Configuration

For production deployments:

1. **Environment Variables**: Use system environment variables instead of `.env` files
2. **Security**: Store PAT tokens in secure credential managers
3. **Distribution**: Code sign applications for security compliance

### Installation

End users simply run the platform-specific installer. The app will:
1. Install to the appropriate system location
2. Create desktop shortcuts and start menu entries
3. Request ADO credentials on first launch (if not pre-configured)

## ⚙️ Available Scripts

### Development Scripts
```bash
npm run tauri:dev        # Start with mock API (default)
npm run tauri:dev:real   # Start with real ADO API
npm start               # Angular dev server only
npm run mock-api        # Mock API server only
```

### Build Scripts
```bash
npm run build           # Build Angular application
npm run tauri:build     # Build complete Tauri app for distribution
npm run watch           # Build Angular in watch mode
```

### Utility Scripts
```bash
npm run ng              # Angular CLI commands
npm run tauri           # Tauri CLI commands
```

## 🔧 Configuration

### API Mode Switching

The application automatically detects your environment configuration:

- **Mock Mode** (`useMockApi: true`): Uses local mock data, perfect for development
- **Real Mode** (`useMockApi: false`): Connects to Azure DevOps REST API v7.0+

### Role-Based Views

Configure your user role in the application settings:
- **Developer**: Code-focused views with detailed task editing
- **Manager**: Overview dashboards with team metrics and approvals

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: Angular 17 with standalone components and reactive signals
- **UI Library**: PrimeNG 20+ for consistent, accessible components
- **Desktop**: Tauri v2 with Rust backend for native system integration
- **State Management**: Angular Signals + RxJS for reactive data flows
- **API Integration**: Environment-based switching between mock and real ADO APIs

### Key Components
- **SharedDataTableComponent**: Reusable table with loading states and filtering
- **LoadingSpinnerComponent**: PrimeNG-based loading indicators with skeleton UI
- **TauriEnvService**: Secure environment variable handling via Rust backend
- **AdoAuthService**: Authentication management with automatic credential loading

### Security Architecture
- **Environment Variables**: Loaded securely via Tauri's Rust backend
- **Credential Storage**: PAT tokens never exposed to browser frontend
- **API Communication**: Secured with automatic authentication headers

## 🔍 Troubleshooting

### Common Issues

#### Environment Setup
```bash
# If Tauri CLI is not found
npm install --global @tauri-apps/cli

# If Rust is not installed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

#### Authentication Issues
- Verify your ADO organization name is correct (just the name, not the full URL)
- Ensure your PAT token has the required scopes
- Check that your PAT token hasn't expired

#### Build Issues
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Angular cache
npm run ng cache clean
```

### Debug Information

Development logs appear in:
- **Terminal**: Tauri and build process logs
- **Browser Console**: Angular application logs (F12 → Console)
- **File**: `applog.txt` contains detailed build and runtime information

### Performance Optimization

- Use **Mock API mode** for rapid development
- **Real API mode** includes automatic request caching
- Loading states provide immediate user feedback

## 📚 Additional Documentation

- **[CLAUDE.md](./CLAUDE.md)**: Development guidelines and project context
- **[Project-Design.md](./Project-Design.md)**: Comprehensive technical design document
- **[.env.example](./.env.example)**: Environment configuration template

## 🤝 Contributing

### Development Guidelines
1. Follow Angular 17 best practices with standalone components
2. Use PrimeNG components for consistent UI
3. Implement proper loading states with LoadingSpinnerComponent
4. Add comprehensive error handling and logging

### Code Structure
```
src/app/
├── mainframe/           # Main application shell
├── shared/             # Reusable components and services
├── services/           # API services and business logic
└── environments/       # Environment-specific configurations
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

Built with:
- [Angular](https://angular.io/) - Web application framework
- [Tauri](https://tauri.app/) - Desktop application framework
- [PrimeNG](https://primeng.org/) - UI component library
- [Azure DevOps REST API](https://docs.microsoft.com/en-us/rest/api/azure/devops/) - ADO integration

---

**Made with ❤️ for the development community**