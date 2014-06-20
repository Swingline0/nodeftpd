// Authentication password.
module.exports = function(commandArg, di){
	di.internals.socket.emit(
		'command:pass',
		commandArg,
		function(username) { // implementor should call this on successful password check
			di.internals.socket.write('230 Logged on\r\n');
			di.internals.socket.username = username;
			di.internals.socket.sandbox = di.PathModule.join(di.internals.server.baseSandbox, username);
		},
		function() { // call second callback if password incorrect
			di.internals.socket.write('530 Invalid password\r\n');
			di.internals.socket.authFailures++;
			di.internals.socket.username = null;
		}
	);
};