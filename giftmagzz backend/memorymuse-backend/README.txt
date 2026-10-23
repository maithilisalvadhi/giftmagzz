MEMORYMUSE BACKEND
Requirements: Node.js 18+ and npm.

1. Open a terminal in this folder.
2. Run: npm install
3. Copy .env.example to .env and update JWT_SECRET to a long random secret.
4. Run: npm start
5. API base URL: http://localhost:5000

SQLite database is created by the backend. Configure CORS/API_BASE_URL in frontend/app.js if deploying separately.
Do not deploy with the example JWT secret. Admin endpoints must be protected/configured before public production use.
