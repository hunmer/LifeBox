#!/bin/bash

# LifeBox Test Runner Script
# Comprehensive testing script for all components

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Configuration
TEST_TYPES=${TEST_TYPES:-"all"}
COVERAGE=${COVERAGE:-"true"}
PARALLEL=${PARALLEL:-"true"}
CI=${CI:-"false"}

# Help function
show_help() {
    echo "LifeBox Test Runner"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -t, --type TYPE        Test type: unit, integration, e2e, all (default: all)"
    echo "  -c, --coverage         Generate coverage report (default: true)"
    echo "  -p, --parallel         Run tests in parallel (default: true)"
    echo "  --ci                   Run in CI mode (default: false)"
    echo "  --watch                Run tests in watch mode"
    echo "  --update-snapshots     Update test snapshots"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                     # Run all tests with coverage"
    echo "  $0 -t unit             # Run only unit tests"
    echo "  $0 -t e2e --ci         # Run E2E tests in CI mode"
    echo "  $0 --watch             # Run tests in watch mode"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            TEST_TYPES="$2"
            shift 2
            ;;
        -c|--coverage)
            COVERAGE="true"
            shift
            ;;
        --no-coverage)
            COVERAGE="false"
            shift
            ;;
        -p|--parallel)
            PARALLEL="true"
            shift
            ;;
        --no-parallel)
            PARALLEL="false"
            shift
            ;;
        --ci)
            CI="true"
            shift
            ;;
        --watch)
            WATCH="true"
            shift
            ;;
        --update-snapshots)
            UPDATE_SNAPSHOTS="true"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    log_error "npm is not installed"
    exit 1
fi

# Check if in correct directory
if [ ! -f "package.json" ]; then
    log_error "Must be run from project root directory"
    exit 1
fi

log_info "Starting LifeBox test suite..."
log_info "Test types: $TEST_TYPES"
log_info "Coverage: $COVERAGE"
log_info "Parallel: $PARALLEL"
log_info "CI mode: $CI"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    npm ci
fi

# Function to run frontend tests
run_frontend_tests() {
    log_info "Running frontend tests..."
    
    local cmd="npm run test --workspace=frontend"
    
    if [ "$COVERAGE" = "true" ]; then
        cmd="npm run test:coverage --workspace=frontend"
    fi
    
    if [ "$WATCH" = "true" ]; then
        cmd="npm run test:watch --workspace=frontend"
    fi
    
    if [ "$UPDATE_SNAPSHOTS" = "true" ]; then
        cmd="$cmd -- --update-snapshots"
    fi
    
    if eval $cmd; then
        log_success "Frontend tests passed"
        return 0
    else
        log_error "Frontend tests failed"
        return 1
    fi
}

# Function to run backend tests
run_backend_tests() {
    log_info "Running backend tests..."
    
    # Setup test database
    log_info "Setting up test database..."
    cd backend
    npm run db:generate
    if [ "$CI" = "false" ]; then
        npm run db:push
    fi
    cd ..
    
    local cmd="npm run test --workspace=backend"
    
    if [ "$COVERAGE" = "true" ]; then
        cmd="npm run test:coverage --workspace=backend"
    fi
    
    if [ "$WATCH" = "true" ]; then
        cmd="npm run test:watch --workspace=backend"
    fi
    
    if eval $cmd; then
        log_success "Backend tests passed"
        return 0
    else
        log_error "Backend tests failed"
        return 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    log_info "Running integration tests..."
    
    if npm run test:integration --workspace=backend; then
        log_success "Integration tests passed"
        return 0
    else
        log_error "Integration tests failed"
        return 1
    fi
}

