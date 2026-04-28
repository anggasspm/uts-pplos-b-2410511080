const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class UserModel {
  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT id, name, email, oauth_provider, avatar, created_at FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async create({ name, email, password = null, oauth_provider = null, oauth_id = null, avatar = null }) {
    const id = uuidv4();
    await db.query(
      'INSERT INTO users (id, name, email, password, oauth_provider, oauth_id, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, password, oauth_provider, oauth_id, avatar]
    );
    return { id, name, email, oauth_provider, avatar };
  }

  static async upsertOAuth({ name, email, oauth_provider, oauth_id, avatar }) {
    let user = await this.findByEmail(email);
    if (!user) {
      user = await this.create({ name, email, oauth_provider, oauth_id, avatar });
    }
    return user;
  }
}

class TokenModel {
  static async saveRefreshToken(userId, token, expiresAt) {
    const id = uuidv4();
    await db.query(
      'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [id, userId, token, expiresAt]
    );
  }

  static async deleteRefreshToken(userId) {
    await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
  }

  static async blacklistJti(jti, expiresAt) {
    const id = uuidv4();
    await db.query(
      'INSERT INTO token_blacklist (id, token_jti, expires_at) VALUES (?, ?, ?)',
      [id, jti, expiresAt]
    );
  }

  static async isBlacklisted(jti) {
    const [rows] = await db.query(
      'SELECT id FROM token_blacklist WHERE token_jti = ? AND expires_at > NOW()',
      [jti]
    );
    return rows.length > 0;
  }
}

module.exports = { UserModel, TokenModel };