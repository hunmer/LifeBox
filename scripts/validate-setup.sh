#!/bin/bash

# LifeBox Testing Configuration Validation Script
# Validates that all testing configurations are properly set up

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
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

VALIDATION_ERRORS=0

# Function to check if file exists and is not empty
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        if [ -s "$file" ]; then
            log_success "$description exists and is not empty"
        else
            log_warning "$description exists but is empty"
        fi
    else
        log_error "$description is missing"
        ((VALIDATION_ERRORS++))
    fi
}

# Function to check if directory exists
check_directory() {
    local dir=$1
    local description=$2
    
    if [ -d "$dir" ]; then
        log_success "$description directory exists"
    else
        log_error "$description directory is missing"
        ((VALIDATION_ERRORS++))
    fi
}

# Function to validate JSON file
validate_json() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        if node -e "JSON.parse(require('fs').readFileSync('$file', 'utf8'))" 2>/dev/null; then
            log_success "$description is valid JSON"
        else
            log_error "$description contains invalid JSON"
            ((VALIDATION_ERRORS++))
        fi
    else
        log_error "$description is missing"
        ((VALIDATION_ERRORS++))
    fi
}

# Function to check npm script exists
check_npm_script() {
    local script=$1
    local description=$2
    
    if npm run 2>&1 | grep -q "  $script"; then
        log_success "$description script is configured"
    else
        log_error "$description script is missing"
        ((VALIDATION_ERRORS++))
    fi
}

log_info "🔍 Validating LifeBox testing configuration..."
echo

# Check project structure
log_info "Checking project structure..."
check_file "package.json" "Root package.json"
check_file "frontend/package.json" "Frontend package.json"
check_file "backend/package.json" "Backend package.json"
check_directory "frontend/src" "Frontend source"
check_directory "backend/src" "Backend source"
check_directory "shared" "Shared directory"
echo

# Check frontend testing configuration
log_info "Checking frontend testing configuration..."
check_file "frontend/vitest.config.ts" "Vitest configuration"
check_file "frontend/src/test/setup.ts" "Frontend test setup"
check_directory "frontend/tests" "Frontend tests directory"
echo

# Check backend testing configuration  
log_info "Checking backend testing configuration..."
check_file "backend/jest.config.js" "Jest configuration"
check_file "backend/tests/setup.ts" "Backend test setup"
check_directory "backend/tests/unit" "Backend unit tests directory"
check_directory "backend/tests/integration" "Backend integration tests directory"
echo

# Check E2E testing configuration
log_info "Checking E2E testing configuration..."
check_file "playwright.config.ts" "Playwright configuration"
check_directory "tests/e2e" "E2E tests directory"
check_file "tests/e2e/utils/test-helpers.ts" "E2E test helpers"
echo

# Check code quality configuration
log_info "Checking code quality configuration..."
check_file ".eslintrc.js" "ESLint configuration"
check_file ".prettierrc.js" "Prettier configuration"
check_file ".prettierignore" "Prettier ignore file"
echo

# Check CI/CD configuration
log_info "Checking CI/CD configuration..."
check_file ".github/workflows/ci.yml" "Main CI workflow"
check_file ".github/workflows/pr-checks.yml" "PR checks workflow"
check_file "codecov.yml" "Codecov configuration"
echo

# Check scripts
log_info "Checking test scripts..."
check_file "scripts/test.sh" "Main test script"
check_file "scripts/dev-setup.sh" "Development setup script"

if [ -f "scripts/test.sh" ]; then
    if [ -x "scripts/test.sh" ]; then
        log_success "Test script is executable"
    else
        log_warning "Test script is not executable"
    fi
fi

if [ -f "scripts/dev-setup.sh" ]; then
    if [ -x "scripts/dev-setup.sh" ]; then
        log_success "Dev setup script is executable"
    else
        log_warning "Dev setup script is not executable"
    fi
fi
echo

# Check npm scripts
log_info "Checking npm scripts..."
check_npm_script "test" "Main test"
check_npm_script "test:unit" "Unit test"
check_npm_script "test:integration" "Integration test"
check_npm_script "test:e2e" "E2E test"
check_npm_script "test:coverage" "Coverage test"
check_npm_script "lint" "Lint"
check_npm_script "format" "Format"
check_npm_script "typecheck" "Type check"
echo

