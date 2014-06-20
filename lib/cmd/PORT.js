// Specifies an address and port to which the server should connect.
module.exports = function(commandArg, di){
	di.internals.socket.passive = false;
	di.internals.socket.dataSocket = null;

	var addr = commandArg.split(',');

	di.internals.socket.dataHost = addr[0] + '.' + addr[1] + '.' + addr[2] + '.' + addr[3];
	di.internals.socket.dataPort = (parseInt(addr[4]) * 256) + parseInt(addr[5]);
	di.internals.socket.write('200 PORT command successful.\r\n');
};