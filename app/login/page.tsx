"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { GradientIllustration } from "@/components/GradientIllustration";
import { authApi } from "@/lib/api";

interface LoginFormState {
  email: string;
  password: string;
  remember: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginFormState>({
    email: "",
    password: "",
    remember: false,
  });
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await authApi.login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      console.log('login',response.access)
      if (response.access) {
        router.push("/todos");
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Invalid email or password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <GradientIllustration
        label="image1.png"
        caption="Pick up where you left off and stay ahead of your tasks."
      >

      </GradientIllustration>
      <main className="flex flex-1 items-center justify-center bg-white px-6 py-10 sm:px-16">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-3xl font-semibold text-[#0a1b3f]">
              Log in to your account
            </h1>
            <p className="mt-2 text-base text-[#5b6c94]">
              Start managing your tasks efficiently
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1b3f]" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                className="w-full rounded-xl border border-[#dde3f5] px-4 py-3 text-sm outline-none transition focus:border-[#5570ff]"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[#0a1b3f]"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
                className="w-full rounded-xl border border-[#dde3f5] px-4 py-3 text-sm outline-none transition focus:border-[#5570ff]"
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-[#0a1b3f]">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      remember: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-[#9aa7d6] text-[#5570ff]"
                />
                Remember me
              </label>
              <Link
                href="#"
                className="font-medium text-[#5570ff] hover:text-[#4051d7]"
              >
                Forgot your password?
              </Link>
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-2xl bg-[#5570ff] py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#4051d7] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Logging In..." : "Log In"}
            </button>
          </form>
          <p className="text-center text-sm text-[#5b6c94]">
            Don’t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-[#5570ff] hover:text-[#4051d7]"
            >
              Register now
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

