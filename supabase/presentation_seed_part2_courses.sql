-- ================================================================
-- COGNARA Presentation Demo - Part 2: Course Content
-- Chapters, Lessons, and Resources for demo courses
-- ================================================================

-- Safely ensure required columns exist to support base and upgraded schemas
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS lesson_order_in_chapter INT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

DO $$
DECLARE
  v_python_course UUID;
  v_webdev_course UUID;
  v_ml_course UUID;
  
  v_coach_zain UUID := 'cccccccc-cccc-cccc-cccc-cccccccccc01';
  v_coach_james UUID := 'cccccccc-cccc-cccc-cccc-cccccccccc02';
  v_coach_priya UUID := 'cccccccc-cccc-cccc-cccc-cccccccccc03';
BEGIN
  -- 1. Get the course IDs by slug
  SELECT id INTO v_python_course FROM public.courses WHERE slug = 'python-for-everybody-spec-2001' LIMIT 1;
  SELECT id INTO v_webdev_course FROM public.courses WHERE slug = 'complete-web-developer-bootcamp-1001' LIMIT 1;
  SELECT id INTO v_ml_course FROM public.courses WHERE slug = 'machine-learning-az-python-2003' LIMIT 1;
  
  -- If courses don't exist, we fallback to finding the first courses or creating them, but they exist.
  IF v_python_course IS NULL THEN
    RAISE NOTICE 'Python course not found, checking fallback...';
  END IF;

  -- 2. Re-assign course coaches to the seeded coach profiles
  UPDATE public.courses SET coach_id = v_coach_zain, status = 'published', is_published = true WHERE id = v_python_course;
  UPDATE public.courses SET coach_id = v_coach_james, status = 'published', is_published = true WHERE id = v_webdev_course;
  UPDATE public.courses SET coach_id = v_coach_priya, status = 'published', is_published = true WHERE id = v_ml_course;

  -- 3. SEED CHAPTERS
  -- Python Course Chapters
  INSERT INTO public.chapters (id, course_id, title, description, order_index, is_locked, wall_type, total_lessons, estimated_mins)
  VALUES
    ('ch000000-0000-0000-0000-000000000101', v_python_course, 'Introduction to Programming with Python', 'Learn what programming is, write your first script, and master python syntax basics.', 1, false, 'none', 3, 45),
    ('ch000000-0000-0000-0000-000000000102', v_python_course, 'Control Flow and Logic', 'Master conditionals, loops, error handling, and structured control flows.', 2, false, 'none', 3, 50),
    ('ch000000-0000-0000-0000-000000000103', v_python_course, 'Data Structures in Python', 'Deep dive into Python built-in data types: Lists, Tuples, Dictionaries, and Sets.', 3, false, 'none', 2, 40)
  ON CONFLICT (id) DO NOTHING;

  -- Web Dev Course Chapters
  INSERT INTO public.chapters (id, course_id, title, description, order_index, is_locked, wall_type, total_lessons, estimated_mins)
  VALUES
    ('ch000000-0000-0000-0000-000000000201', v_webdev_course, 'HTML5 Essentials', 'Understand semantic elements, lists, tables, links, images, and HTML forms.', 1, false, 'none', 2, 35),
    ('ch000000-0000-0000-0000-000000000202', v_webdev_course, 'Styling with CSS3', 'Style elements, master colors, typography, border-box sizing, and responsive Flexbox.', 2, false, 'none', 2, 45),
    ('ch000000-0000-0000-0000-000000000203', v_webdev_course, 'Dynamic Pages with JavaScript', 'Learn variables, loops, DOM selection, click listeners, and dynamic DOM updates.', 3, false, 'none', 3, 60)
  ON CONFLICT (id) DO NOTHING;

  -- ML Course Chapters
  INSERT INTO public.chapters (id, course_id, title, description, order_index, is_locked, wall_type, total_lessons, estimated_mins)
  VALUES
    ('ch000000-0000-0000-0000-000000000301', v_ml_course, 'Foundations of Machine Learning', 'Introduction to the ML landscape, terminology, Jupyter, and essential libraries.', 1, false, 'none', 2, 40),
    ('ch000000-0000-0000-0000-000000000302', v_ml_course, 'Regression and Classification', 'Learn linear & logistic regression, data splitting, training, and model metrics.', 2, false, 'none', 3, 65),
    ('ch000000-0000-0000-0000-000000000303', v_ml_course, 'Unsupervised Learning', 'Clustering with K-Means, dimensionality reduction using PCA, and recommendation engines.', 3, false, 'none', 2, 50)
  ON CONFLICT (id) DO NOTHING;

  -- 4. SEED LESSONS
  -- Python Course Lessons
  INSERT INTO public.lessons (id, course_id, chapter_id, title, content, order_index, type, video_url, duration_mins, is_free_preview, lesson_order_in_chapter, is_published)
  VALUES
    ('le000000-0000-0000-0000-000000000101', v_python_course, 'ch000000-0000-0000-0000-000000000101', 'What is Programming & Python?', '## Welcome to Python for Everybody!
In this lesson, we will explore the core concept of programming. A computer is essentially a highly efficient assistant that needs precise instructions to do any task. Programming is the process of writing those instructions.

### Why Python?
Python is a high-level, interpreted programming language known for its elegant syntax and readability. It is widely used in:
- **Web Development** (Django, Flask)
- **Data Science & ML** (pandas, scikit-learn, PyTorch)
- **Scripting & Automation**

Watch the lecture video below to see Python in action!', 1, 'video', 'https://www.youtube.com/embed/kqtD5dpn9C8', 15, true, 1, true),

    ('le000000-0000-0000-0000-000000000102', v_python_course, 'ch000000-0000-0000-0000-000000000101', 'Variables & Basic Data Types', '## Python Variables & Types
In Python, we store data in variables. Unlike static languages, Python is dynamically typed, meaning you do not need to declare a variable''s type explicitly.

### Basic Types:
1. **Integer** (int): Whole numbers like `42`
2. **Float** (float): Decimal numbers like `3.14`
3. **String** (str): Text enclosed in quotes like `"Hello COGNARA!"`
4. **Boolean** (bool): Logical values, either `True` or `False`

### Example Code:
```python
x = 10
pi = 3.14159
name = "Cognara Learner"
is_active = True

print(type(x))    # Output: <class ''int''>
print(type(name)) # Output: <class ''str''>
```', 2, 'code', NULL, 15, false, 2, true),

    ('le000000-0000-0000-0000-000000000103', v_python_course, 'ch000000-0000-0000-0000-000000000101', 'Writing Your First Python Script', '## Hello World in Python
Let''s put our knowledge to work. Your first coding task is to write a script that displays a welcoming message.

In Python, we use the `print()` function to output text to the console.

### Challenge:
Use the code editor on the side to write:
```python
print("Hello, World!")
```
Run the code and observe the compiled stdout. You''ve officially executed your first script!', 3, 'code', NULL, 15, false, 3, true),

    ('le000000-0000-0000-0000-000000000104', v_python_course, 'ch000000-0000-0000-0000-000000000102', 'Conditional Statements (If/Else)', '## Making Decisions in Code
In programming, we often need to run different code blocks depending on certain criteria. We achieve this with `if`, `elif`, and `else` statements.

### Structure:
Python uses **indentation** (usually 4 spaces) to define code blocks. This is a unique and critical feature of Python.

### Example Code:
```python
score = 85
if score >= 90:
    print("Grade: A")
elif score >= 80:
    print("Grade: B")
else:
    print("Grade: C")
```
Watch the detailed walkthrough video below!', 4, 'video', 'https://www.youtube.com/embed/rfscVS0vtbw', 20, false, 1, true),

    ('le000000-0000-0000-0000-000000000105', v_python_course, 'ch000000-0000-0000-0000-000000000102', 'Loops & Iterations', '## Repeating Operations
Loops allow you to repeat a block of code multiple times. Python has two primary types of loops:
- **for loops**: Iterate over a sequence (list, range, string).
- **while loops**: Repeat as long as a condition is `True`.

### Examples:
```python
# For Loop
for i in range(5):
    print("Iteration:", i)

# While Loop
count = 0
while count < 3:
    print("Count is:", count)
    count += 1
```', 5, 'code', NULL, 15, false, 2, true),

    ('le000000-0000-0000-0000-000000000106', v_python_course, 'ch000000-0000-0000-0000-000000000102', 'Python Basics Assessment', 'Take this interactive quiz to evaluate your understanding of Python variables, data types, conditional statements, and loops.

You have a 15-minute time limit. A passing score of 70% is required to unlock the next chapter. Good luck!', 6, 'quiz', NULL, 15, false, 3, true),

    ('le000000-0000-0000-0000-000000000107', v_python_course, 'ch000000-0000-0000-0000-000000000103', 'Lists, Tuples & Collections', '## Grouping Data
In Python, lists and tuples are used to store multiple items in a single variable.

### Lists (Mutable):
You can change, add, and remove items from a list after it has been created. Defined with square brackets `[]`.
```python
fruits = ["apple", "banana", "cherry"]
fruits.append("orange")
print(fruits) # Output: [''apple'', ''banana'', ''cherry'', ''orange'']
```

### Tuples (Immutable):
You CANNOT change a tuple after creation. Defined with parentheses `()`. Used for fixed collections.
```python
coordinates = (40.7128, -74.0060)
```', 7, 'text', NULL, 20, false, 1, true),

    ('le000000-0000-0000-0000-000000000108', v_python_course, 'ch000000-0000-0000-0000-000000000103', 'Dictionaries and Sets', '## Key-Value Mappings & Unique Values
### Dictionaries (dict):
Store data in key:value pairs. They are ordered, changeable, and do not allow duplicates.
```python
student = {
    "name": "Alex Johnson",
    "major": "Computer Science",
    "gpa": 3.3
}
print(student["name"]) # Output: Alex Johnson
```

### Sets (set):
Unordered, unchangeable, and unindexed collections of unique elements.
```python
unique_numbers = {1, 2, 3, 3, 2, 4}
print(unique_numbers) # Output: {1, 2, 3, 4}
```', 8, 'code', NULL, 20, false, 2, true)
  ON CONFLICT (id) DO NOTHING;

  -- Web Dev Course Lessons
  INSERT INTO public.lessons (id, course_id, chapter_id, title, content, order_index, type, video_url, duration_mins, is_free_preview, lesson_order_in_chapter, is_published)
  VALUES
    ('le000000-0000-0000-0000-000000000201', v_webdev_course, 'ch000000-0000-0000-0000-000000000201', 'Web Architecture & HTML Intro', '## The Structure of the Web
How does a browser render a web page?
When you visit a URL, your browser sends an HTTP request to a server, which responds with HTML, CSS, and JavaScript.

- **HTML** (HyperText Markup Language) defines the structural skeleton.
- **CSS** (Cascading Style Sheets) styles the page.
- **JavaScript** provides interactivity.

In this lesson, we will write our first HTML document containing headers, paragraphs, and list elements!', 1, 'video', 'https://www.youtube.com/embed/pQN-pnXPaVg', 20, true, 1, true),

    ('le000000-0000-0000-0000-000000000202', v_webdev_course, 'ch000000-0000-0000-0000-000000000201', 'Working with Forms and Semantic Tags', '## Structuring Modern Web Pages
Modern HTML uses semantic tags (like `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`) to tell search engines and accessibility tools exactly what purpose each element serves.

### HTML Forms:
Forms are critical for collecting user inputs.
```html
<form action="/submit" method="POST">
  <label for="username">Username:</label>
  <input type="text" id="username" name="username">
  <button type="submit">Submit</button>
</form>
```', 2, 'text', NULL, 15, false, 2, true),

    ('le000000-0000-0000-0000-000000000203', v_webdev_course, 'ch000000-0000-0000-0000-000000000202', 'CSS Selectors & Box Model', '## Introduction to CSS3
CSS is what turns a plain text document into a beautiful, styled webpage.

### The CSS Box Model:
Every HTML element is rendered as a rectangular box. The box model consists of:
1. **Content**: The text/images.
2. **Padding**: Transparent space around content, inside borders.
3. **Border**: The outline surrounding padding.
4. **Margin**: Transparent space outside borders, separating elements.

```css
.card {
  width: 300px;
  padding: 15px;
  border: 1px solid #ddd;
  margin: 10px;
}
```', 3, 'text', NULL, 20, false, 1, true),

    ('le000000-0000-0000-0000-000000000204', v_webdev_course, 'ch000000-0000-0000-0000-000000000202', 'Flexbox & Responsive Layouts', '## Modern CSS Layouts
Flexbox (Flexible Box Layout) is a one-dimensional layout model that makes it easy to align and distribute space among items in a container, even when their size is dynamic.

### Quick Flexbox Rules:
```css
.container {
  display: flex;
  flex-direction: row; /* or column */
  justify-content: space-between; /* horizontal alignment */
  align-items: center; /* vertical alignment */
}
```', 4, 'text', NULL, 25, false, 2, true),

    ('le000000-0000-0000-0000-000000000205', v_webdev_course, 'ch000000-0000-0000-0000-000000000203', 'JS Basics: Variables and Functions', '## The Brain of the Web: JavaScript
JavaScript is a lightweight, interpreted scripting language with first-class functions. It runs client-side in the browser to make pages alive.

### Variables & Functions:
```javascript
let name = "James Miller";
const age = 32;

function greet(user) {
  return "Hello, " + user;
}
console.log(greet(name)); // Output: Hello, James Miller
```', 5, 'video', 'https://www.youtube.com/embed/W6NZfCO5SIk', 25, false, 1, true),

    ('le000000-0000-0000-0000-000000000206', v_webdev_course, 'ch000000-0000-0000-0000-000000000203', 'DOM Manipulation & Click Events', '## Interacting with HTML
The **DOM** (Document Object Model) is a programming interface for web documents. It represents the page so programs can change the structure, style, and content.

### Click Handler Example:
```javascript
const button = document.querySelector("#my-button");
button.addEventListener("click", () => {
  const header = document.querySelector("h1");
  header.textContent = "Clicked!";
  header.style.color = "red";
});
```', 6, 'code', NULL, 20, false, 2, true),

    ('le000000-0000-0000-0000-000000000207', v_webdev_course, 'ch000000-0000-0000-0000-000000000203', 'HTML & CSS Fundamentals Quiz', 'Test your knowledge on tags, box model elements, padding vs margin, flexbox layout properties, and CSS selectors.

You need a score of 60% or higher to pass this quiz!', 7, 'quiz', NULL, 15, false, 3, true)
  ON CONFLICT (id) DO NOTHING;

  -- ML Course Lessons
  INSERT INTO public.lessons (id, course_id, chapter_id, title, content, order_index, type, video_url, duration_mins, is_free_preview, lesson_order_in_chapter, is_published)
  VALUES
    ('le000000-0000-0000-0000-000000000301', v_ml_course, 'ch000000-0000-0000-0000-000000000301', 'Introduction to ML Paradigms', '## What is Machine Learning?
Machine Learning is a field of computer science that gives computers the ability to learn without being explicitly programmed.

### Three Paradigms of ML:
1. **Supervised Learning**: Model learns from labeled training data (inputs & targets).
2. **Unsupervised Learning**: Model finds hidden patterns in unlabeled data.
3. **Reinforcement Learning**: Model learns by taking actions in an environment to maximize some cumulative reward.

Watch Google''s excellent introductory lecture below!', 1, 'video', 'https://www.youtube.com/embed/7eh4d6sabA0', 20, true, 1, true),

    ('le000000-0000-0000-0000-000000000302', v_ml_course, 'ch000000-0000-0000-0000-000000000301', 'Setting Up Your Jupyter Environment', '## Jupyter Notebooks & Data Libraries
In this course, we will use Python along with libraries like:
- **NumPy**: Linear algebra and multi-dimensional arrays.
- **pandas**: Data manipulation and DataFrame objects.
- **scikit-learn**: Machine learning algorithms, pipeline tools, and evaluation metrics.', 2, 'text', NULL, 20, false, 2, true),

    ('le000000-0000-0000-0000-000000000303', v_ml_course, 'ch000000-0000-0000-0000-000000000302', 'Linear Regression from Scratch', '## Predicting Continuous Outcomes
Linear Regression models the relationship between a dependent scalar variable $y$ and one or more explanatory variables $x$.

### Implementation in Python:
```python
import numpy as np
from sklearn.linear_model import LinearRegression

# Generate dummy data
X = np.array([[1], [2], [3], [4]])
y = np.array([3, 5, 7, 9]) # y = 2x + 1

model = LinearRegression()
model.fit(X, y)
print("Slope:", model.coef_[0])     # Output: 2.0
print("Intercept:", model.intercept_) # Output: 1.0
```', 3, 'code', NULL, 25, false, 1, true),

    ('le000000-0000-0000-0000-000000000304', v_ml_course, 'ch000000-0000-0000-0000-000000000302', 'Logistic Regression & Classification', '## Classifying Categorical Outcomes
Unlike Linear Regression, **Logistic Regression** is used to predict categorical outcomes (e.g., Spam vs. Not Spam, Tumor vs. Benign). It uses the **sigmoid function** to map predictions to probabilities between 0 and 1.

Watch the freeCodeCamp lecture video below for a visual breakdown of linear decision boundaries!', 4, 'video', 'https://www.youtube.com/embed/i_LwzRVP7bg', 25, false, 2, true),

    ('le000000-0000-0000-0000-000000000305', v_ml_course, 'ch000000-0000-0000-0000-000000000302', 'Intro to Machine Learning Quiz', 'Validate your conceptual understanding of supervised vs unsupervised paradigms, parameters, features, overfitting, and sklearn syntax.

A passing score of 75% is required!', 5, 'quiz', NULL, 15, false, 3, true)
  ON CONFLICT (id) DO NOTHING;

  -- 5. SEED RESOURCES
  -- Python Course Resources
  INSERT INTO public.resources (id, lesson_id, coach_id, title, type, url, access_level, is_permanently_free)
  VALUES
    ('re000000-0000-0000-0000-000000000101', 'le000000-0000-0000-0000-000000000101', v_coach_zain, 'Official Python Tutorial', 'link', 'https://docs.python.org/3/tutorial/index.html', 'free', true),
    ('re000000-0000-0000-0000-000000000102', 'le000000-0000-0000-0000-000000000107', v_coach_zain, 'Python Data Structures Guide', 'pdf', 'https://docs.python.org/3/tutorial/datastructures.html', 'free', true)
  ON CONFLICT (id) DO NOTHING;

  -- Web Dev Course Resources
  INSERT INTO public.resources (id, lesson_id, coach_id, title, type, url, access_level, is_permanently_free)
  VALUES
    ('re000000-0000-0000-0000-000000000201', 'le000000-0000-0000-0000-000000000201', v_coach_james, 'MDN Web Docs: HTML Learning Area', 'link', 'https://developer.mozilla.org/en-US/docs/Learn', 'free', true),
    ('re000000-0000-0000-0000-000000000203', 'le000000-0000-0000-0000-000000000203', v_coach_james, 'CSS Box Model Explained (Interactive)', 'link', 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Box_Model/Introduction_to_the_CSS_box_model', 'free', true)
  ON CONFLICT (id) DO NOTHING;

  -- ML Course Resources
  INSERT INTO public.resources (id, lesson_id, coach_id, title, type, url, access_level, is_permanently_free)
  VALUES
    ('re000000-0000-0000-0000-000000000301', 'le000000-0000-0000-0000-000000000301', v_coach_priya, 'Stanford CS231n Deep Learning Notes', 'link', 'https://cs231n.github.io/', 'members', false),
    ('re000000-0000-0000-0000-000000000302', 'le000000-0000-0000-0000-000000000302', v_coach_priya, 'scikit-learn Linear Models Tutorial', 'link', 'https://scikit-learn.org/stable/tutorial/basic/tutorial.html', 'free', true)
  ON CONFLICT (id) DO NOTHING;

END $$;
