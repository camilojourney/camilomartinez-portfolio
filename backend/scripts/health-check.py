#!/usr/bin/env python3
"""
Professional Backend Health Check Script
Checks multiple endpoints and services
"""

import json
import sys
import time
from datetime import datetime

import requests

# Configuration
BACKEND_URL = "http://localhost:9000"
TIMEOUT = 5  # seconds

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def check_endpoint(url: str, method: str = "GET", expected_status: int = 200) -> tuple[bool, dict]:
    """Check a single endpoint"""
    try:
        start_time = time.time()
        response = requests.request(method, url, timeout=TIMEOUT)
        response_time = (time.time() - start_time) * 1000  # Convert to ms

        success = response.status_code == expected_status

        return success, {
            "status_code": response.status_code,
            "response_time_ms": round(response_time, 2),
            "content": response.json() if response.headers.get('content-type') == 'application/json' else response.text[:100]
        }
    except requests.exceptions.ConnectionError:
        return False, {"error": "Connection refused - server not running"}
    except requests.exceptions.Timeout:
        return False, {"error": f"Timeout after {TIMEOUT}s"}
    except Exception as e:
        return False, {"error": str(e)}

def print_header():
    """Print header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}  🏥 Backend Health Check Report{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}\n")

def print_result(name: str, success: bool, details: dict):
    """Print check result"""
    status = f"{Colors.GREEN}✓ PASS{Colors.END}" if success else f"{Colors.RED}✗ FAIL{Colors.END}"
    print(f"{status} {Colors.BOLD}{name}{Colors.END}")

    if "status_code" in details:
        status_color = Colors.GREEN if success else Colors.RED
        print(f"  Status: {status_color}{details['status_code']}{Colors.END}")
        print(f"  Response Time: {details['response_time_ms']}ms")

    if "error" in details:
        print(f"  {Colors.RED}Error: {details['error']}{Colors.END}")
    elif "content" in details:
        try:
            print(f"  Response: {json.dumps(details['content'], indent=2)}")
        except Exception:
            print(f"  Response: {details['content']}")

    print()

def main():
    """Run all health checks"""
    print_header()

    # List of checks to run
    checks = [
        ("Server Health", f"{BACKEND_URL}/health", "GET", 200),
        ("API Documentation", f"{BACKEND_URL}/docs", "GET", 200),
        ("OpenAPI Schema", f"{BACKEND_URL}/openapi.json", "GET", 200),
    ]

    results = []

    for name, url, method, expected_status in checks:
        success, details = check_endpoint(url, method, expected_status)
        results.append(success)
        print_result(name, success, details)

    # Summary
    total = len(results)
    passed = sum(results)
    failed = total - passed

    print(f"{Colors.BOLD}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}Summary:{Colors.END}")
    print(f"  Total Checks: {total}")
    print(f"  {Colors.GREEN}Passed: {passed}{Colors.END}")
    print(f"  {Colors.RED}Failed: {failed}{Colors.END}")

    if failed == 0:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✨ All checks passed! Backend is healthy.{Colors.END}\n")
        sys.exit(0)
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}⚠️  Some checks failed. Please investigate.{Colors.END}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
