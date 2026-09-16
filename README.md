# LostLink USTH

LostLink USTH is a Lost & Found website for the USTH community. The frontend remains HTML/CSS/Vanilla JavaScript, while the backend uses Node.js, Express and PostgreSQL.

The project is intentionally kept simple so students can explain every important part during a Web course presentation.

## 1. Project overview

Main user flows:

- Register and login
- View lost items and found items
- Search and filter posts
- Create a lost/found post
- View post details
- Edit, resolve or delete your own post
- Submit a claim for a found item
- Track claim status
- Send system feedback and track it by code
- Send a security report
- Admin dashboard for posts, claims, feedback and security reports

The old frontend-only `localStorage` database has been removed. Real application data is now stored in PostgreSQL.

`localStorage` is used only for:

- JWT token
- basic logged-in user information
- optional UI preferences

## 2. Project structure

```text
LostLink_USTH/
├── index.html
├── lost.html
├── found.html
├── search.html
├── detail.html
├── post.html
├── my-posts.html
├── claims.html
├── claim-status.html
├── contact.html
├── feedback-status.html
├── security-report.html
├── security-center.html
├── campus-map.html
├── login.html
├── register.html
│
├── admin/
│   ├── login.html
│   ├── dashboard.html
│   ├── posts.html
│   ├── claims.html
│   ├── feedback.html
│   └── security.html
│
├── asset/
│   ├── css/
│   ├── images/
│   └── js/
│       ├── config.js
│       ├── api.js
│       ├── auth.js
│       ├── main.js
│       ├── portal-features.js
│       ├── portal-complete.js
│       ├── lostlink-ui.js
│       ├── admin.js
│       ├── admin-features.js
│       └── admin-complete.js
│
└── backend/
    ├── server.js
    ├── package.json
    ├── .env.example
    ├── config/
    │   └── database.js
    ├── middleware/
    │   └── authMiddleware.js
    ├── controllers/
    ├── routes/
    ├── database/
    │   └── schema.sql
    └── scripts/
        └── createAdmin.js
```

## 3. Technologies

Frontend:

- HTML5
- CSS3
- Vanilla JavaScript
- Fetch API

Backend:

- Node.js
- Express.js
- PostgreSQL
- `pg` for SQL queries
- `bcryptjs` for bcrypt password hashing
- `jsonwebtoken` for JWT authentication
- `multer` + Supabase Storage for optional image upload

Deployment:

- Frontend: Vercel
- Backend: Render or Railway
- Database: Supabase PostgreSQL
- Images: Supabase Storage

## 4. Database structure

### users

Stores accounts.

Important columns:

- `id`
- `full_name`
- `email`
- `password_hash`
- `role`: `user` or `admin`

### posts

One table stores both lost and found posts.

Important columns:

- `user_id`
- `type`: `lost` or `found`
- `title`
- `description`
- `category`
- `location`
- `event_date`
- `image_url`
- `status`
- `management_code`
- `verification_questions`

### claims

Stores ownership claims for found items.

Important columns:

- `post_id`
- `claimer_id`
- `student_id`
- `contact`
- `message`
- `answers`
- `status`
- `tracking_code`
- `pickup_code`

### feedback

Stores website feedback and post feedback.

Important columns:

- `user_id`
- `post_id`
- `name`
- `email`
- `subject`
- `message`
- `status`
- `tracking_code`
- `admin_reply`

### security_reports

Stores security reports.

Important columns:

- `user_id`
- `post_id`
- `category`
- `urgency`
- `location`
- `description`
- `status`
- `tracking_code`
- `admin_note`

## 5. Install PostgreSQL schema

Create a Supabase project, open the SQL Editor, then run:

```text
backend/database/schema.sql
```

This creates all required tables and indexes.

## 6. Configure backend `.env`

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://...
DATABASE_SSL=true
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
FRONTEND_URLS=http://127.0.0.1:5500,http://localhost:5500
```

For image upload, also set:

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_BUCKET=lostlink-images
```

Do not commit `.env`.

## 7. Install and run backend

```bash
cd backend
npm install
npm run dev
```

Backend URL:

```text
http://localhost:3000
```

Health check:

```text
GET http://localhost:3000/api/health
```

## 8. Create Admin account

Add these values to `backend/.env`:

```env
ADMIN_NAME=LostLink Admin
ADMIN_EMAIL=admin@usth.edu.vn
ADMIN_PASSWORD=your_private_password
```

Then run:

```bash
cd backend
npm run seed:admin
```

The password is hashed before it is stored in PostgreSQL.

## 9. Run frontend

The frontend must be served by HTTP. Do not open HTML files directly with `file://`.

