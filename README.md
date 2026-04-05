# Grouper 🤝
### The Centralized Group Formation Application

---

## 📝 Project Overview

Grouper is a web-based team-building platform designed to solve the decentralized and inefficient process of university group formation. Instead of relying on awkward in-person requests or random instructor assignments, students can use Grouper to find compatible teammates based on shared goals, technical skills, and schedules.

---

## ⚖️ Problem Statement

In university courses with mandatory projects, students without existing social networks are often at a disadvantage. Current methods (like shouting in lectures or manual instructor intervention) lead to mismatched schedules, incompatible skill sets, and poor project outcomes. Grouper provides a centralized digital platform to ensure every student has equal agency in building their team.

---

## 🎯 Target Users

- **Primary Users (Students):** Students seeking partners or looking to fill vacancies in their existing teams.
- **Secondary Users (Instructors):** Benefit from reduced administrative burden and fewer "orphaned" students at project deadlines.

---

## 🖥️ Local Setup — Running from a Clean Machine

Follow these steps in order. This guide assumes you are starting from a fresh environment.

### Prerequisites

Install the following before proceeding:

| Tool | Version | Download |
|---|---|---|
| Node.js | v14 or higher | https://nodejs.org |
| npm | Comes with Node.js | — |
| MySQL | v8.0 recommended | https://dev.mysql.com/downloads/installer/ |
| Git | Any recent version | https://git-scm.com |

> **Verify your installs** by running these in a terminal:
> ```bash
> node -v
> npm -v
> mysql --version
> git --version
> ```

---

### Step 1 — Clone the Repository
```bash
git clone https://github.com/group-finder-app/group-finder.git
cd group-finder
git checkout staging
```

---

### Step 2 — Set Up MySQL

**Start MySQL** on your machine. On Windows, open `services.msc` and start the `MySQL80` service, or run:
```bash
net start mysql80
```

**Open the MySQL shell:**
```bash
mysql -u root -p
```
Enter your root password when prompted.

