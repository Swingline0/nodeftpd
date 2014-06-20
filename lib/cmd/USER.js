// Authentication username.
module.exports = function(commandArg, di){
	di.internals.socket.emit(
		'command:user',
		commandArg,
		function() { // implementor should call this on successful password check
			di.internals.socket.write('331 Password required for ' + commandArg + '\r\n');
		},
		function() { // call second callback if password incorrect
			di.internals.socket.write('530 Invalid username: ' + commandArg + '\r\n');
		}
	);
};