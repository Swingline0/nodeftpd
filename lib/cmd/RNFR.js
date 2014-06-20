// Rename from.
module.exports = function(commandArg, di){

	di.internals.socket.filefrom = di.PathModule.resolve(di.internals.socket.fs.cwd(), commandArg);
	di.internals.logIf(3, 'Rename from ' + di.internals.socket.filefrom, di.internals.socket);

	di.fs.exists(di.PathModule.join(di.internals.socket.sandbox, di.internals.socket.filefrom), function(exists) {
		if(exists){
			di.internals.socket.write('350 File exists, ready for destination name\r\n');
		}else{
			di.internals.socket.write('350 Command failed, file does not exist\r\n');
		}
	});
};