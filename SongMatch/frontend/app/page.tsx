"use client";

import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import app from "@/firebaseConfig";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      console.log("Firebase user:", user.displayName);
      console.log("Token:", idToken);

      const response = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: idToken }),
      });

      const text = await response.text();
      console.log("Raw response from /api/verify:", text);

      try {
        const data = JSON.parse(text);

        if (data.error) {
          console.error("🚫 Backend verification error:", data.error);
        } else {
          console.log("Verified by backend:", data);
          localStorage.setItem("songmatch-user", JSON.stringify(data)); // ✅ Store user
          router.push("/dashboard"); // ✅ Navigate to dashboard
        }
      } catch (err) {
        console.error("❌ Could not parse response JSON:", err);
      }

    } catch (error) {
      console.error("❌ Login error:", error);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Welcome to SongMatcher 🎶</h1>
      <button
        onClick={handleGoogleLogin}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
      >
        Sign in with Google
      </button>
    </main>
  );
}
