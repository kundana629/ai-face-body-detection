import os
import sys
import subprocess
import shutil

def run_cmd(args, shell=False):
    """
    Utility to run a terminal command and exit on failure
    """
    print(f"Running: {' '.join(args)}")
    res = subprocess.run(args, shell=shell)
    if res.returncode != 0:
        print(f"Command failed with code {res.returncode}")
        return False
    return True

def main():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    
    venv_dir = os.path.join(backend_dir, ".venv")
    requirements_file = os.path.join(backend_dir, "requirements.txt")
    
    # Identify local virtual env paths based on operating system
    if sys.platform == "win32":
        pip_path = os.path.join(venv_dir, "Scripts", "pip.exe")
        python_path = os.path.join(venv_dir, "Scripts", "python.exe")
        uvicorn_path = os.path.join(venv_dir, "Scripts", "uvicorn.exe")
    else:
        pip_path = os.path.join(venv_dir, "bin", "pip")
        python_path = os.path.join(venv_dir, "bin", "python")
        uvicorn_path = os.path.join(venv_dir, "bin", "uvicorn")

    # 1. Setup Virtual Environment if missing
    if not os.path.exists(venv_dir):
        print("Creating virtual environment '.venv'...")
        # Use active python interpreter to spin up virtualenv
        if not run_cmd([sys.executable, "-m", "venv", ".venv"]):
            print("Failed to create virtual environment. Ensure you have the 'venv' package installed.")
            sys.exit(1)
        print("Virtual environment created successfully.")
        
        # Fresh upgrade pip in newly created environment
        print("Upgrading pip...")
        run_cmd([python_path, "-m", "pip", "install", "--upgrade", "pip"])
        
        # Install packages
        print("Installing dependencies from requirements.txt...")
        if not run_cmd([pip_path, "install", "-r", requirements_file]):
            print("Failed to install dependencies.")
            sys.exit(1)
        print("Dependencies installed successfully.")
    else:
        print("Virtual environment already exists.")
        
        # In case new packages are added, run an incremental check/install
        print("Ensuring dependencies are up to date...")
        run_cmd([pip_path, "install", "-r", requirements_file])

    # 2. Fire up Uvicorn ASGI Server
    print("Launching FastAPI server on port 5000 (with auto-reload)...")
    if not os.path.exists(uvicorn_path):
        # Fallback to run uvicorn module if command path fails
        cmd = [python_path, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000", "--reload"]
    else:
        cmd = [uvicorn_path, "main:app", "--host", "0.0.0.0", "--port", "5000", "--reload"]
        
    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\nFastAPI server stopped by user.")

if __name__ == "__main__":
    main()
