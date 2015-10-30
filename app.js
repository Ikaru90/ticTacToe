var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.set('port', (process.env.PORT || 80));

server.listen(app.get('port'));

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
	res.sendfile(__dirname + '/index.html');
});

var clients = new Array();
var roomList = new Array();

var Client = function(id,name){
	this.id = id;
	this.name = name;
};

var Room = function(owner,ownerName,name,size){
	this.status = 'open';
	this.owner = owner;
	this.ownerName = ownerName;
	this.player;
	this.name = name;
	this.size = size;
	this.gameField = new Array();
	for (var i=0; i<size; i++) {
		this.gameField[i] = new Array();
	}
	this.turn = 'owner';
};

function checkWin(x,o,owner,player,roomNumber){
	if (x >= 5){
		io.to(owner).emit('error', 'YOU WIN');
		io.to(player).emit('error', 'YOU LOSE');
		roomList.splice(roomNumber,1);
	}
	if (o >= 5){
		io.to(player).emit('error', 'YOU WIN');
		io.to(owner).emit('error', 'YOU LOSE');
		roomList.splice(roomNumber,1);
	}
};

function calcSeriesWin(game,roomNumber){
	seriesX = 0;
	seriesO = 0;
	// search vertical
	for (var i = 0; i < game.size; i++) {
		for (var j = 0; j < game.size; j++) {
			if (game.gameField[i][j] == 'X'){
				seriesX += 1;
			}else{
				seriesX = 0;
			}
			if (game.gameField[i][j] == 'O'){
				seriesO += 1;
			}else{
				seriesO = 0;
			}
			checkWin(seriesX,seriesO,game.owner,game.player,roomNumber);
		}
		seriesX = 0;
		seriesO = 0;
	}
	// search horizontal
	for (var j = 0; j < game.size; j++) {
		for (var i = 0; i < game.size; i++) {
			if (game.gameField[i][j] == 'X'){
				seriesX += 1;
			}else{
				seriesX = 0;
			}
			if (game.gameField[i][j] == 'O'){
				seriesO += 1;
			}else{
				seriesO = 0;
			}
			checkWin(seriesX,seriesO,game.owner,game.player,roomNumber);
		}
		seriesX = 0;
		seriesO = 0;
	}
	// search upper right triangle
	//OOO = 1;
	for (var j = game.size-1; j > 0; j--) {
		for (var i = 0; i < (game.size-j+1); i++) {
			//game.gameField[i][j+i] = OOO;
			if (game.gameField[i][j+i] == 'X'){
				seriesX += 1;
			}else{
				seriesX = 0;
			}
			if (game.gameField[i][j+i] == 'O'){
				seriesO += 1;
			}else{
				seriesO = 0;
			}
			checkWin(seriesX,seriesO,game.owner,game.player,roomNumber);
		}
		//OOO++;
		seriesX = 0;
		seriesO = 0;
	}
	// search lower left triangle
	//OOO = 1;
	for (var j = 0; j < game.size; j++) {
		for (var i = 0; i < j+1; i++) {
			//game.gameField[game.size-i-1][j-i] = OOO;
			if (game.gameField[game.size-i-1][j-i] == 'X'){
				seriesX += 1;
			}else{
				seriesX = 0;
			}
			if (game.gameField[game.size-i-1][j-i] == 'O'){
				seriesO += 1;
			}else{
				seriesO = 0;
			}
			checkWin(seriesX,seriesO,game.owner,game.player,roomNumber);
		}
		//OOO++;
		seriesX = 0;
		seriesO = 0;
	}
	// search upper left triangle
	//OOO = 1;
	for (var i = 0; i < game.size-1; i++) {
		for (var j = 0; j < i+1; j++) {
			//game.gameField[i-j][j] = OOO;
			if (game.gameField[i-j][j] == 'X'){
				seriesX += 1;
			}else{
				seriesX = 0;
			}
			if (game.gameField[i-j][j] == 'O'){
				seriesO += 1;
			}else{
				seriesO = 0;
			}
			checkWin(seriesX,seriesO,game.owner,game.player,roomNumber);
		}
		//OOO++;
		seriesX = 0;
		seriesO = 0;
	}
	// search lower right triangle
	//OOO = 1;
	for (var i = game.size-1; i >= 0; i--) {
		for (var j = 0; j < (game.size-i); j++) {
			//game.gameField[i+j][game.size-j-1] = OOO;
			if (game.gameField[i+j][game.size-j-1] == 'X'){
				seriesX += 1;
			}else{
				seriesX = 0;
			}
			if (game.gameField[i+j][game.size-j-1] == 'O'){
				seriesO += 1;
			}else{
				seriesO = 0;
			}
			checkWin(seriesX,seriesO,game.owner,game.player,roomNumber);
		}
		//OOO++;
		seriesX = 0;
		seriesO = 0;
	}
};

