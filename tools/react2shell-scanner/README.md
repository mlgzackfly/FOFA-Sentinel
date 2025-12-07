# React2Shell Scanner Integration

This directory contains the integration of [react2shell-scanner](https://github.com/assetnote/react2shell-scanner) for detecting CVE-2025-55182 and CVE-2025-66478 vulnerabilities in Next.js applications.

## Installation

Install Python dependencies using `uv`:

```bash
cd tools/react2shell-scanner
uv pip install -r requirements.txt
```

Or using standard pip (if you have a virtual environment):

```bash
cd tools/react2shell-scanner
pip install -r requirements.txt
```

## Files

- `scanner.py` - Original scanner from assetnote/react2shell-scanner
- `scanner_api.py` - API wrapper for calling the scanner from Node.js
- `requirements.txt` - Python dependencies

## Usage

The scanner is automatically called by the FOFA Sentinel backend when using the RSC scan feature in the UI.

## Credits

Original scanner by Assetnote Security Research Team:
- Adam Kues, Tomais Williamson, Dylan Pindur, Patrik Grobshäuser, Shubham Shah

