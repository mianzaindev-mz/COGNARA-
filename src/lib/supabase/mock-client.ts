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
            title: "Data Structures & Algorithms",
            slug: "dsa",
            category: "Computer Science",
            total_lessons: 20,
            is_published: true,
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
