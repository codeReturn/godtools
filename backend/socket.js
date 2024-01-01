function initSocket(http, corsOptions) {
  const io = require('socket.io')(http, {
    cors: corsOptions,
    path: '/godtoolshost/socket.io/',
  });

  io.on('connection', async (socket) => {
      const { userId } = socket.handshake.query;

      socket.join("user:" + userId)
      
      socket.on('join',  function(data) {
        console.log(data)
      });

      socket.on('disconnect', (reason) => {
        console.log(reason)
      });
      
      socket.on('error', (error) => {
        console.log(error)
      });
    
      socket.on('join_license', function(data) {
        console.log('join_license' + data)
        socket.join("license:" + data)
      })
    
      socket.on('join_admin', function() {
        socket.join("admin")
      })
    
      const appController = require('./controllers/app-controllers')
      const adminController = require('./controllers/admin-controllers');

      appController.initialize(io);
      adminController.initialize(io);
  });
}

module.exports = initSocket;