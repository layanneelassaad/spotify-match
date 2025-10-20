// backend/utils/computeTasteVector.js
function computeTasteVector(audioFeatures) {
    const features = ["danceability", "energy", "valence", "acousticness", "tempo"];
    const sum = {};
  
    for (const f of features) sum[f] = 0;
  
    for (const track of audioFeatures) {
      for (const f of features) {
        sum[f] += track[f];
      }
    }
  
    const avg = {};
    for (const f of features) {
      avg[f] = sum[f] / audioFeatures.length;
    }
  
    return avg;
  }
  