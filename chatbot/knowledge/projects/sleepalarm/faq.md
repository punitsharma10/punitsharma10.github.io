<!--
  Ready answers for SleepAlarm questions. Same format as ../../faq.md:
    ## <id>, keywords:, sources: (section titles), then a first-person answer.
  Keep ids unique across all faq files (prefix them with sleepalarm-).
-->

## sleepalarm
keywords: sleepalarm, sleep alarm, sleep alarm detector, sleepalarm project, sleep alarm project, drowsiness, drowsy, drowsiness detection, sleep detection, fatigue, alarm app, eyes closed, webcam
sources: SleepAlarm
SleepAlarm is my real-time drowsiness detection web app. It tracks your eyes through the webcam with MediaPipe and sounds an alarm when they stay closed too long. It also has monitoring sessions with analytics and multi-organization role-based access control. Try it at https://sleepalarm-punit.duckdns.org or see the code at https://github.com/punitsharma10/sleep_alarm_detector.

## sleepalarm-how
keywords: eye aspect ratio, ear, mediapipe, face mesh, face landmarker, landmarks, computer vision, how does sleepalarm work, how does it detect, detect sleep, blink
sources: SleepAlarm
MediaPipe Face Landmarker tracks 478 face landmarks per frame in the browser. From six points per eye I compute the Eye Aspect Ratio. Below the threshold (0.23 by default) a timer starts: short closures are blinks, longer ones are drowsy events, and past the alarm delay (2.5 seconds by default) the alarm fires and the event is saved.

## sleepalarm-privacy
keywords: privacy, video uploaded, upload video, is my video, camera data, data stored, sleepalarm privacy
sources: SleepAlarm
In SleepAlarm the video is processed on your device and never uploaded. The server keeps only event data such as duration, EAR and blink count, plus one snapshot frame when an alarm fires.

## sleepalarm-stack
keywords: sleepalarm stack, sleepalarm tech, sleepalarm tech stack, tech stack of sleepalarm, stack of sleepalarm, sleepalarm built with, built sleepalarm, mern, sleepalarm deployed, sleepalarm hosted, caddy
sources: SleepAlarm
SleepAlarm uses React 19, TypeScript, Vite and Tailwind CSS on the frontend, Node.js and Express with TypeScript on the backend, MongoDB with Mongoose, and MediaPipe for the vision. It runs in Docker on AWS EC2 behind Caddy for HTTPS, with GitHub Actions for CI/CD.

## sleepalarm-rbac
keywords: super admin, superadmin, organization approval, role based access control, access control, multi organization, multi-organization, multi tenant, user levels, sleepalarm roles, sleepalarm rbac
sources: SleepAlarm
SleepAlarm is multi-organization. An organization registers and a Super Admin approves it, then its admin creates users. Each user has a level from 1 to 10 and can only manage users below them, with create, view, edit and delete permissions and page access set per user, so nobody can grant more than they hold.
