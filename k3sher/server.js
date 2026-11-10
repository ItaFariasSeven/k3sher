const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on('connection', (socket) => {
  console.log(`Celular conectado: ${socket.id}`);

  // Simulando um evento que dispara uma notificação após 5 segundos
  setTimeout(() => {
    socket.emit('nova_notificacao', {
      titulo: 'Pagamento Recebido! 💰',
      corpo: 'Uma nova transação foi registrada no CantinaPay.',
      dados: { id_transacao: 123 }
    });
    console.log('Sinal de notificação enviado!');
  }, 5000);

  socket.on('disconnect', () => {
    console.log('Celular desconectado');
  });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});