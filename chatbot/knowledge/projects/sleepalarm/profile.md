<!--
  PunitBot's record for the SleepAlarm project. Same format as ../../profile.md:
  "## Title {#anchor}", third person, facts only. Edit this file when the
  project changes, then run: node chatbot/build.js  (and redeploy the Worker).
  Code: github.com/punitsharma10/sleep_alarm_detector
-->

## SleepAlarm {#projects}
SleepAlarm (Sleep Alarm Detector) is a personal project by Punit: a real-time drowsiness detection web app. It watches the user's eyes through the webcam with AI computer vision and sounds an alarm when the eyes stay closed too long. Useful while driving, studying, working or operating machinery.
Live demo: https://sleepalarm-punit.duckdns.org . Code: https://github.com/punitsharma10/sleep_alarm_detector . MIT licensed.

How detection works:
- Google MediaPipe Face Landmarker tracks 478 facial landmarks per frame, GPU-accelerated, entirely in the browser.
- Six landmarks per eye give the Eye Aspect Ratio (EAR). When the EAR drops below the threshold (default 0.23) a closed-eye timer starts.
- Closures under 400 ms count as blinks, longer ones as drowsy events, and closures past the alarm delay (default 2.5 seconds) as sleep, which fires a loud alarm and saves the event.
- Live metrics on screen: EAR for each eye, eye state, closed-eye timer, session blink count and frame rate. If the face leaves the frame the alarm is silenced to avoid false alarms.
- Privacy: the video stream is processed on the device and never uploaded. The server stores only event data (type, duration, average and minimum EAR, blink count) plus one snapshot frame when an alarm fires.

Features:
- Monitoring sessions: each session has a label, an activity (driving, studying, working, operating machinery or other), an optional alertness self-rating and notes. Ending a session rolls up its duration, alarms, drowsy events, blinks and average EAR.
- History of sessions with a per-session event list, and analytics with day, week and month trends and charts (Recharts).
- Settings: EAR threshold, alarm delay, frame rate, four alarm sounds (Classic, Siren, Beep, Chime), volume, light, dark or system theme, five languages (English, Spanish, French, German, Hindi) and notifications.
- Multi-organization role-based access control: an organization registers, a platform Super Admin approves it, then its admin creates users. Each user has a level from 1 to 10 and can act only on users below their level; create, view, edit and delete permissions and per-page access are set per user, with no privilege escalation.
- Auth with JWT access and refresh tokens and bcrypt password hashing, plus forgot and reset password.

Tech stack: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, React Router, TanStack Query, React Hook Form, Recharts on the frontend; Node.js, Express and TypeScript on the backend; MongoDB with Mongoose; MediaPipe Tasks Vision for the AI.
Deployment: Docker and Docker Compose on AWS EC2, Caddy for automatic HTTPS, NGINX, and GitHub Actions for CI/CD.
