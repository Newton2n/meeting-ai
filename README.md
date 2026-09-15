# Meeting Action Assistant

An AI-powered meeting management application that converts meeting transcripts into structured, actionable information.

The application allows users to create meetings, provide transcripts, analyze them with Gemini AI, extract action items, manage task status, and ask questions about the meeting through an AI-powered chat interface.

---

## 1. Project Overview

Meetings often contain important decisions, responsibilities, and deadlines, but this information can become difficult to track when it remains inside long transcripts or notes.

Meeting Action Assistant solves this problem by transforming unstructured meeting transcripts into organized information.

### Core workflow

```text
Meeting Transcript
        ↓
     Gemini AI
        ↓
Structured Meeting Data
        ↓
PostgreSQL Database
        ↓
Dashboard
        ↓
Task Management + AI Q&A
```

The system extracts:

* Meeting summary
* Key decisions
* Action items
* Assigned person
* Due dates
* Open questions

Users can then manage the extracted action items and ask questions about the meeting.

---

# 2. Objectives

The main objectives of the application are:

1. Convert meeting transcripts into structured information.
2. Automatically identify actionable tasks.
3. Identify responsible people and mentioned deadlines.
4. Store meeting information persistently.
5. Allow users to update task status and information.
6. Provide an AI assistant for meeting-specific questions.
7. Provide a simple dashboard for managing meetings.

---

# 3. Key Features

## 3.1 Meeting Creation

Users can create a meeting by providing:

* Meeting title
* Meeting transcript

The transcript is validated before being stored.

---

## 3.2 AI Meeting Analysis

After creating a meeting, users can analyze the transcript using Gemini AI.

The AI extracts:

### Summary

A concise overview of the meeting.

### Key Decisions

Important decisions made during the meeting.

### Action Items

Concrete tasks identified from the conversation.

Each action item contains:

* Task
* Assignee
* Due date
* Status

### Open Questions

Questions or unresolved topics that still require clarification or decisions.

---

## 3.3 Action Item Management

Users can manage extracted action items.

Supported operations:

* Edit task
* Change assignee
* Change due date
* Change status
* Delete action item

Supported statuses:

```text
TODO
IN_PROGRESS
COMPLETED
```

---

## 3.4 Meeting Dashboard

The dashboard provides an overview of available meetings.

Each meeting displays:

* Meeting title
* Creation date
* Number of action items
* Link to meeting details

Users can open a meeting to view its complete information.

---

## 3.5 Meeting AI Chat

Each meeting has an AI chat interface.

Users can ask questions such as:

```text
What does John need to complete?

What are Michael's responsibilities?

What decisions were made?

Are there any unresolved questions?
```

The AI receives the stored meeting information as context and answers using information from that meeting.

The assistant is instructed not to invent information that does not exist in the meeting.

---

# 4. Technology Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* React Hook Form
* Zod

## Backend

* Next.js App Router API Routes
* TypeScript
* Gemini API
* Zod validation

## Database

* PostgreSQL
* Prisma ORM

## AI

* Google Gemini API
* `@google/genai`

## Deployment

* Vercel

---

# 5. Architecture

The application uses a full-stack Next.js architecture.

```text
┌──────────────────────────────┐
│          Frontend            │
│                              │
│ Dashboard                    │
│ Create Meeting               │
│ Meeting Details              │
│ Action Items                 │
│ AI Chat                      │
└──────────────┬───────────────┘
               │
               │ HTTP
               ▼
┌──────────────────────────────┐
│       Next.js API Routes     │
│                              │
│ Meetings                     │
│ Action Items                 │
│ AI Analysis                  │
│ AI Chat                      │
└───────┬──────────────┬───────┘
        │              │
        │              │
        ▼              ▼
┌──────────────┐  ┌──────────────┐
│ PostgreSQL   │  │ Gemini API   │
│              │  │              │
│ Meetings     │  │ Analysis     │
│ Tasks        │  │ AI Chat      │
│ Messages     │  │              │
└──────────────┘  └──────────────┘
```

