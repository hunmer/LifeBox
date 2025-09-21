#!/bin/bash

# LifeBox Development Environment Setup Script
# Sets up the complete development environment including dependencies and tools

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check system requirements
check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2)
    local required_version="18.0.0"
    
    if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" != "$required_version" ]; then
        log_error "Node.js version $node_version found, but $required_version or higher is required"
        exit 1
    fi
    
    log_success "Node.js $node_version is installed"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    log_success "npm $(npm --version) is installed"
    
    # Check Rust (for Tauri)
    if ! command -v rustc &> /dev/null; then
        log_warning "Rust is not installed. Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source $HOME/.cargo/env
    fi
    
    log_success "Rust $(rustc --version) is installed"
    
    # Check system-specific dependencies
    case "$OSTYPE" in
        linux-gnu*)
            log_info "Checking Linux dependencies..."
            if command -v apt-get &> /dev/null; then
                sudo apt-get update
                sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev patchelf
            elif command -v yum &> /dev/null; then
                sudo yum install -y gtk3-devel webkit2gtk4.0-devel libappindicator-gtk3-devel librsvg2-devel
            fi
            ;;
        darwin*)
            log_info "macOS detected - no additional system dependencies needed"
            ;;
        msys*|cygwin*)
            log_info "Windows detected - ensure you have the required build tools"
            ;;
    esac
}

# Install project dependencies
install_dependencies() {
    log_info "Installing project dependencies..."
    
    # Install root dependencies
    npm ci
    
    # Install workspace dependencies
    npm run install:all
    
    log_success "Dependencies installed successfully"
}

# Setup development database
setup_database() {
    log_info "Setting up development database..."
    
    cd backend
    
    # Generate Prisma client
    npm run db:generate
    
    # Push database schema
    npm run db:push
    
    # Seed database with initial data
    if [ -f "src/database/seed.ts" ]; then
        npm run db:seed
        log_success "Database seeded with initial data"
    fi
    
    cd ..
    
    log_success "Database setup completed"
}

# Setup development tools
setup_dev_tools() {
    log_info "Setting up development tools..."
    
    # Install Playwright browsers for E2E testing
    npx playwright install
    
    # Setup Git hooks (if using husky)
    if [ -f "package.json" ] && grep -q "husky" package.json; then
        npx husky install
        log_success "Git hooks configured"
    fi
    
    # Setup VS Code settings (if .vscode directory exists)
    if [ -d ".vscode" ]; then
        log_info "VS Code configuration detected"
        
        # Recommend extensions
        if [ -f ".vscode/extensions.json" ]; then
            log_info "Please install the recommended VS Code extensions for the best development experience"
        fi
    fi
    
    log_success "Development tools configured"
}

# Verify installation
verify_installation() {
    log_info "Verifying installation..."
    
    # Check if we can build the project
    log_info "Testing build process..."
    if npm run build; then
        log_success "Build successful"
    else
        log_error "Build failed - please check your installation"
        exit 1
    fi
    
    # Run a quick test to ensure everything works
    log_info "Running quick test suite..."
    if npm run test:unit; then
        log_success "Tests passed"
    else
        log_warning "Some tests failed - this might be expected for a new setup"
    fi
    
    log_success "Installation verification completed"
}

# Create environment files
setup_environment() {
    log_info "Setting up environment files..."
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        cat > backend/.env << EOF
# LifeBox Backend Environment Configuration
NODE_ENV=development
PORT=3001
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-jwt-secret-key-change-in-production"
CORS_ORIGIN="http://localhost:1420"

# WebSocket Configuration
WS_PORT=3002

# Logging
LOG_LEVEL=debug
EOF
        log_success "Created backend/.env"
    fi
    
    # Test environment
    if [ ! -f "backend/.env.test" ]; then
        cat > backend/.env.test << EOF
# LifeBox Test Environment Configuration
NODE_ENV=test
PORT=3001
DATABASE_URL="file:./test.db"
JWT_SECRET="test-jwt-secret"
CORS_ORIGIN="http://localhost:1420"
EOF
        log_success "Created backend/.env.test"
    fi
    
    # Frontend environment (if needed)
    if [ ! -f "frontend/.env" ]; then
        cat > frontend/.env << EOF
# LifeBox Frontend Environment Configuration
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3002
VITE_APP_NAME=LifeBox
VITE_APP_VERSION=1.0.0
EOF
        log_success "Created frontend/.env"
    fi
}

# Main setup function
main() {
    log_info "Starting LifeBox development environment setup..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        log_error "Please run this script from the project root directory"
        exit 1
    fi
    
    check_requirements
    setup_environment
    install_dependencies
    setup_database
    setup_dev_tools
    verify_installation
    
    log_success "🎉 LifeBox development environment setup completed!"
    echo ""
    log_info "Next steps:"
    echo "  1. Start the development servers:"
    echo "     npm run dev"
    echo ""
    echo "  2. Open your browser to http://localhost:1420"
    echo ""
    echo "  3. For testing:"
    echo "     ./scripts/test.sh"
    echo ""
    echo "  4. For building:"
    echo "     npm run build"
    echo ""
    log_info "Happy coding! 🚀"
}

# Run setup if script is executed directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi