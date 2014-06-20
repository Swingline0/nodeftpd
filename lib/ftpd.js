var net = require('net');
var util = require('util');
var fs = require('fs');
var dummyfs = require('./dummyfs');
var PathModule = require('path');
var glob = require('./glob');
require('./date-format');

var internals = {
  socket: null,
  server: null
};

var _supportedCommands = [
  'CDUP',
  'CWD',
  'DELE',
  'FEAT',
  'LIST',
  'MKD',
  'NLST',
  'PASS',
  'PASV',
  'PORT',
  'PWD',
  'QUIT',
  'RETR',
  'RMD',
  'RNFR',
  'RNTO',
  'SIZE',
  'STOR',
  'SYST',
  'TYPE',
  'USER',
  'XPWD'
];

var _unsupportedCommands = [
  'ABOR', // unsupported
  'ACCT', // unsupported
  'ADAT', // unsupported
  'ALLO', // unsupported
  'APPE', // unsupported
  'AUTH', // unsupported
  'CCC', // unsupported
  'CONF', // unsupported
  'ENC', // unsupported
  'EPRT', // unsupported
  'EPSV', // unsupported
  'HELP', // unsupported
  'LANG', // unsupported
  'LPRT', // unsupported
  'LPSV', // unsupported
  'MDTM', // unsupported
  'MIC', // unsupported
  'MLSD', // unsupported
  'MLST', // unsupported
  'MODE', // unsupported
  'NOOP', // unsupported
  'OPTS', // unsupported
  'PBSZ', // unsupported
  'REIN', // unsupported
  'REST', // unsupported
  'SITE', // unsupported
  'SMNT', // unsupported
  'STAT', // unsupported
  'STOU', // unsupported
  'STRU' // unsupported
];


/*
TODO:
- Implement Full RFC 959
- Implement RFC 2428
- Implement RFC 2228
- Implement RFC 3659
- Implement TLS - http://en.wikipedia.org/wiki/FTPS

*/


/**
 * [logIf description]
 *
 * @param  {[type]} level
 * @param  {[type]} message
 * @param  {[type]} internals.socket
 *
 * @return {[type]}
 */
internals.logIf = function(level, message, socket) {
  if (internals.server.debugging >= level) {
    if (socket) {
      console.log(socket.remoteAddress + ': ' + message);
    } else {
      console.log(message);
    }
  }
};


/**
 * [authenticated description]
 *
 * @return {[type]}
 */
internals.authenticated = function() {
  // send a message if not authenticated?
  return (internals.socket.username ? true : false);
};


/**
 * [authFailures description]
 *
 * @return {[type]}
 */
internals.authFailures = function() {
  if (internals.socket.authFailures >= 2) {
    internals.socket.end();
    return true;
  }

  return false;
};


/**
 * [closeDataConnections description]
 *
 * @return {[type]}
 */
internals.closeDataConnections = function() {
  if (internals.socket.dataListener) {
    internals.socket.dataListener.close(); // we're creating a new listener
  }

  if (internals.socket.dataSocket) {
    internals.socket.dataSocket.end(); // close any existing connections
  }
};


/**
 * Purpose of this is to ensure a valid data connection, and run the callback when it's ready
 *
 * @param  {Function} callback
 *
 * @return {[type]}
 */
internals.whenDataWritable = function(callback) {
  if (internals.socket.passive) {
    // how many data connections are allowed?
    // should still be listening since we created a server, right?
    if (internals.socket.dataSocket) {
      internals.logIf(3, 'A data connection exists', internals.socket);

      if (callback) {
        callback(internals.socket.dataSocket); // do!
      }
    } else {
      internals.logIf(3, 'Passive, but no data internals.socket exists ... waiting', internals.socket);

      internals.socket.dataListener.on('data-ready', function(dataSocket) {
        internals.logIf(3, 'Looks like waiting paid off. Here we go!');
        callback(dataSocket);
      });

      //internals.socket.write("425 Can't open data connection\r\n");
    }
  } else {
    // Do we need to open the data connection?
    if (internals.socket.dataSocket) { // There really shouldn't be an existing connection
      internals.logIf(3, 'Using existing non-passive dataSocket', internals.socket);
      callback(internals.socket.dataSocket);
    } else {
      internals.logIf(1, 'Opening data connection to ' + internals.socket.dataHost + ':' + internals.socket.dataPort, internals.socket);

      var dataSocket = new net.Socket();

      // Since data may arrive once the connection is made, pause it right away
      dataSocket.on('data', function(data) {
        internals.logIf(3, dataSocket.remoteAddress + ' event: data ; ' + (Buffer.isBuffer(data) ? 'buffer' : 'string'));
      });

      dataSocket.addListener('connect', function() {
        dataSocket.pause(); // Pause until the data listeners are in place
        internals.socket.dataSocket = dataSocket;
        internals.logIf(3, 'Data connection succeeded', internals.socket);
        callback(dataSocket);
      });

      dataSocket.addListener('close', function(had_error) {
        internals.socket.dataSocket = null;
        if (had_error) {
          internals.logIf(0, 'Data event: close due to error', internals.socket);
        } else {
          internals.logIf(3, 'Data event: close', internals.socket);
        }
      });

      dataSocket.addListener('end', function() {
        internals.logIf(3, 'Data event: end', internals.socket);
      });

      dataSocket.addListener('error', function(err) {
        internals.logIf(0, 'Data event: error: ' + err, internals.socket);
        dataSocket.destroy();
      });

      dataSocket.connect(internals.socket.dataPort, internals.socket.dataHost);
    }
  }
};


