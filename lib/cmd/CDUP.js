// Change to Parent Directory.
module.exports = function(commandArg, di){
	di.internals.socket.write('250 Directory changed to ' + di.internals.socket.fs.chdir('..') + '\r\n');
};