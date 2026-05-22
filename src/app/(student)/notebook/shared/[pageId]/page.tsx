import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SharedNotebookPageProps = {
  params: Promise<{ pageId: string }>;
};

export default async function SharedNotebookPage({ params }: SharedNotebookPageProps) {
  const { pageId } = await params;
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("notebook_pages")
    .select("id, title, content_text, content_canvas, notebooks(title)")
    .eq("id", pageId)
    .maybeSingle();

  if (!page) {
    notFound();
  }

  const canvas = page.content_canvas as any;
  const blocks = Array.isArray(canvas?.modular_blocks) ? canvas.modular_blocks : [];
  const notebook = Array.isArray(page.notebooks) ? page.notebooks[0] : page.notebooks;

  return (
    <div className="mx-auto max-w-4xl px-margin-desktop py-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link href="/notebook" className="text-xs font-black uppercase tracking-[0.2em] text-primary hover:underline">
            Back to notebook
          </Link>
          <h1 className="mt-3 text-4xl font-black text-on-surface">{page.title || "Shared Note"}</h1>
          <p className="mt-2 text-sm font-semibold text-on-surface-variant/70">
            {notebook?.title || "COGNARA Notebook"}
          </p>
        </div>
      </div>

      <article className="rounded-[2rem] border border-black/10 bg-white/80 p-8 shadow-xl backdrop-blur dark:border-white/10 dark:bg-[#1a1816]/80">
        {blocks.length > 0 ? (
          <div className="space-y-5">
            {blocks.map((block: any) => {
              if (block.type === "heading") {
                return (
                  <h2 key={block.id} className="text-2xl font-black text-on-surface">
                    {block.content}
                  </h2>
                );
              }

              if (block.type === "code") {
                return (
                  <pre key={block.id} className="overflow-x-auto rounded-2xl bg-black p-4 text-sm text-white">
                    <code>{block.content}</code>
                  </pre>
                );
              }

              if (block.type === "checkbox") {
                return (
                  <p key={block.id} className="flex items-start gap-3 text-sm font-semibold text-on-surface">
                    <span className="material-symbols-outlined text-primary">
                      {block.properties?.checked ? "check_box" : "check_box_outline_blank"}
                    </span>
                    {block.content}
                  </p>
                );
              }

              return (
                <p key={block.id} className="whitespace-pre-wrap text-base leading-7 text-on-surface-variant">
                  {block.content}
                </p>
              );
            })}
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-base leading-7 text-on-surface-variant">
            {page.content_text || "This shared note is empty."}
          </p>
        )}
      </article>
    </div>
  );
}
