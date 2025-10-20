// backend/services/db.js

let users = {}; // just a temporary in-memory object

module.exports = {
  updateUser: async (id, data) => {
    users[id] = { ...users[id], ...data };
    console.log(`[DB] Updated user ${id}:`, users[id]);
  },

  getUserById: async (id) => {
    return users[id] || null;
  },

  getAllUsersExcept: async (id) => {
    return Object.entries(users)
      .filter(([uid]) => uid !== id)
      .map(([uid, user]) => ({ id: uid, tasteVector: user.tasteVector || {} }));
  },

  findUsersByHashedEmails: async (hashedEmails) => {
    return Object.entries(users)
      .filter(([_, user]) => hashedEmails.includes(user.hashedEmail))
      .map(([uid, user]) => ({ id: uid }));
  },

  findUsersByInstagram: async (handles) => {
    return Object.entries(users)
      .filter(([_, user]) => handles.includes(user.igHandle))
      .map(([uid, user]) => ({ id: uid }));
  },
};
