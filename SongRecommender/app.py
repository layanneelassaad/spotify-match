from flask import Flask, render_template, request, jsonify
from recommend import SongRecommender

app = Flask(__name__)
recommender = SongRecommender('data/playlists.json')

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/recommend', methods=['POST'])
def recommend():
    song = request.form.get('song').strip()
    results = recommender.recommend(song)
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)
