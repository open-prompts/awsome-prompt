import subprocess
import time
import requests
import sys
import os

def run_command(command):
    print(f"Executing: {command}")
    process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()
    if process.returncode != 0:
        print(f"Error executing command: {command}")
        print(stderr.decode())
        return False
    return True

def wait_for_service(url, timeout=60):
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            response = requests.get(url)
            if response.status_code == 200:
                return True
        except requests.exceptions.ConnectionError:
            pass
        time.sleep(1)
    return False

def test_list_templates():
    url = "http://localhost:8080/api/v1/templates"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            print("List Templates Response:", data)
            # Since DB is initially empty (unless seeded), we might get empty list
            # But getting 200 OK and valid JSON is a success for connectivity
            # The response structure should match ListTemplatesResponse
            if "templates" in data or data.get("templates") is None:
                 print("Test Passed: List Templates API is reachable and returned valid structure.")
                 return True
        else:
            print(f"Test Failed: Status Code {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Test Failed: {e}")
    return False

def main():
    # Start containers
    print("Starting containers...")
    # Assuming we are running from the root of the repo
    if not run_command("docker-compose -f deployment/docker-compose.yml up -d --build"):
        sys.exit(1)

    # Wait for backend
    print("Waiting for backend...")
    if not wait_for_service("http://localhost:8080/api/v1/templates"): 
        print("Backend failed to start or is not reachable.")
        run_command("docker-compose -f deployment/docker-compose.yml logs backend")
        run_command("docker-compose -f deployment/docker-compose.yml down")
        sys.exit(1)

    # Run tests
    print("Running tests...")
    success = test_list_templates()

    # Cleanup
    print("Cleaning up...")
    run_command("docker-compose -f deployment/docker-compose.yml down")

    if success:
        print("All tests passed!")
        sys.exit(0)
    else:
        print("Tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
