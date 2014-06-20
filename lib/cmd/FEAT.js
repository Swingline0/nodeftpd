// Get the feature list implemented by the internals.server. (RFC 2389)
module.exports = function(commandArg, di){
	di.internals.socket.write('211-Features\r\n');
	di.internals.socket.write(' SIZE\r\n');
	di.internals.socket.write('211 end\r\n');
};