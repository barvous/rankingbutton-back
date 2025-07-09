require("dotenv").config();

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
const authService = require("./services/firebaseAuthenticationService");

const app = express();

// Constantes
const PORT = process.env.PORT || 3000;
const MAXIMO_USUARIOS_TOP_RANKING = 10;

//Configurando o serviço HTTP
const frontendOrigin = process.env.FRONTEND_ORIGIN;
app.use(cors({ origin: frontendOrigin }));
app.use(express.json());

// 1- ROTAS DA API

/**
 * Endpoint de criação de usuário Firebase Auth
 * Recebe JSON: { email, password, displayName }
 */
app.post("/api/auth/signup", async (req, res) => {
	// console.log("CHEGUEI")
	const { email, password, displayName } = req.body;
	if (!email || !password || !displayName) {
		return res
			.status(400)
			.json({ error: "Email e senha são obrigatórios" });
	}

	try {
		const userRecord = await authService.createUser({
			email,
			password,
			displayName,
		});
		// pode retornar o objeto completo ou só os campos que quiser expor
		res.status(201).json({
			uid: userRecord.uid,
			email: userRecord.email,
			displayName: userRecord.displayName,
		});
	} catch (err) {
		console.error("Erro ao criar usuário:", err);
		res.status(400).json({ error: err.message });
	}
});

// Criando o servidor http e configurando o websocket
const server = http.createServer(app);
const io = new Server(server, {
	cors: { origin: frontendOrigin },
});

// 2- ROTAS DO WEBSOCKET
let lastRanking = [];
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
			const ranking = await getTopUsersRanking(
				MAXIMO_USUARIOS_TOP_RANKING
			);
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
			const novaLista = await getTopUsersRanking(
				MAXIMO_USUARIOS_TOP_RANKING
			);
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

server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
