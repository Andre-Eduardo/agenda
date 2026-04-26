import { useState } from "react";
import { Outlet, Link, useRouterState, useNavigate, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Menu,
  Moon,
  Stethoscope,
  Sun,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { useCan, type Permission } from "@/hooks/useCan";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavItem {
  icon: LucideIcon;
  labelKey: string;
  path: string;
  permission?: Permission;
}

interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "nav.menu",
    items: [
      { icon: Home, labelKey: "nav.dashboard", path: "/" },
      { icon: Calendar, labelKey: "nav.appointments", path: "/appointments" },
      { icon: Users, labelKey: "nav.patients", path: "/patients" },
      { icon: Stethoscope, labelKey: "nav.professionals", path: "/professionals" },
    ],
  },
  {
    labelKey: "nav.system",
    items: [
      { icon: ClipboardList, labelKey: "nav.forms", path: "/form-templates" },
      { icon: FileText, labelKey: "nav.chat", path: "/chat" },
    ],
  },
];

export const Route = createFileRoute("/_stackedLayout")({
  // TODO: re-enable auth guard once /auth/login route is registered in routes.ts
  // beforeLoad: ({ context, location }) => {
  //   if (!context?.auth) {
  //     throw redirect({
  //       to: '/auth/login',
  //       search: { redirect: location.pathname },
  //     });
  //   }
  // },
  component: StackedLayout,
});

function getInitials(name: string | undefined | null): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

interface NavLinkProps {
  item: NavItem;
  currentPath: string;
  onClick?: () => void;
}

function NavLink({ item, currentPath, onClick }: NavLinkProps) {
  const { t } = useTranslation();
  const allowed = useCan(item.permission ? { has: item.permission } : undefined);
  const isActive = item.path === "/" ? currentPath === "/" : currentPath.startsWith(item.path);
  const Icon = item.icon;

  if (!allowed) return null;

  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-(--radius-button) px-3 py-2 text-sm-body font-medium transition-colors",
        isActive
          ? "bg-(--color-primary-surface) text-(--color-primary-text)"
          : "text-(--color-text-secondary) hover:bg-(--color-bg-surface) hover:text-(--color-text-primary)",
      )}
    >
      <Icon aria-hidden className="size-5" />
      {t(item.labelKey)}
    </Link>
  );
}

interface NavSectionProps {
  group: NavGroup;
  currentPath: string;
  onNavigate?: () => void;
}

function NavSection({ group, currentPath, onNavigate }: NavSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-1">
      <p className="px-3 pb-1 pt-2 text-2xs uppercase tracking-wider text-(--color-text-tertiary)">
        {t(group.labelKey)}
      </p>
      {group.items.map((item) => (
        <NavLink key={item.path} item={item} currentPath={currentPath} onClick={onNavigate} />
      ))}
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const navigate = useNavigate();
  const setAuth = useAppStore((s) => s.setAuth);
  const colorMode = useAppStore((s) => s.colorMode);
  const setColorMode = useAppStore((s) => s.setColorMode);

  const handleLogout = () => {
    setAuth(false, null);
    onNavigate?.();
    navigate({ to: "/auth/login" }).catch((error: unknown) => {
      // eslint-disable-next-line no-console -- defensive logging; navigate rejection here means the router is in an unrecoverable state
      console.error("Logout navigation failed", error);
    });
  };

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center gap-3 px-2">
        <div className="flex size-9 items-center justify-center rounded-(--radius-button) bg-(--color-primary) text-(--color-primary-foreground)">
          <Stethoscope aria-hidden className="size-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sub font-medium leading-tight text-(--color-text-primary)">
            Agenda Saúde
          </span>
          <span className="text-2xs text-(--color-text-tertiary)">Gestão Clínica</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <NavSection
            key={group.labelKey}
            group={group}
            currentPath={currentPath}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="flex flex-col gap-2 border-t border-(--color-border) pt-4">
        <Button
          type="button"
          variant="ghost"
          className="justify-start gap-3 text-(--color-text-secondary) hover:text-(--color-text-primary)"
          onClick={() => setColorMode(colorMode === "dark" ? "light" : "dark")}
        >
          {colorMode === "dark" ? (
            <Sun aria-hidden className="size-5" />
          ) : (
            <Moon aria-hidden className="size-5" />
          )}
          {colorMode === "dark" ? t("theme.light") : t("theme.dark")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="justify-start gap-3 text-(--color-text-secondary) hover:text-(--color-text-primary)"
          onClick={handleLogout}
        >
          <LogOut aria-hidden className="size-5" />
          {t("nav.logout")}
        </Button>
      </div>
    </div>
  );
}

export function StackedLayout() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const userName = "User";
  const initials = getInitials(userName);

  return (
    <div className="flex min-h-screen bg-(--color-bg-page)">
      <aside className="hidden w-64 shrink-0 border-r border-(--color-border) bg-(--color-bg-surface) lg:block">
        <SidebarContent />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-(--color-border) bg-(--color-bg-card) px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label={t("nav.menu")}
                >
                  <Menu aria-hidden className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 bg-(--color-bg-surface)">
                <SheetTitle className="sr-only">{t("nav.menu")}</SheetTitle>
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>

          {/* TODO: link this to /user-profile once that route is registered */}
          <div className="flex items-center gap-2 rounded-(--radius-button) px-2 py-1">
            <Avatar className="size-8">
              <AvatarFallback className="bg-(--color-primary-surface) text-(--color-primary-text) text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
