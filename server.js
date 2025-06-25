const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Variável contador
let contador = 0;

// Rota simples
app.get('/', (req, res) => {
    console.log(req);
  res.send(`Contador atual: ${contador}`);
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
