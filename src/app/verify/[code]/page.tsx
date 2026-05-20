import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ code: string }>;
};

export default async function VerifyRedirectPage({ params }: PageProps) {
  const { code } = await params;
  redirect(`/verify-certificate/${code}`);
}
