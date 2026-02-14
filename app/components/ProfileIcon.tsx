"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClientSupabaseClient } from "@/lib/supabaseClient";

interface ProfileIconState {
  imageUrl: string | null;
  profileHref: string | null;
  isVisible: boolean;
}

export default function ProfileIcon() {
  const [state, setState] = useState<ProfileIconState>({
    imageUrl: null,
    profileHref: null,
    isVisible: false,
  });

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const supabase = createClientSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        if (isMounted) {
          setState({ imageUrl: null, profileHref: null, isVisible: false });
        }
        return;
      }

      const userId = session.user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_image, role")
        .eq("id", userId)
        .single();

      const role = profile?.role || null;
      let imageUrl = profile?.profile_image || null;

      if (!imageUrl && role !== "parent") {
        const childKey = `childProfileImage:${userId}`;
        const cachedChildImage = localStorage.getItem(childKey) || "";
        imageUrl = cachedChildImage || null;
      }

      const profileHref = role === "parent"
        ? "/parent-profile"
        : role === "child"
        ? "/child-profile"
        : "/profile";

      if (isMounted) {
        setState({ imageUrl, profileHref, isVisible: true });
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!state.isVisible || !state.profileHref) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <Link
        href={state.profileHref}
        className="pointer-events-auto flex items-center justify-center w-11 h-11 rounded-full border border-white/60 bg-white/90 shadow-lg shadow-cyan-500/20 backdrop-blur-sm hover:shadow-cyan-500/40 transition-all hover:scale-105"
        title="Profile"
      >
        {state.imageUrl ? (
          <img
            src={state.imageUrl}
            alt="Profile"
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <i className="fas fa-user text-cyan-700 text-lg"></i>
        )}
      </Link>
    </div>
  );
}
