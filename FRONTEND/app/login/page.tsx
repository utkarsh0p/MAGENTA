"use client";

import { Auth } from "@/components/ui/auth-form-1";

export default function LoginPage() {
  return (
    <main className="scrollbar-hide flex h-dvh w-full items-center justify-center overflow-y-auto bg-background px-4 py-6 sm:items-start sm:py-8">
      <Auth />
    </main>
  );
}
