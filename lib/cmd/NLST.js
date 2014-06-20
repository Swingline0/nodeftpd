// Returns a list of file names in a specified directory.
module.exports = function(commandArg, di){

	/**
	Normally the server responds with a mark using code 150. It then stops accepting new connections, attempts to send the contents of the directory over the data connection, and closes the data connection. Finally it

		accepts the LIST or NLST request with code 226 if the entire directory was successfully transmitted;
		rejects the LIST or NLST request with code 425 if no TCP connection was established;
		rejects the LIST or NLST request with code 426 if the TCP connection was established but then broken by the client or by network failure; or
		rejects the LIST or NLST request with code 451 if the server had trouble reading the directory from disk.

	The server may reject the LIST or NLST request (with code 450 or 550) without first responding with a mark. In this case the server does not touch the data connection.
	 *
	 */

	di.internals.whenDataWritable(function(dataSocket){

		// This will be called once data has ACTUALLY written out ... internals.socket.write() is async!
		var success = function(){
			di.internals.socket.write('226 Transfer OK\r\n');
			dataSocket.end();
		};

		var failure = function(){
			dataSocket.end();
		};

		// Use temporary filesystem path maker since a path might be sent with NLST
		var temp = '';

		if(commandArg){
			// Remove double slashes or "up directory"
			commandArg = commandArg.replace(/\/{2,}|\.{2}/g, '');

			if(commandArg.substr(0, 1) == '/'){
				temp = di.PathModule.join(di.internals.socket.sandbox, commandArg);
			}else{
				temp = di.PathModule.join(di.internals.socket.sandbox, di.internals.socket.fs.cwd(), commandArg);
			}
		}else{
			temp = di.PathModule.join(di.internals.socket.sandbox, di.internals.socket.fs.cwd());
		}

		if(dataSocket.readable){
			dataSocket.resume();
		}

		di.internals.logIf(3, 'Sending file list', di.internals.socket);

		di.glob(temp, function(err, files){
			if(err){
				di.internals.logIf(0, 'During NLST, error globbing files: ' + err, di.internals.socket);
				di.internals.socket.write('451 Read error\r\n');
				dataSocket.write('', failure);
				return;
			}

			// Wait until acknowledged!
			di.internals.socket.write('150 Here comes the directory listing\r\n', function() {
				di.internals.logIf(3, 'Directory has ' + files.length + ' files', di.internals.socket);
				dataSocket.write(files.map(di.PathModule.basename).join('\015\012') + '\015\012', success);
			});
		});
	});
};