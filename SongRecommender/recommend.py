import json
from collections import defaultdict
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class SongRecommender:
    def __init__(self, playlist_file):
        self.song_to_index = {}
        self.index_to_song = {}
        self.co_matrix = None
        self._build_matrix(playlist_file)

    def _build_matrix(self, playlist_file):
        print("Building co-occurrence matrix...")
        song_pairs = defaultdict(lambda: defaultdict(int))
        song_counts = defaultdict(int)

        with open(playlist_file, 'r') as f:
            playlists = json.load(f)

        song_id = 0
        for pl in playlists:
            unique_tracks = list(set(pl['tracks']))
            for i in range(len(unique_tracks)):
                for j in range(len(unique_tracks)):
                    if i != j:
                        a, b = unique_tracks[i], unique_tracks[j]
                        song_pairs[a][b] += 1
                song_counts[unique_tracks[i]] += 1

        all_songs = list(song_counts.keys())
        self.song_to_index = {song: i for i, song in enumerate(all_songs)}
        self.index_to_song = {i: song for song, i in self.song_to_index.items()}

        N = len(all_songs)
        self.co_matrix = np.zeros((N, N))
        for songA in song_pairs:
            for songB in song_pairs[songA]:
                i, j = self.song_to_index[songA], self.song_to_index[songB]
                self.co_matrix[i][j] = song_pairs[songA][songB]

        print(f"Matrix built for {N} songs.")

    def recommend(self, input_song, top_n=10):
        if input_song not in self.song_to_index:
            return [f"Song '{input_song}' not found in database."]
        
        idx = self.song_to_index[input_song]
        input_vector = self.co_matrix[idx].reshape(1, -1)
        similarities = cosine_similarity(input_vector, self.co_matrix)[0]

        similar_indices = np.argsort(similarities)[::-1][1:top_n+1]
        results = [(self.index_to_song[i], similarities[i]) for i in similar_indices]
        return results