/**
 * host should be an IP address, and sandbox a path without trailing slash for now
 *
 * @param  {[type]} host
 * @param  {[type]} sandbox
 *
 * @return {[type]}
 */
internals.createServer = function(host, sandbox) {
  // make sure host is an IP address, otherwise DATA connections will likely break
  internals.server = net.createServer();
  internals.server.baseSandbox = sandbox; // path which we're starting relative to
  internals.server.debugging = 0;

  internals.server.on('listening', function() {
    internals.logIf(0, 'nodeFTPd server up and ready for connections');
  });

  internals.server.on('connection', function(socket) {
    internals.socket = socket;

    internals.server.emit('client:connected', internals.socket); // pass internals.socket so they can listen for client-specific events

    internals.socket.setTimeout(0); // We want to handle timeouts ourselves
    internals.socket.setEncoding('ascii'); // force data String not Buffer, so can parse FTP commands as a string
    internals.socket.setNoDelay();

    internals.socket.passive = false;
    internals.socket.dataHost = null;
    internals.socket.dataPort = 20; // default
    internals.socket.dataListener = null; // for incoming passive connections
    internals.socket.dataSocket = null; // the actual data internals.socket
    internals.socket.mode = 'ascii';
    internals.socket.filefrom = '';
    // Authentication
    internals.socket.authFailures = 0; // 3 tries then we disconnect you
    internals.socket.username = null;

    internals.socket.sandbox = sandbox; // after authentication we'll tack on a user-specific subfolder
    internals.socket.fs = new dummyfs.dummyfs('/');
    internals.logIf(0, 'Base FTP directory: ' + internals.socket.fs.cwd());

    internals.socket.addListener('data', function(data) {
      data = (data + '').trim();
      internals.logIf(2, 'FTP command: ' + data, internals.socket);

      var command, commandArg;

      var index = data.indexOf(' ');
      if (index > 0) {
        command = data.substring(0, index).trim().toUpperCase();
        commandArg = data.substring(index + 1, data.length).trim();
      } else {
        command = data.trim().toUpperCase();
        commandArg = '';
      }
      // Separate authenticated versus not?

      //-----------------------------------
      // process commands here
      //-----------------------------------

      try{
        internals.command(command, commandArg);
      }catch(ex){
        internals.socket.write('202 Not supported\r\n');
        internals.logIf(0, command + ' is an unsupported command', internals.socket);
      }

    });


    internals.socket.addListener('end', function() {
      internals.logIf(1, 'Client connection ended', internals.socket);
    });

    internals.socket.addListener('error', function(err) {
      internals.logIf(0, 'Client connection error: ' + err, internals.socket);
    });

    // Tell client we're ready
    internals.logIf(1, 'Connection', internals.socket);
    internals.socket.write('220 FTP server (nodeftpd) ready\r\n');
  });

  internals.server.addListener('close', function() {
    internals.logIf(0, 'Server closed');
  });

  return internals.server;
};

internals.command = function(command, commandArg) {

  // Collect dependencies to pass on to command handlers
  dependencyInjector = {
    internals:     internals,
    PathModule:    PathModule,
    fs:            fs,
    glob:          glob
  };

  // @TODO Bring back some authentication

  // Off you go!
  require('./cmd/' + command)(commandArg, dependencyInjector);

};


util.inherits(internals.createServer, process.EventEmitter);

exports.createServer = internals.createServer;
