# QuickChat - Real-Time MERN Chat App

QuickChat is a full-stack real-time chat application built with React, Node.js, Express, MongoDB, Socket.IO, and Cloudinary. It supports private chats, group conversations, online presence, media messages, status updates, WebRTC audio/video calls, and an optional Pulse AI assistant powered by the OpenAI Responses API.

## Features

- JWT-based signup, login, auth check, and profile updates
- Real-time one-to-one messaging with Socket.IO
- Group creation and group messaging
- Online user presence and unread message counts
- Image upload support for messages, profiles, and statuses through Cloudinary
- Status updates with text or images
- Message and status deletion
- WebRTC audio and video calls with socket signaling
- Pulse AI assistant chat with stored per-user AI history
- Responsive React UI built with Vite and Tailwind CSS

## Tech Stack

**Frontend**

- React 19
- Vite
- Tailwind CSS
- Axios
- React Router
- React Hot Toast
- Socket.IO Client

**Backend**

- Node.js
- Express 5
- MongoDB and Mongoose
- Socket.IO
- JWT authentication
- Cloudinary
- OpenAI Responses API

## Project Structure

```text
chat-app/
|-- client/                 # React + Vite frontend
|   |-- public/
|   |-- src/
|   |-- package.json
|   `-- vite.config.js
|-- server/                 # Express + Socket.IO backend
|   |-- controllers/
|   |-- lib/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- package.json
|   `-- server.js
|-- .gitignore
`-- Readme.md
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- MongoDB database
- Cloudinary account for media uploads
- OpenAI API key if you want live Pulse AI replies

### Clone the Repository

```bash
git clone https://github.com/Sandeep9026/chat-app.git
cd chat-app
```

### Install Dependencies

```bash
cd server
npm install

cd ../client
npm install
```

## Environment Variables

Create a `.env` file inside `server/`.

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5-nano

# Optional TURN relay for calls across different Wi-Fi/mobile networks
TURN_URLS=
TURN_USERNAME=
TURN_CREDENTIAL=
```

Create a `.env` file inside `client/`.

```env
VITE_BACKEND_URL=http://localhost:5000
```

`OPENAI_API_KEY` is optional. If it is missing, the AI chat screen still works, but Pulse AI will return a setup message instead of live AI responses.

## Run Locally

Start the backend:

```bash
cd server
npm run server
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

Open the app at:

```text
http://localhost:5173
```

## Available Scripts

### Server

```bash
npm run server   # Start the backend with nodemon
npm start        # Start the backend with node
```

### Client

```bash
npm run dev      # Start Vite dev server
npm run build    # Build production frontend
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## API Overview

- `GET /api/status` - health check
- `POST /api/auth/signup` - create a user account
- `POST /api/auth/login` - log in and receive a JWT
- `GET /api/auth/check` - validate the current user
- `PUT /api/auth/update-profile` - update profile details
- `GET /api/messages/users` - fetch users, groups, and unread counts
- `GET /api/messages/:id` - fetch direct messages
- `POST /api/messages/send/:id` - send a direct message
- `GET /api/messages/group/:id` - fetch group messages
- `POST /api/messages/group/send/:id` - send a group message
- `POST /api/messages/groups` - create a group
- `GET /api/statuses` - fetch active statuses
- `POST /api/statuses` - create a status
- `GET /api/ai/messages` - fetch Pulse AI conversation history
- `POST /api/ai/chat` - send a message to Pulse AI

Protected routes expect the JWT token in the `token` request header.

## Deployment Notes

The repository includes Vercel configuration files for both `client` and `server`.

For frontend deployment, set:

```env
VITE_BACKEND_URL=https://your-backend-url
```

For backend deployment, set all server environment variables and update:

```env
CLIENT_URL=https://your-frontend-url
```

Set production MongoDB credentials and TURN settings in the hosting provider's
environment settings. Local `.env` files are intentionally excluded from Git;
copy the required variable names from `server/.env.example`. For `TURN_URLS`,
use comma-separated `turn:` and `turns:` addresses supplied by your relay provider.
Use a backend host that supports persistent Socket.IO connections for chat and
call signaling. The frontend can be deployed separately with `VITE_BACKEND_URL`
pointing to that backend.

For local or deployed calling features, microphone and camera access require HTTPS, except on `localhost`.

## Author

Sandeep Yadav

## License

This project is licensed under the ISC license.
