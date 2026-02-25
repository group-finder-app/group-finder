(Bottom of the README contains simple instructions to locally run frontend / backend) 
# Grouper 🤝 
**The Centralized Group Formation Application**

## 📝 Project Overview
**Grouper** is a web-based team-building platform designed to solve the decentralized and inefficient process of university group formation. Instead of relying on awkward in-person requests or random instructor assignments, students can use Grouper to find compatible teammates based on shared goals, technical skills, and schedules.

## ⚖️ Problem Statement
In university courses with mandatory projects, students without existing social networks are often at a disadvantage. Current methods (like shouting in lectures or manual instructor intervention) lead to mismatched schedules, incompatible skill sets, and poor project outcomes. Grouper provides a centralized digital platform to ensure every student has equal agency in building their team.

## 🎯 Target Users
* **Primary Users (Students):** Students seeking partners or looking to fill vacancies in their existing teams.
* **Secondary Users (Instructors):** Benefit from reduced administrative burden and fewer "orphaned" students at project deadlines.

---

## 🚀 Milestone 01: Planning & Design
This repository contains the foundational design and architectural planning for the Grouper application.

### Quick Links
* **Project Board (Kanban):** https://github.com/orgs/group-finder-app/projects/1
* **Documentation/Wiki:** https://github.com/group-finder-app/group-finder/wiki

---

## ✨ Features (Scope)

### 🔴 Must Have (Essential for Viability)
* **User Authentication:** Secure login/signup (Exploring SSO/Microsoft API for Laurier accounts).
* **Group Management (CRUD):** Create, edit, and delete group "Help Wanted" listings.
* **Course-Based Browsing:** Filterable main feed strictly by Course Code (e.g., CP476).
* **Join Request Workflow:** State-management for "Request to Join" -> "Leader Approval/Decline."
* **Roster Management:** A dashboard for group leaders to manage applicants and team capacity.
* **Basic User Profiles:** Read-only profiles showing Name, Program, and Year Level.

### 🟡 Should Have (Significant Value)
* **Skill Tagging System:** Searchable tags (e.g., "JavaScript," "SQL") for both users and group requirements.
* **Availability Indicators:** General schedule preferences to ensure time-compatibility.
* **Advanced Filtering:** Search by specific criteria (e.g., "Groups looking for Frontend").
* **In-App Notifications:** Visual alerts for request updates or new applicants.

### 🟢 Could Have (Future Enhancements)
* **Instructor Dashboard:** Specialized view for professors to see "Orphaned" students.
* **Endorsement System:** Peer-review "badges" for skills like "Good Communicator."
* **Contact Export:** Downloadable text file with team email/Discord IDs.

---

## 🚫 Out of Scope
* **Real-time Chat:** Users will exchange contact info (Discord/Email) once a group is formed.
* **Project Management:** No task boards or file sharing.
* **LMS Integration:** We will use mock data rather than direct MyLS/Brightspace API integration.

---

## Backend Setup

### Prerequisites
- Node.js (v14 or higher)
- npm
- MySQL (optional for now - stub endpoints work without DB)

### Installation & Running
1. Navigate to backend folder:
   ```bash
  cd backend
  npm install

2. Create a .env file in the backend/ root directory and add the following configuration (placeholder until connection to db):
  PORT=5000
  DB_HOST=localhost
  DB_USER=your_mysql_user
  DB_PASS=your_mysql_password
  DB_NAME=grouper
  JWT_SECRET=your_secret_key

3. To start the server in development mode:
   npm run dev

   The server will start at http://localhost:5000

