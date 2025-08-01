# Mental Health Tracker

## Overview
The Mental Health Tracker is a project designed to monitor and support users' emotional well-being by logging mood data, writing journals, setting goals, and providing automated responses. Built using Supabase for data storage and n8n for workflow automation, this project aims to offer a simple yet effective tool for mental health management.

## Features
- **Mood Logging**: Users can submit their mood (e.g., 1 for happy, 2 for sad), intensity (1-10), cause, and notes via a webhook.
- **Data Storage**: Data is stored in a Supabase `moods` table with columns: `id`, `user_id`, `mood`, `intensity`, `cause`, `notes`, `tags`, `created_at`, `updated_at`, and `ai_analysis`.
- **Automated Response**: A mock AI analysis generates supportive messages based on mood, intensity, and cause (e.g., "Great to hear you're happy!" for mood 1).
- **Webhook Integration**: The n8n workflow triggers on webhook calls, processes data, and updates the database.
- **Profile Setup**: Users can create and manage their profiles, including personal details and preferences.
- **Magic Link Login**: Implements secure, passwordless login using Supabase magic links for user authentication.
- **Set Goals**: Allows users to define and track personal mental health goals (e.g., meditate daily, journal weekly).
- **Journals**: Provides a space for users to write and store journal entries linked to their mood data.
- **Dashboard with Quick Stats**: Displays an overview of mood trends, goal progress, and habit streaks in a user-friendly interface.
- **Habit Streaks**: Tracks consistent habits (e.g., exercise, meditation) with streak counters.
- **Sleep Analysis**: Logs and analyzes sleep patterns to correlate with mood and well-being.

## Technologies Used
- **Supabase**: For database management, REST API integration, and authentication (magic links).
- **n8n**: For workflow automation, including webhook handling, data routing, and database updates.
- **GitHub**: For version control and project hosting.

## Installation and Setup
1. Clone the repository: `git clone https://github.com/AfshanN754/mental-health-tracker.git`
2. Set up Supabase with a `moods` table and obtain an API key.
3. Install n8n locally and import the `workflow.json` file.
4. Update the Supabase URL and API key in the n8n workflow (Update Mood Entry node).
5. Test with a POST request to the webhook URL (e.g., `http://localhost:5678/webhook-test/mood-tracker`).

## Usage
- Send a JSON payload to the webhook, e.g.:
  ```json
  {
    "id": "gen_random_uuid()",
    "user_id": "123",
    "mood": 1,
    "intensity": 5,
    "cause": "work",
    "date": "2025-08-01"
  }

## Limitations

- The AI logic is currently mocked due to API quota limits (e.g., OpenAI). Future integration with a real AI API is planned.
- The workflow relies on local n8n setup and Supabase connectivity.