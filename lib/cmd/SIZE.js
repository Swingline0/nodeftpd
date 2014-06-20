// Return the size of a file. (RFC 3659)
module.exports = function(commandArg, di){

	var filename = di.PathModule.resolve(di.internals.socket.fs.cwd(), commandArg);

	di.fs.stat(di.PathModule.join(di.internals.socket.sandbox, filename), function(err, s) {
		if(err){
			di.internals.logIf(0, 'Error getting size of file: ' + filename, di.internals.socket);
			di.internals.socket.write('450 Failed to get size of file\r\n');
			return;
		}
		di.internals.socket.write('213 ' + s.size + '\r\n');
	});
};