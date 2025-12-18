module.exports = (io) => {
	io.on('connection', (socket) => {
		let currentRoom = null;

		// Client joins a room
		socket.on('join', ({ room, user }) => {
			currentRoom = room;
			socket.join(room);
			socket.data.user = user;

			// collect existing peers (excluding current)
			const roomInfo = io.sockets.adapter.rooms.get(room);
			const existingPeers = [];
			if (roomInfo) {
				for (const sid of roomInfo) {
					if (sid === socket.id) continue;
					const peerSocket = io.sockets.sockets.get(sid);
					if (peerSocket) {
						existingPeers.push({ socketId: sid, user: peerSocket.data.user || null });
					}
				}
			}
			// Send existing peers to the joining client
			socket.emit('existing-peers', existingPeers);

			// Notify others in the room
			socket.to(room).emit('user-joined', { socketId: socket.id, user });
		});

		// WebRTC SDP offer
		socket.on('offer', ({ to, sdp }) => {
			io.to(to).emit('offer', { from: socket.id, sdp, user: socket.data.user });
		});

		// WebRTC SDP answer
		socket.on('answer', ({ to, sdp }) => {
			io.to(to).emit('answer', { from: socket.id, sdp });
		});

		// ICE candidates
		socket.on('ice-candidate', ({ to, candidate }) => {
			io.to(to).emit('ice-candidate', { from: socket.id, candidate });
		});

		// Broadcast simple state events (mute/video/screen/hand)
		socket.on('state-update', (payload) => {
			if (!currentRoom) return;
			socket.to(currentRoom).emit('state-update', { from: socket.id, ...payload });
		});


		// Leave room explicitly
		socket.on('leave', () => {
			if (currentRoom) {
				socket.to(currentRoom).emit('user-left', { socketId: socket.id });
				socket.leave(currentRoom);
				currentRoom = null;
			}
		});

		socket.on('disconnect', () => {
			if (currentRoom) {
				socket.to(currentRoom).emit('user-left', { socketId: socket.id });
			}
		});
	});
}; 