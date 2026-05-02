Hero Section: "AI Cricket Coach for Everyone"
Problem: Young players can't afford academies, coaches manually analyze hundreds of videos
Solution: AI-powered video analysis + coach dashboard
CTA Buttons: "Sign Up as Player" | "Sign Up as Coach"
2️⃣ LOGIN/SIGNUP (Role-Based)
PLAYER Registration

Email, Password
Full Name
Age / Experience Level
Preferred Cricket Role (Batter, Bowler, All-rounder)
COACH Registration

Email, Password
Full Name
Academy/Organization Name
Certification/Experience
3️⃣ PLAYER DASHBOARD
Personal space for individual players

👤 Profile Section

Display: Player name, role, experience level, total videos analyzed

📹 Upload Video Section

Choose video file → Select shot type (Cover drive, Pull shot, Bowling action, Footwork, etc.) → Upload → Get instant AI analysis

📊 Video History & Analytics

List all uploaded videos with: Date, Shot type, AI Analysis, Progress over time, Compare improvements

📈 Analytics by Category

Group videos by shot type → Show improvement metrics → Weakness tracker → Strength tracker

💾 Only Own Data Visible

Privacy: Player sees ONLY their own videos, their own analytics, their own history

4️⃣ COACH DASHBOARD
Manage academy + analyze multiple students

🏫 Manage Academy

Add students with names → Assign to squads/batches → Manage player list

📹 Upload Videos for Students

Select student → Upload their video → Mark shot type → Get AI analysis instantly

📊 Batch Analytics

View all students' videos → Filter by player → Filter by shot type → Compare across students

💡 Get Analysis & Tips

See AI-generated feedback, tips, weaknesses for each student → Share with players → Track improvement over time

🔐 Academy Data Isolation

Coach sees ONLY their academy's data, ONLY their students' videos, NO access to other coaches' data

🔒 DATA ISOLATION & SECURITY
PLAYER Data

Each player has their own user_id → Only sees their videos → Only their analytics → Cannot see other players' data

COACH Data

Each coach has their own coach_id → Manages one academy → Only sees their academy's students → Cannot see other coaches' academies

VIDEO Data

Each video tied to player_id/coach_id → Private storage → Analysis report belongs to owner only

🗄️ DATABASE STRUCTURE
Users Table:
id, email, password_hash, name, role (player/coach), created_at

Players Table:
id, user_id, age, experience_level, preferred_role, created_at

Coaches Table:
id, user_id, academy_name, certification, created_at

Academy_Players Table:
id, coach_id, player_id, joined_date (coach-player relationship)

Videos Table:
id, player_id, uploaded_by (player_id or coach_id), video_url, shot_type, analysis_text, created_at

Analytics Table:
id, video_id, improvement_areas, strengths, tips, created_at
Copy failed — try from claude.ai in browser