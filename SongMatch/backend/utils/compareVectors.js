// backend/utils/compareVectors.js
function cosineSimilarity(vec1, vec2) {
    const dot = Object.keys(vec1).reduce((sum, key) => sum + vec1[key] * vec2[key], 0);
    const mag1 = Math.sqrt(Object.values(vec1).reduce((sum, v) => sum + v * v, 0));
    const mag2 = Math.sqrt(Object.values(vec2).reduce((sum, v) => sum + v * v, 0));
    return dot / (mag1 * mag2);
  }
  