// Disconnect.
module.exports = function(commandArg, di){
	di.internals.socket.write('221 Goodbye\r\n');
	di.internals.socket.end();
	di.internals.closeDataConnections();
};