**Create the database and all tables** by pasting the following block and pressing Enter:
```sql
CREATE DATABASE grouper;
USE grouper;

CREATE TABLE users (
    userID INT NOT NULL AUTO_INCREMENT,
    email VARCHAR(100) NOT NULL,
    hashPass VARCHAR(100) NOT NULL,
    CONSTRAINT users_pk PRIMARY KEY(userID),
    CONSTRAINT users_email UNIQUE(email)
);

CREATE TABLE skills (
    skillID INT NOT NULL AUTO_INCREMENT,
    skillName VARCHAR(100) NOT NULL,
    CONSTRAINT skills_pk PRIMARY KEY(skillID),
    CONSTRAINT skills_unique UNIQUE(skillName)
);

CREATE TABLE schools (
    schoolID INT NOT NULL AUTO_INCREMENT,
    schoolName VARCHAR(100) NOT NULL,
    CONSTRAINT schools_PK PRIMARY KEY(schoolID)
);

CREATE TABLE majors (
    majorID INT NOT NULL AUTO_INCREMENT,
    majorName VARCHAR(100) NOT NULL,
    CONSTRAINT majors_PK PRIMARY KEY(majorID)
);

CREATE TABLE schoolsMajors (
    schoolID INT NOT NULL,
    majorID INT NOT NULL,
    CONSTRAINT schoolsMajors_PK PRIMARY KEY(schoolID, majorID),
    CONSTRAINT schoolsMajors_schools_FK FOREIGN KEY(schoolID) REFERENCES schools(schoolID),
    CONSTRAINT schoolsMajors_majors_FK FOREIGN KEY(majorID) REFERENCES majors(majorID)
);

CREATE TABLE courses (
    courseInstanceID INT NOT NULL AUTO_INCREMENT,
    courseCode VARCHAR(10) NOT NULL,
    courseName VARCHAR(100) NOT NULL,
    section VARCHAR(2) NOT NULL,
    term VARCHAR(20) NOT NULL,
    schoolID INT NOT NULL,
    CONSTRAINT courses_PK PRIMARY KEY(courseInstanceID),
    CONSTRAINT courses_schools_FK FOREIGN KEY(schoolID) REFERENCES schools(schoolID),
    CONSTRAINT courses_unique UNIQUE(courseCode, section, term, schoolID)
);

CREATE TABLE userProfiles (
    userID INT NOT NULL,
    fname VARCHAR(100) NOT NULL,
    lname VARCHAR(100) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    userYear INT NOT NULL,
    aboutUser VARCHAR(1000),
    schoolID INT NOT NULL,
    majorID INT NOT NULL,
    CONSTRAINT userProfiles_PK PRIMARY KEY(userID),
    CONSTRAINT userProfiles_users_FK FOREIGN KEY(userID) REFERENCES users(userID),
    CONSTRAINT userProfiles_schools_FK FOREIGN KEY(schoolID) REFERENCES schools(schoolID),
    CONSTRAINT userProfiles_majors_FK FOREIGN KEY(majorID) REFERENCES majors(majorID),
    CONSTRAINT userProfiles_score CHECK(score >= 0)
);

CREATE TABLE usersSkills (
    skillID INT NOT NULL,
    userID INT NOT NULL,
    CONSTRAINT usersSkills_PK PRIMARY KEY(skillID, userID),
    CONSTRAINT usersSkills_skills_FK FOREIGN KEY(skillID) REFERENCES skills(skillID),
    CONSTRAINT usersSkills_users_FK FOREIGN KEY(userID) REFERENCES users(userID)
);

CREATE TABLE groupsTbl (
    groupID INT NOT NULL AUTO_INCREMENT,
    userCount INT NOT NULL DEFAULT 0,
    userMax INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    aboutGroup VARCHAR(1000),
    dueDate DATE NOT NULL,
    leaderID INT NOT NULL,
    courseInstanceID INT NOT NULL,
    CONSTRAINT groups_PK PRIMARY KEY(groupID),
    CONSTRAINT groups_users_FK FOREIGN KEY(leaderID) REFERENCES users(userID),
    CONSTRAINT groups_courses_FK FOREIGN KEY(courseInstanceID) REFERENCES courses(courseInstanceID),
    CONSTRAINT groups_userCount CHECK(userCount BETWEEN 0 AND userMax),
    CONSTRAINT groups_dueDate CHECK(dueDate BETWEEN '2025-01-01' AND '2030-12-31')
);

CREATE TABLE usersGroups (
    userID INT NOT NULL,
    groupID INT NOT NULL,
    CONSTRAINT usersGroups_PK PRIMARY KEY(userID, groupID),
    CONSTRAINT usersGroups_users_FK FOREIGN KEY(userID) REFERENCES users(userID),
    CONSTRAINT usersGroups_groups_FK FOREIGN KEY(groupID) REFERENCES groupsTbl(groupID)
);

CREATE TABLE usersCourses (
    userID INT NOT NULL,
    courseInstanceID INT NOT NULL,
    CONSTRAINT usersCourses_PK PRIMARY KEY(userID, courseInstanceID),
    CONSTRAINT usersCourses_users_FK FOREIGN KEY(userID) REFERENCES users(userID),
    CONSTRAINT usersCourses_courses_FK FOREIGN KEY(courseInstanceID) REFERENCES courses(courseInstanceID)
);

CREATE TABLE requests (
    reqID INT NOT NULL AUTO_INCREMENT,
    reqStatus ENUM('pending', 'accepted', 'rejected') NOT NULL,
    message VARCHAR(1000),
    reqUserID INT NOT NULL,
    groupID INT NOT NULL,
    CONSTRAINT requests_PK PRIMARY KEY(reqID),
    CONSTRAINT requests_users_FK FOREIGN KEY(reqUserID) REFERENCES users(userID),
    CONSTRAINT requests_groups_FK FOREIGN KEY(groupID) REFERENCES groupsTbl(groupID),
    CONSTRAINT requests_unique UNIQUE(reqUserID, groupID)
);
```

**Seed the required reference data** (schools, majors, and courses must exist before users can register or create groups):
```sql
INSERT INTO schools (schoolName) VALUES ('Wilfrid Laurier University');

INSERT INTO majors (majorName) VALUES ('Computer Science');
INSERT INTO majors (majorName) VALUES ('Business Administration');
INSERT INTO majors (majorName) VALUES ('Data Science');

INSERT INTO schoolsMajors (schoolID, majorID) VALUES (1, 1);
INSERT INTO schoolsMajors (schoolID, majorID) VALUES (1, 2);
INSERT INTO schoolsMajors (schoolID, majorID) VALUES (1, 3);

INSERT INTO courses (courseCode, courseName, section, term, schoolID)
VALUES ('CP476', 'Internet Computing', 'A', 'Winter 2026', 1);

INSERT INTO courses (courseCode, courseName, section, term, schoolID)
VALUES ('CP317', 'Software Engineering', 'A', 'Winter 2026', 1);

INSERT INTO courses (courseCode, courseName, section, term, schoolID)
VALUES ('CP363', 'Database Management', 'A', 'Winter 2026', 1);

INSERT INTO courses (courseCode, courseName, section, term, schoolID)
VALUES ('CP104', 'Introduction to Programming', 'A', 'Winter 2026', 1);
```

Verify everything is set up:
```sql
SHOW TABLES;
```
You should see 12 tables listed. Type `exit` to leave the MySQL shell.

---

### Step 3 — Configure the Backend Environment

Navigate to the backend folder:
```bash
cd backend
```

Create a `.env` file in the `backend/` directory:
```bash
# On Windows (Command Prompt)
copy .env.example .env

# On Mac/Linux
cp .env.example .env
```

Open `.env` and fill in your values:
```
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_root_password
DB_NAME=grouper
JWT_SECRET=grouper_secret_key_cp476_2026
PORT=5000
```
---

