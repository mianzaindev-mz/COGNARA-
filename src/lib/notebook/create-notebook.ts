"use client";

import { createClient } from "@/lib/supabase/client";
import { isValidUUID } from "@/lib/utils/uuid";

export type CreatedNotebook = {
  notebookId: string;
  pageId: string | null;
};

export function buildDefaultNotebookCanvas(title = "New Notebook") {
  const now = new Date().toISOString();

  return {
    mode: "modular",
    bgType: "ruled",
    modular_blocks: [
      {
        id: `b-${Math.random().toString(36).slice(2, 9)}`,
        type: "heading",
        content: title,
        properties: { level: 2 },
        createdAt: now,
        lastEditedAt: now,
      },
      {
        id: `b-${Math.random().toString(36).slice(2, 9)}`,
        type: "text",
        content: "Start typing notes here, or switch to freehand canvas to draw.",
        createdAt: now,
        lastEditedAt: now,
      },
    ],
    freehand_strokes: [],
    freehand_annotations: [],
  };
}

export async function createNotebookWithFirstPage(title = "New Notebook"): Promise<CreatedNotebook> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error("Notebook storage is not connected. Check Supabase environment settings.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error("Your session expired. Please sign in again before creating a notebook.");
  }

  if (!isValidUUID(user.id)) {
    throw new Error("Invalid user ID");
  }

  const { data: notebook, error: notebookError } = await supabase
    .from("notebooks")
    .insert({
      student_id: user.id,
      title,
      course_id: null,
    })
    .select()
    .single();

  if (notebookError || !notebook) {
    throw new Error(notebookError?.message || "Notebook could not be created.");
  }

  const { data: page, error: pageError } = await supabase
    .from("notebook_pages")
    .insert({
      notebook_id: notebook.id,
      title: "Page 1",
      content_text: "Welcome to your new page!",
      content_canvas: buildDefaultNotebookCanvas(title),
      order_index: 0,
    })
    .select()
    .single();

  if (pageError || !page) {
    await supabase.from("notebooks").delete().eq("id", notebook.id);
    throw new Error(pageError?.message || "Notebook page could not be created.");
  }

  return {
    notebookId: notebook.id,
    pageId: page.id,
  };
}
