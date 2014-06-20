// Sets the transfer mode (ASCII/Binary).
module.exports = function(commandArg, di){
	if(commandArg == 'A'){
		di.internals.socket.mode = 'ascii';
		di.internals.socket.write('200 Type set to A\r\n');
	}else{
		di.internals.socket.mode = 'binary';
		di.internals.socket.write('200 Type set to I\r\n');
	}
};