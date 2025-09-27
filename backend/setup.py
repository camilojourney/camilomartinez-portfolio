"""
Installation and Setup Guide for Camilo's AI Analytics FastAPI Backend

This script helps set up the development environment for the Python FastAPI backend.
Run this after creating the backend structure to install dependencies and configure the environment.
"""

import subprocess
import sys
import os
from pathlib import Path


def run_command(command: str, description: str = ""):
    """Run a shell command and handle errors."""
    print(f"\n🔧 {description}")
    print(f"Running: {command}")
    
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        if e.stderr:
            print(f"Error output: {e.stderr}")
        return False


def check_prerequisites():
    """Check if required tools are installed."""
    print("🔍 Checking prerequisites...")
    
    required_tools = ["python3", "poetry", "redis-server", "psql"]
    missing_tools = []
    
    for tool in required_tools:
        if not run_command(f"which {tool}", f"Checking {tool}"):
            missing_tools.append(tool)
    
    if missing_tools:
        print(f"\n❌ Missing required tools: {', '.join(missing_tools)}")
        print("\nPlease install:")
        for tool in missing_tools:
            if tool == "poetry":
                print("- Poetry: curl -sSL https://install.python-poetry.org | python3 -")
            elif tool == "redis-server":
                print("- Redis: brew install redis (macOS) or apt-get install redis-server (Ubuntu)")
            elif tool == "psql":
                print("- PostgreSQL client: brew install postgresql (macOS)")
        return False
    
    print("✅ All prerequisites found!")
    return True


def setup_backend():
    """Set up the FastAPI backend development environment."""
    print("🚀 Setting up Camilo's AI Analytics FastAPI Backend")
    print("=" * 60)
    
    # Check prerequisites
    if not check_prerequisites():
        return False
    
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    print(f"📁 Working in: {backend_dir}")
    
    # Install dependencies with Poetry
    if not run_command("poetry install", "Installing Python dependencies"):
        return False
    
    # Create .env file from example
    env_file = Path(".env")
    env_example = Path(".env.example")
    
    if not env_file.exists() and env_example.exists():
        run_command("cp .env.example .env", "Creating .env file from example")
        print("⚠️  Please edit .env file with your actual configuration values!")
    
    # Initialize Alembic (database migrations)
    if not Path("alembic").exists():
        run_command("poetry run alembic init alembic", "Initializing database migrations")
    
    # Check Redis connection
    run_command("redis-cli ping", "Testing Redis connection (should return PONG)")
    
    # Display next steps
    print("\n🎉 Backend setup complete!")
    print("\n📋 Next steps:")
    print("1. Edit .env file with your configuration")
    print("2. Start Redis: redis-server")
    print("3. Run database migrations: poetry run alembic upgrade head")
    print("4. Start development server: poetry run uvicorn app.main:app --reload")
    print("5. Visit http://localhost:8000/docs for API documentation")
    
    return True


if __name__ == "__main__":
    if not setup_backend():
        sys.exit(1)
    
    print("\n✅ Setup successful! Your FastAPI backend is ready for development.")