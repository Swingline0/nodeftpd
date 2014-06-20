// Remove a directory.
module.exports = function(commandArg, di){
	var filename = di.PathModule.resolve(di.internals.socket.fs.cwd(), commandArg);
	di.fs.rmdir(di.PathModule.join(di.internals.socket.sandbox, filename), function(err) {
		if(err){
			di.internals.logIf(0, 'Error removing directory ' + filename, di.internals.socket);
			di.internals.socket.write('550 Delete operation failed\r\n');
		}else{
			di.internals.socket.write('250 \"' + filename + '\" directory removed\r\n');
		}
	});
};