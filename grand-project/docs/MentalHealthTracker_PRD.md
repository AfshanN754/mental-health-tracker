Mental Health Tracker - Product Requirements Document (PRD)

1. Overview
The Mental Health Tracker is an AI-powered web application designed to empower users to monitor and enhance their mental well-being through mood tracking, journaling, goal setting, and guided activities. It uses magic link authentication via Supabase, stores data in MongoDB, leverages n8n for AI-driven insights, and is deployed on Vercel with CI/CD.

1.1 Purpose
To provide a comprehensive, user-friendly platform for tracking mental health metrics, setting wellness goals, and accessing personalized AI insights and resources, all while prioritizing privacy and accessibility.

1.2 Target Audience
Individuals seeking to improve mental health through self-tracking and guided activities.
Mental health enthusiasts interested in data-driven insights.
Professionals or caregivers needing tools to support clients.

2. Features

2.1 Landing / Home Page
Personalized Welcome: Dynamic greeting (e.g., “Hey [Name] 👋”).
Quick Mood Check-In: Emoji selector or mood slider.
Daily Quote/Affirmation: Randomized motivational quote or affirmation.
Daily Preview: List of tasks or goals for the day.
CTAs: Buttons for “Start Journaling,” “Track Mood,” “Set Goals.”
App Intro: Section highlighting benefits (e.g., mood tracking, AI insights).
Testimonials Slider: Rotating user testimonials.
Sign-Up/Login: Magic link email input for authentication.

2.2 Dashboard Page
Personalized Greeting: Time-based greeting (e.g., “Good Morning, [Name]!”).
Habit Streaks: Visual indicators for daily habits (e.g., meditation, hydration).
Weekly Mood Summary: Line or bar chart of mood trends.
Quick Stats:
Mood balance (positive vs. negative).
Goal completion rate (% completed).
Sleep/focus trends (based on user input).


Recent Activity: List of recent mood logs, journal entries, and goals.
Quick Links: Buttons for Mood Tracker, Journal, and Goals.
Daily Tip: AI-generated suggestion (e.g., “Try a 5-minute meditation”).

2.3 Mood Tracker Page
Mood Selection: Emoji, slider, or color bubble input.
Mood Tags: Select tags (e.g., anxious, productive).
Notes: Optional text input for mood context.
Mood Intensity: Slider (1–10).
Mood Cause: Dropdown (e.g., work, friends, health).
Media Upload: Optional photo or voice note upload (stored in Supabase Storage).
Charts: Weekly/monthly mood trend visualizations.
Insights: AI-driven pattern analysis (via n8n).

2.4 Journal Page
Daily Prompt: AI-generated writing prompt.
Rich Text Editor: Free journaling with formatting options.
Additional Inputs:
Emoji selector.
Tags (e.g., stress, gratitude).
Voice note or short video upload.
Drawing pad for doodles.


Lockable Entries: PIN-protected entries.
Mood Selector: Assign mood to each entry.
Entry History: Filterable list by tags or date.

2.5 Goal Setting Page
Goal Creation: Add customizable mental wellness goals.
Frequency: Set as daily, weekly, or custom.
Motivational Quote: Optional quote for each goal.
Progress Tracking: Completion bars or donut charts.
Streaks & Badges: Track streaks and award badges for milestones.
Favorites/Archive: Mark favorite goals or archive completed ones.

2.6 Calendar Page
Mood Calendar: Emoji-based calendar showing daily moods.
Day Details: Tap to view mood, journal entry, and goals for a specific day.
Color-Coding: Days color-coded by mood.
Summary Graph: Toggle weekly/monthly trends.
Export: Download data as PDF or CSV.

2.7 Affirmation & Reflection Page
Daily Affirmation: Animated card with a new affirmation daily.
Saved Affirmations: Browse and manage saved affirmations.
Audio Playback: Optional text-to-speech for affirmations.
Reflection Prompts: Theme-based prompts (e.g., gratitude, self-worth).
Gratitude Tracker: List of gratitude entries.
Daily Checklist: Mental clarity tasks (e.g., reflect, breathe).

2.8 Guided Activities Page
Audio Library: Sleep stories and meditation audio.
Breathing Exercises: Animated 4-7-8 or box breathing visuals.
Focus Timer: Pomodoro or relaxation timer.
Grounding Tool: 5-4-3-2-1 sensory exercise.
Self-Care Suggestions: Tasks like reading, stretching, or hydrating.

