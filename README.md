# Spotify Match: Taste Profiles, Matching & Recommendations

This repo contains two parts:

- **SongMatch/** – Next.js app + Node/Express backend that authenticates with Spotify, builds a **taste profile** (genres + popularity), finds **similar users**, and returns **track recommendations**.
- **SongRecommender/** Flask demo that serves a **co-occurrence** playlist recommender (baseline).

> Portfolio focus: secure env-based config, clean API surface, and clear separation of training/inference concerns.

---

## Product flow:

1. **Sign in** (Firebase Google Auth) and **connect Spotify** (OAuth).
2. **Build my taste profile** → fixed-length vector from **genres** + **track popularity**.
3. **Find my matches** → cosine similarity vs. other users’ profiles (top-K neighbors).
4. **Explain the match** → show **shared artists**, **shared tracks**, **shared genres**, and a **score breakdown** (artists/tracks/genres/popularity components).
5. **Recommend songs** → aggregate tracks from nearest neighbors, **filter out** the user’s liked & top tracks, and return the top-N with links.


## Features

- **Spotify OAuth** → exchange code → access token (no secrets in code)
- **Taste profile builder** → genres + popularity + fixed-length vector
- **User matching** → cosine similarity with breakdown (artists / tracks / genres / popularity)
- **Recommendations** → aggregates top tracks from nearest neighbors, **excludes liked & top tracks**
- **Privacy** → local profile JSONs saved under `backend/profiles/` and `backend/spotify-profiles/` (gitignored)


**Prereqs**
- Node **20+**
- Python **3.10+**
- Spotify Developer App (Client ID/Secret)  
- (Optional) Firebase service account if using the auth middleware


## Setup

**1) Backend**
```bash
cd SongMatch/backend
cp .env.example .env
# Fill SPOTIFY_* and either FIREBASE_SERVICE_ACCOUNT_JSON or the PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY trio
npm ci
npm run dev
# server at http://localhost:${PORT:-5050}
```

**API endpoints:**
```bash
GET /api/spotify/login – redirect to Spotify
POST /api/spotify/callback – exchange code → tokens
GET /api/spotify/profile – requires headers: Spotify-Access-Token, Spotify-UID
GET /api/spotify/top-tracks
GET /api/spotify/audio-features?ids=...
POST /api/taste-profile – body { uid } → builds & stores taste vector
POST /api/match/find-matches – { uid } → top 5 similar users + breakdown
POST /api/recommend – { uid, likedTrackIds } → top 10 recs (filtered)
GET /api/liked-tracks – header Spotify-Access-Token → your liked track IDs
```

**Key endpoints**
```bash
python -m venv .venv && source .venv/bin/activate    # or: conda create -n ll97 python=3.11
python -m pip install -r requirements.txt
# Data handling:
#  - Private (default): put raw/processed files in data/ (gitignored)
#  - Public (optional): small, shareable CSVs in data_public/ with a README noting source & license
jupyter notebook notebooks/NYC_LL97_PiercingTheSky.ipynb
# Optional: export an executed HTML for quick viewing
jupyter nbconvert --to html --execute notebooks/NYC_LL97_PiercingTheSky.ipynb \
  --output ./assets/notebook.html --ExecutePreprocessor.timeout=600
```

**Local data**
```bash
SongMatch/backend/profiles/
SongMatch/backend/spotify-profiles/
```

**2) Front end (SongMatch/frontend)**
```bash
cd SongMatch/frontend
npm ci
npm run dev
# Next.js dev server at http://localhost:3000
```

**Baseline demo**
```bash
cd SongRecommender
python3 -m venv .venv && source .venv/bin/activate
pip install flask numpy scikit-learn
python app.py
# Flask dev server at http://127.0.0.1:5000
```
---
## How matching & scoring works

We compute a weighted similarity between two users using:
1. Shared artists and shared tracks counts (capped, then scaled)

2. Shared genres Jaccard ratio

3. Popularity similarity (cosine over the first N popularity entries)

The total match score is a weighted sum of these components; the UI displays both the total score and the per-component breakdown plus the actual shared items (artists/tracks/genres) for transparency.
