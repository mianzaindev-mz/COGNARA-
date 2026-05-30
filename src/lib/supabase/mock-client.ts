const serverCourseStore = new Map<string, any[]>();

function defaultMockCourses(demoUser: any) {
  return [
    {
      id: "c-dsa",
      coach_id: "00000000-0000-0000-0000-000000000001",
      title: "Data Structures & Algos",
      slug: "dsa",
      description: "A visual path through arrays, recursion, graphs, and algorithmic thinking.",
      category: "Computer Science",
      difficulty: "intermediate",
      total_lessons: 5,
      total_enrolled: 312,
      avg_rating: 4.8,
      price_usd: 0,
      is_published: true,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "c-marketing",
      coach_id: "00000000-0000-0000-0000-000000000001",
      title: "Digital Marketing Pro",
      slug: "marketing",
      description: "Plan campaigns, analyze funnels, and build a practical launch playbook.",
      category: "Marketing",
      difficulty: "beginner",
      total_lessons: 4,
      total_enrolled: 188,
      avg_rating: 4.7,
      price_usd: 24,
      is_published: true,
      created_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "c1",
      coach_id: demoUser.id,
      title: "Advanced Algorithms",
      slug: "advanced-algorithms",
      description: "Master graph traversal, dynamic programming, and complexity analysis.",
      category: "CS Core",
      difficulty: "advanced",
      total_lessons: 12,
      total_enrolled: 124,
      avg_rating: 4.9,
      price_usd: 50.00,
      is_published: true,
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "c2",
      coach_id: demoUser.id,
      title: "Systems Architecture",
      slug: "systems-architecture",
      description: "Design scalable services, data flows, and resilient platform patterns.",
      category: "Engineering",
      difficulty: "intermediate",
      total_lessons: 9,
      total_enrolled: 89,
      avg_rating: 4.7,
      price_usd: 17.42,
      is_published: true,
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "c-cyber",
      coach_id: "00000000-0000-0000-0000-000000000001",
      title: "Cybersecurity Fundamentals",
      slug: "cybersecurity-fundamentals",
      description: "Master threat detection, encryption, social engineering defenses, and incident response.",
      category: "Security",
      difficulty: "intermediate",
      total_lessons: 4,
      total_enrolled: 215,
      avg_rating: 4.9,
      price_usd: 0,
      is_published: true,
      created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "c-flagged",
      coach_id: "00000000-0000-0000-0000-000000000099",
      title: "Controversial Content Creation",
      slug: "controversial-content",
      description: "A questionable course with potentially inappropriate material that violates platform guidelines.",
      category: "Marketing",
      difficulty: "beginner",
      total_lessons: 3,
      total_enrolled: 42,
      avg_rating: 2.1,
      price_usd: 99,
      is_published: true,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];
}

function loadMockCourses(demoUser: any) {
  const key = `cognara_mock_courses_${demoUser.id}`;

  if (typeof window === "undefined") {
    if (!serverCourseStore.has(key)) {
      serverCourseStore.set(key, defaultMockCourses(demoUser));
    }
    const existing = serverCourseStore.get(key) ?? [];
    const merged = [
      ...defaultMockCourses(demoUser).filter((course) => !existing.some((item) => item.id === course.id)),
      ...existing,
    ];
    serverCourseStore.set(key, merged);
    return [...merged];
  }

  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const existing = JSON.parse(stored);
      const merged = [
        ...defaultMockCourses(demoUser).filter((course) => !existing.some((item: any) => item.id === course.id)),
        ...existing,
      ];
      localStorage.setItem(key, JSON.stringify(merged));
      return merged;
    }
    const defaults = defaultMockCourses(demoUser);
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  } catch {
    return defaultMockCourses(demoUser);
  }
}

function saveMockCourses(demoUser: any, courses: any[]) {
  const key = `cognara_mock_courses_${demoUser.id}`;

  if (typeof window === "undefined") {
    serverCourseStore.set(key, courses);
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(courses));
  } catch {
    // Ignore storage errors in demo mode.
  }
}

