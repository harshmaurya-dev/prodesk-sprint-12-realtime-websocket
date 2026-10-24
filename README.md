# Prodesk Sprint 12 — Real-Time Workspace

A full-stack real-time team chat built for the Prodesk IT Week 12 / Sprint 12 deliverable.

## Tech stack
- React + Vite
- Node.js + Express
- Socket.IO for bidirectional real-time events
- Responsive CSS UI

## Sprint requirements implemented
- Persistent Socket.IO client/server connection
- Real-time chat messages with sender identity and timestamps
- Unique browser session ID
- Live typing indicator
- Two rooms: \`general\` and \`tech\`
- Server-side room membership validation and isolated room broadcasts
- Join/leave system messages
- Connection state and basic error feedback
- Health-check endpoint at \`/health\`

## Project structure
\`\`\`text
client/
  src/
    main.jsx
    style.css
  index.html
  package.json
server/
  server.js
  package.json
package.json
vercel.json
render.yaml
\`\`\`

## Run locally

Use Node.js 20 or newer.

Terminal 1 — backend:
\`\`\`bash
cd server
npm install
npm run dev
\`\`\`

Terminal 2 — frontend:
\`\`\`bash
cd client
npm install
npm run dev
\`\`\`

Open the Vite URL shown in the terminal (usually \`http://localhost:5173\`). Open a second browser tab with another display name to test messaging, typing events and room isolation.

## Deploy

### 1. Deploy the backend to Render
This repository includes \`render.yaml\`. Create a new Render Blueprint from this repository and deploy the web service. The server listens on Render's \`PORT\` and exposes \`/\` and \`/health\`.

After deployment, copy the backend service URL (for example, \`https://your-service.onrender.com\`).

In the Render service environment, set:
- \`CLIENT_URL\` = your deployed frontend origin (for example, \`https://your-project.vercel.app\`)

### 2. Deploy the frontend to Vercel
Import this repository into Vercel. The included \`vercel.json\` builds the Vite app from \`client/\`.

Set the Vercel environment variable:
- \`VITE_SERVER_URL\` = your Render backend URL, without a trailing slash

Deploy the frontend, then copy its production URL into Render's \`CLIENT_URL\` environment variable. Redeploy/restart the backend after changing environment variables.

> The frontend and backend must both be deployed and their URLs configured for real-time chat to work in production. A GitHub push alone does not create a live backend.

## Test checklist
- [ ] Open the app in two tabs with different display names.
- [ ] Send a message and confirm it appears in both tabs.
- [ ] Confirm typing status appears for the other user.
- [ ] Switch rooms and confirm messages do not cross between rooms.
- [ ] Confirm the backend \`/health\` endpoint returns \`{"status":"healthy"}\`.

## Author
Harsh Maurya
