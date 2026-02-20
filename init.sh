#!/bin/bash
#
# PuraToDo Monorepo Development Environment Init Script
# ========================================================
#
# Usage:
#   ./init.sh web       # Start Next.js web app (default)
#   ./init.sh app       # Start Tauri desktop app
#   ./init.sh check     # Check all dependencies
#   ./init.sh --no-dev  # Install deps only, don't start server
#
# This script follows the "long-running agent" methodology from:
# https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$SCRIPT_DIR/apps/web"
APP_DIR="$SCRIPT_DIR/apps/app"

# ============================================================================
# Utility Functions
# ============================================================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}==>${NC} $1"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ============================================================================
# Dependency Checking Functions
# ============================================================================

check_pnpm() {
    log_step "Checking pnpm..."
    if command_exists pnpm; then
        PNPM_VERSION=$(pnpm --version)
        echo -e "  ${GREEN}✓${NC} pnpm $PNPM_VERSION"
        return 0
    else
        echo -e "  ${RED}✗${NC} pnpm (not found)"
        echo -e "    Install with: ${YELLOW}npm install -g pnpm${NC}"
        return 1
    fi
}

check_node() {
    log_step "Checking Node.js..."
    if command_exists node; then
        NODE_VERSION=$(node --version)
        echo -e "  ${GREEN}✓${NC} Node.js $NODE_VERSION"
        return 0
    else
        echo -e "  ${RED}✗${NC} Node.js (not found)"
        echo -e "    Install from: ${YELLOW}https://nodejs.org/${NC}"
        return 1
    fi
}

check_rust() {
    log_step "Checking Rust (required for Tauri)..."
    if command_exists rustc; then
        RUST_VERSION=$(rustc --version)
        echo -e "  ${GREEN}✓${NC} $RUST_VERSION"
        return 0
    else
        echo -e "  ${RED}✗${NC} Rust (not found)"
        echo -e "    Install from: ${YELLOW}https://rustup.rs/${NC}"
        return 1
    fi
}

check_cargo() {
    if command_exists cargo; then
        CARGO_VERSION=$(cargo --version)
        echo -e "  ${GREEN}✓${NC} $CARGO_VERSION"
        return 0
    else
        echo -e "  ${RED}✗${NC} Cargo (not found)"
        return 1
    fi
}

check_platform_deps() {
    log_step "Checking platform-specific dependencies..."

    case "$(uname -s)" in
        Darwin*)
            echo -e "  ${BLUE}Platform: macOS${NC}"

            # Check Xcode Command Line Tools
            if xcode-select -p >/dev/null 2>&1; then
                echo -e "  ${GREEN}✓${NC} Xcode Command Line Tools"
            else
                echo -e "  ${RED}✗${NC} Xcode Command Line Tools"
                echo -e "    Install with: ${YELLOW}xcode-select --install${NC}"
                return 1
            fi
            ;;

        Linux*)
            echo -e "  ${BLUE}Platform: Linux${NC}"

            # Check webkit2gtk (required for Tauri on Linux)
            if pkg-config --exists webkit2gtk-4.1 2>/dev/null; then
                echo -e "  ${GREEN}✓${NC} webkit2gtk-4.1"
            else
                echo -e "  ${RED}✗${NC} webkit2gtk-4.1"
                echo -e "    Install with: ${YELLOW}sudo apt install libwebkit2gtk-4.1-dev${NC}"
                return 1
            fi

            # Check OpenSSL
            if pkg-config --exists openssl 2>/dev/null; then
                echo -e "  ${GREEN}✓${NC} OpenSSL"
            else
                echo -e "  ${RED}✗${NC} OpenSSL"
                echo -e "    Install with: ${YELLOW}sudo apt install libssl-dev${NC}"
                return 1
            fi
            ;;

        MINGW*|MSYS*|CYGWIN*)
            echo -e "  ${BLUE}Platform: Windows${NC}"

            # Check for Visual Studio Build Tools
            if command_exists cl.exe || [ -d "/c/Program Files/Microsoft Visual Studio" ]; then
                echo -e "  ${GREEN}✓${NC} Visual Studio Build Tools"
            else
                echo -e "  ${RED}✗${NC} Visual Studio Build Tools"
                echo -e "    Download from: ${YELLOW}https://visualstudio.microsoft.com/downloads/${NC}"
                return 1
            fi

            # Check WebView2
            if [ -f "/c/Program Files (x86)/Microsoft/EdgeWebView/Application/msedge.dll" ] 2>/dev/null; then
                echo -e "  ${GREEN}✓${NC} WebView2"
            else
                echo -e "  ${YELLOW}!${NC} WebView2 (may need to install for Windows 10)"
                echo -e "    Download from: ${YELLOW}https://developer.microsoft.com/en-us/microsoft-edge/webview2/${NC}"
            fi
            ;;

        *)
            echo -e "  ${YELLOW}!${NC} Unknown platform: $(uname -s)"
            ;;
    esac

    return 0
}

