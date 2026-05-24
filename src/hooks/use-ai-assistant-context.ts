"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/auth/roles";
import { isValidUUID } from "@/lib/utils/uuid";

export interface AIAssistantContext {
  isEnabled: boolean;
  userRole: UserRole | null;
  currentPage: string;
  currentLessonTitle?: string;
  currentCourseTitle?: string;
  isQuizActive: boolean;
  isLoading: boolean;
}

const EXCLUDED_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/banned",
];

const QUIZ_PATHS = [
  "/quiz",
  "/assessment",
  "/exam",
  "/test",
];

export function useAIAssistantContext(): AIAssistantContext {
  const pathname = usePathname();
  const [context, setContext] = useState<AIAssistantContext>({
    isEnabled: false,
    userRole: null,
    currentPage: pathname,
    isQuizActive: false,
    isLoading: true,
  });

  useEffect(() => {
    let mounted = true;

    async function fetchContext() {
      try {
        console.log("[AI Assistant Context] Fetching context for:", pathname);
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        console.log("[AI Assistant Context] User:", user ? user.id : "No user");

        if (!user) {
          console.log("[AI Assistant Context] No user found, disabling AI");
          if (mounted) {
            setContext({
              isEnabled: false,
              userRole: null,
              currentPage: pathname,
              isQuizActive: false,
              isLoading: false,
            });
          }
          return;
        }

        if (!isValidUUID(user.id)) {
          console.log("[AI Assistant Context] Invalid UUID, disabling AI");
          if (mounted) {
            setContext({
              isEnabled: false,
              userRole: null,
              currentPage: pathname,
              isQuizActive: false,
              isLoading: false,
            });
          }
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        const userRole = profile?.role as UserRole || "student";
        console.log("[AI Assistant Context] User role:", userRole);

        const isExcluded = EXCLUDED_PATHS.some((path) =>
          pathname === path || pathname.startsWith(path + "/")
        );

        const isQuizPath = QUIZ_PATHS.some((path) =>
          pathname.includes(path)
        );

        console.log("[AI Assistant Context] isExcluded:", isExcluded, "isQuizPath:", isQuizPath);

        if (mounted) {
          setContext({
            isEnabled: !isExcluded,
            userRole,
            currentPage: pathname,
            isQuizActive: isQuizPath,
            isLoading: false,
          });
          console.log("[AI Assistant Context] Context set:", { isEnabled: !isExcluded, userRole, isQuizPath });
        }
      } catch (error) {
        console.error("[AI Assistant Context] Error fetching context:", error);
        if (mounted) {
          setContext({
            isEnabled: false,
            userRole: null,
            currentPage: pathname,
            isQuizActive: false,
            isLoading: false,
          });
        }
      }
    }

    fetchContext();

    return () => {
      mounted = false;
    };
  }, [pathname]);

  return context;
}
