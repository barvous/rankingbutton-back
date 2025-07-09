const admin = require('../firebaseAdminConfig');
const db = admin.firestore();
const COLECAO_USUARIO_FIRSTORE = "usuario";

/**
 * Verifica o ID Token passado pelo cliente e retorna o UID.
 * @param {string} idToken
 * @returns {Promise<string>} uid do usuário
 */
async function verifyIdToken(idToken) {
	const decoded = await admin.auth().verifyIdToken(idToken);
	return decoded.uid;
}

/**
 * Grava (ou atualiza) no Firestore o total de cliques de um usuário.
 * @param {string} userId
 * @param {number} totalCliques
 * @returns {Promise<FirebaseFirestore.WriteResult>}
 */
function setUserClickCount(userId, totalCliques) {
	return db
		.collection(COLECAO_USUARIO_FIRSTORE)
		.doc(userId)
		.set({ totalCliques }, { merge: true });
}

/**
 * Busca o totalCliques do usuário na coleção "usuario".
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function getUserClickCount(userId) {
	const doc = await db.collection(COLECAO_USUARIO_FIRSTORE).doc(userId).get();
	if (!doc.exists) return 0;
	const data = doc.data();
	return typeof data.totalCliques === "number" ? data.totalCliques : 0;
}

/**
 * Busca os top N usuários ordenados por totalCliques desc na coleção "usuario"
 * @param {number} limit Número máximo de usuários a retornar
 * @returns {Promise<Array<{ userId: string, apelido?: string, totalCliques?: number, dataUltimoClique?: any }>>}
 */
async function getTopUsersRanking(limit = 10) {
	const snapshot = await db
		.collection(COLECAO_USUARIO_FIRSTORE)
		.orderBy("totalCliques", "desc")
		.limit(limit)
		.get();

	return snapshot.docs.map((doc) => {
		const data = doc.data();
		return {
			userId: doc.id,
			apelido: data.apelido,
			totalCliques: data.totalCliques,
			dataUltimoClique: data.dataUltimoClique,
		};
	});
}

module.exports = {
	verifyIdToken,
	setUserClickCount,
	getUserClickCount,
	getTopUsersRanking,
};
