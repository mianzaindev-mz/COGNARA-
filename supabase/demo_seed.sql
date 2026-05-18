-- ================================================================
-- COGNARA Demo Seed Data
-- Run this against your Supabase SQL editor to populate demo content.
-- This creates courses, lessons, and a demo coach profile.
-- ================================================================

-- Demo Coach Profile (uses a fixed UUID — replace if needed)
INSERT INTO profiles (id, full_name, email, role, is_verified_coach, bio)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Dr. Sarah Chen',
  'coach@cognara.dev',
  'coach',
  true,
  'Senior software engineer with 10+ years teaching experience. Specializes in Python, JavaScript, and system design.'
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_verified_coach = EXCLUDED.is_verified_coach;

-- ================================================================
-- COURSES
-- ================================================================
INSERT INTO courses (id, coach_id, title, slug, description, category, difficulty, price_usd, is_published, total_enrolled, avg_rating, total_lessons)
VALUES
  ('c0000000-0001-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'Python Fundamentals', 'python-fundamentals',
   'Master Python from zero to confident. Covers variables, functions, OOP, file I/O, and real-world projects.',
   'Computer Science', 'beginner', 0.00, true, 42, 4.8, 12),

  ('c0000000-0002-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'JavaScript & the Modern Web', 'javascript-modern-web',
   'Deep dive into ES6+, async/await, DOM manipulation, and building interactive web apps from scratch.',
   'Computer Science', 'intermediate', 9.99, true, 38, 4.7, 15),

  ('c0000000-0003-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'Data Structures & Algorithms', 'data-structures-algorithms',
   'Essential DSA for coding interviews. Arrays, trees, graphs, dynamic programming with step-by-step visuals.',
   'Computer Science', 'advanced', 14.99, true, 27, 4.9, 20),

  ('c0000000-0004-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'UI/UX Design Principles', 'ui-ux-design',
   'Learn user-centered design, wireframing, prototyping, and design systems using Figma.',
   'Design', 'beginner', 0.00, true, 55, 4.6, 10),

  ('c0000000-0005-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'Business Communication', 'business-communication',
   'Master professional writing, presentations, and cross-cultural communication for the modern workplace.',
   'Business', 'beginner', 4.99, true, 31, 4.5, 8),

  ('c0000000-0006-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'Machine Learning Essentials', 'machine-learning-essentials',
   'Introduction to ML concepts, supervised/unsupervised learning, and building models with scikit-learn.',
   'Data & AI', 'intermediate', 19.99, true, 19, 4.8, 18)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  is_published = EXCLUDED.is_published,
  total_enrolled = EXCLUDED.total_enrolled;

-- ================================================================
-- LESSONS (3 per course for demo)
-- ================================================================
INSERT INTO lessons (id, course_id, title, slug, "order", content, duration_min)
VALUES
  -- Python Fundamentals
  ('l0000001-0001-0000-0000-000000000001', 'c0000000-0001-0000-0000-000000000001',
   'Setting Up Your Environment', 'setting-up', 1,
   '## Getting Started\n\nInstall Python 3.12+ and configure your IDE. We recommend VS Code with the Python extension.\n\n### Steps\n1. Download Python from python.org\n2. Install VS Code\n3. Install the Python extension\n4. Create your first `.py` file\n\n```python\nprint("Hello, COGNARA!")\n```', 15),

  ('l0000001-0002-0000-0000-000000000001', 'c0000000-0001-0000-0000-000000000001',
   'Variables & Data Types', 'variables-types', 2,
   '## Variables in Python\n\nPython is dynamically typed. You can assign values without declaring types.\n\n```python\nname = "COGNARA"\nversion = 2.0\nis_active = True\nstudents = [1, 2, 3]\n```\n\n### Key Types\n- `str` — text\n- `int` / `float` — numbers\n- `bool` — True/False\n- `list` — ordered collection', 20),

  ('l0000001-0003-0000-0000-000000000001', 'c0000000-0001-0000-0000-000000000001',
   'Control Flow & Loops', 'control-flow', 3,
   '## Making Decisions\n\nUse `if`, `elif`, `else` to control program flow.\n\n```python\nscore = 85\nif score >= 90:\n    grade = "A"\nelif score >= 80:\n    grade = "B"\nelse:\n    grade = "C"\n```\n\n### Loops\n```python\nfor i in range(5):\n    print(f"Step {i}")\n```', 25),

  -- JavaScript
  ('l0000002-0001-0000-0000-000000000001', 'c0000000-0002-0000-0000-000000000001',
   'ES6+ Essentials', 'es6-essentials', 1,
   '## Modern JavaScript\n\nES6 introduced major improvements to JavaScript.\n\n### Key Features\n- `let` and `const` for block scoping\n- Arrow functions `() => {}`\n- Template literals `` `Hello ${name}` ``\n- Destructuring\n- Spread operator', 20),

  ('l0000002-0002-0000-0000-000000000001', 'c0000000-0002-0000-0000-000000000001',
   'Async JavaScript', 'async-javascript', 2,
   '## Promises & Async/Await\n\nHandle asynchronous operations elegantly.\n\n```javascript\nasync function fetchCourses() {\n  const res = await fetch("/api/courses");\n  const data = await res.json();\n  return data;\n}\n```', 30),

  ('l0000002-0003-0000-0000-000000000001', 'c0000000-0002-0000-0000-000000000001',
   'DOM Manipulation', 'dom-manipulation', 3,
   '## Working with the DOM\n\nJavaScript can dynamically update HTML content.\n\n```javascript\nconst btn = document.querySelector("#submit");\nbtn.addEventListener("click", () => {\n  document.getElementById("output").textContent = "Submitted!";\n});\n```', 25),

  -- Data Structures
  ('l0000003-0001-0000-0000-000000000001', 'c0000000-0003-0000-0000-000000000001',
   'Arrays & Linked Lists', 'arrays-linked-lists', 1,
   '## Fundamental Data Structures\n\nUnderstand how data is stored and accessed in memory.\n\n### Arrays\n- O(1) random access\n- O(n) insertion/deletion\n\n### Linked Lists\n- O(1) insertion at head\n- O(n) random access', 30),

  ('l0000003-0002-0000-0000-000000000001', 'c0000000-0003-0000-0000-000000000001',
   'Trees & Binary Search', 'trees-bst', 2,
   '## Tree Structures\n\nTrees are hierarchical data structures used everywhere.\n\n### Binary Search Tree\n- Left child < parent\n- Right child > parent\n- O(log n) search, insert, delete (balanced)', 35),

  ('l0000003-0003-0000-0000-000000000001', 'c0000000-0003-0000-0000-000000000001',
   'Dynamic Programming', 'dynamic-programming', 3,
   '## Breaking Down Problems\n\nDP solves complex problems by breaking them into overlapping subproblems.\n\n### Approach\n1. Define the subproblem\n2. Write the recurrence relation\n3. Memoize or tabulate\n4. Reconstruct the solution', 40)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content;

-- ================================================================
-- AI Credits for demo coach
-- ================================================================
INSERT INTO ai_credits (user_id, balance)
VALUES ('00000000-0000-0000-0000-000000000001', 100)
ON CONFLICT (user_id) DO UPDATE SET balance = 100;

-- Done! Refresh your app to see the seeded data.
