"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { getToken, getUser, removeToken, User } from "@/lib/api";
import Image from "next/image";

const navItems = [
  { label: "Todos", href: "/todos", icon: "check" },
  { label: "Account Information", href: "/profile", icon: "user" },
];

function Icon({ name }: { name: string }) {
  switch (name) {
    case "home":
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
        >
          <path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
        </svg>
      );
    case "check":
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
        >
          <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "user":
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
        </svg>
      );
    default:
      return null;
  }
}

export default function DashboardLayout({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user once on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const storedUser = getUser();
    if (storedUser) {
      setUser(storedUser);
      setIsLoading(false);
    } else {
      // If no user info stored, redirect to login to re-authenticate
      router.replace("/login");
    }
  }, [router]);

  // Listen for user updates (e.g. profile changes) to refresh sidebar info
  useEffect(() => {
    const handleUserUpdated = () => {
      const updatedUser = getUser();
      if (updatedUser) {
        setUser(updatedUser);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("user-updated", handleUserUpdated);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("user-updated", handleUserUpdated);
      }
    };
  }, []);

  const initials = useMemo(() => {
    if (!user) return "DS";
    const first = user.first_name?.charAt(0) ?? "D";
    const last = user.last_name?.charAt(0) ?? "S";
    return `${first}${last}`.toUpperCase();
  }, [user]);

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6fb] text-[#0a1b3f]">
        Preparing your workspace...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6fb] text-[#0a1b3f]">
      <aside className="flex w-64 flex-col bg-[#071741] text-white">
        <div className="flex flex-col items-center gap-3 border-b border-white/10 px-6 py-10 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-2xl font-semibold">
          {user.profile_image ? (
              <Image
                src={user.profile_image}
                alt="Profile avatar"
                width={96}
                height={96}
                className="h-full w-full object-cover rounded-full" 
              />
            ) : (
              `${initials}`
            )}
          </div>
          <div>
            <p className="text-lg font-semibold capitalize">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-sm text-white/70">{user.email}</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-4 py-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive ? "bg-white/15" : "text-white/70 hover:bg-white/10"
                }`}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-4 pb-8">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-transparent px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <path
                d="m10 17 5-5-5-5M15 12H3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[#e1e6f6] bg-white px-10 py-6">
          <div>
            <img src="logo.png" alt="" />
          </div>
          <div className="flex items-center gap-4 text-sm text-[#5b6c94]">
            <div className="flex items-center gap-2 rounded-full bg-[#f4f6fb] px-4 py-2">
              <span role="img" aria-label="bell">
                🔔
              </span>
              <span role="img" aria-label="calendar">
                📅
              </span>
            </div>
            <div className="rounded-full bg-[#f4f6fb] px-4 py-2">
              {new Intl.DateTimeFormat("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(new Date())}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-10 py-10">{children}</main>
      </div>
    </div>
  );
}