---

# 6. Project Structure

```text
src/
├── app/
│   ├── api/
│   │   ├── action-items/
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   │
│   │   └── meetings/
│   │       ├── route.ts
│   │       │
│   │       └── [id]/
│   │           ├── route.ts
│   │           ├── analyze/
│   │           │   └── route.ts
│   │           └── chat/
│   │               └── route.ts
│   │
│   ├── meetings/
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   └── meetings/
│       ├── meeting-card.tsx
│       ├── meeting-chat.tsx
│       ├── meeting-sections.tsx
│       └── action-item-table.tsx
│
└── lib/
    ├── gemini.ts
    ├── prisma.ts
    └── validations/
        ├── meeting.ts
        └── action-item.ts
```

---

# 7. Database Design

The application uses three main models:

```text
Meeting
   │
   ├── ActionItem
   │
   └── ChatMessage
```

---

## 7.1 Meeting

Stores the main meeting information.

```text
Meeting
-------------------------
id
title
transcript
summary
keyDecisions
openQuestions
createdAt
updatedAt
```

`keyDecisions` and `openQuestions` are stored as JSON because they represent variable-length lists of text.

---

## 7.2 ActionItem

Stores individual tasks extracted from the meeting.

```text
ActionItem
-------------------------
id
meetingId
task
assignee
dueDate
status
createdAt
updatedAt
```

Each action item belongs to one meeting.

The relationship is:

```text
Meeting 1 ──────── * ActionItem
```

Deleting a meeting also deletes its associated action items.

---

## 7.3 ChatMessage

Stores the meeting-specific AI conversation.

```text
ChatMessage
-------------------------
id
meetingId
role
content
createdAt
```

The `role` identifies whether the message came from:

```text
user
assistant
```

Relationship:

```text
Meeting 1 ──────── * ChatMessage
```

---

# 8. API Documentation

## 8.1 Create Meeting

### Endpoint

```http
POST /api/meetings
```

### Request

```json
{
  "title": "Payment System Launch Planning",
  "transcript": "John will finish the API documentation by Friday..."
}
```

### Response

```json
{
  "id": "cm...",
  "title": "Payment System Launch Planning",
  "transcript": "John will finish...",
  "summary": null,
  "keyDecisions": null,
  "openQuestions": null
}
```

---

# 8.2 Get Meetings

### Endpoint

```http
GET /api/meetings
```

Returns meetings ordered by creation date.

The response also includes the number of action items associated with each meeting.

---

# 8.3 Get Meeting

### Endpoint

```http
GET /api/meetings/:id
```

Returns:

* Meeting information
* Action items
* Chat messages

---

# 8.4 Update Meeting

### Endpoint

```http
PATCH /api/meetings/:id
```

Example:

```json
{
  "title": "Updated Meeting Title"
}
```

---

# 8.5 Delete Meeting

### Endpoint

```http
DELETE /api/meetings/:id
```

Deletes the meeting and its related action items and chat messages.

---

# 8.6 Analyze Meeting

### Endpoint

```http
POST /api/meetings/:id/analyze
```

This endpoint:

1. Loads the meeting transcript.
2. Sends the transcript to Gemini.
3. Requests structured meeting information.
4. Validates the AI response using Zod.
5. Removes previously generated action items.
6. Stores the new analysis.
7. Creates the extracted action items.
8. Returns the updated meeting.

### AI output structure

```json
{
  "summary": "The team discussed the payment launch.",
  "keyDecisions": [
    "Launch after testing is completed."
  ],
  "openQuestions": [
    "Which payment provider should be used?"
  ],
  "actionItems": [
    {
      "task": "Finish API documentation",
      "assignee": "John",
      "dueDate": "Friday"
    }
  ]
}
```

---

# 8.7 Update Action Item

### Endpoint

```http
PATCH /api/action-items/:id
```

Example:

```json
{
  "status": "IN_PROGRESS"
}
```

