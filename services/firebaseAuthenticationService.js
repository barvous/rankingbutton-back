const admin = require('../firebaseAdminConfig');
const frontendOrigin = process.env.FRONTEND_ORIGIN;

/**
 * Service responsável por encapsular operações de autenticação
 * usando o Firebase Admin SDK.
 */
class FirebaseAuthenticationService {
  /**
   * Cria um novo usuário com email e senha.
   * @param {Object} params
   * @param {string} params.email
   * @param {string} params.password
   * @param {string} [params.displayName]
   * @returns {Promise<admin.auth.UserRecord>}
   */
  async createUser({ email, password, displayName }) {
    return admin.auth().createUser({ email, password, displayName });
  }

  /**
   * Gera um link de redefinição de senha para o email informado.
   * @param {string} email
   * @param {string} [redirectUrl] URL para redirecionamento pós-reset
   * @returns {Promise<string>} - Link gerado
   */
  async generatePasswordResetLink(email, redirectUrl = `${frontendOrigin}/login`) {
    return admin.auth().generatePasswordResetLink(email, { url: redirectUrl });
  }

  /**
   * Verifica um ID token de usuário e retorna o UID válido.
   * @param {string} idToken
   * @returns {Promise<string>} uid do usuário
   */
  async verifyIdToken(idToken) {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded.uid;
  }

  /**
   * Gera um custom token para autenticação no cliente.
   * @param {string} uid
   * @param {Object} [additionalClaims]
   * @returns {Promise<string>} custom token
   */
  async createCustomToken(uid, additionalClaims = {}) {
    return admin.auth().createCustomToken(uid, additionalClaims);
  }

  /**
   * Busca dados completos de um usuário pelo UID.
   * @param {string} uid
   * @returns {Promise<admin.auth.UserRecord>}
   */
  async getUser(uid) {
    return admin.auth().getUser(uid);
  }

  /**
   * Atualiza propriedades de um usuário.
   * @param {string} uid
   * @param {Object} properties Campos a serem atualizados (displayName, photoURL, etc.)
   * @returns {Promise<admin.auth.UserRecord>}
   */
  async updateUser(uid, properties) {
    return admin.auth().updateUser(uid, properties);
  }

  /**
   * Apaga um usuário pelo UID.
   * @param {string} uid
   * @returns {Promise<void>}
   */
  async deleteUser(uid) {
    return admin.auth().deleteUser(uid);
  }
}

module.exports = new FirebaseAuthenticationService();