2.9 Notifications & Reminders Page
Custom Reminders: Set reminders for journaling, mood checks, etc.
Sound Selection: Choose reminder sounds.
Reminder Management: Preview and edit all reminders.
Do Not Disturb: Toggle to mute notifications.
Emergency Contact: Shortcut to call/message a contact.
Test Notification: Preview notification behavior.

2.10 Profile / Settings Page
User Info: Edit name, avatar, email.
Layout Customization: Cards vs. list view.
Theme Toggle: Light, dark, pastel, or nature themes.
Language: Select preferred language.
Analytics: Enable/disable data tracking.
Data Management: Export or delete account data.
Security: PIN or 2FA for login.

2.11 Insights / Analytics Page
Visualizations: Mood trends, goal completion charts.
Comparisons: Week-over-week analytics.
Sentiment Analysis: AI-driven insights from journal entries (via n8n).
Keyword Cloud: Visualize frequent tags.
Smart Suggestions: Personalized tips (e.g., “Try gratitude journaling”).

2.12 Help & Support Page
SOS Button: Quick access to emergency contacts.
Crisis Helplines: Region-specific helpline list.
User Guide: Interactive tutorial for app features.
Feedback: Form to submit user feedback.
Resources: Links to mental health articles and tools.
Bug Reporting: Form to report issues.

2.13 Authentication
Magic Link Login: Passwordless sign-in via email (Supabase Auth).
Sign-Up: Auto-create account on first magic link use.
Session Management: Secure sessions with Supabase.

2.14 AI Integration
n8n Workflows:
Sentiment analysis of journal entries.
Mood trend analysis and insights.
Personalized suggestions (e.g., activities, affirmations).
Notification triggers for reminders.
Webhook Triggers: Send mood/journal data to n8n for processing.

2.15 Data Storage
Supabase:
Authentication: Magic link and session management.
Postgres: User profiles, metadata, and settings.
Storage: Photos, voice notes, and videos.


MongoDB:
Collections: moods (user_id, mood, intensity, tags, cause, timestamp, media), journals (user_id, entry, mood, tags, timestamp, media), goals (user_id, goal, frequency, progress, quote).


Integration: Supabase Edge Functions for MongoDB operations.

3. Technical Requirements

3.1 Tech Stack
Frontend: Next.js (App Router), React, Tailwind CSS.
Backend:
Node.js: Next.js API routes and Supabase Edge Functions.
Supabase: Authentication, Postgres, and Storage.
MongoDB: Document storage for moods, journals, and goals.
n8n: AI workflow automation (self-hosted or cloud).


APIs:
Supabase Auth/Storage APIs.
MongoDB Atlas API.
n8n webhooks for AI (e.g., OpenAI or Perplexity).


Deployment: Vercel with CI/CD via GitHub.

3.2 Security
Authentication: Supabase magic links with rate limiting (60s) and 1-hour link expiration.
Data Privacy: Row-Level Security (RLS) on Supabase Postgres; encrypted MongoDB connections.
PIN Protection: Client-side encryption for lockable journal entries.
Secrets: Store API keys in Vercel environment variables.

3.3 Performance
Scalability: Supabase/MongoDB Atlas for data scaling; Vercel for serverless.
Latency: n8n workflows optimized for <3s AI processing.
Real-Time: Supabase subscriptions for live dashboard updates.

4. Non-Functional Requirements

Usability: Intuitive UI with minimal clicks for key actions.
Accessibility: WCAG 2.1 compliance (color contrast, screen reader support).
Reliability: 99.9% uptime via Vercel/Supabase.
Maintainability: Modular code with TypeScript and ESLint.

5. Wireframes
Wireframes are provided in /grand-project/docs/MentalHealthTracker_Wireframes.md.

6. Milestones
PRD + wireframesBackend & DB 
setupFrontend UI
AI logic + testing
Public demo live


7. Success Metrics

Engagement: 80% of users engage (mood/journal/goals) 3+ times/week.
AI Accuracy: Sentiment analysis >85% accuracy based on feedback.
Retention: 70% monthly active users after 30 days.
Deployment: Zero-downtime Vercel deployments.

8. Risks and Mitigations

Risk: High AI model costs.
Mitigation: Use cost-effective models or self-hosted LLMs via n8n.


Risk: Data privacy concerns.
Mitigation: GDPR compliance, RLS, and encrypted storage.


Risk: Media upload storage limits.
Mitigation: Set upload size limits (e.g., 5MB) in Supabase Storage.