export function createMockQueryBuilder(tableName: string, demoUser: any) {
  const builder: any = {
    _single: false,
    _filters: [] as { field: string; value: any }[],
    _operation: "select" as "select" | "insert" | "update" | "delete" | "upsert",
    _payload: null as any,

    select: () => { if (builder._operation !== "insert" && builder._operation !== "update" && builder._operation !== "upsert") { builder._operation = "select"; } return builder; },
    eq: (field: string, value: any) => {
      builder._filters.push({ field, value });
      return builder;
    },
    neq: () => builder,
    gt: () => builder,
    lt: () => builder,
    gte: () => builder,
    lte: () => builder,
    like: () => builder,
    ilike: () => builder,
    is: () => builder,
    in: () => builder,
    not: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => builder,
    single: () => { builder._single = true; return builder; },
    maybeSingle: () => { builder._single = true; return builder; },
    insert: (payload: any) => {
      builder._operation = "insert";
      builder._payload = payload;
      return builder;
    },
    update: (payload: any) => {
      builder._operation = "update";
      builder._payload = payload;
      return builder;
    },
    upsert: (payload: any) => {
      builder._operation = "upsert";
      builder._payload = payload;
      return builder;
    },
    delete: () => {
      builder._operation = "delete";
      return builder;
    },

    then: (onfulfilled: any) => {
      let data: any = null;
      const error: any = null;

      if (tableName === "profiles") {
        data = {
          id: demoUser.id,
          full_name: demoUser.name || "Demo User",
          role: demoUser.role || "student",
          username: demoUser.email?.split("@")[0] || "demo",
          bio: "Passionate learner exploring advanced technologies on COGNARA™.",
          github_url: "https://github.com",
          linkedin_url: "https://linkedin.com",
          is_verified: demoUser.role === "coach" ? false : true, // Mock verification false for coaches to show banner
        };
      } else if (tableName === "user_settings") {
        data = {
          user_id: demoUser.id,
          onboarding_complete: true,
          theme: "dark",
        };
      } else if (tableName === "ai_credits") {
        data = {
          user_id: demoUser.id,
          balance: 150,
        };
      } else if (tableName === "user_xp") {
        data = {
          user_id: demoUser.id,
          streak_days: 5,
          total_xp: 1250,
          level: 4,
        };
      } else if (tableName === "enrollments") {
        let list = demoUser.role === "student" ? [
          {
            id: "en-dsa",
            student_id: demoUser.id,
            course_id: "c-dsa",
            progress_pct: 75,
            enrolled_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            completed_at: null,
            profiles: {
              full_name: demoUser.name || "Demo Student",
              email: demoUser.email,
              avatar_url: null,
            },
            courses: {
              id: "c-dsa",
              title: "Data Structures & Algorithms",
              slug: "dsa",
              category: "Computer Science",
              difficulty: "intermediate",
              thumbnail_url: null,
              total_lessons: 12,
              total_enrolled: 347,
            },
          },
          {
            id: "en-marketing",
            student_id: demoUser.id,
            course_id: "c-marketing",
            progress_pct: 75,
            enrolled_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            completed_at: null,
            profiles: {
              full_name: demoUser.name || "Demo Student",
              email: demoUser.email,
              avatar_url: null,
            },
            courses: {
              id: "c-marketing",
              title: "Digital Marketing Pro",
              slug: "marketing",
              category: "Marketing",
              difficulty: "beginner",
              thumbnail_url: null,
              total_lessons: 8,
              total_enrolled: 156,
            },
          },
          {
            id: "en-cyber",
            student_id: demoUser.id,
            course_id: "c-cyber",
            progress_pct: 40,
            enrolled_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            completed_at: null,
            profiles: {
              full_name: demoUser.name || "Demo Student",
              email: demoUser.email,
              avatar_url: null,
            },
            courses: {
              id: "c-cyber",
              title: "Cybersecurity Fundamentals",
              slug: "cybersecurity-fundamentals",
              category: "Security",
              difficulty: "intermediate",
              thumbnail_url: null,
              total_lessons: 4,
              total_enrolled: 215,
            },
          },
          {
            id: "en-flagged",
            student_id: demoUser.id,
            course_id: "c-flagged",
            progress_pct: 15,
            enrolled_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            completed_at: null,
            profiles: {
              full_name: demoUser.name || "Demo Student",
              email: demoUser.email,
              avatar_url: null,
            },
            courses: {
              id: "c-flagged",
              title: "Controversial Content Creation",
              slug: "controversial-content",
              category: "Marketing",
              difficulty: "beginner",
              thumbnail_url: null,
              total_lessons: 3,
              total_enrolled: 42,
            },
          },
        ] : [];

        if (demoUser.role === "coach") {
          list = [
            {
              id: "en-coach-demo",
              student_id: "00000000-0000-0000-0000-000000000002",
              course_id: "c-dsa",
              progress_pct: 75,
              enrolled_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
              completed_at: null,
              profiles: {
                full_name: "Demo Student",
                email: "student@gmail.com",
                avatar_url: null,
              },
              courses: {
                id: "c-dsa",
                title: "Data Structures & Algorithms",
                slug: "dsa",
                category: "Computer Science",
                difficulty: "intermediate",
                thumbnail_url: null,
                total_lessons: 12,
                total_enrolled: 347,
              },
            },
          ];
        }

        data = list.filter((item: any) => builder._filters.every((f: any) => item[f.field] === f.value));
      } else if (tableName === "agent_sessions") {
        data = [
          { id: "s1", skill: "Ask a question", created_at: new Date().toISOString() },
          { id: "s2", skill: "Debug code", created_at: new Date(Date.now() - 86400000).toISOString() },
        ];
      } else if (tableName === "courses") {
        let list = loadMockCourses(demoUser);

        const matchesFilters = (item: any) => {
          return builder._filters.every((f: any) => item[f.field] === f.value);
        };

        if (builder._operation === "select") {
          data = list.filter(matchesFilters);
        } else if (builder._operation === "insert") {
          const payloads = Array.isArray(builder._payload) ? builder._payload : [builder._payload];
          const newRecords = payloads.map((p: any) => ({
            id: p.id || `c-${Math.random().toString(36).slice(2, 10)}`,
            coach_id: p.coach_id || demoUser.id,
            title: p.title || "Untitled Course",
            slug: p.slug || `course-${Math.random().toString(36).slice(2, 7)}`,
            description: p.description ?? null,
            category: p.category || "Computer Science",
            difficulty: p.difficulty || "beginner",
            total_lessons: p.total_lessons ?? 0,
            total_enrolled: p.total_enrolled ?? 0,
            avg_rating: p.avg_rating ?? null,
            price_usd: p.price_usd ?? 0,
            is_published: p.is_published ?? false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));
          list = [...newRecords, ...list];
          saveMockCourses(demoUser, list);
          data = Array.isArray(builder._payload) ? newRecords : newRecords[0];
        } else if (builder._operation === "update") {
          const updated: any[] = [];
          list = list.map((item: any) => {
            if (!matchesFilters(item)) return item;
            const next = { ...item, ...builder._payload, updated_at: new Date().toISOString() };
            updated.push(next);
            return next;
          });
          saveMockCourses(demoUser, list);
          data = updated;
        } else if (builder._operation === "delete") {
          const deleted = list.filter(matchesFilters);
          list = list.filter((item: any) => !matchesFilters(item));
          saveMockCourses(demoUser, list);
          data = deleted;
        } else {
          data = list.filter(matchesFilters);
        }
      } else if (tableName === "notifications") {
        data = [
          {
            id: "n1",
            user_id: demoUser.id,
            type: "verified",
            title: "Ahmed K. mastered \"Recursive Structures\"",
            message: "Ahmed K. completed all modules and quizzes for Recursive Structures with 100% score.",
            is_read: false,
            created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          },
          {
            id: "n2",
            user_id: demoUser.id,
            type: "feedback",
            title: "Sara M. left a 5-star review: \"Excellent depth.\"",
            message: "Sara M. rated your course 5 stars and wrote: 'Excellent depth, very well explained.'",
            is_read: false,
            created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          },
          {
            id: "n3",
            user_id: demoUser.id,
            type: "conversion",
            title: "New Enrollment: Bilal J. joined Architecture",
            message: "Bilal J. purchased and enrolled in Systems Architecture course.",
            is_read: false,
            created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          }
        ];
      } else if (tableName === "lessons") {
        const list = [
          {
            id: "dsa-l1",
            course_id: "c-dsa",
            title: "Arrays as Memory Maps",
            content: null,
            order_index: 1,
            duration_mins: 12,
            type: "text",
            is_graded: false,
          },
          {
            id: "dsa-l2",
            course_id: "c-dsa",
            title: "Stacks, Queues, and Flow",
            content: null,
            order_index: 2,
            duration_mins: 14,
            type: "text",
            is_graded: false,
          },
          {
            id: "dsa-l3",
            course_id: "c-dsa",
            title: "Recursion and Call Trees",
            content: null,
            order_index: 3,
            duration_mins: 16,
            type: "text",
            is_graded: true,
          },
          {
            id: "dsa-l4",
            course_id: "c-dsa",
            title: "Graph Traversal Islands",
            content: null,
            order_index: 4,
            duration_mins: 18,
            type: "text",
            is_graded: false,
          },
          {
            id: "dsa-l5",
            course_id: "c-dsa",
            title: "Dynamic Programming Routes",
            content: null,
            order_index: 5,
            duration_mins: 20,
            type: "text",
            is_graded: true,
          },
          {
            id: "marketing-l1",
            course_id: "c-marketing",
            title: "Audience Research",
            content: null,
            order_index: 1,
            duration_mins: 11,
            type: "text",
            is_graded: false,
          },
          {
            id: "marketing-l2",
            course_id: "c-marketing",
            title: "Offer Positioning",
            content: null,
            order_index: 2,
            duration_mins: 13,
            type: "text",
            is_graded: false,
          },
          {
            id: "cyber-l1",
            course_id: "c-cyber",
            title: "Threat Landscape Overview",
            content: null,
            order_index: 1,
            duration_mins: 15,
            type: "text",
            is_graded: false,
          },
          {
            id: "cyber-l2",
            course_id: "c-cyber",
            title: "Encryption & Authentication",
            content: null,
            order_index: 2,
            duration_mins: 18,
            type: "text",
            is_graded: false,
          },
          {
            id: "cyber-l3",
            course_id: "c-cyber",
            title: "Social Engineering Defense",
            content: null,
            order_index: 3,
            duration_mins: 14,
            type: "text",
            is_graded: true,
          },
          {
            id: "cyber-l4",
            course_id: "c-cyber",
            title: "Incident Response Protocols",
            content: null,
            order_index: 4,
            duration_mins: 20,
            type: "text",
            is_graded: true,
          },
          {
            id: "flagged-l1",
            course_id: "c-flagged",
            title: "Getting Started with Clickbait",
            content: null,
            order_index: 1,
            duration_mins: 8,
            type: "text",
            is_graded: false,
          },
          {
            id: "flagged-l2",
            course_id: "c-flagged",
            title: "Misleading Thumbnails 101",
            content: null,
            order_index: 2,
            duration_mins: 10,
            type: "text",
            is_graded: false,
          },
          {
            id: "flagged-l3",
            course_id: "c-flagged",
            title: "Manipulative Copywriting",
            content: null,
            order_index: 3,
            duration_mins: 12,
            type: "text",
            is_graded: false,
          },
        ];
        data = list.filter((item: any) => builder._filters.every((f: any) => item[f.field] === f.value));
      } else if (tableName === "lesson_progress") {
        const list = [
          { student_id: demoUser.id, lesson_id: "dsa-l1", completed: true },
          { student_id: demoUser.id, lesson_id: "dsa-l2", completed: true },
        ];
        data = list.filter((item: any) => builder._filters.every((f: any) => item[f.field] === f.value));
      } else if (tableName === "notebooks") {
        const key = `cognara_mock_notebooks_${demoUser.id}`;
        let list: any[] = [];
        try {
          const stored = typeof window !== "undefined" ? localStorage.getItem(key) : null;
          if (stored) {
            list = JSON.parse(stored);
          } else {
            list = [
              {
                id: "n-default",
                student_id: demoUser.id,
                title: "Default Notebook",
                course_id: "c1",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            ];
            if (typeof window !== "undefined") {
              localStorage.setItem(key, JSON.stringify(list));
            }
          }
        } catch {
          // storage error — silently ignore
        }

        if (builder._operation === "select") {
          data = list.filter(item => {
            return builder._filters.every((f: any) => {
              const fKey = f.field === "user_id" ? "student_id" : f.field;
              const itemVal = fKey === "user_id" ? item.student_id : item[fKey];
              return itemVal === f.value;
            });
          });
          data.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        } else if (builder._operation === "insert") {
          const payloads = Array.isArray(builder._payload) ? builder._payload : [builder._payload];
          const newRecords = payloads.map((p: any) => {
            return {
              id: p.id || `n-${Math.random().toString(36).substring(2, 9)}`,
              student_id: p.student_id || p.user_id || demoUser.id,
              course_id: p.course_id || null,
              title: p.title || "Untitled Notebook",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          });
          list = [...newRecords, ...list];
          try {
            if (typeof window !== "undefined") {
              localStorage.setItem(key, JSON.stringify(list));
            }
          } catch {}
          data = Array.isArray(builder._payload) ? newRecords : newRecords[0];
        } else if (builder._operation === "update") {
          list = list.map(item => {
            const matches = builder._filters.every((f: any) => {
              const fKey = f.field === "user_id" ? "student_id" : f.field;
              const itemVal = fKey === "user_id" ? item.student_id : item[fKey];
              return itemVal === f.value;
            });
            if (matches) {
              const updated = {
                ...item,
                ...builder._payload,
                updated_at: new Date().toISOString()
              };
              data = updated;
              return updated;
            }
            return item;
          });
          try {
            if (typeof window !== "undefined") {
              localStorage.setItem(key, JSON.stringify(list));
            }
          } catch {}
          if (!Array.isArray(data)) {
            data = data ? [data] : [];
          }
        } else if (builder._operation === "delete") {
          const deleted: any[] = [];
          list = list.filter(item => {
            const matches = builder._filters.every((f: any) => {
              const fKey = f.field === "user_id" ? "student_id" : f.field;
              const itemVal = fKey === "user_id" ? item.student_id : item[fKey];
              return itemVal === f.value;
            });
            if (matches) {
              deleted.push(item);
              return false;
            }
            return true;
          });
          try {
            if (typeof window !== "undefined") {
              localStorage.setItem(key, JSON.stringify(list));
            }
          } catch {}
          data = deleted;
        }
      } else if (tableName === "notebook_pages") {
        const key = `cognara_mock_notebook_pages_${demoUser.id}`;
        let list: any[] = [];
        try {
          const stored = typeof window !== "undefined" ? localStorage.getItem(key) : null;
          if (stored) {
            list = JSON.parse(stored);
          } else {
            list = [
              {
                id: "np-default",
                notebook_id: "n-default",
                title: "Page 1",
                content_text: "Welcome to your upgraded Student Notebook! Type / to add blocks or toggle freehand mode to sketch.",
                content_canvas: {
                  mode: "modular",
                  modular_blocks: [
                    {
                      id: "b1",
                      type: "heading",
                      content: "Welcome to your Advanced Notes",
                      properties: { level: 2 },
                      createdAt: new Date().toISOString(),
                      lastEditedAt: new Date().toISOString(),
                    },
                    {
                      id: "b2",
                      type: "text",
                      content: "This is a modular note block. You can drag and drop to reorder blocks, use inline styling, or insert code blocks.",
                      createdAt: new Date().toISOString(),
                      lastEditedAt: new Date().toISOString(),
                    }
                  ]
                },
                order_index: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            ];
            if (typeof window !== "undefined") {
              localStorage.setItem(key, JSON.stringify(list));
            }
          }
        } catch {}

        if (builder._operation === "select") {
          data = list.filter(item => {
            return builder._filters.every((f: any) => {
              return item[f.field] === f.value;
            });
          });
          data.sort((a: any, b: any) => a.order_index - b.order_index);
        } else if (builder._operation === "insert") {
          const payloads = Array.isArray(builder._payload) ? builder._payload : [builder._payload];
          const newRecords = payloads.map((p: any) => {
            return {
              id: p.id || `np-${Math.random().toString(36).substring(2, 9)}`,
              notebook_id: p.notebook_id,
              title: p.title || "Untitled Page",
              content_text: p.content_text || "",
              content_canvas: p.content_canvas || { mode: "modular", modular_blocks: [] },
              order_index: p.order_index || 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          });
          list = [...list, ...newRecords];
          try {
            if (typeof window !== "undefined") {
              localStorage.setItem(key, JSON.stringify(list));
            }
          } catch {}
          data = Array.isArray(builder._payload) ? newRecords : newRecords[0];
        } else if (builder._operation === "update") {
          let updatedRecord: any = null;
          list = list.map(item => {
            const matches = builder._filters.every((f: any) => {
              return item[f.field] === f.value;
            });
            if (matches) {
              const updated = {
                ...item,
                ...builder._payload,
                updated_at: new Date().toISOString()
              };
              updatedRecord = updated;
              return updated;
            }
            return item;
          });
          try {
            if (typeof window !== "undefined") {
              localStorage.setItem(key, JSON.stringify(list));
            }
          } catch {}
          data = updatedRecord ? [updatedRecord] : [];
        } else if (builder._operation === "delete") {
          const deleted: any[] = [];
          list = list.filter(item => {
            const matches = builder._filters.every((f: any) => {
              return item[f.field] === f.value;
            });
            if (matches) {
              deleted.push(item);
              return false;
            }
            return true;
          });
          try {
            if (typeof window !== "undefined") {
              localStorage.setItem(key, JSON.stringify(list));
            }
          } catch {}
          data = deleted;
        }
      } else if (tableName === "notebook_share_tokens") {
        const key = `cognara_mock_notebook_share_tokens_${demoUser.id}`;
        let list: any[] = [];
        try {
          const stored = typeof window !== "undefined" ? localStorage.getItem(key) : null;
          list = stored ? JSON.parse(stored) : [];
        } catch {}

        if (builder._operation === "select") {
          data = list.filter(item => {
            return builder._filters.every((f: any) => item[f.field] === f.value);
          });
        } else if (builder._operation === "insert") {
          const payloads = Array.isArray(builder._payload) ? builder._payload : [builder._payload];
          const newRecords = payloads.map((p: any) => ({
            id: p.id || `nst-${Math.random().toString(36).substring(2, 9)}`,
            page_id: p.page_id,
            created_by: p.created_by || demoUser.id,
            token: p.token,
            visibility: p.visibility || "private_link",
            expires_at: p.expires_at || null,
            revoked_at: p.revoked_at || null,
            created_at: new Date().toISOString(),
          }));
          list = [...list, ...newRecords];
          try {
            if (typeof window !== "undefined") {
              localStorage.setItem(key, JSON.stringify(list));
            }
          } catch {}
          data = Array.isArray(builder._payload) ? newRecords : newRecords[0];
        } else if (builder._operation === "update") {
          let updatedRecord: any = null;
          list = list.map(item => {
            const matches = builder._filters.every((f: any) => item[f.field] === f.value);
            if (!matches) return item;
            updatedRecord = { ...item, ...builder._payload };
            return updatedRecord;
          });
          try {
            if (typeof window !== "undefined") {
              localStorage.setItem(key, JSON.stringify(list));
            }
          } catch {}
          data = updatedRecord ? [updatedRecord] : [];
        }
      } else if (tableName === "notebook_page_versions") {
        data = [];
      } else {
        data = [];
      }

      if (builder._single && Array.isArray(data)) {
        data = data[0] || null;
      }

      return Promise.resolve(onfulfilled({ data, error }));
    }
  };

  return builder;
}

export function createMockSupabaseClient(demoUser: any, onSignOut?: () => void) {
  return {
    auth: {
      getUser: async () => {
        return {
          data: {
            user: {
              id: demoUser.id,
              email: demoUser.email,
              user_metadata: {
                full_name: demoUser.name,
                role: demoUser.role,
              },
              role: "authenticated",
            }
          },
          error: null,
        };
      },
      getSession: async () => {
        return {
          data: {
            session: {
              user: {
                id: demoUser.id,
                email: demoUser.email,
                user_metadata: {
                  full_name: demoUser.name,
                  role: demoUser.role,
                },
              }
            }
          },
          error: null,
        };
      },
      signInWithPassword: async () => {
        return {
          data: {
            user: {
              id: demoUser.id,
              email: demoUser.email,
            }
          },
          error: null,
        };
      },
      signOut: async () => {
        if (onSignOut) {
          onSignOut();
        }
        return { error: null };
      }
    },
    from: (tableName: string) => {
      return createMockQueryBuilder(tableName, demoUser);
    }
  } as any;
}
