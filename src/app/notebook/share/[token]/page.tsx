import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

type NotebookSharePageProps = {
  params: Promise<{ token: string }>;
};

export default async function NotebookSharePage({ params }: NotebookSharePageProps) {
  const { token } = await params;

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    supabase = await createServerClient();
  }

  const { data: share } = await supabase
    .from("notebook_share_tokens")
    .select("page_id, visibility, expires_at, revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (
    !share ||
    share.revoked_at ||
    (share.expires_at && new Date(share.expires_at).getTime() < Date.now())
  ) {
    notFound();
  }

  const { data: page } = await supabase
    .from("notebook_pages")
    .select("id, title, content_text, content_canvas, notebooks(title)")
    .eq("id", share.page_id)
    .maybeSingle();

  if (!page) {
    notFound();
  }

  const canvas = page.content_canvas as any;
  const blocks = Array.isArray(canvas?.modular_blocks) ? canvas.modular_blocks : [];
  const notebook = Array.isArray(page.notebooks) ? page.notebooks[0] : page.notebooks;

  return (
    <main className="min-h-screen bg-cn-canvas px-6 py-10 text-cn-ink dark:bg-[#0c0a09] dark:text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-3 border-b border-black/10 pb-6 dark:border-white/10">
          <Link href="/" className="text-xs font-black uppercase tracking-[0.2em] text-cn-orange hover:underline">
            COGNARA shared notebook
          </Link>
          <h1 className="text-4xl font-black tracking-tight">{page.title || "Shared Note"}</h1>
          <p className="text-sm font-semibold text-cn-ink-muted dark:text-white/60">
            {notebook?.title || "Notebook"} · {share.visibility.replace("_", " ")}
          </p>
        </div>

        <article className="rounded-[2rem] border border-black/10 bg-white/85 p-8 shadow-xl dark:border-white/10 dark:bg-[#171412]">
          {blocks.length > 0 ? (
            <div className="space-y-5">
              {blocks.map((block: any) => {
                if (block.type === "heading") {
                  return <h2 key={block.id} className="text-2xl font-black">{block.content}</h2>;
                }
                if (block.type === "code") {
                  return (
                    <pre key={block.id} className="overflow-x-auto rounded-2xl bg-black p-4 text-sm text-white">
                      <code>{block.content}</code>
                    </pre>
                  );
                }
                return (
                  <p key={block.id} className="whitespace-pre-wrap text-base leading-7 text-cn-ink-muted dark:text-white/70">
                    {block.content}
                  </p>
                );
              })}
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-base leading-7 text-cn-ink-muted dark:text-white/70">
              {page.content_text || "This shared note is empty."}
            </p>
          )}
        </article>
      </div>
    </main>
  );
}
