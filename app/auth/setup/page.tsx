import SetupPasswordForm from "./SetupPasswordForm";

interface SetupPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function SetupPasswordPage({ searchParams }: SetupPageProps) {
  const params = await searchParams;
  return <SetupPasswordForm token={params.token ?? ""} />;
}
