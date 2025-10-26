#!/bin/bash

# Vercel Environment Variables Sync Script
# This script helps you sync environment variables between Vercel and your local project

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_NAME="camilo-martinez-portfolio"
ENV_FILE=".env.local"
BACKUP_DIR=".env-backups"

# Helper functions
print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if Vercel CLI is installed
check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed"
        echo ""
        echo "Install it with:"
        echo "  npm install -g vercel"
        exit 1
    fi
    print_success "Vercel CLI is installed"
}

# Check if project is linked
check_project_link() {
    if [ ! -f ".vercel/project.json" ]; then
        print_error "Project is not linked to Vercel"
        echo ""
        echo "Link it with:"
        echo "  vercel link --project=${PROJECT_NAME}"
        exit 1
    fi

    local linked_project=$(cat .vercel/project.json | grep -o '"projectName":"[^"]*"' | cut -d'"' -f4)
    print_success "Linked to project: ${linked_project}"
}

# Create backup of current .env file
backup_env() {
    if [ -f "$ENV_FILE" ]; then
        mkdir -p "$BACKUP_DIR"
        local timestamp=$(date +"%Y%m%d_%H%M%S")
        local backup_file="${BACKUP_DIR}/${ENV_FILE}.${timestamp}"
        cp "$ENV_FILE" "$backup_file"
        print_success "Backed up current .env to: ${backup_file}"
    else
        print_warning "No existing .env file to backup"
    fi
}

# Pull environment variables from Vercel
pull_env() {
    print_header "PULL: Downloading from Vercel → Local"

    check_vercel_cli
    check_project_link
    backup_env

    echo ""
    print_info "Pulling environment variables from Vercel..."

    if vercel env pull "$ENV_FILE"; then
        echo ""
        print_success "Environment variables pulled successfully!"

        # Count variables
        local var_count=$(grep -c "^[A-Z_]" "$ENV_FILE" 2>/dev/null || echo "0")
        print_info "Total variables: ${var_count}"

        echo ""
        print_warning "Don't forget to restart your dev server:"
        echo "  npm run dev"
    else
        print_error "Failed to pull environment variables"
        exit 1
    fi
}

# Push environment variables to Vercel
push_env() {
    print_header "PUSH: Uploading Local → Vercel"

    print_error "Direct push is not supported by Vercel CLI"
    echo ""
    print_info "To add/update variables on Vercel, use one of these methods:"
    echo ""
    echo "1. Add a single variable:"
    echo "   vercel env add VARIABLE_NAME"
    echo ""
    echo "2. Use Vercel Dashboard:"
    echo "   https://vercel.com/juancamilos-projects-0340fa98/${PROJECT_NAME}/settings/environment-variables"
    echo ""
    print_info "After adding variables on Vercel, run: ./scripts/sync-env.sh pull"
}

# List environment variables
list_env() {
    print_header "LIST: Environment Variables on Vercel"

    check_vercel_cli
    check_project_link

    echo ""
    print_info "Fetching environment variables from Vercel..."
    echo ""

    vercel env ls
}

# Compare local vs remote
compare_env() {
    print_header "COMPARE: Local vs Vercel"

    check_vercel_cli
    check_project_link

    if [ ! -f "$ENV_FILE" ]; then
        print_error "No local .env file found at: ${ENV_FILE}"
        echo ""
        print_info "Pull from Vercel first: ./scripts/sync-env.sh pull"
        exit 1
    fi

    echo ""
    print_info "Local environment variables (${ENV_FILE}):"
    echo ""
    grep "^[A-Z_]" "$ENV_FILE" | cut -d'=' -f1 | sort | while read var; do
        echo "  • $var"
    done

    echo ""
    print_info "Vercel environment variables:"
    echo ""
    vercel env ls

    echo ""
    print_warning "Note: This only shows variable names, not values"
}