# Function to run E2E tests
run_e2e_tests() {
    log_info "Running E2E tests..."
    
    # Check if Playwright is installed
    if ! npx playwright --version &> /dev/null; then
        log_info "Installing Playwright browsers..."
        npx playwright install
    fi
    
    # Build application first
    log_info "Building application for E2E tests..."
    npm run build
    
    local cmd="npm run test:e2e"
    
    if [ "$CI" = "true" ]; then
        cmd="$cmd -- --reporter=json"
    fi
    
    if eval $cmd; then
        log_success "E2E tests passed"
        return 0
    else
        log_error "E2E tests failed"
        return 1
    fi
}

# Function to run lint checks
run_lint_checks() {
    log_info "Running lint checks..."
    
    if npm run lint; then
        log_success "Lint checks passed"
        return 0
    else
        log_error "Lint checks failed"
        return 1
    fi
}

# Function to run type checks
run_type_checks() {
    log_info "Running type checks..."
    
    local frontend_check=0
    local backend_check=0
    
    if npm run typecheck --workspace=frontend; then
        log_success "Frontend type check passed"
    else
        log_error "Frontend type check failed"
        frontend_check=1
    fi
    
    if npm run typecheck --workspace=backend; then
        log_success "Backend type check passed"
    else
        log_error "Backend type check failed"
        backend_check=1
    fi
    
    if [ $frontend_check -eq 0 ] && [ $backend_check -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# Main test execution
main() {
    local exit_code=0
    
    # Always run lint and type checks first (unless in watch mode)
    if [ "$WATCH" != "true" ]; then
        if ! run_lint_checks; then
            exit_code=1
        fi
        
        if ! run_type_checks; then
            exit_code=1
        fi
    fi
    
    # Run tests based on type
    case $TEST_TYPES in
        "unit")
            if [ "$PARALLEL" = "true" ]; then
                # Run frontend and backend tests in parallel
                run_frontend_tests &
                frontend_pid=$!
                
                run_backend_tests &
                backend_pid=$!
                
                wait $frontend_pid
                frontend_result=$?
                
                wait $backend_pid
                backend_result=$?
                
                if [ $frontend_result -ne 0 ] || [ $backend_result -ne 0 ]; then
                    exit_code=1
                fi
            else
                if ! run_frontend_tests; then
                    exit_code=1
                fi
                
                if ! run_backend_tests; then
                    exit_code=1
                fi
            fi
            ;;
        "integration")
            if ! run_integration_tests; then
                exit_code=1
            fi
            ;;
        "e2e")
            if ! run_e2e_tests; then
                exit_code=1
            fi
            ;;
        "all")
            # Run unit tests first
            if [ "$PARALLEL" = "true" ]; then
                run_frontend_tests &
                frontend_pid=$!
                
                run_backend_tests &
                backend_pid=$!
                
                wait $frontend_pid
                frontend_result=$?
                
                wait $backend_pid
                backend_result=$?
                
                if [ $frontend_result -ne 0 ] || [ $backend_result -ne 0 ]; then
                    exit_code=1
                fi
            else
                if ! run_frontend_tests; then
                    exit_code=1
                fi
                
                if ! run_backend_tests; then
                    exit_code=1
                fi
            fi
            
            # Run integration tests
            if ! run_integration_tests; then
                exit_code=1
            fi
            
            # Run E2E tests last (only if unit and integration tests pass)
            if [ $exit_code -eq 0 ] && [ "$WATCH" != "true" ]; then
                if ! run_e2e_tests; then
                    exit_code=1
                fi
            fi
            ;;
        *)
            log_error "Invalid test type: $TEST_TYPES"
            show_help
            exit 1
            ;;
    esac
    
    # Generate combined coverage report
    if [ "$COVERAGE" = "true" ] && [ "$WATCH" != "true" ] && [ $exit_code -eq 0 ]; then
        log_info "Generating combined coverage report..."
        # This would be implemented to merge frontend and backend coverage
    fi
    
    if [ $exit_code -eq 0 ]; then
        log_success "All tests completed successfully!"
    else
        log_error "Some tests failed!"
    fi
    
    exit $exit_code
}

# Run main function
main