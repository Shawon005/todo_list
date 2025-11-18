"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { GradientIllustration } from "@/components/GradientIllustration";
import { authApi } from "@/lib/api";

interface SignupFormState {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const initialState: SignupFormState = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState<Record<keyof SignupFormState, string>>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const hasErrors = useMemo(
    () => Object.values(errors).some((value) => Boolean(value)),
    [errors],
  );

  const validate = (): boolean => {
    const nextErrors = { ...errors };
    const nameRegex = /^[A-Za-z\s'-]+$/;
    nextErrors.first_name = nameRegex.test(form.first_name)
      ? ""
      : "Please enter a valid name format.";
    nextErrors.last_name = nameRegex.test(form.last_name)
      ? ""
      : "Please enter a valid name format.";
    nextErrors.email = /\S+@\S+\.\S+/.test(form.email)
      ? ""
      : "Please enter a valid email.";
    nextErrors.password =
      form.password.length >= 4
        ? ""
        : "Password should be at least 4 characters.";
    nextErrors.confirmPassword =
      form.password === form.confirmPassword
        ? ""
        : "Passwords do not match.";

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setApiError("");

    try {
      const response = await authApi.signup({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      
      if (response) {
        router.push("/todos");
      } else {
        
        setApiError("Registration failed. Please try again.");
      }
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const setField = <K extends keyof SignupFormState>(
    field: K,
    value: SignupFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <GradientIllustration
        label="image2.png"
        caption="Start managing your tasks efficiently"
      >
      </GradientIllustration>

      <main className="flex flex-1 items-center justify-center bg-white px-6 py-10 sm:px-16">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-3xl font-semibold text-[#0a1b3f]">
              Create your account
            </h1>
            <p className="mt-2 text-base text-[#5b6c94]">
              Start managing your tasks efficiently
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["first_name", "last_name"] as const).map((field) => (
                <div key={field} className="space-y-2">
                  <label
                    htmlFor={field}
                    className="text-sm font-medium text-[#0a1b3f]"
                  >
                    {field === "first_name" ? "First Name" : "Last Name"}
                  </label>
                  <input
                    id={field}
                    value={form[field]}
                    onChange={(event) => setField(field, event.target.value)}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                      errors[field]
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#dde3f5] focus:border-[#5570ff]"
                    }`}
                    placeholder={
                      field === "first_name" ? "First Name" : "Last Name"
                    }
                    required
                  />
                  {errors[field] && (
                    <p className="text-xs text-red-500">{errors[field]}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[#0a1b3f]"
                htmlFor="email"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => setField("email", event.target.value)}
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                  errors.email
                    ? "border-red-400 focus:border-red-500"
                    : "border-[#dde3f5] focus:border-[#5570ff]"
                }`}
                placeholder="Enter your email"
                required
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
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
                onChange={(event) => setField("password", event.target.value)}
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                  errors.password
                    ? "border-red-400 focus:border-red-500"
                    : "border-[#dde3f5] focus:border-[#5570ff]"
                }`}
                placeholder="Create a password"
                required
              />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[#0a1b3f]"
                htmlFor="confirmPassword"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(event) =>
                  setField("confirmPassword", event.target.value)
                }
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                  errors.confirmPassword
                    ? "border-red-400 focus:border-red-500"
                    : "border-[#dde3f5] focus:border-[#5570ff]"
                }`}
                placeholder="Confirm your password"
                required
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {apiError && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {apiError}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-2xl bg-[#5570ff] py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#4051d7] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={hasErrors || isLoading}
            >
              {isLoading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-sm text-[#5b6c94]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#5570ff] hover:text-[#4051d7]"
            >
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

