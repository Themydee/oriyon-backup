import { redirect } from "next/navigation";

interface SetupPasswordRedirectProps {
  searchParams: Promise<{ token?: string }>;
}

/**
 * Redirect page: emails currently link to /setup-password?token=...
 * but the real page lives at /auth/setup?token=...
 * This page forwards the token so existing links keep working.
 */
export default async function SetupPasswordRedirect({
  searchParams,
}: SetupPasswordRedirectProps) {
  const params = await searchParams;
  const token = params.token ?? "";
  redirect(`/auth/setup?token=${encodeURIComponent(token)}`);
}
