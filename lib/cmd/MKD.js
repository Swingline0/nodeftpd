// Make directory.
module.exports = function(commandArg, di){

	var filename = di.PathModule.resolve(di.internals.socket.fs.cwd(), commandArg);

	di.fs.mkdir(di.PathModule.join(di.internals.socket.sandbox, filename), 0755, function(err) {

		if(err){
			di.internals.logIf(0, 'Error making directory ' + filename + ' because ' + err, di.internals.socket);
			// write error to internals.socket
			di.internals.socket.write('550 \"' + filename + '\" directory NOT created\r\n');

			return;
		}

	di.internals.socket.write('257 \"' + filename + '\" directory created\r\n');

	});
};