# Show status
status() {
    print_header "STATUS: Environment Sync Status"

    # Check CLI
    if command -v vercel &> /dev/null; then
        print_success "Vercel CLI installed ($(vercel --version))"
    else
        print_error "Vercel CLI not installed"
    fi

    # Check project link
    if [ -f ".vercel/project.json" ]; then
        local project=$(cat .vercel/project.json | grep -o '"projectName":"[^"]*"' | cut -d'"' -f4)
        print_success "Project linked: ${project}"
    else
        print_error "Project not linked"
    fi

    # Check .env file
    if [ -f "$ENV_FILE" ]; then
        local var_count=$(grep -c "^[A-Z_]" "$ENV_FILE" 2>/dev/null || echo "0")
        local file_size=$(ls -lh "$ENV_FILE" | awk '{print $5}')
        print_success "Local .env file exists (${var_count} variables, ${file_size})"

        # Show last modified
        if [[ "$OSTYPE" == "darwin"* ]]; then
            local last_modified=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$ENV_FILE")
        else
            local last_modified=$(stat -c "%y" "$ENV_FILE" | cut -d'.' -f1)
        fi
        print_info "Last modified: ${last_modified}"
    else
        print_warning "No local .env file found"
    fi

    # Check backups
    if [ -d "$BACKUP_DIR" ]; then
        local backup_count=$(ls -1 "$BACKUP_DIR" | wc -l | tr -d ' ')
        print_info "Backups available: ${backup_count}"
    fi

    echo ""
}

# Add a new environment variable
add_var() {
    print_header "ADD: New Environment Variable"

    check_vercel_cli
    check_project_link

    if [ -z "$1" ]; then
        print_error "Please provide a variable name"
        echo ""
        echo "Usage:"
        echo "  ./scripts/sync-env.sh add VARIABLE_NAME"
        exit 1
    fi

    local var_name=$1

    echo ""
    print_info "Adding variable: ${var_name}"
    echo ""

    vercel env add "$var_name"

    echo ""
    print_success "Variable added to Vercel!"
    print_info "Pull it to local: ./scripts/sync-env.sh pull"
}

# Remove an environment variable
remove_var() {
    print_header "REMOVE: Environment Variable"

    check_vercel_cli
    check_project_link

    if [ -z "$1" ]; then
        print_error "Please provide a variable name"
        echo ""
        echo "Usage:"
        echo "  ./scripts/sync-env.sh remove VARIABLE_NAME"
        exit 1
    fi

    local var_name=$1

    echo ""
    print_warning "Removing variable: ${var_name}"
    echo ""

    vercel env rm "$var_name"

    echo ""
    print_success "Variable removed from Vercel!"
    print_info "Pull changes to local: ./scripts/sync-env.sh pull"
}

# Show help
show_help() {
    cat << EOF
Vercel Environment Variables Sync Script

Usage:
  ./scripts/sync-env.sh [command] [options]

Commands:
  pull              Download environment variables from Vercel to local
  push              Show instructions for pushing variables to Vercel
  list              List all environment variables on Vercel
  compare           Compare local and Vercel environment variables
  status            Show sync status and configuration
  add VAR_NAME      Add a new environment variable to Vercel
  remove VAR_NAME   Remove an environment variable from Vercel
  help              Show this help message

Examples:
  # Download latest variables from Vercel
  ./scripts/sync-env.sh pull

  # Check what's on Vercel
  ./scripts/sync-env.sh list

  # Add a new API key
  ./scripts/sync-env.sh add OPENAI_API_KEY

  # Remove a variable
  ./scripts/sync-env.sh remove OLD_VAR

  # Check sync status
  ./scripts/sync-env.sh status

Configuration:
  Project: ${PROJECT_NAME}
  Env File: ${ENV_FILE}
  Backups: ${BACKUP_DIR}/

For more information, see: docs/vercel/environment-variables.md

EOF
}

# Main script logic
main() {
    case "${1:-help}" in
        pull)
            pull_env
            ;;
        push)
            push_env
            ;;
        list|ls)
            list_env
            ;;
        compare|diff)
            compare_env
            ;;
        status)
            status
            ;;
        add)
            add_var "$2"
            ;;
        remove|rm)
            remove_var "$2"
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
}

# Run main function
main "$@"
