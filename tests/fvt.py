import subprocess
import time
import requests
import sys
import os
import json

BASE_URL = "http://localhost:8080/api/v1/templates"

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

def test_lifecycle():
    print("--- Starting Lifecycle Test ---")
    
    # 1. Create Template
    print("1. Creating Template...")
    create_payload = {
        "owner_id": "user_123",
        "title": "My First Template",
        "description": "A test template",
        "visibility": "VISIBILITY_PUBLIC",
        "type": "TEMPLATE_TYPE_USER",
        "tags": ["test", "demo"],
        "category": "general"
    }
    resp = requests.post(BASE_URL, json=create_payload)
    if resp.status_code != 200:
        print(f"Create failed: {resp.status_code} - {resp.text}")
        return False
    
    created_template = resp.json().get("template")
    if not created_template:
        print("Create response missing template")
        return False
    template_id = created_template.get("id")
    print(f"Created Template ID: {template_id}")

    # 2. Get Template
    print("2. Getting Template...")
    resp = requests.get(f"{BASE_URL}/{template_id}")
    if resp.status_code != 200:
        print(f"Get failed: {resp.status_code} - {resp.text}")
        return False
    if resp.json().get("template", {}).get("title") != "My First Template":
        print("Get returned incorrect title")
        return False

    # 3. Update Template
    print("3. Updating Template...")
    update_payload = {
        "owner_id": "user_123",
        "title": "Updated Template Title",
        "description": "Updated description",
        "visibility": "VISIBILITY_PRIVATE",
        "tags": ["updated"],
        "category": "updated_cat"
    }
    resp = requests.put(f"{BASE_URL}/{template_id}", json=update_payload)
    if resp.status_code != 200:
        print(f"Update failed: {resp.status_code} - {resp.text}")
        return False
    if resp.json().get("template", {}).get("title") != "Updated Template Title":
        print("Update returned incorrect title")
        return False

    # 4. List Templates
    print("4. Listing Templates...")
    resp = requests.get(BASE_URL)
    if resp.status_code != 200:
        print(f"List failed: {resp.status_code} - {resp.text}")
        return False
    templates = resp.json().get("templates", [])
    found = False
    for t in templates:
        if t.get("id") == template_id:
            found = True
            if t.get("title") != "Updated Template Title":
                print("List returned incorrect title for updated template")
                return False
            break
    if not found:
        print("List did not find the updated template")
        return False

    # 5. Delete Template
    print("5. Deleting Template...")
    resp = requests.delete(f"{BASE_URL}/{template_id}?owner_id=user_123")
    if resp.status_code != 200:
        print(f"Delete failed: {resp.status_code} - {resp.text}")
        return False

    # 6. Verify Deletion
    print("6. Verifying Deletion...")
    resp = requests.get(f"{BASE_URL}/{template_id}")
    # Expecting 404 or 500 (since we return error) depending on implementation details
    # In our service implementation, Get returns error if not found, which main.go maps to 500 usually or we can check message
    if resp.status_code == 200:
        print("Get after delete should fail, but got 200")
        return False
    
    print("--- Lifecycle Test Passed ---")
    return True

def test_auth():
    print("--- Starting Auth Test ---")
    REGISTER_URL = "http://localhost:8080/api/v1/register"
    LOGIN_URL = "http://localhost:8080/api/v1/login"

    user_id = "fvt_user_1"
    email = "fvt_user_1@example.com"
    password = "password123"

    # 1. Register
    print("1. Registering User...")
    register_payload = {
        "id": user_id,
        "email": email,
        "password": password,
        "display_name": "FVT User"
    }
    resp = requests.post(REGISTER_URL, json=register_payload)
    if resp.status_code != 200:
        print(f"Register failed: {resp.status_code} - {resp.text}")
        return False
    
    data = resp.json()
    if data.get("id") != user_id:
        print(f"Register returned wrong ID: {data.get('id')}")
        return False
    if not data.get("token"):
        print("Register response missing token")
        return False
    
    print("User registered successfully.")

    # 2. Login
    print("2. Logging in...")
    login_payload = {
        "email": email,
        "password": password
    }
    resp = requests.post(LOGIN_URL, json=login_payload)
    if resp.status_code != 200:
        print(f"Login failed: {resp.status_code} - {resp.text}")
        return False
    
    data = resp.json()
    if data.get("id") != user_id:
        print(f"Login returned wrong ID: {data.get('id')}")
        return False
    if not data.get("token"):
        print("Login response missing token")
        return False
    
    print("User logged in successfully.")

    # 3. Duplicate Register
    print("3. Testing Duplicate Register...")
    resp = requests.post(REGISTER_URL, json=register_payload)
    if resp.status_code == 200:
        print("Duplicate register should fail, but got 200")
        return False
    print("Duplicate register failed as expected.")

    # 4. Invalid Login
    print("4. Testing Invalid Login...")
    invalid_payload = {
        "email": email,
        "password": "wrongpassword"
    }
    resp = requests.post(LOGIN_URL, json=invalid_payload)
    if resp.status_code == 200:
        print("Invalid login should fail, but got 200")
        return False
    print("Invalid login failed as expected.")

    print("--- Auth Test Passed ---")
    return True

def main():
    # Start containers
    print("Starting containers...")
    if not run_command("docker-compose -f deployment/docker-compose.yml up -d --build"):
        sys.exit(1)

    # Wait for backend
    print("Waiting for backend...")
    if not wait_for_service(BASE_URL): 
        print("Backend failed to start or is not reachable.")
        run_command("docker-compose -f deployment/docker-compose.yml logs backend")
        run_command("docker-compose -f deployment/docker-compose.yml down")
        sys.exit(1)

    # Run tests
    print("Running tests...")
    success = test_lifecycle()
    if success:
        success = test_auth()

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
