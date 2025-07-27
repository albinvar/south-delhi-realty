#!/bin/bash

# South Delhi Real Estate Docker Management Script

set -e

COMPOSE_FILE="docker-compose.yml"
COMPOSE_DEV_FILE="docker-compose.dev.yml"
ENV_FILE=".env"
ENV_DOCKER_FILE=".env.docker"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if docker-compose is available
check_compose() {
    if ! command -v docker-compose > /dev/null 2>&1 && ! docker compose version > /dev/null 2>&1; then
        print_error "docker-compose is not available. Please install docker-compose or use Docker with compose plugin."
        exit 1
    fi
    
    # Prefer docker compose over docker-compose
    if docker compose version > /dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
}

# Function to setup environment
setup_env() {
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f "$ENV_DOCKER_FILE" ]; then
            print_status "Copying $ENV_DOCKER_FILE to $ENV_FILE"
            cp "$ENV_DOCKER_FILE" "$ENV_FILE"
            print_warning "Please edit $ENV_FILE with your configuration before running the application."
        else
            print_error "No environment file found. Please create $ENV_FILE with your configuration."
            exit 1
        fi
    fi
}

# Function to build the application
build() {
    print_status "Building South Delhi Real Estate application..."
    check_docker
    check_compose
    
    $COMPOSE_CMD -f "$COMPOSE_FILE" build
    print_success "Build completed successfully!"
}

# Function to start production environment
start_prod() {
    print_status "Starting South Delhi Real Estate in production mode..."
    check_docker
    check_compose
    setup_env
    
    $COMPOSE_CMD -f "$COMPOSE_FILE" up -d
    print_success "Production environment started successfully!"
    print_status "Application will be available at: http://localhost:5000"
    print_status "Use 'docker logs sdr-webapp' to view application logs"
}

# Function to start development environment
start_dev() {
    print_status "Starting South Delhi Real Estate in development mode..."
    check_docker
    check_compose
    setup_env
    
    $COMPOSE_CMD -f "$COMPOSE_DEV_FILE" up -d
    print_success "Development environment started successfully!"
    print_status "Backend will be available at: http://localhost:5000"
    print_status "Frontend dev server will be available at: http://localhost:5173"
    print_status "Use 'docker logs sdr-webapp-dev' to view application logs"
}

# Function to start with nginx
start_nginx() {
    print_status "Starting South Delhi Real Estate with Nginx..."
    check_docker
    check_compose
    setup_env
    
    $COMPOSE_CMD -f "$COMPOSE_FILE" --profile nginx up -d
    print_success "Production environment with Nginx started successfully!"
    print_status "Application will be available at: http://localhost (port 80)"
}

# Function to stop services
stop() {
    print_status "Stopping South Delhi Real Estate services..."
    check_docker
    check_compose
    
    $COMPOSE_CMD -f "$COMPOSE_FILE" down
    $COMPOSE_CMD -f "$COMPOSE_DEV_FILE" down 2>/dev/null || true
    print_success "Services stopped successfully!"
}

# Function to view logs
logs() {
    check_docker
    check_compose
    
    if [ "$1" = "dev" ]; then
        $COMPOSE_CMD -f "$COMPOSE_DEV_FILE" logs -f "${@:2}"
    else
        $COMPOSE_CMD -f "$COMPOSE_FILE" logs -f "$@"
    fi
}

# Function to show status
status() {
    check_docker
    check_compose
    
    print_status "Production services:"
    $COMPOSE_CMD -f "$COMPOSE_FILE" ps
    
    echo ""
    print_status "Development services:"
    $COMPOSE_CMD -f "$COMPOSE_DEV_FILE" ps 2>/dev/null || print_warning "No development services running"
}

# Function to clean up
clean() {
    print_status "Cleaning up South Delhi Real Estate Docker resources..."
    check_docker
    check_compose
    
    $COMPOSE_CMD -f "$COMPOSE_FILE" down -v --rmi local
    $COMPOSE_CMD -f "$COMPOSE_DEV_FILE" down -v --rmi local 2>/dev/null || true
    
    # Remove orphaned containers
    docker container prune -f
    
    # Remove unused images
    docker image prune -f
    
    print_success "Cleanup completed successfully!"
}

# Function to restart services
restart() {
    print_status "Restarting South Delhi Real Estate services..."
    stop
    if [ "$1" = "dev" ]; then
        start_dev
    elif [ "$1" = "nginx" ]; then
        start_nginx
    else
        start_prod
    fi
}

# Function to run database migrations
migrate() {
    check_docker
    check_compose
    
    print_status "Running database migrations..."
    $COMPOSE_CMD -f "$COMPOSE_FILE" exec webapp npm run db:migrate
    print_success "Migrations completed successfully!"
}

# Function to show help
show_help() {
    echo "South Delhi Real Estate Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build         Build the Docker images"
    echo "  start|prod    Start production environment"
    echo "  dev           Start development environment with hot reload"
    echo "  nginx         Start production environment with Nginx"
    echo "  stop          Stop all services"
    echo "  restart       Restart services (add 'dev' or 'nginx' for specific mode)"
    echo "  logs          View logs (add 'dev' for development logs)"
    echo "  status        Show running services status"
    echo "  clean         Clean up Docker resources"
    echo "  migrate       Run database migrations"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev                 # Start development environment"
    echo "  $0 prod                # Start production environment"
    echo "  $0 logs dev            # View development logs"
    echo "  $0 restart nginx       # Restart with nginx"
}

# Main script logic
case "${1:-help}" in
    build)
        build
        ;;
    start|prod)
        start_prod
        ;;
    dev)
        start_dev
        ;;
    nginx)
        start_nginx
        ;;
    stop)
        stop
        ;;
    restart)
        restart "$2"
        ;;
    logs)
        logs "${@:2}"
        ;;
    status)
        status
        ;;
    clean)
        clean
        ;;
    migrate)
        migrate
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
