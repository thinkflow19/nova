import sys
import os

# Ensure the backend directory is in the path
sys.path.append(os.path.abspath('backend'))

# Import the test suite function
try:
    from app.tests.integration_test_suite import run_test_suite
    
    # Run the suite
    print("Starting integration test suite explicitly...")
    run_test_suite()
    print("Integration test suite finished.")

except ImportError as e:
    print(f"Error importing test suite: {e}")
    print("Please ensure you are running this from the project root directory.")
except Exception as e:
    print(f"An error occurred during test execution: {e}") 