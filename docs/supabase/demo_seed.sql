-- COGNARA demo seed (run AFTER schema_bundle.sql)
-- Idempotent: safe to re-run. Uses ON CONFLICT to skip duplicates.

-- ═══════════════════════════════════════════════════════════════
-- COURSES (6 total — varied categories and difficulties)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO public.courses (coach_id, title, slug, description, category, difficulty, price_usd, is_published, total_lessons)
SELECT
  p.id,
  v.title, v.slug, v.description, v.category, v.difficulty, v.price, true, v.total_lessons
FROM public.profiles p
CROSS JOIN (
  VALUES
    ('Python for Beginners',           'python-for-beginners',     'Build a solid foundation in Python — variables, loops, functions, and real projects.',   'Computer Science', 'beginner',     0,     18),
    ('Web Development with React',     'web-dev-react',            'Master modern frontend: components, hooks, state management, and deployment.',          'Computer Science', 'intermediate', 29.99, 24),
    ('Data Science Fundamentals',      'data-science-fundamentals','From data wrangling to visualization — pandas, numpy, and matplotlib.',                'Data Science',     'intermediate', 19.99, 15),
    ('Creative Writing for Beginners', 'creative-writing',         'Storytelling fundamentals, character development, and daily writing practice.',         'Marketing',        'beginner',     0,     20),
    ('Digital Illustration Foundations','digital-illustration',     'Vectors, composition, color theory, and digital tools for visual storytelling.',        'Computer Science', 'beginner',     0,     12),
    ('Public Speaking & Leadership',   'public-speaking',          'Build presence, structure persuasive talks, and lead with confidence.',                  'Psychology',       'beginner',     0,     24)
) AS v(title, slug, description, category, difficulty, price, total_lessons)
WHERE p.role = 'coach'
LIMIT 1
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- LESSONS (5+ lessons per course = 30+ total)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO public.lessons (course_id, title, content, order_index, duration_mins, type)
SELECT c.id, l.title, l.content, l.order_index, l.duration_mins, 'video'
FROM public.courses c
CROSS JOIN (
  VALUES
    -- Python for Beginners
    ('python-for-beginners', 'Welcome to Python',         'Install Python, set up VS Code, and run your first "Hello, World!" script.',                   1, 10),
    ('python-for-beginners', 'Variables & Data Types',     'Understand strings, integers, floats, and booleans. Practice type conversion.',                2, 15),
    ('python-for-beginners', 'Control Flow: if/else',      'Write conditional logic. Build a simple grade calculator.',                                    3, 18),
    ('python-for-beginners', 'Loops & Iteration',          'Master for and while loops. Create a number guessing game.',                                   4, 20),
    ('python-for-beginners', 'Functions & Scope',          'Define reusable functions, parameters, return values. Understand local vs global scope.',      5, 22),
    ('python-for-beginners', 'Lists & Dictionaries',       'Store and manipulate collections of data. Build a contact book.',                              6, 20),

    -- Web Development with React
    ('web-dev-react', 'Setting Up Your Environment',       'Install Node.js, create a React app with Vite, and understand the project structure.',         1, 12),
    ('web-dev-react', 'JSX & Components',                  'Learn JSX syntax, create functional components, and compose UIs.',                             2, 18),
    ('web-dev-react', 'Props & State',                     'Pass data with props, manage component state with useState.',                                  3, 22),
    ('web-dev-react', 'useEffect & Side Effects',          'Fetch data from APIs, handle lifecycle events, and cleanup.',                                  4, 25),
    ('web-dev-react', 'Routing with React Router',         'Create multi-page apps with client-side routing.',                                             5, 20),

    -- Data Science Fundamentals
    ('data-science-fundamentals', 'Introduction to Data Science', 'What is data science? Overview of the workflow: collect → clean → analyze → visualize.', 1, 10),
    ('data-science-fundamentals', 'Pandas Basics',               'Load CSV files, filter rows, select columns, and handle missing data.',                   2, 20),
    ('data-science-fundamentals', 'Data Visualization',          'Create charts with matplotlib and seaborn. Bar, line, scatter, and heatmaps.',            3, 22),
    ('data-science-fundamentals', 'NumPy for Computation',       'Arrays, broadcasting, and vectorized operations for fast math.',                          4, 18),
    ('data-science-fundamentals', 'Exploratory Data Analysis',   'Descriptive statistics, correlation, and pattern discovery on real datasets.',             5, 25),

    -- Creative Writing
    ('creative-writing', 'Introduction to Creative Writing', 'Warm up with freewriting and observation exercises. Set a 10-minute timer and capture three scenes from your day.', 1, 12),
    ('creative-writing', 'Finding Your Voice',               'Compare two authors you admire. List what makes their voice distinct — rhythm, vocabulary, perspective.',           2, 18),
    ('creative-writing', 'Story Arcs & Structure',           'Map a three-act outline for an 800-word short story. Identify the inciting incident and climax.',                  3, 22),
    ('creative-writing', 'Character Development',            'Create a character sheet: backstory, motivations, flaws, and speech patterns.',                                    4, 20),
    ('creative-writing', 'Show, Don''t Tell',                'Rewrite three "telling" paragraphs using sensory detail and action.',                                              5, 15),

    -- Digital Illustration
    ('digital-illustration', 'Tools & Canvas Setup',         'Configure your workspace: brushes, layers, and export presets for web and print.',            1, 15),
    ('digital-illustration', 'Shape Language',               'Study silhouettes in reference photos. Sketch five thumbnails using only geometric shapes.',  2, 20),
    ('digital-illustration', 'Color Theory Basics',          'Understand hue, saturation, value. Create harmonious palettes using complementary colors.',   3, 18),
    ('digital-illustration', 'Digital Inking Techniques',    'Practice clean line art with pressure sensitivity. Compare brush types.',                     4, 22),

    -- Public Speaking
    ('public-speaking', 'Breath & Presence',                 'Practice box breathing before speaking. Record a 60-second introduction and review posture.', 1, 14),
    ('public-speaking', 'Structuring a Talk',                'Use problem → insight → action. Draft bullet points for a five-minute talk.',                  2, 18),
    ('public-speaking', 'Audience Engagement',               'Techniques for eye contact, pausing for effect, and handling Q&A.',                            3, 20),
    ('public-speaking', 'Storytelling in Presentations',     'Weave personal anecdotes into your message. The "hero journey" framework for talks.',          4, 22),
    ('public-speaking', 'Overcoming Stage Fright',           'Cognitive reframing, power poses, and progressive desensitization exercises.',                 5, 16)
) AS l(slug, title, content, order_index, duration_mins)
WHERE c.slug = l.slug
  AND NOT EXISTS (
    SELECT 1 FROM public.lessons x
    WHERE x.course_id = c.id AND x.order_index = l.order_index
  );

-- ═══════════════════════════════════════════════════════════════
-- AUTO-ENROLL: Enroll current user in 3 courses for a populated dashboard
-- (Uncomment and replace YOUR_USER_ID with your auth UUID)
-- ═══════════════════════════════════════════════════════════════
-- INSERT INTO public.enrollments (student_id, course_id, progress_pct)
-- SELECT 'YOUR_USER_ID'::uuid, c.id, v.progress
-- FROM public.courses c
-- INNER JOIN (
--   VALUES
--     ('python-for-beginners', 45),
--     ('creative-writing', 72),
--     ('data-science-fundamentals', 18)
-- ) AS v(slug, progress)
-- ON c.slug = v.slug
-- ON CONFLICT (student_id, course_id) DO NOTHING;
