# writes-by-siva-server
## Blogging Backend
This is the backend server for the blogging platform. It powers the admin dashboard, newsletter system, and provides secure APIs for managing blogs and subscribers.

## 🚀 Features
### 🔑 Authentication & Sessions
- Admin Login – Secure login system for administrators.
- Session Management with Redis – All admin login sessions are stored in Redis for fast and secure session handling.
- Logout – End sessions safely and clear tokens.

### 📝 Blog Management
- Admin Dashboard – A panel that displays all blog posts in a table view.
- Options to view, reset stats, and delete a post.
- Create Blog Post – Post new blogs directly from the dashboard.
- Edit Blog – Update and modify existing blog posts.

### 📩 Newsletter System
- Subscribe / Unsubscribe – Visitors can manage subscriptions.
- All subscriber emails are stored in encrypted form for privacy.
- Automated Emails – Newsletter emails are triggered for key events:
  - When a user subscribes.
  - When a user unsubscribes.
  - When a new blog is posted.
- A weekly digest summarizing the latest blogs.

### 🛠 Tech Stack
- Node.js / Express – Core backend framework
- Redis – Session store for admin authentication
- PostgreSQL (or your DB) – Storage for blogs and subscribers
- Encryption – Secure storage of emails
- Resend (or mail service) – For sending newsletters

**✅ Future Improvements**
- [ ] Role-based access for multiple admins
- [ ] Rich-text blog editor support
- [ ] Analytics for newsletter open/click rates
