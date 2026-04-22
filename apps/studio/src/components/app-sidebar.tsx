import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@repo/ui/components/sidebar";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

type AppSidebarProps = {
  user: {
    name: string;
    email: string;
    avatarUrl: string | null;
    initial: string;
  };
};

export function AppSidebar({ user }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <span className="text-sm font-semibold">S</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Studio</span>
                <span className="truncate text-xs text-muted-foreground">
                  pavelrapoport.com
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          name={user.name}
          email={user.email}
          avatarUrl={user.avatarUrl}
          initial={user.initial}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