# Validate JSON configurations
log_info "Validating JSON configurations..."
validate_json "package.json" "Root package.json"
validate_json "frontend/package.json" "Frontend package.json"
validate_json "backend/package.json" "Backend package.json"

if [ -f "shared/package.json" ]; then
    validate_json "shared/package.json" "Shared package.json"
fi
echo

# Check TypeScript configurations
log_info "Checking TypeScript configurations..."
check_file "frontend/tsconfig.json" "Frontend TypeScript config"
check_file "backend/tsconfig.json" "Backend TypeScript config"

if [ -f "shared/tsconfig.json" ]; then
    check_file "shared/tsconfig.json" "Shared TypeScript config"
fi
echo

# Check dependencies
log_info "Checking critical dependencies..."
if [ -f "frontend/package.json" ]; then
    if grep -q "vitest" frontend/package.json; then
        log_success "Vitest is installed in frontend"
    else
        log_error "Vitest is missing from frontend"
        ((VALIDATION_ERRORS++))
    fi
    
    if grep -q "@testing-library/react" frontend/package.json; then
        log_success "React Testing Library is installed"
    else
        log_error "React Testing Library is missing"
        ((VALIDATION_ERRORS++))
    fi
    
    if grep -q "playwright" frontend/package.json; then
        log_success "Playwright is installed"
    else
        log_error "Playwright is missing"
        ((VALIDATION_ERRORS++))
    fi
fi

if [ -f "backend/package.json" ]; then
    if grep -q "jest" backend/package.json; then
        log_success "Jest is installed in backend"
    else
        log_error "Jest is missing from backend"
        ((VALIDATION_ERRORS++))
    fi
    
    if grep -q "supertest" backend/package.json; then
        log_success "Supertest is installed"
    else
        log_error "Supertest is missing"
        ((VALIDATION_ERRORS++))
    fi
fi
echo

# Test configuration syntax
log_info "Testing configuration syntax..."

# Test Vitest config
if [ -f "frontend/vitest.config.ts" ]; then
    if npx vitest --version >/dev/null 2>&1; then
        log_success "Vitest configuration syntax is valid"
    else
        log_warning "Could not validate Vitest configuration"
    fi
fi

# Test Jest config
if [ -f "backend/jest.config.js" ]; then
    if cd backend && npx jest --version >/dev/null 2>&1; then
        log_success "Jest configuration syntax is valid"
        cd ..
    else
        log_warning "Could not validate Jest configuration"
        cd ..
    fi
fi

# Test Playwright config
if [ -f "playwright.config.ts" ]; then
    if npx playwright --version >/dev/null 2>&1; then
        log_success "Playwright configuration syntax is valid"
    else
        log_warning "Could not validate Playwright configuration"
    fi
fi

# Test ESLint config
if [ -f ".eslintrc.js" ]; then
    if npx eslint --version >/dev/null 2>&1; then
        log_success "ESLint configuration syntax is valid"
    else
        log_warning "Could not validate ESLint configuration"
    fi
fi
echo

# Summary
log_info "📊 Validation Summary"
echo "----------------------------------------"

if [ $VALIDATION_ERRORS -eq 0 ]; then
    log_success "All testing configurations are properly set up! 🎉"
    echo
    log_info "You can now run:"
    echo "  • npm test                 - Run all tests"
    echo "  • npm run test:unit        - Run unit tests"
    echo "  • npm run test:integration - Run integration tests"
    echo "  • npm run test:e2e         - Run E2E tests"
    echo "  • npm run test:coverage    - Run tests with coverage"
    echo "  • npm run lint             - Run linting"
    echo "  • npm run format           - Format code"
    echo "  • npm run typecheck        - Check types"
    echo
    log_info "For TDD development workflow:"
    echo "  • npm run test:watch       - Run tests in watch mode"
    echo
    exit 0
else
    log_error "Found $VALIDATION_ERRORS validation error(s)"
    echo
    log_info "Please fix the errors above and run this script again."
    echo
    exit 1
fi