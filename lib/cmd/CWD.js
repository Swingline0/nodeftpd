// Change working directory.
module.exports = function(commandArg, di){

	var path = di.PathModule.join(di.internals.socket.sandbox, di.PathModule.resolve(di.internals.socket.fs.cwd(), commandArg));

	di.fs.exists(path, function(exists) {
		if(!exists){
			di.internals.socket.write('550 Folder not found.\r\n');
			return;
		}
		di.internals.socket.write('250 CWD successful. \"' + di.internals.socket.fs.chdir(commandArg) + '\" is current directory\r\n');
	});
};