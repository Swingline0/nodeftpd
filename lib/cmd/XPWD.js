module.exports = function(commandArg, di){
	di.internals.socket.write('257 ' + di.internals.socket.fs.cwd() + ' is the current directory\r\n');
};