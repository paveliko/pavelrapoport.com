import { getUser } from "@repo/auth";
import {
  SidebarInset,
  SidebarProvider,
} from "@repo/ui/components/sidebar";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login?error=session_expired");
  }

  const navUser = {
    name: user.profile.display_name ?? user.email,
    email: user.email,
    avatarUrl: user.profile.avatar_url,
  };

  return (
    <SidebarProvider>
      <AppSidebar user={navUser} />
      <SidebarInset>
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
