// Returns information of a file or directory if specified, else information of the current working directory is returned.
module.exports = function(commandArg, di){

	di.internals.whenDataWritable(function(dataSocket) {

		var leftPad = function(text, width) {
			var out = '';
			for(var j = text.length; j < width; j++){
				out += ' ';
			}
			out += text;
			return out;
		  };

		// This will be called once data has ACTUALLY written out ... internals.socket.write() is async!
		var success = function() {
			di.internals.socket.write('226 Transfer OK\r\n');
			dataSocket.end();
		};

		var failure = function() {
			dataSocket.end();
		};

		var path = di.PathModule.join(di.internals.socket.sandbox, di.internals.socket.fs.cwd());

		if(dataSocket.readable){
			dataSocket.resume();
		}

		di.internals.logIf(3, 'Sending file list', di.internals.socket);

		di.fs.readdir(path, function(err, files) {
			if(err){
				di.internals.logIf(0, 'While sending file list, reading directory: ' + err, di.internals.socket);
				dataSocket.write('', failure);
			}else{
				// Wait until acknowledged!
				di.internals.socket.write('150 Here comes the directory listing\r\n', function() {
					di.internals.logIf(3, 'Directory has ' + files.length + ' files', di.internals.socket);
					for(var i = 0; i < files.length; i++){
						var file = files[i];
						var s = di.fs.statSync(di.PathModule.join(path, file));
						var line = s.isDirectory() ? 'd' : '-';
						if (i > 0) dataSocket.write('\r\n');
						line += (0400 & s.mode) ? 'r' : '-';
						line += (0200 & s.mode) ? 'w' : '-';
						line += (0100 & s.mode) ? 'x' : '-';
						line += (040 & s.mode) ? 'r' : '-';
						line += (020 & s.mode) ? 'w' : '-';
						line += (010 & s.mode) ? 'x' : '-';
						line += (04 & s.mode) ? 'r' : '-';
						line += (02 & s.mode) ? 'w' : '-';
						line += (01 & s.mode) ? 'x' : '-';
						line += ' 1 ftp ftp ';
						line += leftPad(s.size.toString(), 12) + ' ';
						var d = new Date(s.mtime);
						line += leftPad(d.format('M d H:i'), 12) + ' '; // need to use a date string formatting lib
						line += file;
						dataSocket.write(line);
					}
					// write the last bit, so we can know when it's finished
					dataSocket.write('\r\n', success);
				});
			}
		});
	});
};