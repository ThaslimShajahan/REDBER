import os
import zipfile

def zip_dir(dir_name, zip_name, exclude_dirs, exclude_files):
    print(f"Zipping {dir_name} to {zip_name}...")
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(dir_name):
            # Mutate dirs in-place to skip excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for file in files:
                if file in exclude_files or file == zip_name:
                    continue
                file_path = os.path.join(root, file)
                # Need to use arcname to make path relative to the zipping directory
                arcname = os.path.relpath(file_path, dir_name)
                zipf.write(file_path, arcname)
    print(f"Completed {zip_name}!")

if __name__ == "__main__":
    base_dir = os.getcwd()

    # Clean up old zips
    old_zips = [f for f in os.listdir() if f.endswith('.zip') and f not in ('frontend_prod.zip', 'backend_prod.zip')]
    for oz in old_zips:
        try:
            os.remove(oz)
            print(f"Removed old zip file: {oz}")
        except:
            pass
            
    try:
        if os.path.exists("frontend_prod.zip"): os.remove("frontend_prod.zip")
        if os.path.exists("backend_prod.zip"): os.remove("backend_prod.zip")
    except:
        pass

    # Zip Frontend
    frontend_dir = os.path.join(base_dir, "frontend")
    exclude_dirs_fe = {".next", "node_modules", ".git"}
    exclude_files_fe = {".env.development", ".env.local"}
    zip_dir(frontend_dir, "frontend_prod.zip", exclude_dirs_fe, exclude_files_fe)

    # Zip Backend
    backend_dir = os.path.join(base_dir, "backend")
    exclude_dirs_be = {"__pycache__", "venv", "env", ".pytest_cache", ".git"}
    exclude_files_be = {".env.development"}
    zip_dir(backend_dir, "backend_prod.zip", exclude_dirs_be, exclude_files_be)

    print("\nZIP creation successful! You can now upload 'frontend_prod.zip' and 'backend_prod.zip' to your VPS.")
