# Contributing to Marex Server Control

Thanks for your interest in contributing! This project is open to all kinds of contributions: bug fixes, features, documentation improvements, and more.

## How to Contribute

### Reporting Bugs

1. Check if the bug is already reported on [Issues](https://github.com/yourusername/marex-server-control/issues)
2. If not, create a new issue with:
   - Clear title describing the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment (Docker version, OS, etc.)
   - Relevant logs (from `docker-compose logs`)

### Suggesting Features

1. Open a GitHub Issue with the `enhancement` label
2. Describe the feature and why it would be useful
3. Include any relevant examples or mockups

### Contributing Code

1. **Fork** the repository
2. **Create a feature branch:** `git checkout -b feature/my-feature`
3. **Make your changes** (see below)
4. **Test locally** to ensure it works
5. **Commit** with clear messages: `git commit -m "Add feature X"`
6. **Push** to your fork: `git push origin feature/my-feature`
7. **Open a Pull Request** with a description of changes

### Pull Request Guidelines

- **Keep it focused:** One feature or fix per PR
- **Write clear commit messages:** Explain the "why" not just the "what"
- **Update documentation:** If you change API endpoints or behavior, update README.md or DEVELOPMENT.md
- **Test your changes:** Make sure the feature works in Docker and local dev
- **No breaking changes:** Unless agreed upon in an issue first

## Development Setup

See [DEVELOPMENT.md](DEVELOPMENT.md) for full setup instructions.

Quick start:
```bash
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" # Generate JWT_SECRET
# Edit .env and paste the JWT_SECRET
docker-compose up --build
```

## Code Guidelines

### Backend (Node.js/Express)

- Use async/await for asynchronous code
- Always use parameterized queries to prevent SQL injection: `db.get('SELECT * FROM users WHERE id = ?', [id])`
- Wrap database calls in try/catch
- Return JSON responses with consistent structure
- Use `authMiddleware` for protected endpoints

**Example endpoint:**
```javascript
app.post('/api/items', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    
    await db.run('INSERT INTO items (user_id, name) VALUES (?, ?)', 
      [req.userId, name]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### Frontend (React/Vite)

- Use functional components with hooks
- Keep components small and focused
- Always include `Authorization` header when calling protected endpoints
- Handle loading and error states
- Use Material-UI components for consistency

**Example component:**
```jsx
import { useEffect, useState } from 'react';
import { Card, CircularProgress, Alert } from '@mui/material';

export default function MyData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    fetch('/api/my-data', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;
  
  return <Card>{JSON.stringify(data)}</Card>;
}
```

### SQL

- Always use parameterized queries
- Create tables in `db.js` `initDB()` function
- Use descriptive column names
- Include timestamps for audit trails

---

## Testing Your Changes

### Locally with Docker

```bash
# Make your changes
docker-compose up --build -d
# Test the feature in the dashboard at http://localhost

# Check logs for any errors
docker-compose logs -f
```

### Without Docker

**Terminal 1 — Backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
```

Visit http://localhost:5173 to test.

### Testing API Changes

```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' | jq -r .token)

# Test endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost/api/my-endpoint
```

---

## Documentation

If you add a new feature, please update:
- **README.md** — If it's user-facing
- **DEVELOPMENT.md** — If it affects development/architecture
- **API comments** — In the code itself, if it's not obvious

---

## Common Contribution Types

### Adding a New API Endpoint

1. Add the endpoint to `backend/src/index.js`
2. Update `DEVELOPMENT.md` with the new endpoint details
3. Test with both Docker and local dev
4. Update `frontend/src/App.jsx` if it needs dashboard integration

### Adding a Dashboard Feature

1. Edit `frontend/src/App.jsx` or create new components
2. Call your backend endpoint with proper error handling
3. Test in both dev and Docker builds
4. Update README.md if it's a major feature

### Updating Database Schema

1. Add the table creation to `backend/src/db.js` `initDB()`
2. Delete `backend/data.db` to test fresh DB creation
3. Restart the backend: `docker-compose restart backend`
4. Document the schema in DEVELOPMENT.md

### Bug Fixes

1. Create a test case that reproduces the bug
2. Fix the bug
3. Verify the fix works
4. Add a comment explaining the fix if it's non-obvious

---

## Code Review Process

- All PRs require at least one review
- We'll check for:
  - Code quality and style
  - Security issues (SQL injection, XSS, etc.)
  - Performance concerns
  - Documentation updates
  - Tests/verification of the fix

---

## Questions?

- Open an issue and tag it `question`
- Check existing documentation first
- Join GitHub Discussions for feature ideas

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for helping make Marex Server Control better!** 🙏
