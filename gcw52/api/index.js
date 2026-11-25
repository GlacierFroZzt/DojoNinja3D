const server = require('../servidor');

module.exports = (req, res) => {
  server.emit('request', req, res);
};
