"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";
import app from "@/firebaseConfig";

interface UserData {
  uid: string;
  name: string;
  email: string;
  picture: string;
}

interface SpotifyProfile {
  display_name: string;
  email: string;
  id: string;
  images?: { url: string }[];
  followers?: { total: number };
}

interface Track {
  id: string;
  name: string;
  artists: string;
  album: string;
  image?: string;
  preview_url?: string;
  external_url: string;
}

interface MatchBreakdown {
  artistScore: number;
  trackScore: number;
  genreScore: number;
  popularityScore: number;
  sharedArtists: string[];
  sharedTracks: string[];
  sharedGenres: string[];
}

interface Match {
  uid: string;
  name: string;
  email: string;
  picture: string;
  score: number;
  breakdown: MatchBreakdown;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [spotifyProfile, setSpotifyProfile] = useState<SpotifyProfile | null>(null);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [likedTrackIds, setLikedTrackIds] = useState<string[] | null>(null);
  const [recommendations, setRecommendations] = useState<{
    id: string;
    name: string;
    count: number;
    score: string;
    external_url: string;
  }[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("songmatch-user");
    if (!storedUser) {
      router.push("/");
    } else {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);

      const accessToken = document.cookie
        .split("; ")
        .find((c) => c.startsWith("spotify_access_token="))
        ?.split("=")[1];

      if (accessToken) {
        setSpotifyConnected(true);

        fetch("http://localhost:5050/api/spotify/profile", {
          method: "GET",
          headers: {
            "Spotify-Access-Token": accessToken,
            "Spotify-UID": parsed.uid,
          },
          credentials: "include",
          mode: "cors",
        })
          .then((res) => res.json())
          .then((data) => setSpotifyProfile(data))
          .catch((err) => console.error("❌ Failed to fetch Spotify profile:", err));

        fetchLikedTracks(accessToken);
      }
    }
  }, [router]);

  const fetchTopTracks = async () => {
    const accessToken = document.cookie
      .split("; ")
      .find((c) => c.startsWith("spotify_access_token="))
      ?.split("=")[1];

    if (!accessToken) return;

    try {
      const res = await fetch("http://localhost:5050/api/spotify/top-tracks", {
        method: "GET",
        headers: {
          "Spotify-Access-Token": accessToken,
        },
        credentials: "include",
        mode: "cors",
      });
      const data = await res.json();
      setTopTracks(data);
    } catch (err) {
      console.error("❌ Error fetching top tracks:", err);
    }
  };

  const findMatches = async () => {
    const accessToken = document.cookie
      .split("; ")
      .find((c) => c.startsWith("spotify_access_token="))
      ?.split("=")[1];

    if (!user || !accessToken) return;

    try {
      await fetch("http://localhost:5050/api/taste-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Spotify-Access-Token": accessToken,
        },
        body: JSON.stringify({ uid: user.uid }),
        credentials: "include",
        mode: "cors",
      });

      const matchRes = await fetch("http://localhost:5050/api/find-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
        credentials: "include",
        mode: "cors",
      });

      const matchData = await matchRes.json();
      setMatches(matchData);
    } catch (err) {
      console.error("❌ Error finding matches:", err);
    }
  };

  const fetchLikedTracks = async (accessToken: string) => {
    try {
      const res = await fetch("http://localhost:5050/api/liked-tracks", {
        method: "GET",
        headers: {
          "Spotify-Access-Token": accessToken,
        },
      });

      const data = await res.json();
      console.log("Liked tracks:", data.likedTrackIds);
      setLikedTrackIds(data.likedTrackIds || []);
    } catch (err) {
      console.error("❌ Error fetching liked tracks:", err);
    }
  };

  const fetchRecommendations = async () => {
    if (!user || likedTrackIds === null) {
      console.warn("⚠️ User or liked tracks not loaded");
      return;
    }

    try {
      const res = await fetch("http://localhost:5050/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, likedTrackIds }),
      });

      const data = await res.json();
      console.log("Recommendations:", data.recommendations);
      setRecommendations(data.recommendations);
    } catch (err) {
      console.error("❌ Error fetching recommendations:", err);
    }
  };

  const handleSignOut = () => {
    const auth = getAuth(app);

    signOut(auth)
      .then(() => {
        console.log("Signed out from Firebase");
        localStorage.removeItem("songmatch-user");
        document.cookie = "spotify_access_token=; max-age=0; path=/";
        router.push("/");
      })
      .catch((error) => {
        console.error("❌ Sign-out failed:", error);
      });
  };

  const redirectToSpotifyAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
    const redirectUri = "http://localhost:3000/api/spotify/callback";
    const scope = ["user-top-read", "user-read-email", "user-read-private"].join(" ");

    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(
      scope
    )}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    window.location.href = authUrl;
  };

  if (!user) return null;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-4xl font-bold mb-6">🎶 Welcome, {user.name}!</h1>
      <img src={user.picture} alt="Profile" className="w-24 h-24 rounded-full mb-4" />
      <p className="text-lg mb-2">📧 {user.email}</p>

      {spotifyConnected ? (
        <>
          <p className="text-green-600 font-semibold mt-4">✅ Spotify is connected!</p>
          {spotifyProfile && (
            <div className="mt-4 text-center">
              <p className="text-xl font-medium">🎧 Spotify User: {spotifyProfile.display_name}</p>
              {spotifyProfile.followers && <p>👥 Followers: {spotifyProfile.followers.total}</p>}
              {spotifyProfile.images?.[0]?.url && (
                <img
                  src={spotifyProfile.images[0].url}
                  alt="Spotify Avatar"
                  className="w-24 h-24 rounded-full mt-3"
                />
              )}
            </div>
          )}

          <button
            onClick={fetchTopTracks}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Show My Top Tracks 🎧
          </button>
          <button
            onClick={findMatches}
            className="mt-4 bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
          >
            Find My Music Matches 🎯
          </button>
          <button
          onClick={fetchRecommendations}
          className="mt-4 bg-yellow-500 text-white px-6 py-2 rounded hover:bg-yellow-600"
          >
            Get Song Recommendations 🔮
            </button>
        </>
      ) : (
        <button
          onClick={redirectToSpotifyAuth}
          className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          Connect to Spotify
        </button>
      )}

      <button
        onClick={handleSignOut}
        className="mt-6 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
      >
        Sign Out
      </button>

      {topTracks.length > 0 && (
        <div className="mt-10 w-full max-w-2xl">
          <h2 className="text-2xl font-semibold mb-4 text-emerald-600">🎵 Your Top Tracks</h2>
          {topTracks.map((track, index) => (
            <div
              key={track.id}
              className="mb-6 p-4 border rounded-lg shadow-sm bg-green-50"
            >
              <p className="text-lg font-bold text-emerald-700">
                {index + 1}. {track.name}
              </p>
              <p className="text-sm text-gray-800 font-medium">🎤 Artist(s): {track.artists}</p>
              <p className="text-sm text-gray-800 font-medium">💿 Album: {track.album}</p>
              {track.image && <img src={track.image} className="w-24 h-24 mt-2 rounded border" />}
            </div>
          ))}
        </div>
      )}

      {matches.length > 0 && (
        <div className="mt-10 w-full max-w-2xl">
          <h2 className="text-2xl font-semibold mb-4 text-purple-600">🎯 Your Top Matches</h2>
          {matches.map((match, index) => (
            <div
              key={match.uid}
              className="mb-6 p-4 rounded-lg shadow-md bg-purple-50"
            >
              <div className="flex gap-4 items-center">
                <img
                  src={
                    match.picture ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(match.name)}&background=purple&color=fff`
                  }
                  className="w-16 h-16 rounded-full object-cover border"
                />
                <div>
                  <p className="text-lg font-bold text-purple-800">#{index + 1}: {match.name}</p>
                  <p className="text-sm text-gray-700">📧 {match.email}</p>
                  <p className="text-sm text-purple-700">🎯 Score: {match.score.toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-800 space-y-1">
                <p> <strong>Shared Artists:</strong> {match.breakdown.sharedArtists.length > 0 ? match.breakdown.sharedArtists.join(", ") : "None"}</p>
                <p> <strong>Shared Tracks:</strong> {match.breakdown.sharedTracks.length > 0 ? match.breakdown.sharedTracks.join(", ") : "None"}</p>
                <p> <strong>Shared Genres:</strong> {match.breakdown.sharedGenres.length > 0 ? match.breakdown.sharedGenres.join(", ") : "None"}</p>
                <p> <strong>Component Scores:</strong></p>
                <ul className="ml-4 list-disc">
                  <li>Artist Score: {match.breakdown.artistScore.toFixed(2)}</li>
                  <li>Track Score: {match.breakdown.trackScore.toFixed(2)}</li>
                  <li>Genre Score: {match.breakdown.genreScore.toFixed(2)}</li>
                  <li>Popularity Score: {match.breakdown.popularityScore.toFixed(2)}</li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
      {recommendations.length > 0 && (
  <div className="mt-10 w-full max-w-2xl">
    <h2 className="text-2xl font-semibold mb-4 text-yellow-600">🔮 Recommended Songs</h2>
    <ul className="space-y-2">
      {recommendations.map((rec, index) => (
        <li key={rec.id} className="p-4 bg-yellow-50 rounded shadow-sm">
          <p className="font-bold text-yellow-800">{index + 1}. {rec.name}</p>
          <p className="text-sm text-gray-700">🔥 Liked by {rec.count} of your matches</p>
          <a
            href={rec.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            🔗 Open in Spotify
          </a>
        </li>
      ))}
    </ul>
  </div>
)}


    </main>
  );
}