io.on('connection', function(socket){

	socket.on('tryLogin', function(name){
		if (name != ''){
			if ( /^[\w]{0,16}$/i.test(name) ) {
				freeName = true;
				searchClient: for(var i=0;i<clients.length;i++) {
					if (clients[i].name == name){
						freeName = false;
						break searchClient;
					}
				}
				if (freeName){
					newClient = new Client(socket.id,name);
					clients.push(newClient);
					io.to(socket.id).emit('loginSuccess',roomList);
				} else {
					io.to(socket.id).emit('error', 'Name alredy used');
				}
			} else {
			io.to(socket.id).emit('error', 'Wrong room name');
			}
		}else{
			io.to(socket.id).emit('error', 'Name cannot be empty');
		}
	});

	socket.on('enterTheRoom', function(roomName){
		searchRoom: for(var i=0;i<roomList.length;i++) {
			if (roomList[i].name == roomName){
				roomID = i;
				break searchRoom;
			}
		}
		if (roomList[roomID].player == undefined){
			roomList[roomID].player = socket.id;
			roomList[roomID].status = 'close';
			socket.join(roomList[roomID].name);
			io.to(socket.id).emit('enterTheRoom', roomList[roomID]);
			io.emit('getRoomList', roomList);
		} else {
			io.to(socket.id).emit('error', 'Room not empty');
		}
	});

	socket.on('disconnect', function(){
		searchClient: for(var i=0;i<clients.length;i++) {
			if (clients[i].id == socket.id){								
				clients.splice(i,1);
				break searchClient;
			}
		}
		searchRoom: for(var i=0;i<roomList.length;i++) {
			if (roomList[i].owner == socket.id){
				io.to(roomList[i].player).emit('error', 'One player was disconnected, game over');
				io.to(roomList[i].player).emit('backToRoomList');
				roomList.splice(i,1);
				break searchRoom;
			}
		}
		searchRoom: for(var i=0;i<roomList.length;i++) {
			if (roomList[i].player == socket.id){
				io.to(roomList[i].owner).emit('error', 'One player was disconnected, game over');
				io.to(roomList[i].owner).emit('backToRoomList');
				roomList.splice(i,1);
				break searchRoom;
			}
		}
		io.emit('getRoomList', roomList);
	});

	socket.on('sendMessage', function(data){		
		if (data != ''){
			var room;
			var name;
			var player;
			searchRoom: for(var i=0;i<roomList.length;i++) {
				if (roomList[i].owner == socket.id){
					room = roomList[i].name;
					player = 'owner';
					break searchRoom;
				}
				if (roomList[i].player == socket.id){
					room = roomList[i].name;
					player = 'player';
					break searchRoom;
				}
			}
			searchClient: for(var i=0;i<clients.length;i++) {
				if (clients[i].id == socket.id){
					name = clients[i].name;
					break searchClient;
				}
			}
			io.to(room).emit('sendMessage',[name,data,player]);
		}
	});

	socket.on('exitGame', function(){
		searchRoom: for(var i=0;i<roomList.length;i++) {
			if (roomList[i].owner == socket.id){
				io.to(roomList[i].player).emit('error', 'One player was disconnected, game over');
				io.to(roomList[i].player).emit('backToRoomList');
				roomList.splice(i,1);
				break searchRoom;
			}
			if (roomList[i].player == socket.id){
				io.to(roomList[i].owner).emit('error', 'One player was disconnected, game over');
				io.to(roomList[i].owner).emit('backToRoomList');
				roomList.splice(i,1);
				break searchRoom;
			}
		}
		io.emit('getRoomList', roomList);
	});

	socket.on('getClientList', function(){
		var roomNumber;
		var owner;
		var player;
		searchRoom: for(var i=0;i<roomList.length;i++) {
			if (roomList[i].owner == socket.id){
				roomNumber = i;
				break searchRoom;
			}
			if (roomList[i].player == socket.id){
				roomNumber = i;
				break searchRoom;
			}
		}		
		searchOwner: for(var i=0;i<clients.length;i++) {
			if (clients[i].id == roomList[roomNumber].owner){
				owner = clients[i].name;
				break searchOwner;
			}
		}
		searchPlayer: for(var i=0;i<clients.length;i++) {
			if (clients[i].id == roomList[roomNumber].player){
				player = clients[i].name;
				break searchPlayer;
			}
		}
		io.to(roomList[roomNumber].name).emit('getClientList',[owner,player]);
	});

	socket.on('createRoom', function(data){
		roomNameAlredyUsed = false;
		if ( /^[\w]{0,8}$/i.test(data[0]) ) {
			if (data[0] != ''){
				searchRoom: for(var i=0;i<roomList.length;i++) {
					if (roomList[i].name == data[0]){
						roomNameAlredyUsed = true;
						break searchRoom;
					}
				}
				if (roomNameAlredyUsed == false){
					if (data[1] != ''){
						if (data[1] >= 10){
							if (data[1] <= 20){
								searchClient: for(var i=0;i<clients.length;i++) {
									if (clients[i].id == socket.id){
										ownerName = clients[i].name;
										break searchClient;
									}
								}
								var room = new Room(socket.id,ownerName,data[0],data[1]);
								roomList.push(room);

								searchRoom: for(var i=0;i<roomList.length;i++) {
									if (roomList[i].name == data[0]){
										io.to(socket.id).emit('createRoom',roomList[i]);
										break searchRoom;
									}
								}
								socket.join(data[0]);
								io.emit('getRoomList', roomList);
							}
						}
					}
				} else {
					io.to(socket.id).emit('error', 'Room name alredy used');
				}
			}
		} else {
			io.to(socket.id).emit('error', 'Wrong room name');
		}
	});

	socket.on('ownerTurn', function (data) {
		searchRoom: for(var i=0;i<roomList.length;i++) {
			if (roomList[i].name == data[0]){
				var roomNumber = i;
				break searchRoom;
			}
		}
		if (roomNumber != undefined){
			var x = data[1];
			var y = data[2];
			if (roomList[roomNumber].player != undefined){
				if (roomList[roomNumber].turn == 'owner') {
					if (roomList[roomNumber].gameField[x][y] == undefined){
						roomList[roomNumber].gameField[x][y] = 'X';
						io.to(roomList[roomNumber].owner).emit('updateField', [roomList[roomNumber],'owner']);
						io.to(roomList[roomNumber].player).emit('updateField', [roomList[roomNumber],'player']);
						roomList[roomNumber].turn = 'player';
						//
						win = calcSeriesWin(roomList[roomNumber],roomNumber);
						//
					}
				} else {
					io.to(socket.id).emit('error', 'Now turn other player');
				}
			}else{
				io.to(socket.id).emit('error', 'Wait other player');
			}
		}
	});

	socket.on('playerTurn', function (data) {
		searchRoom: for(var i=0;i<roomList.length;i++) {
				if (roomList[i].name == data[0]){
				var roomNumber = i;
				break searchRoom;
			}
		}
		if (roomNumber != undefined){
			var x = data[1];
			var y = data[2];
			if (roomList[roomNumber].turn == 'player') {
				if (roomList[roomNumber].gameField[x][y] == undefined){
					roomList[roomNumber].gameField[x][y] = 'O';
					io.to(roomList[roomNumber].owner).emit('updateField', [roomList[roomNumber],'owner']);
					io.to(roomList[roomNumber].player).emit('updateField', [roomList[roomNumber],'player']);
					roomList[roomNumber].turn = 'owner';
					//
					win = calcSeriesWin(roomList[roomNumber],roomNumber);
					//
				}
			} else {
				io.to(socket.id).emit('error', 'Now turn other player');
			}
		}
	});

});

console.log("SERVER STARTED");