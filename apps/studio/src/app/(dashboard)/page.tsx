import { getUser } from "@repo/auth";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await getUser();
  const name = user?.profile.display_name ?? user?.email ?? "there";

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">Welcome back, {name}</h1>
      <p className="text-sm text-muted-foreground">
        Your studio is ready. Pick a tool from the sidebar to get started.
      </p>
    </section>
  );
}
