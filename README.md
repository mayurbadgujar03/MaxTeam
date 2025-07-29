# 🧑‍💼 MaxTeam — Project & Team Management API

MaxTeam is a scalable backend API built with **Node.js + Express + MongoDB** that helps teams manage projects, tasks, notes, subtasks, and members. It supports authentication, role-based actions, and team collaboration logic — making it ideal for modern SaaS or internal productivity tools.

---

## ⚙️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose ORM
- **Authentication:** JWT (Access + Refresh Tokens)
- **Security:** HTTP-only Cookies, dotenv, Helmet
- **Structure:** Modular MVC pattern
- **Testing:** Postman (manual) & future Jest support

---

## ✨ Features

- ✅ User authentication with JWT (access + refresh)
- ✅ Project creation with member assignment
- ✅ Add/update tasks & subtasks
- ✅ Notes and nested note system
- ✅ Role-based logic (creator, member)
- ✅ Centralized error & response handling
- ✅ Environment variable management via `.env`
- ✅ Modular controller-service-model structure

---

## 🔐 Environment Setup

Create a `.env` file in the root:

```env
PORT=8000
MONGO_URI=your_mongodb_uri
ACCESS_TOKEN_SECRET=your_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_secret
REFRESH_TOKEN_EXPIRY=1d
```
---
## 🏁 Getting Started
# Clone the repo
```
git clone https://github.com/mayurbadgujar03/MaxTeam.git
```

# Install dependencies
```
cd MaxTeam
npm install
```

# Run the server
```
npm run dev
```

---
## 🧠 Developer Notes
This backend is still in progress.

# 👨‍💻 Author

**Mayur Badgujar**  
🐦 [@mayurbadgujar36](https://x.com/mayurbadgujar36)
📎 [linkedin.com/mayur-badgujar](https://www.linkedin.com/in/mayur-badgujar-060a7927b/)  
