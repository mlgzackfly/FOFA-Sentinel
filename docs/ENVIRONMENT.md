# Environment Variables

This document describes all environment variables used in FOFA Sentinel.

## Server Configuration

### `PORT`
- **Type**: Number
- **Default**: `3002`
- **Description**: Port number for the backend server
- **Example**: `PORT=3002`

## FOFA API Configuration

These can be set via environment variables or through the web UI.

### `FOFA_API_KEY`
- **Type**: String
- **Required**: Yes (can be set in UI)
- **Description**: Your FOFA API key
- **How to get**: Visit https://fofa.info/user/personal
- **Example**: `FOFA_API_KEY=your_api_key_here`
- **Note**: Your FOFA account email will be automatically retrieved from your account info when needed

## Database Configuration

### `DB_PATH`
- **Type**: String
- **Default**: `./data/fofa.db`
- **Description**: Path to the SQLite database file
- **Example**: `DB_PATH=./data/fofa.db`

## Example `.env` File

```env
# Server
PORT=3002

# FOFA API (optional - can be set in UI)
FOFA_API_KEY=your_api_key_here

# Database
DB_PATH=./data/fofa.db
```

## Security Notes

⚠️ **Important**: Never commit your `.env` file to version control. The `.env` file is already included in `.gitignore`.

For production deployments:
- Use environment variables provided by your hosting platform
- Use secure secret management systems
- Rotate API keys regularly

