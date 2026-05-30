-- Migration: 20260528000002_seed_courses
-- Seed 50 realistic courses modeled on the Kaggle Udemy Courses dataset structure.
-- Attribution: Course metadata inspired by Udemy Courses Dataset (Andrew MVD, Kaggle, CC BY 4.0).
--
-- Uses a sentinel coach profile "COGNARA Demo Coach" created inline.
-- All courses default to published = true, status = 'published'.

-- Create the auth user first to satisfy the profiles_id_fkey foreign key constraint
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, role, aud, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'demo-coach@cognara.dev',
  crypt('DemoCoach@1234', gen_salt('bf')),
  NOW(),
  '{"full_name": "COGNARA Demo Coach", "role": "coach"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated',
  'authenticated',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Now create/update the demo coach profile
INSERT INTO public.profiles (id, email, role, full_name, username, is_verified)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'demo-coach@cognara.dev',
  'coach',
  'COGNARA Demo Coach',
  'DemoCoach',
  true
)
ON CONFLICT (id) DO UPDATE
SET username = EXCLUDED.username, is_verified = EXCLUDED.is_verified;

-- Seed courses
INSERT INTO public.courses (coach_id, title, slug, description, category, difficulty, language, price_usd, is_published, thumbnail_url, total_lessons, total_enrolled, avg_rating)
VALUES
  -- Web Development (10)
  ('11111111-1111-1111-1111-111111111111', 'The Complete Web Developer Bootcamp', 'complete-web-developer-bootcamp-1001', 'Master HTML, CSS, JavaScript, React, Node.js, and MongoDB from absolute zero to job-ready full-stack developer.', 'Web Development', 'beginner', 'en', 0, true, NULL, 62, 18420, 4.72),
  ('11111111-1111-1111-1111-111111111111', 'Advanced React Patterns & Performance', 'advanced-react-patterns-perf-1002', 'Deep dive into compound components, render props, hooks internals, React Server Components, and performance optimization.', 'Web Development', 'advanced', 'en', 29.99, true, NULL, 38, 4210, 4.85),
  ('11111111-1111-1111-1111-111111111111', 'Next.js 14 — The Full Stack Framework', 'nextjs-14-full-stack-framework-1003', 'Build production apps with Next.js 14 App Router, Server Actions, Middleware, ISR, and deployment on Vercel.', 'Web Development', 'intermediate', 'en', 24.99, true, NULL, 44, 7835, 4.68),
  ('11111111-1111-1111-1111-111111111111', 'CSS Mastery: Modern Layouts & Animations', 'css-mastery-layouts-animations-1004', 'Flexbox, Grid, container queries, @layer, custom properties, scroll-driven animations, and responsive design.', 'Web Development', 'intermediate', 'en', 19.99, true, NULL, 30, 5620, 4.55),
  ('11111111-1111-1111-1111-111111111111', 'TypeScript for Professionals', 'typescript-for-professionals-1005', 'Master generics, conditional types, mapped types, template literals, declaration merging, and real-world patterns.', 'Web Development', 'advanced', 'en', 34.99, true, NULL, 42, 6180, 4.91),
  ('11111111-1111-1111-1111-111111111111', 'Build a SaaS with Next.js, Supabase & Stripe', 'saas-nextjs-supabase-stripe-1006', 'End-to-end SaaS: auth, RLS, subscriptions, webhooks, dashboards, email, and production deployment.', 'Web Development', 'advanced', 'en', 49.99, true, NULL, 56, 3290, 4.78),
  ('11111111-1111-1111-1111-111111111111', 'HTML & CSS for Absolute Beginners', 'html-css-absolute-beginners-1007', 'Your first website in 2 hours. Learn semantic HTML5, CSS styling, responsive design, and deploy on Netlify.', 'Web Development', 'beginner', 'en', 0, true, NULL, 18, 31200, 4.42),
  ('11111111-1111-1111-1111-111111111111', 'Vue.js 3 Complete Guide', 'vuejs-3-complete-guide-1008', 'Composition API, Pinia, Vue Router, Nuxt 3, and building real-world single page applications.', 'Web Development', 'intermediate', 'en', 24.99, true, NULL, 36, 4870, 4.61),
  ('11111111-1111-1111-1111-111111111111', 'Tailwind CSS From Scratch', 'tailwind-css-from-scratch-1009', 'Utility-first CSS framework: responsive design, custom themes, component patterns, and dark mode.', 'Web Development', 'beginner', 'en', 14.99, true, NULL, 22, 8950, 4.50),
  ('11111111-1111-1111-1111-111111111111', 'GraphQL with Apollo & Node.js', 'graphql-apollo-nodejs-1010', 'Schema design, resolvers, subscriptions, federation, caching strategies, and full-stack integration.', 'Web Development', 'intermediate', 'en', 29.99, true, NULL, 34, 2680, 4.63),

  -- Python & Data Science (10)
  ('11111111-1111-1111-1111-111111111111', 'Python for Everybody Specialization', 'python-for-everybody-spec-2001', 'Learn Python from scratch: variables, loops, functions, files, APIs, databases, and data visualization.', 'Python', 'beginner', 'en', 0, true, NULL, 48, 42500, 4.81),
  ('11111111-1111-1111-1111-111111111111', 'Data Science with Python & Pandas', 'data-science-python-pandas-2002', 'Data wrangling, EDA, visualization with matplotlib/seaborn, statistical analysis, and real datasets.', 'Data Science', 'intermediate', 'en', 29.99, true, NULL, 40, 9870, 4.73),
  ('11111111-1111-1111-1111-111111111111', 'Machine Learning A-Z: Hands-On Python', 'machine-learning-az-python-2003', 'Regression, classification, clustering, NLP, deep learning with scikit-learn, TensorFlow, and PyTorch.', 'Data Science', 'intermediate', 'en', 39.99, true, NULL, 58, 15200, 4.67),
  ('11111111-1111-1111-1111-111111111111', 'Deep Learning Specialization', 'deep-learning-specialization-2004', 'Neural networks, CNNs, RNNs, transformers, GANs, and deploying models to production.', 'Data Science', 'advanced', 'en', 49.99, true, NULL, 64, 7430, 4.88),
  ('11111111-1111-1111-1111-111111111111', 'Python Automation & Scripting', 'python-automation-scripting-2005', 'Automate Excel, PDFs, emails, web scraping, file management, and system tasks with Python.', 'Python', 'beginner', 'en', 19.99, true, NULL, 28, 11300, 4.59),
  ('11111111-1111-1111-1111-111111111111', 'Natural Language Processing with Transformers', 'nlp-with-transformers-2006', 'BERT, GPT, T5, fine-tuning, tokenization, sentiment analysis, and building NLP pipelines.', 'Data Science', 'advanced', 'en', 44.99, true, NULL, 36, 3890, 4.82),
  ('11111111-1111-1111-1111-111111111111', 'SQL for Data Analysis', 'sql-for-data-analysis-2007', 'SELECT, JOIN, subqueries, window functions, CTEs, and query optimization with PostgreSQL.', 'Data Science', 'beginner', 'en', 0, true, NULL, 24, 19600, 4.56),
  ('11111111-1111-1111-1111-111111111111', 'Statistics & Probability for Data Science', 'statistics-probability-data-science-2008', 'Descriptive stats, distributions, hypothesis testing, Bayesian reasoning, and A/B testing.', 'Data Science', 'intermediate', 'en', 24.99, true, NULL, 32, 6740, 4.71),
  ('11111111-1111-1111-1111-111111111111', 'Computer Vision with OpenCV & Python', 'computer-vision-opencv-python-2009', 'Image processing, object detection, face recognition, OCR, and real-time video analysis.', 'Data Science', 'intermediate', 'en', 34.99, true, NULL, 38, 4520, 4.64),
  ('11111111-1111-1111-1111-111111111111', 'Data Engineering with Apache Spark', 'data-engineering-apache-spark-2010', 'PySpark, DataFrames, Spark SQL, streaming, Delta Lake, and building data pipelines at scale.', 'Data Science', 'advanced', 'en', 39.99, true, NULL, 42, 2980, 4.76),

  -- Mobile Development (5)
  ('11111111-1111-1111-1111-111111111111', 'Flutter & Dart: The Complete Guide', 'flutter-dart-complete-guide-3001', 'Build beautiful cross-platform mobile apps with Flutter widgets, state management, Firebase, and publishing.', 'Mobile Development', 'intermediate', 'en', 29.99, true, NULL, 52, 8940, 4.74),
  ('11111111-1111-1111-1111-111111111111', 'React Native — Build Mobile Apps', 'react-native-build-mobile-apps-3002', 'Cross-platform iOS and Android development with React Native, Expo, navigation, and native modules.', 'Mobile Development', 'intermediate', 'en', 24.99, true, NULL, 44, 6730, 4.62),
  ('11111111-1111-1111-1111-111111111111', 'iOS Development with SwiftUI', 'ios-development-swiftui-3003', 'Build native iOS apps: SwiftUI views, Core Data, networking, animations, and App Store submission.', 'Mobile Development', 'intermediate', 'en', 34.99, true, NULL, 40, 5180, 4.69),
  ('11111111-1111-1111-1111-111111111111', 'Android Development with Kotlin', 'android-development-kotlin-3004', 'Jetpack Compose, MVVM, Room, Retrofit, coroutines, and publishing on Google Play.', 'Mobile Development', 'intermediate', 'en', 29.99, true, NULL, 38, 4650, 4.58),
  ('11111111-1111-1111-1111-111111111111', 'Mobile UI/UX Design Fundamentals', 'mobile-ui-ux-design-fundamentals-3005', 'Design principles, wireframing, prototyping in Figma, user testing, and platform guidelines.', 'Mobile Development', 'beginner', 'en', 19.99, true, NULL, 20, 7280, 4.51),

  -- DevOps & Cloud (5)
  ('11111111-1111-1111-1111-111111111111', 'Docker & Kubernetes: The Practical Guide', 'docker-kubernetes-practical-guide-4001', 'Containers, Docker Compose, Kubernetes orchestration, Helm charts, CI/CD pipelines, and monitoring.', 'DevOps', 'intermediate', 'en', 34.99, true, NULL, 46, 7620, 4.79),
  ('11111111-1111-1111-1111-111111111111', 'AWS Certified Solutions Architect', 'aws-certified-solutions-architect-4002', 'EC2, S3, VPC, Lambda, RDS, CloudFront, IAM, and exam preparation with practice tests.', 'Cloud Computing', 'intermediate', 'en', 44.99, true, NULL, 60, 12400, 4.83),
  ('11111111-1111-1111-1111-111111111111', 'CI/CD with GitHub Actions', 'ci-cd-github-actions-4003', 'Automated testing, deployment workflows, matrix builds, secrets management, and reusable actions.', 'DevOps', 'beginner', 'en', 0, true, NULL, 16, 9870, 4.47),
  ('11111111-1111-1111-1111-111111111111', 'Terraform Infrastructure as Code', 'terraform-infrastructure-as-code-4004', 'HCL syntax, providers, modules, state management, workspaces, and multi-cloud deployments.', 'DevOps', 'intermediate', 'en', 29.99, true, NULL, 28, 4350, 4.66),
  ('11111111-1111-1111-1111-111111111111', 'Linux System Administration', 'linux-system-administration-4005', 'File systems, permissions, networking, systemd, shell scripting, security hardening, and server management.', 'DevOps', 'beginner', 'en', 19.99, true, NULL, 34, 8920, 4.54),

  -- Computer Science Fundamentals (5)
  ('11111111-1111-1111-1111-111111111111', 'Data Structures & Algorithms in JavaScript', 'dsa-javascript-5001', 'Arrays, linked lists, trees, graphs, sorting, searching, dynamic programming, and Big-O analysis.', 'Computer Science', 'intermediate', 'en', 29.99, true, NULL, 50, 11800, 4.77),
  ('11111111-1111-1111-1111-111111111111', 'System Design Interview Prep', 'system-design-interview-prep-5002', 'Load balancers, caching, databases, microservices, message queues, and designing scalable systems.', 'Computer Science', 'advanced', 'en', 39.99, true, NULL, 32, 6540, 4.86),
  ('11111111-1111-1111-1111-111111111111', 'Operating Systems: Three Easy Pieces', 'operating-systems-three-easy-pieces-5003', 'Processes, threads, memory management, file systems, scheduling, and concurrency.', 'Computer Science', 'intermediate', 'en', 24.99, true, NULL, 28, 3470, 4.65),
  ('11111111-1111-1111-1111-111111111111', 'Discrete Mathematics for CS', 'discrete-math-for-cs-5004', 'Logic, sets, combinatorics, graph theory, number theory, and proofs for computer science.', 'Computer Science', 'beginner', 'en', 0, true, NULL, 24, 5890, 4.48),
  ('11111111-1111-1111-1111-111111111111', 'Compiler Design from Scratch', 'compiler-design-from-scratch-5005', 'Lexing, parsing, ASTs, type checking, code generation, and building a working compiler.', 'Computer Science', 'advanced', 'en', 34.99, true, NULL, 36, 2140, 4.89),

  -- Cybersecurity (5)
  ('11111111-1111-1111-1111-111111111111', 'Ethical Hacking: The Complete Course', 'ethical-hacking-complete-course-6001', 'Penetration testing, network security, Kali Linux, Metasploit, OWASP Top 10, and bug bounties.', 'Cybersecurity', 'intermediate', 'en', 34.99, true, NULL, 48, 9650, 4.75),
  ('11111111-1111-1111-1111-111111111111', 'Web Application Security', 'web-application-security-6002', 'XSS, CSRF, SQL injection, authentication flaws, CSP, and secure coding practices.', 'Cybersecurity', 'intermediate', 'en', 29.99, true, NULL, 30, 5240, 4.68),
  ('11111111-1111-1111-1111-111111111111', 'Network Security & Firewalls', 'network-security-firewalls-6003', 'TCP/IP, VPNs, IDS/IPS, firewall configuration, packet analysis with Wireshark, and defense-in-depth.', 'Cybersecurity', 'intermediate', 'en', 24.99, true, NULL, 26, 4180, 4.57),
  ('11111111-1111-1111-1111-111111111111', 'Cryptography Fundamentals', 'cryptography-fundamentals-6004', 'Symmetric/asymmetric encryption, hashing, digital signatures, TLS/SSL, and PKI.', 'Cybersecurity', 'beginner', 'en', 19.99, true, NULL, 22, 6730, 4.52),
  ('11111111-1111-1111-1111-111111111111', 'SOC Analyst: Blue Team Operations', 'soc-analyst-blue-team-6005', 'SIEM, log analysis, incident response, threat hunting, and security operations center workflows.', 'Cybersecurity', 'advanced', 'en', 39.99, true, NULL, 34, 3120, 4.81),

  -- Soft Skills & Career (5)
  ('11111111-1111-1111-1111-111111111111', 'Technical Interview Masterclass', 'technical-interview-masterclass-7001', 'Behavioral questions, coding challenges, system design, salary negotiation, and offer evaluation.', 'Career', 'beginner', 'en', 0, true, NULL, 20, 14500, 4.63),
  ('11111111-1111-1111-1111-111111111111', 'Git & GitHub for Teams', 'git-github-for-teams-7002', 'Branching strategies, pull requests, code reviews, conflict resolution, and CI/CD integration.', 'Career', 'beginner', 'en', 0, true, NULL, 16, 22300, 4.58),
  ('11111111-1111-1111-1111-111111111111', 'Agile & Scrum Master Certification Prep', 'agile-scrum-master-cert-7003', 'Scrum framework, sprint planning, retrospectives, Kanban, and PSM I exam preparation.', 'Career', 'beginner', 'en', 24.99, true, NULL, 18, 7840, 4.49),
  ('11111111-1111-1111-1111-111111111111', 'Clean Code: Writing Readable Software', 'clean-code-writing-readable-software-7004', 'Naming, functions, comments, formatting, error handling, testing, and refactoring patterns.', 'Career', 'intermediate', 'en', 19.99, true, NULL, 22, 8960, 4.74),
  ('11111111-1111-1111-1111-111111111111', 'Building Your Developer Portfolio', 'building-developer-portfolio-7005', 'Project selection, GitHub profile, personal website, case studies, and standing out to recruiters.', 'Career', 'beginner', 'en', 0, true, NULL, 12, 11200, 4.44),

  -- AI & Machine Learning (5)
  ('11111111-1111-1111-1111-111111111111', 'Generative AI & Prompt Engineering', 'generative-ai-prompt-engineering-8001', 'LLMs, ChatGPT, Claude, Gemini, prompt design, chain-of-thought, RAG, and building AI applications.', 'Artificial Intelligence', 'beginner', 'en', 24.99, true, NULL, 26, 16800, 4.71),
  ('11111111-1111-1111-1111-111111111111', 'Building AI Agents with LangChain', 'building-ai-agents-langchain-8002', 'Chains, tools, memory, retrieval augmentation, autonomous agents, and production deployment.', 'Artificial Intelligence', 'intermediate', 'en', 34.99, true, NULL, 32, 5430, 4.83),
  ('11111111-1111-1111-1111-111111111111', 'Reinforcement Learning: Theory to Practice', 'reinforcement-learning-theory-practice-8003', 'MDP, Q-learning, policy gradient, PPO, multi-agent RL, and OpenAI Gym environments.', 'Artificial Intelligence', 'advanced', 'en', 44.99, true, NULL, 38, 2760, 4.87),
  ('11111111-1111-1111-1111-111111111111', 'MLOps: Machine Learning in Production', 'mlops-machine-learning-production-8004', 'Model versioning, experiment tracking, feature stores, model serving, monitoring, and CI/CD for ML.', 'Artificial Intelligence', 'advanced', 'en', 39.99, true, NULL, 30, 3890, 4.79),
  ('11111111-1111-1111-1111-111111111111', 'Computer Vision Projects with PyTorch', 'computer-vision-projects-pytorch-8005', 'Image classification, object detection, segmentation, GANs, and deploying vision models.', 'Artificial Intelligence', 'intermediate', 'en', 29.99, true, NULL, 34, 4210, 4.72)

ON CONFLICT DO NOTHING;
