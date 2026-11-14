<!--
  PunitBot's record for the Chatify project. Same format as ../../profile.md:
  "## Title {#anchor}", third person, facts only. Edit this file when the
  project changes, then run: node chatbot/build.js  (and redeploy the Worker).
  Code: github.com/punitsharma10/Chatify
-->

## Chatify {#projects}
Chatify is a personal project by Punit: a full-stack, real-time chat app inspired by WhatsApp Web. People can chat one-on-one or in groups with friends and family, and make voice and video calls.
Live demo: https://chatifybypunit.onrender.com . Code: https://github.com/punitsharma10/Chatify .

Features:
- Real-time 1:1 and group chats with typing indicators, online / last seen, and delivered and read receipts (blue ticks).
- Reply, forward, edit, and delete for me or for everyone; emoji reactions, starred and pinned messages, and message search.
- Images, videos, files, emoji and stickers; disappearing messages.
- Groups with admins, member management and permission settings.
- 1:1 and group voice and video calls with call history.
- Contacts, message requests, blocking and privacy settings (who can see last seen, online, profile photo and about); archive, pin and mute chats.
- Sign up with email or phone, OTP verification and password reset.
- Responsive WhatsApp Web style UI for desktop and mobile.

How it differs from WhatsApp: you can sign up with just an email (no phone number needed), it runs fully in the browser with no phone to link, messages from strangers arrive as message requests that must be approved first, and it is built from scratch and self-hosted.

How it works:
- Socket.IO carries real-time messages, presence (online, typing) and call signaling.
- Calls use WebRTC peer-to-peer audio and video, with a mesh topology for group calls. STUN uses Google's public servers and TURN uses Cloudflare Realtime TURN, so calls connect on mobile networks behind carrier NAT.
- Auth uses JWT stored in HTTP-only cookies, bcrypt.js password hashing and a CORS allow-list.
- Email OTP is sent with Nodemailer over Gmail SMTP; mobile OTP by SMS goes through textbee (an Android SMS gateway), with Twilio as an alternative.
- Media uploads (images, video, files) are stored on Cloudinary.

Tech stack: React 18 (Create React App), Redux Toolkit, React Router v6, Tailwind CSS, React Bootstrap and Socket.IO Client on the frontend; Node.js 24, Express and Socket.IO on the backend; MongoDB Atlas with Mongoose.
Deployment: GitHub Actions CI/CD runs the backend tests and the frontend production build on every push and deploys only when they pass; Render hosts the backend web service and the frontend static site.
