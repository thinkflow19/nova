import os
import shutil
from pathlib import Path

def setup_dev_environment():
    """
    Set up the development environment by copying .env.dev to .env
    and ensuring all required packages are installed.
    """
    print("🔧 Setting up development environment...")
    
    # Get current directory
    current_dir = Path.cwd()
    
    # Check if .env.dev exists
    env_dev_path = current_dir / ".env.dev"
    env_path = current_dir / ".env"
    
    if not env_dev_path.exists():
        print("❌ .env.dev file not found. Please create one first.")
        return False
    
    # Copy .env.dev to .env
    try:
        shutil.copy(env_dev_path, env_path)
        print("✅ Copied .env.dev to .env")
    except Exception as e:
        print(f"❌ Failed to copy .env.dev to .env: {str(e)}")
        return False
    
    # Set environment variables for this process
    os.environ["MOCK_MODE"] = "true"
    os.environ["ENABLE_DEMO_MODE"] = "true"
    
    print("✅ Development environment set up successfully!")
    print("ℹ️ Make sure to restart the backend server to apply changes.")
    
    return True

if __name__ == "__main__":
    setup_dev_environment() 