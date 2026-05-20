export function createMockQueryBuilder(tableName: string, demoUser: any) {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
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
    single: () => builder,
    maybeSingle: () => builder,
    insert: () => builder,
    update: () => builder,
    upsert: () => builder,
    delete: () => builder,

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
        data = [];
      } else if (tableName === "agent_sessions") {
        data = [
          { id: "s1", skill: "Ask a question", created_at: new Date().toISOString() },
          { id: "s2", skill: "Debug code", created_at: new Date(Date.now() - 86400000).toISOString() },
        ];
      } else if (tableName === "courses") {
        data = [
          {
            id: "c1",
            coach_id: demoUser.id,
            title: "Advanced Algorithms",
            slug: "advanced-algorithms",
            category: "CS Core",
            total_enrolled: 124,
            avg_rating: 4.9,
            price_usd: 50.00,
            is_published: true,
            updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "c2",
            coach_id: demoUser.id,
            title: "Systems Architecture",
            slug: "systems-architecture",
            category: "Engineering",
            total_enrolled: 89,
            avg_rating: 4.7,
            price_usd: 17.42,
            is_published: true,
            updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          }
        ];
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
      } else {
        data = [];
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
