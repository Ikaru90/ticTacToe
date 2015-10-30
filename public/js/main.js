var socket = io();
var roomList = new Array();
var click = new Audio('/sounds/click.wav');
var turn = new Audio('/sounds/turn.mp3');
var disconnect = new Audio('/sounds/disconnect.mp3');
var chat  = new Audio('/sounds/chat.mp3');

function login(keyCode){
	if (keyCode == 13){
		name = $('#nameInput').val();
		socket.emit('tryLogin', name);
	}
};

socket.on('loginSuccess', function(data){
	click.play();
	$('#loginBlock').fadeTo("slow", 0, function(){
		$('#loginBlock').hide();
		$('#roomListBlock').show();
		$('#roomListBlock').fadeTo("slow",1);
		openRoomList(data);
	});
});

socket.on('getRoomList', function(roomList){
	openRoomList(roomList);
});

function openRoomList(roomList){
	if (roomList.length > 0){
		document.getElementById('roomList').innerHTML = '';
		for(var i=0;i<roomList.length;i++) {
			if (roomList[i].status == 'open'){
				roomCount = 1;
				$('#roomList').append($('<li class=\"roomListOpen\" onclick=\"enterTheRoom(\''+roomList[i].name+'\')\">').text("ROOM NAME: "+roomList[i].name+", SIZE: "+roomList[i].size+", OWNER: "+roomList[i].ownerName+", STATUS: "+roomList[i].status));
			} else {
			$('#roomList').append($('<li class=\"roomListClose\">').text("ROOM NAME: "+roomList[i].name+", SIZE: "+roomList[i].size+", OWNER: "+roomList[i].ownerName+", STATUS: "+roomList[i].status));			
			}
		}	
	} else {
		document.getElementById('roomList').innerHTML = '';
		$('#roomList').append($('<li class=\"roomListEmpty\">').text('Rooms not found'));
	}
}

function enterTheRoom(roomName){
	socket.emit('enterTheRoom', roomName);
};

socket.on('enterTheRoom', function(room){
	click.play();
	openRoom(room,'player');
	$('#roomListBlock').fadeTo("slow", 0, function(){
		$('#roomListBlock').hide();
		$('#gameBlock').show();
		$('#gameBlock').fadeTo("slow",1);
		document.getElementById("message").focus();
	});	
});

socket.on('error', function(errorText){
	showErrorBlock(errorText);
});

