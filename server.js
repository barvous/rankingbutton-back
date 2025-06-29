const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Cors para http
app.use(cors({
  origin: 'http://localhost:4200',   // ou '*' se quiser liberar para qualquer origem
  methods: ['GET','POST'],           // métodos que você vai usar
  allowedHeaders: ['Content-Type'],  // headers que você usa
}));

// Cors do websocket
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Variável contador
let contador = 0;

// Rota simples
app.get('/cliques', (req, res) => {
  res.send(contador);
});

// Conexão socket
io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);

  socket.on('botaoClicado', () => {
    contador += 1;
    console.log(`Contador: ${contador}`);

    // Envia o novo contador para todos os clientes
    io.emit('contadorAtualizado', contador);
  });

  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);
  });
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
