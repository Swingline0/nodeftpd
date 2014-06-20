// Delete file.
module.exports = function(commandArg, di){

	var filename = di.PathModule.resolve(di.internals.socket.fs.cwd(), commandArg);

	di.fs.unlink(di.PathModule.join(di.internals.socket.sandbox, filename), function(err) {
		if (err){
			di.internals.logIf(0, 'Error deleting file: ' + filename + ', ' + err, di.internals.socket);
			// write error to internals.socket
			di.internals.socket.write('550 Permission denied\r\n');
		}else{
			di.internals.socket.write('250 File deleted\r\n');
		}
	});
};