"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { defaultUserProfile } from "@/lib/defaults";
import { STORAGE_KEYS, readFromStorage, writeToStorage } from "@/lib/storage";
import { UserProfile } from "@/types";
import { profileApi, User } from "@/lib/api";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

  // Convert User (API) to UserProfile (form)
  const userToProfile = (user: User): UserProfile => {
    return {
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      email: user.email || "",
      password: "", // Don't include password in profile
      address: user.address || "",
      contactNumber: user.contact_number || "",
      birthday: user.birthday || "",
      avatar: user.profile_image || "",
    };
  };

  // Load profile from API on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    setError("");
    try {
      const user = await profileApi.get();
      setProfile(userToProfile(user));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load profile. Please try again."
      );
      // Fallback to stored user or default
      // const stored = readFromStorage<UserProfile | null>(STORAGE_KEYS.USER, null);
      // if (stored) {
      //   setProfile(stored);
      // }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    setMessage("");
    setError("");
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Store the file for upload
    setProfileImageFile(file);
    
    // Preview the image
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((prev) => ({ ...prev, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const updateData: {
        first_name?: string;
        last_name?: string;
        email?: string;
        address?: string;
        contact_number?: string;
        birthday?: string;
        profile_image?: File;
      } = {
        first_name: profile.firstName,
        last_name: profile.lastName,
        email: profile.email,
        address: profile.address,
        contact_number: profile.contactNumber,
        birthday: profile.birthday,
      };

      // Add image file if a new one was selected
      if (profileImageFile) {
        updateData.profile_image = profileImageFile;
      }

      const updatedUser = await profileApi.update(updateData);
      setProfile(userToProfile(updatedUser));
      setProfileImageFile(null);
      setMessage("Profile saved successfully.");
      // Also update local storage copy used elsewhere in the UI (if needed)
      writeToStorage(STORAGE_KEYS.USER, userToProfile(updatedUser));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save profile. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    setProfileImageFile(null);
    setError("");
    setMessage("");
    // Reload from API
    await loadProfile();
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <p className="text-sm text-[#5b6c94]">Dreamy Software</p>
          <h1 className="text-3xl font-semibold text-[#0a1b3f]">
            Account Information
          </h1>
        </div>
        <div className="flex items-center justify-center rounded-3xl border border-[#dde3f5] bg-white p-16">
          <div className="text-center">
            <div className="text-[#5570ff]">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-[#5b6c94]">Dreamy Software</p>
        <h1 className="text-3xl font-semibold text-[#0a1b3f]">
          Account Information
        </h1>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form
        className="space-y-8 rounded-3xl border border-[#dde3f5] bg-white p-8 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start rounded-3xl border border-[#dde3f5] p-2 w-fit pe-5 shadow-sm">
          <div className=" flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#eef1ff] text-2xl font-semibold text-[#5570ff]">
            {profile.avatar ? (
              <Image
                src={profile.avatar}
                alt="Profile avatar"
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            ) : (
              `${profile.firstName.charAt(0) || "D"}${profile.lastName.charAt(0) || "S"}`
            )}
          </div>
          <div className="space-y-3 my-auto text-white ">
            <label className="text-sm font-medium  rounded-2xl bg-[#5570ff] px-6 py-3 " htmlFor="image">
              Upload New Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="text-sm text-[#5b6c94] hidden"
              id="image"
            />
            
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#0a1b3f]" htmlFor="firstName">
              First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              value={profile.firstName}
              onChange={handleChange}
              className="w-full rounded-xl border border-[#dde3f5] px-4 py-3 text-sm outline-none focus:border-[#5570ff]"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#0a1b3f]" htmlFor="lastName">
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              value={profile.lastName}
              onChange={handleChange}
              className="w-full rounded-xl border border-[#dde3f5] px-4 py-3 text-sm outline-none focus:border-[#5570ff]"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#0a1b3f]" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={profile.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-[#dde3f5] px-4 py-3 text-sm outline-none focus:border-[#5570ff]"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#0a1b3f]" htmlFor="contactNumber">
              Contact Number
            </label>
            <input
              id="contactNumber"
              name="contactNumber"
              value={profile.contactNumber}
              onChange={handleChange}
              className="w-full rounded-xl border border-[#dde3f5] px-4 py-3 text-sm outline-none focus:border-[#5570ff]"
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#0a1b3f]" htmlFor="address">
              Address
            </label>
            <input
              id="address"
              name="address"
              value={profile.address}
              onChange={handleChange}
              className="w-full rounded-xl border border-[#dde3f5] px-4 py-3 text-sm outline-none focus:border-[#5570ff]"
              placeholder="Enter your address"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#0a1b3f]" htmlFor="birthday">
              Birthday
            </label>
            <input
              id="birthday"
              name="birthday"
              type="date"
              value={profile.birthday}
              onChange={handleChange}
              className="w-full rounded-xl border border-[#dde3f5] px-4 py-3 text-sm outline-none focus:border-[#5570ff]"
            />
          </div>
        </div>

        {message && (
          <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-600">
            {message}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-2xl border border-[#dde3f5] px-6 py-3 text-sm font-semibold text-[#5b6c94] hover:border-[#5570ff] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-2xl bg-[#5570ff] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4051d7] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

