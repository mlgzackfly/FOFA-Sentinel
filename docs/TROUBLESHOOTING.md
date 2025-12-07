# Troubleshooting Guide

Common issues and their solutions.

## Installation Issues

### `better-sqlite3` compilation errors

**Problem**: Error during `npm install` related to `better-sqlite3` compilation.

**Solutions**:
1. Ensure you have build tools installed:
   - **macOS**: `xcode-select --install`
   - **Linux**: `sudo apt-get install build-essential` (Ubuntu/Debian)
   - **Windows**: Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/)

2. Try using a prebuilt binary:
   ```bash
   npm install better-sqlite3 --build-from-source=false
   ```

3. Update Node.js to the latest LTS version

### Port already in use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3002`

**Solutions**:
1. Change the port in `.env`:
   ```env
   PORT=3003
   ```

2. Find and kill the process using the port:
   ```bash
   # macOS/Linux
   lsof -ti:3002 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :3002
   taskkill /PID <PID> /F
   ```

## Runtime Issues

### API Key not working

**Problem**: Getting "API key not configured" or authentication errors.

**Solutions**:
1. Verify your API key is correct in Settings page
2. Check if your FOFA account has API access enabled
3. Ensure your API key hasn't expired
4. Try regenerating your API key from https://fofa.info/user/personal

### Database errors

**Problem**: SQLite database errors or permission issues.

**Solutions**:
1. Check database file permissions:
   ```bash
   chmod 644 data/fofa.db
   ```

2. Ensure the `data/` directory exists and is writable:
   ```bash
   mkdir -p data
   chmod 755 data
   ```

3. If database is corrupted, delete and recreate:
   ```bash
   rm data/fofa.db*
   npm run dev
   ```

### CORS errors

**Problem**: CORS errors when making API requests.

**Solution**: The backend server includes CORS middleware. If you're still seeing errors:
1. Check that the backend server is running on the correct port
2. Verify the proxy configuration in `vite.config.ts` matches your backend port

## Development Issues

### TypeScript errors

**Problem**: Type errors in the codebase.

**Solutions**:
1. Run type check: `npm run type-check`
2. Ensure all dependencies are installed: `npm install`
3. Clear TypeScript cache: `rm -rf node_modules/.cache`

### Lint errors

**Problem**: ESLint errors preventing commits.

**Solutions**:
1. Auto-fix issues: `npm run lint:fix`
2. Check specific file: `npx eslint src/path/to/file.ts`
3. Review `.eslintrc.json` for configuration

### Build failures

**Problem**: `npm run build` fails.

**Solutions**:
1. Clear build cache: `rm -rf dist node_modules/.vite`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check for TypeScript errors: `npm run type-check`
4. Review build logs for specific error messages

## Browser Issues

### Page not loading

**Problem**: Blank page or errors in browser console.

**Solutions**:
1. Check browser console for errors
2. Verify frontend server is running: `npm run dev:client`
3. Clear browser cache and hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
4. Check network tab for failed requests

### Styles not applying

**Problem**: UI looks broken or styles missing.

**Solutions**:
1. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
2. Check if CSS files are loading in Network tab
3. Verify `index.css` is imported in `main.tsx`
4. Clear Vite cache: `rm -rf node_modules/.vite`

## Getting Help

If you're still experiencing issues:

1. Check [GitHub Issues](https://github.com/your-username/fofa-api-client/issues) for similar problems
2. Create a new issue with:
   - Description of the problem
   - Steps to reproduce
   - Error messages/logs
   - Environment details (OS, Node.js version, etc.)

