import LoginClient from "./LoginClient";

type SearchParams = Promise<{ error?: string; details?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const sp = (await searchParams) ?? {};
  return <LoginClient error={sp.error} details={sp.details} />;
}