### Step 4 — Install Backend Dependencies and Start the Server
```bash
npm install
npm run dev
```

You should see: 

Server running on port 5000

> To stop the server: `Ctrl + C`
> To restart without stopping: type `rs` and press Enter

**Verify the server is running** by opening a browser and visiting: http://localhost:5000/

You should see: `Grouper API is running...`

---

### Step 5 — Run the Frontend

The frontend is a static HTML/CSS/JS application — no build step required.

Navigate to the `frontend/` folder in your file explorer and **double-click `index.html`** to open it in your browser.

> **Recommended:** Use the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension in VS Code for automatic reloading on file changes. Right-click `index.html` → *Open with Live Server*.

The frontend connects to the backend at `http://localhost:5000/api`. Make sure the backend server (Step 4) is running before using the app.

---

### Step 6 — Create Your First Account

Once both the backend and frontend are running:

1. Open `frontend/index.html` in your browser
2. Click **Create Account**
3. Fill in your details — select **Computer Science** as your program (majorID 1) and **Year 4**
4. Click **Create Account** — you'll see a success confirmation
5. Click **Go to Login** and log in with your new credentials

---

## 🗂️ Project Structure
```
group-finder/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                # MySQL connection pool
│   │   ├── controllers/
│   │   │   ├── authController.js    # Register + login logic
│   │   │   ├── groupController.js   # Group CRUD
│   │   │   ├── requestController.js # Join request workflow
│   │   │   ├── userController.js    # Profile + vouch
│   │   │   └── courseController.js  # Course listing + validation
│   │   ├── middleware/
│   │   │   └── authMiddleware.js    # JWT verification
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── groupRoutes.js
│   │   │   ├── requestRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   └── courseRoutes.js
│   │   └── server.js                # Express entry point
│   ├── .env.example                 # Environment variable template
│   └── package.json
│
└── frontend/
├── css/
│   └── styles.css
├── js/
│   └── app.js                  # All frontend logic + API calls
└── index.html                  # Single-page application entry point
```

---

## 🔌 API Endpoints

All protected routes require the header: `Authorization: Bearer <token>`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create a new account |
| POST | `/api/auth/login` | No | Log in, receive JWT |
| GET | `/api/users/me` | Yes | Get own profile |
| GET | `/api/users/me/groups` | Yes | Get managing/member/applied groups |
| POST | `/api/users/:id/vouch` | Yes | Vouch for a user |
| GET | `/api/groups` | Yes | Get all groups (optional `?courseCode=`) |
| GET | `/api/groups/:id` | Yes | Get single group with members |
| POST | `/api/groups` | Yes | Create a group listing |
| PATCH | `/api/groups/:id` | Yes | Edit a group (leader only) |
| DELETE | `/api/groups/:id` | Yes | Delete a group (leader only) |
| POST | `/api/requests` | Yes | Submit a join request |
| GET | `/api/requests/group/:groupID` | Yes | View requests for a group (leader only) |
| PATCH | `/api/requests/:reqID` | Yes | Approve or decline a request |
| GET | `/api/courses` | Yes | List all courses |
| GET | `/api/courses/:courseCode` | Yes | Validate a course code |

---

## ✨ Features

### 🔴 Must Have — Implemented
- **User Authentication:** Register and login with bcrypt password hashing and JWT session management
- **Group Management (CRUD):** Create, view, update, and delete group listings
- **Course-Based Browsing:** Filterable feed by course code
- **Join Request Workflow:** Request → Approve/Decline with real-time roster updates
- **Roster Management:** Leader dashboard showing pending requests and current members
- **User Profiles:** Profiles showing name, program, year, and reliability score

### 🟡 Should Have — Partially Implemented
- **Skill Tagging:** Tag chips on Create Listing form (UI complete; DB persistence in progress)
- **Advanced Filtering:** Course code filter on the home feed
- **In-App Notifications:** Notification panel in the UI (static; real-time not yet implemented)

### 🟢 Could Have — Planned
- Instructor Dashboard
- Endorsement/Badge System
- Contact Export

### 🚫 Out of Scope
- Real-time Chat
- Project Management Tools
- LMS Integration (MyLS/Brightspace)

---

## 👥 Team Members & Contributions

| Student Name | Student Number | Email | Milestone 3 Contributions |
|---|---|---|---|
| Drake Martin | 150473490 | mart3490@mylaurier.ca | Backend setup, API integration, DB schema implementation, README |
| Josh Gelbaum | 169039064 | gelb9064@mylaurier.ca | Frontend development, HTML/CSS, JS logic |
| Kyler Smart | 169040921 | smar0921@mylaurier.ca | Database design, SQL schema, testing |
| Paul Matsialko | 169028235 | mats8235@mylaurier.ca | Frontend development, JS, presentation |

---

## 🔗 Quick Links

- **Project Board (Kanban):** https://github.com/orgs/group-finder-app/projects/1
- **Documentation / Wiki:** https://github.com/group-finder-app/group-finder/wiki
