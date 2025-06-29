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

const LIMITE_DO_RANKING = 10;
const app = express();
app.use(cors({ origin: "http://localhost:4200" })); // libera CORS pro seu Angular

const server = http.createServer(app);
const io = new Server(server, {
	cors: { origin: "*" }, // para o Socket.IO
});

let contador = 0;

io.on("connection", (socket) => {
	// 1) Tenta extrair token, mas NUNCA rejeita a conexão
	const token = socket.handshake.auth?.token;
	socket.userId = null;
	if (token) {
		verifyIdToken(token)
			.then((uid) => {
				socket.userId = uid;
				console.log("Usuário autenticado conectado:", uid);
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
			console.log("Ranking:", ranking);
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

	// 4) Evento protegido: só quem tiver userId setado
	socket.on("botaoClicado", async () => {
		if (!socket.userId) return;
		globalContador++;
		io.emit("contadorAtualizado", globalContador);
		try {
			await setUserClickCount(socket.userId, globalContador);
		} catch (err) {
			console.error("Erro ao gravar totalCliques:", err);
		}
	});

	socket.on("disconnect", () => {
		console.log("Usuário desconectado:", socket.userId);
	});
});

server.listen(3000, () => console.log("Servidor rodando na porta 3000"));
