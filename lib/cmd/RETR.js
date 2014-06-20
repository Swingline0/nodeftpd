// Retrieve (download) a remote file.
module.exports = function(commandArg, di){
	di.internals.whenDataWritable(function(dataSocket){
		dataSocket.setEncoding(di.internals.socket.mode);

		var filename = di.PathModule.resolve(di.internals.socket.fs.cwd(), commandArg);
		var from = di.fs.createReadStream(di.PathModule.join(di.internals.socket.sandbox, filename), {flags: 'r'});

		from.on('error', function(){
			di.internals.logIf(2, 'Error reading file');
		});

		from.on('end', function(){
			di.internals.logIf(3, 'DATA file ' + filename + ' closed');
			dataSocket.end();
			di.internals.socket.write('226 Closing data connection\r\n');
		});

		di.internals.logIf(3, 'DATA file ' + filename + ' opened');

		di.internals.socket.write('150 Opening ' + di.internals.socket.mode.toUpperCase() + ' mode data connection\r\n');

		if(dataSocket.readable){
			dataSocket.resume();
			from.pipe(dataSocket);
		}
	});
};