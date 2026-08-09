"use client";

import Image from "next/image";

interface Props {
  avatarUrl: string | null;
  name: string;
  className?: string;
}

export default function ProfileAvatar({ avatarUrl, name, className = "" }: Props) {
  if (avatarUrl) {
    return (
      <div className={`relative shrink-0 overflow-hidden rounded-full ${className}`}>
        <Image src={avatarUrl} alt={`${name} Profil Fotoğrafı`} fill className="object-cover" priority />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[55%] w-[55%] text-zinc-400 dark:text-zinc-500">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4.418 3.582-7 8-7s8 2.582 8 7" />
      </svg>
    </div>
  );
}