# ============================================================================
# Installation Functions
# ============================================================================

install_monorepo_deps() {
    log_step "Installing monorepo dependencies..."

    if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
        cd "$SCRIPT_DIR"
        pnpm install
        log_info "Monorepo dependencies installed"
    else
        log_info "Monorepo dependencies already installed"
    fi
}

install_app_deps() {
    log_step "Installing Tauri app dependencies..."

    if [ -f "$APP_DIR/package.json" ]; then
        if [ ! -d "$APP_DIR/node_modules" ]; then
            cd "$APP_DIR"
            npm install
            log_info "Tauri app dependencies installed"
        else
            log_info "Tauri app dependencies already installed"
        fi
    fi
}

# ============================================================================
# Start Functions
# ============================================================================

start_web() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  Starting Next.js Web Development Server${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""

    log_info "Web app will be available at: ${YELLOW}http://localhost:3000${NC}"
    echo ""

    cd "$SCRIPT_DIR"
    pnpm dev
}

start_app() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  Starting Tauri Desktop App${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""

    log_info "Starting Tauri development server..."
    log_info "Press ${BLUE}Ctrl+C${NC} to stop"
    echo ""

    cd "$APP_DIR"
    npm run tauri dev
}

# ============================================================================
# Check All Dependencies
# ============================================================================

check_all_deps() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  Checking All Dependencies${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""

    local web_ok=true
    local app_ok=true

    # Web dependencies
    echo -e "${YELLOW}[Web App Dependencies]${NC}"
    check_pnpm || web_ok=false
    check_node || web_ok=false
    echo ""

    # App dependencies
    echo -e "${YELLOW}[Tauri App Dependencies]${NC}"
    check_rust || app_ok=false
    check_cargo || app_ok=false
    check_platform_deps || app_ok=false
    echo ""

    # Summary
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  Summary${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""

    if [ "$web_ok" = true ]; then
        echo -e "  Web App:  ${GREEN}✓ Ready${NC}"
    else
        echo -e "  Web App:  ${RED}✗ Missing dependencies${NC}"
    fi

    if [ "$app_ok" = true ]; then
        echo -e "  Tauri App: ${GREEN}✓ Ready${NC}"
    else
        echo -e "  Tauri App: ${RED}✗ Missing dependencies${NC}"
    fi

    echo ""

    if [ "$web_ok" = true ] && [ "$app_ok" = true ]; then
        log_info "All dependencies satisfied!"
        return 0
    else
        log_error "Some dependencies are missing. Please install them and try again."
        return 1
    fi
}

# ============================================================================
# Main Script
# ============================================================================

show_help() {
    echo "PuraToDo Monorepo Development Environment"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  web        Start Next.js web development server (default)"
    echo "  app        Start Tauri desktop app"
    echo "  check      Check all dependencies"
    echo ""
    echo "Options:"
    echo "  --no-dev   Install dependencies only, don't start server"
    echo "  --help     Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 web              # Start web dev server"
    echo "  $0 app              # Start Tauri app"
    echo "  $0 check            # Check dependencies"
    echo "  $0 web --no-dev     # Install deps without starting server"
}

main() {
    local command="web"
    local start_dev=true

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            web|app|check)
                command="$1"
                shift
                ;;
            --no-dev)
                start_dev=false
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Run '$0 --help' for usage information"
                exit 1
                ;;
        esac
    done

    # Header
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  PuraToDo Monorepo${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""

    case "$command" in
        check)
            check_all_deps
            exit $?
            ;;

        web)
            # Check web dependencies
            echo -e "${YELLOW}[Checking Web App Dependencies]${NC}"
            check_pnpm || exit 1
            check_node || exit 1
            echo ""

            # Install dependencies
            install_monorepo_deps
            echo ""

            if [ "$start_dev" = true ]; then
                start_web
            else
                log_info "Environment ready! Run '${YELLOW}./init.sh web${NC}' to start the server."
            fi
            ;;

        app)
            # Check all dependencies (web + tauri)
            echo -e "${YELLOW}[Checking Tauri App Dependencies]${NC}"
            check_pnpm || exit 1
            check_node || exit 1
            check_rust || exit 1
            check_platform_deps || exit 1
            echo ""

            # Install dependencies
            install_monorepo_deps
            install_app_deps
            echo ""

            if [ "$start_dev" = true ]; then
                start_app
            else
                log_info "Environment ready! Run '${YELLOW}./init.sh app${NC}' to start the app."
            fi
            ;;
    esac
}

main "$@"