Other editable fields include:

```json
{
  "task": "Finish API documentation",
  "assignee": "John",
  "dueDate": "Friday",
  "status": "COMPLETED"
}
```

---

# 8.8 Delete Action Item

### Endpoint

```http
DELETE /api/action-items/:id
```

Deletes a specific action item.

---

# 8.9 Meeting AI Chat

### Endpoint

```http
POST /api/meetings/:id/chat
```

### Request

```json
{
  "message": "What does John need to complete?"
}
```

### Process

```text
User Question
      ↓
Load Meeting
      ↓
Load Transcript
      ↓
Load Summary
      ↓
Load Decisions
      ↓
Load Open Questions
      ↓
Load Action Items
      ↓
Send Context + Question to Gemini
      ↓
Generate Answer
      ↓
Store Conversation
      ↓
Return Answer
```

### Response

```json
{
  "answer": "John needs to finish the API documentation by Friday."
}
```

---

# 9. AI Design

The application uses two separate AI workflows.

## 9.1 Meeting Analysis

The first AI workflow converts unstructured text into structured information.

```text
Transcript
     ↓
Gemini
     ↓
Structured JSON
     ↓
Zod Validation
     ↓
PostgreSQL
```

The model is instructed to:

* Use only transcript information.
* Avoid inventing information.
* Return `null` when an assignee is not mentioned.
* Return `null` when a due date is not mentioned.
* Extract concrete action items.
* Return empty arrays when information is unavailable.

This reduces the risk of storing fabricated meeting information.

---

## 9.2 AI Meeting Chat

The second AI workflow answers questions about an individual meeting.

The system builds a context containing:

```text
Meeting title
Transcript
Summary
Key decisions
Open questions
Action items
Previous chat messages
```

This context is provided to Gemini along with the user's question.

The AI is instructed to answer only from the supplied meeting information.

For example:

```text
User:
What does John need to complete?

AI:
John needs to finish the API documentation by Friday.
```

If the user asks:

```text
What is John's salary?
```

The assistant should respond that the information is not available in the meeting.

---

# 10. Validation

The backend uses Zod to validate incoming requests and AI-generated data.

For example, meeting creation validates:

```text
title
transcript
```

Action item updates validate:

```text
task
assignee
dueDate
status
```

AI responses are also validated before being stored in the database.

This provides an additional layer of protection against malformed AI responses.

---

# 11. Error Handling

The API returns appropriate HTTP status codes.

```text
200  Successful request
201  Resource created
400  Invalid request
404  Resource not found
500  Server error
502  Invalid AI response
```

Server-side errors are logged for debugging while the client receives a controlled error message.

---

# 12. Environment Variables

Create a `.env` file in the project root.

```env
DATABASE_URL="your_postgresql_connection_string"

GEMINI_API_KEY="your_gemini_api_key"
```

The Gemini API key must remain server-side and should never be exposed in client-side code.

The `.env` file should also be excluded from Git:

```text
.env
.env.local
```

---

# 13. Local Development

## Install dependencies

```bash
npm install
```

Install the Gemini SDK if required:

```bash
npm install @google/genai
```

---

## Generate Prisma Client

```bash
npx prisma generate
```

---

## Apply database migrations

```bash
npx prisma migrate dev
```

---

## Start development server

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:3000
```

---

# 14. Testing the Application

A useful test transcript is:

```text
Sarah: Thanks everyone for joining. Today we need to finalize the payment system launch plan.

John: I've completed most of the backend integration. I still need to finish the API documentation.

Sarah: Can you have the documentation ready by Friday?

John: Yes, I'll finish it by Friday.

Sarah: Great. Michael, we also need the payment flow tested before the launch.

Michael: I'll test the payment flow and report any issues. I should be able to finish testing by next Wednesday.

Sarah: Good. We also agreed that we will launch the new payment system after the testing is completed.

John: What about international payments? We haven't decided which provider we'll use for those yet.

Sarah: That's still an open question. I'll compare the available providers and share a recommendation next week.

