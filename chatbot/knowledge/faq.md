<!--
  Ready answers, first person. Two jobs:
   1. The AI gets them as extra record (for facts that are not on the page).
   2. When no AI is reachable, the browser picks the entry whose keywords best
      match the question and shows its answer, so the bot never goes dark.

  Format of each entry:
    ## <id>
    keywords: comma-separated words or phrases that point to this answer
    sources: section titles from profile.md (comma-separated), or none
    <answer, one short paragraph>

  An answer that is just TODO is skipped everywhere until you fill it in.
-->

## greeting
keywords: hi, hello, hey, hii, namaste, good morning, good evening, sup
sources: none
Hi, I am PunitBot, Punit's AI. Ask me about my experience, the projects I have built, my skills or how to reach me.

## identity
keywords: real punit, are you real, real person, are you human, human, are you a bot, who are you, are you ai, talking to, chatbot
sources: About
I am PunitBot, Punit's AI. I answer as Punit from his record only. For the real Punit, email punitsharma0511@gmail.com.

## intro
keywords: about you, about yourself, tell me about you, introduce yourself, introduction, who is punit, summary, background, profile
sources: About
I am Punit Kumar Sharma, a Full-Stack Developer from Agra, India, with over 3 years of experience. I build scalable web apps, real-time systems and AI-powered features. Right now I am SDE-1 at OmnisAI, building a legal case-management CRM with NestJS and PostgreSQL.

## years
keywords: how many years, years of experience, how much experience, experience do you have, how long, since when, total experience
sources: About, Experience
I have over 3 years of professional experience, starting in June 2023. I have worked at Shophree Retails, FuturElectra and now OmnisAI, all as an SDE-1 Full Stack developer.

## omnisai
keywords: omnisai, omnis, current job, current company, currently, right now, present, legal, crm, law firm, law firms, case management, houston, clients, customizable dashboards, drag and drop
sources: Experience
At OmnisAI (Houston, TX, USA, remote), since May 2025, I build a legal case-management CRM serving 4 law firms managing 100+ clients. I shipped 15+ REST API modules with NestJS, TypeORM and PostgreSQL, a custom fields engine, real-time notifications for 30+ outbound and 15+ inbound messages a day, a client portal with one-time-code login and drag-and-drop dashboards.

## futurelectra
keywords: futurelectra, future electra, electra, gurugram, gurgaon, 2100, 350, aggregation, response time, optimise, optimize, performance
sources: Experience
At FuturElectra (Gurugram, hybrid), from January 2024 to May 2025, I built CRM dashboards with React and Express on MongoDB. I created 30+ reusable components and cut controller response times from 2100 ms to 350 ms with MongoDB aggregation pipelines.

## shophree
keywords: shophree, shophree retails, first job, first company, ecommerce, e-commerce, serverless, jwt
sources: Experience
At Shophree Retails (Agra, onsite), from June 2023 to January 2024, I worked on e-commerce platforms with React and JavaScript, deployed Node.js APIs on AWS Serverless and added JWT-based authentication.

## experience
keywords: experience, worked at, worked for, work history, companies, company, jobs, career, previous, roles, where have you worked
sources: Experience
I have worked at three companies, all as SDE-1 Full Stack: OmnisAI in Houston, remote (May 2025 to now, a legal CRM for 4 law firms with NestJS and PostgreSQL), FuturElectra in Gurugram, hybrid (2024 to 2025, React and MongoDB dashboards) and Shophree Retails in Agra, onsite (2023 to 2024, e-commerce on AWS Serverless).

## ai
keywords: ai, llm, gpt, openai, claude, gemini, openrouter, mcp, agent, agents, prompt, genai, machine learning, artificial intelligence
sources: Skills
On the AI side I work with Gemini, Claude, OpenAI and OpenRouter, plus MCP, agent orchestration and prompt versioning. This bot is one example: it answers from my record and cites its sources.

## skills
keywords: skills, stack, tech stack, technologies, tools, languages, what do you know, expertise, proficient
sources: Skills
My core stack is React and Next.js on the frontend, NestJS, Node.js and Express on the backend, and PostgreSQL, MongoDB and Redis for data. I also work with TypeScript, Socket.IO, Docker, Kubernetes, AWS and AI models such as Gemini, Claude and OpenAI.

