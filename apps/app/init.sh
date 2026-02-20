#!/bin/bash

# PuraToDo Tauri App - Development Environment Setup Script
# This script sets up and runs the Tauri development environment
#
# Usage:
#   ./init.sh              # Install deps and start dev server
#   ./init.sh --no-dev     # Only install deps, don't start server
#   ./init.sh --check      # Check dependencies only

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TAURI_DIR="$SCRIPT_DIR/src-tauri"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  PuraToDo Tauri App - Environment Setup${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check dependencies
check_dependencies() {
    echo -e "${YELLOW}Checking dependencies...${NC}"
    local missing=()

    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        echo -e "  ${GREEN}✓${NC} Node.js $NODE_VERSION"
    else
        echo -e "  ${RED}✗${NC} Node.js (not found)"
        missing+=("node")
    fi

    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        echo -e "  ${GREEN}✓${NC} npm $NPM_VERSION"
    else
        echo -e "  ${RED}✗${NC} npm (not found)"
        missing+=("npm")
    fi

    # Check Rust
    if command_exists rustc; then
        RUST_VERSION=$(rustc --version)
        echo -e "  ${GREEN}✓${NC} $RUST_VERSION"
    else
        echo -e "  ${RED}✗${NC} Rust (not found)"
        missing+=("rust")
    fi

    # Check Cargo
    if command_exists cargo; then
        CARGO_VERSION=$(cargo --version)
        echo -e "  ${GREEN}✓${NC} $CARGO_VERSION"
    else
        echo -e "  ${RED}✗${NC} Cargo (not found)"
        missing+=("cargo")
    fi

    # Platform-specific checks
    case "$(uname -s)" in
        Darwin*)
            echo -e "${YELLOW}Checking macOS-specific dependencies...${NC}"

            # Check Xcode Command Line Tools
            if xcode-select -p >/dev/null 2>&1; then
                echo -e "  ${GREEN}✓${NC} Xcode Command Line Tools"
            else
                echo -e "  ${RED}✗${NC} Xcode Command Line Tools (run: xcode-select --install)"
                missing+=("xcode")
            fi
            ;;

        Linux*)
            echo -e "${YELLOW}Checking Linux-specific dependencies...${NC}"

            # Check webkit2gtk (required for Tauri on Linux)
            if pkg-config --exists webkit2gtk-4.1 2>/dev/null; then
                echo -e "  ${GREEN}✓${NC} webkit2gtk-4.1"
            else
                echo -e "  ${RED}✗${NC} webkit2gtk-4.1"
                echo -e "    Install with: sudo apt install libwebkit2gtk-4.1-dev"
                missing+=("webkit2gtk")
            fi

            # Check OpenSSL
            if pkg-config --exists openssl 2>/dev/null; then
                echo -e "  ${GREEN}✓${NC} OpenSSL"
            else
                echo -e "  ${RED}✗${NC} OpenSSL"
                echo -e "    Install with: sudo apt install libssl-dev"
                missing+=("openssl")
            fi
            ;;

        MINGW*|MSYS*|CYGWIN*)
            echo -e "${YELLOW}Checking Windows-specific dependencies...${NC}"

            # Check for Visual Studio Build Tools
            if command_exists cl.exe || [ -d "/c/Program Files/Microsoft Visual Studio" ]; then
                echo -e "  ${GREEN}✓${NC} Visual Studio Build Tools"
            else
                echo -e "  ${RED}✗${NC} Visual Studio Build Tools"
                echo -e "    Download from: https://visualstudio.microsoft.com/downloads/"
                missing+=("vs-build-tools")
            fi

            # Check WebView2
            if [ -f "/c/Program Files (x86)/Microsoft/EdgeWebView/Application/msedge.dll" ] 2>/dev/null; then
                echo -e "  ${GREEN}✓${NC} WebView2"
            else
                echo -e "  ${YELLOW}!${NC} WebView2 (may need to install for Windows 10)"
                echo -e "    Download from: https://developer.microsoft.com/en-us/microsoft-edge/webview2/"
            fi
            ;;
    esac

    echo ""

    if [ ${#missing[@]} -gt 0 ]; then
        echo -e "${RED}Missing dependencies: ${missing[*]}${NC}"
        echo ""
        echo "Please install missing dependencies and run this script again."
        echo ""
        echo "Installation guides:"
        echo "  Node.js:    https://nodejs.org/"
        echo "  Rust:       https://rustup.rs/"
        echo "  Tauri deps: https://tauri.app/v2/guides/prerequisites/"
        return 1
    fi

    echo -e "${GREEN}All dependencies satisfied!${NC}"
    return 0
}

# Function to install npm dependencies
install_npm_deps() {
    echo -e "${YELLOW}Installing npm dependencies...${NC}"

    if [ -f "$SCRIPT_DIR/package.json" ]; then
        cd "$SCRIPT_DIR"
        npm install
        echo -e "${GREEN}npm dependencies installed${NC}"
    else
        echo -e "${YELLOW}No package.json found, creating React + Vite project...${NC}"
        cd "$SCRIPT_DIR"

        # Initialize Vite project with React + TypeScript
        npm create vite@latest . -- --template react-ts

        # Install additional dependencies
        npm install @tanstack/react-query axios
        npm install -D tailwindcss postcss autoprefixer
        npx tailwindcss init -p

        echo -e "${GREEN}Vite + React project initialized${NC}"
    fi
}

# Function to initialize Tauri if not exists
init_tauri() {
    if [ ! -d "$TAURI_DIR" ]; then
        echo -e "${YELLOW}Initializing Tauri project...${NC}"
        cd "$SCRIPT_DIR"

        # Create Tauri project
        npx tauri init --app-name "PuraToDo" \
            --window-title "PuraToDo" \
            --dev-url "http://localhost:5173" \
            --before-dev-command "npm run dev" \
            --before-build-command "npm run build" \
            --ci

        echo -e "${GREEN}Tauri project initialized${NC}"
    else
        echo -e "${GREEN}Tauri project already exists${NC}"
    fi
}

# Function to start development server
start_dev() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  Starting Development Server${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""

    echo -e "${YELLOW}Starting Tauri development server...${NC}"
    echo -e "Press ${BLUE}Ctrl+C${NC} to stop"
    echo ""

    # Start Tauri dev
    cd "$SCRIPT_DIR"
    npx tauri dev
}

# Main script logic
main() {
    local start_server=true

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-dev)
                start_server=false
                shift
                ;;
            --check)
                check_dependencies
                exit $?
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --no-dev    Install dependencies only, don't start server"
                echo "  --check     Check dependencies only"
                echo "  --help, -h  Show this help message"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    # Check dependencies
    if ! check_dependencies; then
        exit 1
    fi

    echo ""

    # Install npm dependencies
    install_npm_deps

    echo ""

    # Initialize Tauri if needed
    init_tauri

    # Start dev server if requested
    if [ "$start_server" = true ]; then
        start_dev
    else
        echo ""
        echo -e "${GREEN}Setup complete!${NC}"
        echo ""
        echo "To start development:"
        echo "  ./init.sh"
        echo ""
        echo "Or manually:"
        echo "  npx tauri dev"
    fi
}

main "$@"