A simple option is VS Code Live Server.

For example:

```text
http://127.0.0.1:5500/index.html
```

During local development `asset/js/config.js` automatically uses:

```text
http://localhost:3000
```

## 10. Main API endpoints

### Auth

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Posts

```text
GET    /api/posts
GET    /api/posts/mine
GET    /api/posts/:id
POST   /api/posts
PUT    /api/posts/:id
PATCH  /api/posts/:id/status
DELETE /api/posts/:id
```

Search examples:

```text
GET /api/posts?type=lost
GET /api/posts?type=found
GET /api/posts?search=wallet
GET /api/posts?category=Thiết bị điện tử
GET /api/posts?location=A21
```

### Claims

```text
POST /api/claims
GET  /api/claims/my
GET  /api/claims/track/:code
GET  /api/claims/post/:postId
GET  /api/claims                  Admin only
PUT  /api/claims/:id/status       Admin only
```

### Feedback

```text
POST /api/feedback
GET  /api/feedback/track/:code
GET  /api/feedback                Admin only
PUT  /api/feedback/:id            Admin only
```

### Security reports

```text
POST /api/security-reports
GET  /api/security-reports/my
GET  /api/security-reports/track/:code
GET  /api/security-reports        Admin only
PUT  /api/security-reports/:id/status   Admin only
```

### Admin

```text
GET   /api/admin/dashboard
GET   /api/admin/posts
PATCH /api/admin/posts/:id/status
```

### Images

```text
POST /api/uploads
```

The request must use `multipart/form-data` with field name `image`.

## 11. Authentication flow

```text
Login form
→ POST /api/auth/login
→ server finds user by email
→ bcrypt verifies password
→ server creates JWT
→ frontend stores JWT
→ frontend sends Authorization: Bearer <token>
→ auth middleware verifies JWT
→ protected controller runs
```

Admin permission is also checked on the backend. Hiding an Admin button in the browser is not considered security.

## 12. Ownership flow

When a user edits or deletes a post, the backend checks the post owner.

Conceptually:

```javascript
const isOwner = post.user_id === req.user.id;
const isAdmin = req.user.role === 'admin';

if (!isOwner && !isAdmin) {
    return res.status(403).json({
        message: 'You do not have permission to edit this post.'
    });
}
```

This is important because frontend buttons can always be modified by a browser user.

## 13. SQL safety

All SQL uses parameters:

```javascript
const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
);
```

Do not build SQL with user input inside template strings.

## 14. Image upload

Images are not stored in the Git repository.

Flow:

```text
Browser chooses image
→ POST /api/uploads
→ backend validates file
→ backend uploads to Supabase Storage
→ Supabase returns public URL
→ frontend sends image_url when creating the post
→ PostgreSQL stores only image_url
```

If Supabase Storage is not configured, posts can still be created without an image.

## 15. Deploy frontend to Vercel

1. Push repository to GitHub.
2. Import the repository into Vercel.
3. The frontend is static, so no build command is required.
4. Deploy.
5. Copy the Vercel URL.

Example:

```text
https://lostlink-usth.vercel.app
```

## 16. Deploy backend to Render

Create a new Web Service from the same GitHub repository.

Settings:

```text
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

Add all environment variables from `.env.example` in Render.

After deployment, copy the backend URL, for example:

```text
https://lostlink-api.onrender.com
```

Then edit:

```text
asset/js/config.js
```

Replace:

```javascript
'https://YOUR-BACKEND-URL.onrender.com'
```

with the real backend URL.

Also add the Vercel URL to backend `FRONTEND_URLS`.

## 17. Important code to understand for the presentation

### `backend/middleware/authMiddleware.js`

Explains how JWT is read and verified.

### `backend/controllers/authController.js`

Explains register, bcrypt hashing and login.

### `backend/controllers/postController.js`

Explains CRUD, validation, search filters and ownership checks.

### `backend/controllers/claimController.js`

Explains the secure claim workflow and Admin approval.

### `asset/js/api.js`

Explains how frontend uses `fetch()` and automatically adds JWT.

### `asset/js/main.js`

Explains the main frontend flows: posts, details, feedback and post management.

### `asset/js/admin.js`

Explains Admin authentication and moderation.

## 18. Why the architecture is intentionally simple

The project does not use:

- React
- Redux
- GraphQL
- ORM
- repository/service layers
- Docker
- Redis
- microservices
- Kubernetes

The flow is deliberately direct:

```text
HTML / JavaScript
→ fetch()
→ Express route
→ controller
→ parameterized PostgreSQL query
→ JSON response
```

That makes the code easier to understand and explain in a Web course defense.