## backend
keywords: backend, back end, nestjs, nest, node, express, api, apis, rest, typeorm, websocket, socket, rbac, swagger
sources: Skills, Experience
Backend is where I spend most of my time: NestJS, Node.js and Express with TypeScript, TypeORM, REST APIs, Swagger, JWT and OAuth 2.0, role-based access control and real-time features over WebSockets and Socket.IO.

## frontend
keywords: frontend, front end, react, next, nextjs, redux, tailwind, bootstrap, ui, css, html, javascript
sources: Skills
On the frontend I use React.js and Next.js with Redux, Tailwind CSS and Bootstrap. At FuturElectra I built 30+ reusable components and custom hooks for a CRM.

## database
keywords: database, databases, db, sql, postgres, postgresql, mongodb, mongo, redis, indexing, query
sources: Skills, Experience
I work with PostgreSQL, MongoDB and Redis. I tune queries with aggregation pipelines and indexing, which is how I took one set of controllers from 2100 ms to 350 ms.

## devops
keywords: devops, docker, kubernetes, k8s, aws, cloud, ec2, s3, lambda, ci, cd, github actions, deploy, deployment, vercel, netlify, grafana, playwright, testing
sources: Skills
For shipping I use Docker, Kubernetes, GitHub Actions and CI/CD, and AWS services such as EC2, S3, Lambda and Serverless. I also deploy to Vercel and Netlify, monitor with Grafana and test with Playwright.

## projects
keywords: project, projects, built, portfolio, nykaa, oestin, hotel, todo, clone, side project, demo, razorpay
sources: Projects
My portfolio projects are a Nykaa clone (e-commerce with cart, filters and auth), Oestin (hotel booking with Google sign-in and Razorpay payments) and a TODO app. Each one has code and a live demo in the Projects section.

## education
keywords: education, degree, college, university, btech, b.tech, cgpa, gpa, graduate, graduation, study, studied, agra college
sources: Education
I have a B.Tech in Computer Science and Engineering from Agra College, Agra (2019 to 2023), with a CGPA of 7.12 out of 10.

## contact
keywords: contact, email, mail, phone, call, whatsapp, linkedin, github, reach, connect, get in touch, meeting, schedule
sources: Contact
Email me at punitsharma0511@gmail.com or WhatsApp +91-9997222612. I am also on LinkedIn (punitsharma1009) and GitHub (punitsharma10), and I usually reply within 24 hours.

## hire
keywords: why hire, hire you, why should, strengths, strength, good fit, stand out, value, what makes you
sources: Experience, Skills
I ship end to end: APIs, databases, real-time features and the UI on top. At OmnisAI I built 15+ production API modules and a client portal, and at FuturElectra I cut response times from 2100 ms to 350 ms. I also bring hands-on AI and LLM work.

## availability
keywords: available, availability, open to, looking for, job, opportunity, opportunities, freelance, full time, full-time, remote, remotely, work from home, wfh, hybrid, work mode
sources: Contact
I am open to full-time roles, freelance projects and collaborations, and I can work remote or hybrid. Email me at punitsharma0511@gmail.com.

## location
keywords: where are you, location, based, city, live, india, agra
sources: About
I am based in Agra, Uttar Pradesh, India.

## resume
keywords: resume, cv, download resume, pdf, curriculum vitae, biodata
sources: Contact
You can download my resume here: https://punitsharma10.github.io/Media/Punit_Kumar_Sharma_Resume.pdf. It is also on the Resume button at the top of the page and in the Contact section.

## salary
keywords: salary, ctc, compensation, package, pay, expected salary, current salary, lpa
sources: none
I discuss compensation directly. Email me at punitsharma0511@gmail.com.

## notice
keywords: notice period, notice, join, joining, when can you start, start date, immediate, immediate joiner
sources: About
I am an immediate joiner, so I can start right away. Email me at punitsharma0511@gmail.com to take it forward.

## relocation
keywords: relocate, relocating, relocation, willing to relocate, open to relocating, relocating to, relocate to, move, shift, onsite, on-site, office, bangalore, bengaluru, pune, noida, gurgaon, hyderabad, mumbai, delhi, chennai, kolkata, ahmedabad, jaipur
sources: About
Yes, I am open to relocating anywhere in India. I can also work remote or hybrid.