Michael: We should also make sure failed payments are handled correctly before launch.

Sarah: Good point. Michael, please include failed payment scenarios in your testing.

Michael: Sure, I'll include them.

Sarah: So the main action items are John's API documentation, Michael's payment testing, and my payment provider comparison. Once testing is complete, we'll make the final launch decision.
```

### Expected action items

| Task                                    | Assignee | Due Date       | Status |
| --------------------------------------- | -------- | -------------- | ------ |
| Finish API documentation                | John     | Friday         | Todo   |
| Test payment flow                       | Michael  | Next Wednesday | Todo   |
| Compare international payment providers | Sarah    | Next week      | Todo   |
| Test failed payment scenarios           | Michael  | Not specified  | Todo   |

---

# 15. Deployment

The application can be deployed to Vercel.

The production environment requires:

```text
DATABASE_URL
GEMINI_API_KEY
```

to be added to the Vercel project's environment variables.

After deployment:

```text
User
 ↓
Vercel
 ↓
Next.js API Route
 ↓
Gemini API
 ↓
PostgreSQL
```

The AI functionality therefore works remotely without requiring the developer's local machine to be running.

---

# 16. Security Considerations

The application follows several basic security practices:

* API keys are stored in environment variables.
* API keys are not exposed to the browser.
* Request payloads are validated using Zod.
* AI responses are validated before database storage.
* Database access is handled through Prisma.
* Meeting deletion uses relational cascade behavior.
* AI instructions explicitly prohibit inventing information.

For a production system, additional authentication, authorization, rate limiting, audit logging, and stronger data privacy controls would be recommended.

---

# 17. Design Decisions

## Why Next.js API Routes?

Using Next.js for both frontend and backend keeps the project simple and allows the application to be deployed as one service.

## Why PostgreSQL?

Meeting data has clear relationships between meetings, action items, and chat messages. PostgreSQL provides reliable relational storage for this structure.

## Why Prisma?

Prisma provides type-safe database access and makes relational queries easier to maintain.

## Why Gemini?

Gemini provides the AI capabilities required for transcript analysis and meeting-specific question answering through a remotely accessible API.

## Why Zod?

Zod validates both user input and AI-generated structured data before the application uses it.

---

# 18. Future Improvements

The current implementation focuses on the core assignment requirements.

Possible future improvements include:

### Authentication

Allow users to have private meeting workspaces.

### File Upload

Allow users to upload meeting transcript files.

### Calendar Integration

Connect action items and deadlines with calendar services.

### Email Notifications

Send reminders when action-item deadlines approach.

### Cross-Meeting Search

Allow users to ask questions across multiple meetings.

### Speaker Identification

Automatically identify and associate speakers with action items.

### Automatic Meeting Titles

Generate a meaningful title from the transcript.

### Follow-up Emails

Generate follow-up emails based on meeting decisions and action items.

### Real-Time Transcription

Support live meeting transcription instead of requiring an existing transcript.

---

# 19. Current Scope

The implemented MVP focuses on the core workflow:

```text
Create Meeting
      ↓
Add Transcript
      ↓
Analyze with Gemini
      ↓
Generate Summary
      ↓
Extract Decisions
      ↓
Extract Action Items
      ↓
Extract Open Questions
      ↓
Save to PostgreSQL
      ↓
Manage Tasks
      ↓
Ask Questions About Meeting
```

This keeps the implementation focused on the primary problem rather than adding unnecessary infrastructure.

---

# 20. Conclusion

Meeting Action Assistant turns meeting transcripts into structured, actionable information.

The application combines:

* Next.js
* TypeScript
* PostgreSQL
* Prisma
* Gemini AI
* Zod
* Tailwind CSS

to provide a complete workflow from transcript ingestion to task management and AI-powered meeting Q&A.

The architecture is intentionally simple enough for an MVP while leaving room for future features such as authentication, calendar integration, notifications, cross-meeting search, and real-time transcription.
