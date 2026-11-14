<!--
  Ready answers for Chatify questions. Same format as ../../faq.md:
    ## <id>, keywords:, sources: (section titles), then a first-person answer.
  Keep ids unique across all faq files (prefix them with chatify-).
-->

## chatify
keywords: chatify, chatify project, chat app, chatting app, messaging app, whatsapp clone, whatsapp, real time chat, realtime chat, chat application
sources: Chatify
Chatify is my full-stack, real-time chat app inspired by WhatsApp Web. You can chat one-on-one or in groups, share photos, videos and files, and make voice and video calls. Try it at https://chatifybypunit.onrender.com or see the code at https://github.com/punitsharma10/Chatify.

## chatify-vs-whatsapp
keywords: different from whatsapp, difference from whatsapp, chatify vs whatsapp, why chatify, better than whatsapp, unlike whatsapp, how is chatify different
sources: Chatify
Unlike WhatsApp, Chatify lets you sign up with just an email, no phone number needed. It runs fully in the browser with no phone to link, messages from strangers arrive as message requests you approve first, and I built it from scratch and host it myself.

## chatify-calls
keywords: video call, voice call, calling, calls, webrtc, turn server, stun, group call, chatify calls
sources: Chatify
Chatify's voice and video calls use WebRTC peer to peer, with a mesh for group calls and Socket.IO as the signaling channel. Google STUN plus Cloudflare Realtime TURN let calls connect even on mobile data behind carrier NAT. Every call is saved in the call history.

## chatify-features
keywords: chatify features, typing indicator, read receipts, blue ticks, last seen, disappearing messages, reactions, reply, forward, message requests, groups, otp
sources: Chatify
Chatify has typing indicators, online and last seen, read receipts, reply, forward, edit and delete for everyone, reactions, starred and pinned messages, search, disappearing messages, groups with admins, message requests, blocking and privacy settings, and email or phone sign-up with OTP verification.

## chatify-stack
keywords: chatify stack, chatify tech, chatify tech stack, tech stack of chatify, chatify built with, socket.io, socketio, redux, chatify deployed, chatify hosted, render, cloudinary
sources: Chatify
Chatify uses React 18 with Redux Toolkit, React Router and Tailwind CSS on the frontend, and Node.js, Express and Socket.IO on the backend with MongoDB Atlas. Auth is JWT in HTTP-only cookies with bcrypt, OTP goes out via Nodemailer and an SMS gateway, and media is stored on Cloudinary. GitHub Actions runs tests before each deploy to Render.
