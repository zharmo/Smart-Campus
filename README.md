# Smart Campus Assistance System (SE331 Assessment 2)

## Run locally
1. Create PostgreSQL database: `createdb smart_campus` (or use pgAdmin)
2. Backend:  cd backend && cp .env.example .env  (edit DATABASE_URL) && npm install && npm run db:setup && npm run dev   -> http://localhost:5000
3. Frontend: cd frontend && npm install && npm run dev   -> http://localhost:5173

## Demo accounts (password: Password123)
- Admin:   admin@campus.edu
- Student: student@campus.edu  (also fatima@campus.edu, omar@campus.edu)
