// Store (upload) a file.
module.exports = function(commandArg, di){

	di.internals.whenDataWritable(function(dataSocket){

		// dataSocket comes to us paused, so we have a chance to create the file before accepting data
		filename = di.PathModule.resolve(di.internals.socket.fs.cwd(), commandArg);

		var destination = di.fs.createWriteStream(
			di.PathModule.join(di.internals.socket.sandbox, filename), {flags: 'w+', mode: 0644}
		);

		destination.on('error', function(err) {
			di.internals.logIf(0, 'Error opening/creating file: ' + filename, di.internals.socket);
			di.internals.socket.write('553 Could not create file\r\n');
			dataSocket.end();
		});

		destination.on('close', function(){
			// Finished
		});

		di.internals.logIf(3, 'File opened/created: ' + filename, di.internals.socket);

		dataSocket.addListener('end', function(){
			di.internals.socket.write('226 Data connection closed\r\n');
		});

		dataSocket.addListener('error', function(err){
			di.internals.logIf(0, 'Error transferring ' + filename + ': ' + err, di.internals.socket);
		});

		di.internals.logIf(3, 'Told client ok to send file data', di.internals.socket);

		di.internals.socket.write('150 Ok to send data\r\n'); // don't think resume() needs to wait for this to succeed

		if(dataSocket.readable){
			dataSocket.resume();
			// Let pipe() do the dirty work ... it'll keep both streams in sync
			dataSocket.pipe(destination);
		}
	});
};