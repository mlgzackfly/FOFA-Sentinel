#!/usr/bin/env python3
"""
API wrapper for react2shell-scanner
Allows calling the scanner from Node.js via JSON
"""

import json
import sys
from scanner import check_vulnerability

def main():
    """Read JSON input from stdin and return JSON output"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        host = input_data.get('host')
        if not host:
            print(json.dumps({
                'error': 'host is required'
            }))
            sys.exit(1)
        
        # Extract options
        options = {
            'timeout': input_data.get('timeout', 10),
            'verify_ssl': input_data.get('verifySsl', True),
            'follow_redirects': input_data.get('followRedirects', True),
            'custom_headers': input_data.get('customHeaders'),
            'safe_check': input_data.get('safeCheck', False),
            'windows': input_data.get('windows', False),
            'waf_bypass': input_data.get('wafBypass', False),
            'waf_bypass_size_kb': input_data.get('wafBypassSize', 128),
            'vercel_waf_bypass': input_data.get('vercelWafBypass', False),
            'paths': input_data.get('paths'),
        }
        
        # Call the scanner
        result = check_vulnerability(host, **options)
        
        # Convert result to JSON-serializable format
        output = {
            'host': result.get('host'),
            'vulnerable': result.get('vulnerable'),
            'statusCode': result.get('status_code'),
            'error': result.get('error'),
            'finalUrl': result.get('final_url'),
            'testedUrl': result.get('tested_url'),
            'timestamp': result.get('timestamp'),
        }
        
        # Remove None values
        output = {k: v for k, v in output.items() if v is not None}
        
        print(json.dumps(output))
        
    except Exception as e:
        print(json.dumps({
            'error': str(e)
        }))
        sys.exit(1)

if __name__ == '__main__':
    main()

