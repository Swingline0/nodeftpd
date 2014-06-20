module.exports = function(commandArg, di){

	// not sure whether the spec limits to 1 data connection at a time ...
	if(di.internals.socket.dataListener){
		di.internals.socket.dataListener.close(); // we're creating a new listener
	}

	if(di.internals.socket.dataSocket){
		di.internals.socket.dataSocket.end(); // close any existing connections
	}

	di.internals.socket.dataListener = null;
	di.internals.socket.dataSocket = null;
	di.internals.socket.pause(); // Pause processing of further commands

	var pasv = net.createServer(function(pasvSocket){
		di.internals.logIf(1, 'Incoming passive data connection', di.internals.socket);
		pasvSocket.pause(); // Pause until data listeners are in place

		pasvSocket.on('data', function(data){
			// should watch out for malicious users uploading large amounts of data outside protocol
			di.internals.logIf(4, 'Data event: received ' + (Buffer.isBuffer(data) ? 'buffer' : 'string'), di.internals.socket);
		});

		pasvSocket.on('end', function(){
			di.internals.logIf(3, 'Passive data event: end', di.internals.socket);
			// remove pointer
			di.internals.socket.dataSocket = null;

			if(di.internals.socket.readable){
				di.internals.socket.resume(); // just in case
			}
		});

		pasvSocket.addListener('error', function(err){

			di.internals.logIf(0, 'Passive data event: error: ' + err, di.internals.socket);
			di.internals.socket.dataSocket = null;

			if(di.internals.socket.readable){
				di.internals.socket.resume();
			}
		});

		pasvSocket.addListener('close', function(had_error){
			di.internals.logIf(
				(had_error ? 0 : 3),
				'Passive data event: close ' + (had_error ? ' due to error' : ''),
				di.internals.socket
			);
			if(di.internals.socket.readable){
				di.internals.socket.resume();
			}
		});

		// Once we have a completed data connection, make note of it
		di.internals.socket.dataSocket = pasvSocket;

		// 150 should be sent before we send data on the data connection
		//internals.socket.write("150 Connection Accepted\r\n");
		if(di.internals.socket.readable){
			di.internals.socket.resume();
		}

		// Emit this so the pending callback gets picked up in whenDataWritable()
		di.internals.socket.dataListener.emit('data-ready', pasvSocket);

	});

	// Once we're successfully listening, tell the client
	pasv.addListener('listening', function(){
		var port = pasv.address().port;
		di.internals.socket.passive = true; // wait until we're actually listening
		di.internals.socket.dataHost = host;
		di.internals.socket.dataPort = port;
		di.internals.logIf(3, 'Passive data connection listening on port ' + port, di.internals.socket);
		var i1 = parseInt(port / 256);
		var i2 = parseInt(port % 256);
		di.internals.socket.write('227 Entering Passive Mode (' + host.split('.').join(',') + ',' + i1 + ',' + i2 + ')\r\n');
	});

	pasv.on('close', function(){
		di.internals.logIf(3, 'Passive data listener closed', di.internals.socket);
		if(di.internals.socket.readable){
			di.internals.socket.resume(); // just in case
		}
	});

	pasv.listen(0);
	di.internals.socket.dataListener = pasv;
	di.internals.logIf(3, 'Passive data connection beginning to listen', di.internals.socket);
};