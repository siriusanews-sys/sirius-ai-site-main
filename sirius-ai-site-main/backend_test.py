import requests
import sys
import json
from datetime import datetime

class UFOAPITester:
    def __init__(self, base_url="https://mystery-globe.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_id = f"test_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                    return True, response_data
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_get_sightings(self):
        """Test getting all sightings"""
        success, data = self.run_test("Get All Sightings", "GET", "sightings", 200)
        if success and 'sightings' in data:
            print(f"   Found {len(data['sightings'])} sightings")
            if data['sightings']:
                sample = data['sightings'][0]
                print(f"   Sample sighting: {sample.get('title', 'No title')}")
        return success

    def test_get_sightings_by_type(self):
        """Test getting sightings filtered by type"""
        success1, data1 = self.run_test("Get UFO Sightings", "GET", "sightings", 200, params={"type": "ufo"})
        success2, data2 = self.run_test("Get UAP Sightings", "GET", "sightings", 200, params={"type": "uap"})
        success3, data3 = self.run_test("Get Anomaly Sightings", "GET", "sightings", 200, params={"type": "anomaly"})
        
        if success1 and 'sightings' in data1:
            print(f"   UFO sightings: {len(data1['sightings'])}")
        if success2 and 'sightings' in data2:
            print(f"   UAP sightings: {len(data2['sightings'])}")
        if success3 and 'sightings' in data3:
            print(f"   Anomaly sightings: {len(data3['sightings'])}")
            
        return success1 and success2 and success3

    def test_create_sighting(self):
        """Test creating a new sighting"""
        test_sighting = {
            "type": "ufo",
            "title": "Test UFO Sighting",
            "description": "Test sighting for API validation",
            "location": "Test City, Test Country",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "date": "2024-01-01",
            "reported_by": "API Test"
        }
        
        success, data = self.run_test("Create Sighting", "POST", "sightings", 200, data=test_sighting)
        if success and 'id' in data:
            print(f"   Created sighting with ID: {data['id']}")
            self.test_sighting_id = data['id']
            return True
        return False

    def test_get_specific_sighting(self):
        """Test getting a specific sighting by ID"""
        if hasattr(self, 'test_sighting_id'):
            return self.run_test("Get Specific Sighting", "GET", f"sightings/{self.test_sighting_id}", 200)[0]
        else:
            print("⚠️  Skipping - No test sighting ID available")
            return True

    def test_get_phenomena(self):
        """Test getting anomalous phenomena"""
        success, data = self.run_test("Get Phenomena", "GET", "phenomena", 200)
        if success and 'phenomena' in data:
            print(f"   Found {len(data['phenomena'])} phenomena")
        return success

    def test_get_satellites(self):
        """Test getting satellite data"""
        success, data = self.run_test("Get Satellites", "GET", "satellites", 200)
        if success and 'satellites' in data:
            print(f"   Found {len(data['satellites'])} satellites")
            if data['satellites']:
                sample = data['satellites'][0]
                print(f"   Sample satellite: {sample.get('name', 'No name')} at {sample.get('latitude', 0):.2f}, {sample.get('longitude', 0):.2f}")
        return success

    def test_get_videos(self):
        """Test getting video data"""
        success, data = self.run_test("Get Videos", "GET", "videos", 200)
        if success and 'videos' in data:
            print(f"   Found {len(data['videos'])} videos")
            if data['videos']:
                sample = data['videos'][0]
                print(f"   Sample video: {sample.get('title', 'No title')}")
        return success

    def test_chat_functionality(self):
        """Test AI chat functionality"""
        chat_message = {
            "session_id": self.session_id,
            "message": "Tell me about the Phoenix Lights incident"
        }
        
        print(f"   Using session ID: {self.session_id}")
        success, data = self.run_test("Chat Message", "POST", "chat", 200, data=chat_message)
        
        if success and 'response' in data:
            print(f"   AI Response length: {len(data['response'])} characters")
            if 'location' in data and data['location']:
                print(f"   Location extracted: {data['location']}")
            return True
        return False

    def test_chat_history(self):
        """Test getting chat history"""
        success, data = self.run_test("Get Chat History", "GET", f"chat/history/{self.session_id}", 200)
        if success and 'messages' in data:
            print(f"   Found {len(data['messages'])} messages in history")
        return success

    def test_clear_chat_history(self):
        """Test clearing chat history"""
        return self.run_test("Clear Chat History", "DELETE", f"chat/history/{self.session_id}", 200)[0]

    def test_seed_database(self):
        """Test database seeding"""
        success, data = self.run_test("Seed Database", "POST", "seed", 200)
        if success and 'message' in data:
            print(f"   Seed result: {data['message']}")
            if 'sightings_count' in data:
                print(f"   Sightings count: {data['sightings_count']}")
        return success

def main():
    print("🚀 Starting UFO Mystery Globe API Tests")
    print("=" * 50)
    
    tester = UFOAPITester()
    
    # Test sequence
    tests = [
        ("Root Endpoint", tester.test_root_endpoint),
        ("Database Seeding", tester.test_seed_database),
        ("Get All Sightings", tester.test_get_sightings),
        ("Get Sightings by Type", tester.test_get_sightings_by_type),
        ("Create New Sighting", tester.test_create_sighting),
        ("Get Specific Sighting", tester.test_get_specific_sighting),
        ("Get Phenomena", tester.test_get_phenomena),
        ("Get Satellites", tester.test_get_satellites),
        ("Get Videos", tester.test_get_videos),
        ("AI Chat Functionality", tester.test_chat_functionality),
        ("Get Chat History", tester.test_chat_history),
        ("Clear Chat History", tester.test_clear_chat_history),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"\n❌ Failed Tests:")
        for test in failed_tests:
            print(f"   - {test}")
        return 1
    else:
        print("\n✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())