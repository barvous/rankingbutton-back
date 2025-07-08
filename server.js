const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const {
	verifyIdToken,
	setUserClickCount,
	getUserClickCount,
	getTopUsersRanking,
} = require("./services/firebaseService");

let lastRanking = [];
const app = express();
const frontendOrigin = process.env.FRONTEND_ORIGIN;

const PORT = process.env.PORT || 3000;

console.log("CORS liberado para:", frontendOrigin);

app.use(cors({ origin: frontendOrigin })); // libera CORS pro seu Angular

const server = http.createServer(app);
const io = new Server(server, {
	cors: { origin: frontendOrigin }, // para o Socket.IO
});

io.on("connection", (socket) => {
	// 1) Tenta extrair token, mas NUNCA rejeita a conexão
	const token = socket.handshake.auth?.token;
	socket.userId = null;
	if (token) {
		verifyIdToken(token)
			.then((uid) => {
				socket.userId = uid;
			})
			.catch((err) => {
				console.error("Falha ao autenticar socket:", err);
			});
	} else {
		console.log(
			"Usuário não-autenticado conectado (ranking OK):",
			socket.id
		);
	}

	// 2) Evento público: qualquer um pode listar ranking
	socket.on("listarRanking", async () => {
		try {
			const ranking = await getTopUsersRanking(10);
			socket.emit("rankingUsuarios", ranking);
		} catch (err) {
			console.error("Erro em listarRanking:", err);
			socket.emit("rankingUsuarios", []);
		}
	});

	// 3) Evento protegido: só quem tiver userId setado
	socket.on("obterCliques", async () => {
		if (!socket.userId) {
			socket.emit("valorCliques", 0);
			return;
		}
		try {
			const total = await getUserClickCount(socket.userId);
			globalContador = total;
			socket.emit("valorCliques", total);
		} catch (err) {
			console.error("Erro em obterCliques:", err);
			socket.emit("valorCliques", 0);
		}
	});

	socket.on("botaoClicado", async () => {
		if (!socket.userId) return;
		// incrementa e salva no Firestore
		globalContador++;
		io.emit("contadorAtualizado", globalContador);
		await setUserClickCount(socket.userId, globalContador);

		// 1) re-calcula Top 10
		try {
			const novaLista = await getTopUsersRanking(10);
			// 2) compara com a anterior para não emitir sempre
			const mudou =
				JSON.stringify(novaLista) !== JSON.stringify(lastRanking);
			if (mudou) {
				lastRanking = novaLista;
				// 3) emite para TODOS os clientes (logados ou não)
				io.emit("rankingAtualizado", novaLista);
			}
		} catch (err) {
			console.error("Erro ao recalcular ranking:", err);
		}
	});

	socket.on("disconnect", () => {
		console.log("Usuário desconectado:", socket.userId);
	});
});

server.listen(PORT, () => console.log("Servidor rodando na porta 3000"));