function escapeHtml(text) {
	var map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	};
	return text.replace(/[&<>"']/g, function(m) { return map[m]; });
};

socket.on('sendMessage', function(data){
	chat.play();
	if (data[2] == 'owner'){
		$('#chatList').append($('<li>').html('<span class="owner">'+data[0]+'</span>'+' : '+escapeHtml(data[1])));	
	}
	if (data[2] == 'player'){
		$('#chatList').append($('<li>').html('<span class="player">'+data[0]+'</span>'+' : '+escapeHtml(data[1])));	
	}	
	scrollVal = document.getElementById('chatListBlock').scrollHeight;
	document.getElementById('chatListBlock').scrollTop = scrollVal;	
});

function sendMessage(keyCode){
	if (keyCode == 13){
		message = $('#message').val();
		if (message != ''){
			socket.emit('sendMessage', message);
		}
		document.getElementById('message').value = '';
	}
};

function goToCreateRoom(){
	click.play();
	$('#roomListBlock').fadeTo("slow", 0, function(){
		$('#roomListBlock').hide();
		$('#createRoomBlock').show();
		document.getElementById('roomName').value="";
		document.getElementById('roomSize').value="";
		document.getElementById("roomName").focus();
		$('#createRoomBlock').fadeTo("slow",1);
	});
};

function backToRoomListFromCreateRoom(){
	click.play();
	$('#createRoomBlock').fadeTo("slow", 0, function(){
		$('#createRoomBlock').hide();
		$('#roomListBlock').show();
		$('#roomListBlock').fadeTo("slow",1);
	});
};

function backToRoomListBlockFromGameField(){
	click.play();
	$('#gameBlock').fadeTo("slow", 0, function(){
		$('#gameBlock').hide();
		$('#roomListBlock').show();
		$('#roomListBlock').fadeTo("slow",1);
	});
	socket.emit('exitGame');
};

socket.on('createRoom', function(room){
	click.play();
	openRoom(room,'owner');
	$('#createRoomBlock').fadeTo("slow", 0, function(){
		$('#createRoomBlock').hide();
		$('#gameBlock').show();
		$('#gameBlock').fadeTo("slow",1);
		document.getElementById("message").focus();
	});	
});

socket.on('getClientList', function(data){
	owner = data[0];
	player = data[1];
	document.getElementById('clientsList').innerHTML = '';
	$("#clientsList").append($('<li class=\"owner\">').text(owner));
	if (player != null) {
		$("#clientsList").append($('<li class=\"player\">').text(player));
	}
});

function closeError(){
	$('#errorBlock').hide();
};

function showErrorBlock(errorText){
	$('#spanError').text(errorText);
	$('#errorBlock').show();
	disconnect.play();
};

function createRoom(keyCode){
	if (keyCode == 13){
		if ($('#roomName').val() != ''){
			if ($('#roomSize').val() != ''){
				if ($('#roomSize').val() >= 10){
					if ($('#roomSize').val() <= 20){
						roomName = $('#roomName').val();
						roomSize = $('#roomSize').val();
						socket.emit('createRoom', [roomName, roomSize]);
					} else {
						showErrorBlock('Room size must be less than 21');
					}
				} else {
					showErrorBlock('Room size must be more than 9');
				}
			} else {
				showErrorBlock('Room size cannot be empty');
			}
		} else {
			showErrorBlock('Room name cannot be empty');
		}
	}
};

function openRoom(room,player){
	document.getElementById('gameTableField').innerHTML = '';
	document.getElementById('chatList').innerHTML = '';
	if (player == 'owner') {
		$('#gameTableField').outerWidth(room.size*30);
		for(var i=0;i<room.size;i++) {
			$('#gameTableField').append('<tr id=\'row_'+i+'\'>');
			for(var j=0;j<room.size;j++) {
				$('#row_'+i).append('<td class=\'emptyCell\' id=\''+i+'x'+j+'\' onclick=\"ownerTurn(\''+room.name+'\','+i+','+j+')\">');
			}
		}
	}
	if (player == 'player') {
		$('#gameTableField').outerWidth(room.size*30);
		for(var i=0;i<room.size;i++) {
			$('#gameTableField').append('<tr id=\'row_'+i+'\'>');
			for(var j=0;j<room.size;j++) {
				$('#row_'+i).append('<td class=\'emptyCell\' id=\''+i+'x'+j+'\' onclick=\"playerTurn(\''+room.name+'\','+i+','+j+')\">');
			}
		}
	}
	socket.emit('getClientList');
};

function ownerTurn(game,x,y){
	socket.emit('ownerTurn',[game,x,y]);
};

function playerTurn(game,x,y){
	socket.emit('playerTurn',[game,x,y]);
};

socket.on('backToRoomList', function(){
	$('#gameBlock').fadeTo("slow", 0, function(){
		$('#gameBlock').hide();
		$('#roomListBlock').show();
		$('#roomListBlock').fadeTo("slow",1);
	});
});

socket.on('updateField', function(data){
	room = data[0];
	player = data[1];
	turn.play();
	document.getElementById('gameTableField').innerHTML = '';
	if (player == 'owner') {
		$('#gameTableField').outerWidth(room.size*30);
		for(var i=0;i<room.size;i++) {
			$('#gameTableField').append('<tr id=\'row_'+i+'\'>');
			for(var j=0;j<room.size;j++) {
				if (room.gameField[i][j] == undefined){
					$('#row_'+i).append('<td class=\'emptyCell\' id=\''+i+'x'+j+'\' onclick=\"ownerTurn(\''+room.name+'\','+i+','+j+')\">');					
				}
				if (room.gameField[i][j] == 'O'){
					$('#row_'+i).append('<td class=\'OCell\' id=\''+i+'x'+j+'\'>');
				}
				if (room.gameField[i][j] == 'X'){
					$('#row_'+i).append('<td class=\'XCell\' id=\''+i+'x'+j+'\'>');
				}
			}
		}
	}
	if (player == 'player') {
		$('#gameTableField').outerWidth(room.size*30);
		for(var i=0;i<room.size;i++) {
			$('#gameTableField').append('<tr id=\'row_'+i+'\'>');
			for(var j=0;j<room.size;j++) {
				if (room.gameField[i][j] == undefined){
					$('#row_'+i).append('<td class=\'emptyCell\' id=\''+i+'x'+j+'\' onclick=\"playerTurn(\''+room.name+'\','+i+','+j+')\">');
				}
				if (room.gameField[i][j] == 'O'){
					$('#row_'+i).append('<td class=\'OCell\' id=\''+i+'x'+j+'\'>');
				}
				if (room.gameField[i][j] == 'X'){
					$('#row_'+i).append('<td class=\'XCell\' id=\''+i+'x'+j+'\'>');
				}
			}
		}
	}
});