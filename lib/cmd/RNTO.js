// Rename to.
module.exports = function(commandArg, di){

	var fileto = di.PathModule.resolve(di.internals.socket.fs.cwd(), commandArg);
	di.fs.rename(di.PathModule.join(di.internals.socket.sandbox, di.internals.socket.filefrom), di.PathModule.join(di.internals.socket.sandbox, fileto), function(err) {
		if(err){
			di.internals.logIf(3, 'Error renaming file from ' + di.internals.socket.filefrom + ' to ' + fileto, di.internals.socket);
			di.internals.socket.write('550 Rename failed\r\n');
		}else{
			di.internals.socket.write('250 File renamed successfully\r\n');
		}
	});
};