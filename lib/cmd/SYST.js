// Return system type.
module.exports = function(commandArg, di){
	di.internals.socket.write('215 UNIX emulated by NodeFTPd\r\n');
};