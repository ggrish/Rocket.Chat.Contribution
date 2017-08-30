import { RoomType } from 'temporary-rocketlets-ts-definition/rooms';

export class RocketletRoomsConverter {
	constructor(orch) {
		this.orch = orch;
	}

	convertById(roomId) {
		const room = RocketChat.models.Rooms.findOneById(roomId);

		return this._convertToRocketlet(room);
	}

	convertByName(roomName) {
		const room = RocketChat.models.Rooms.findOneByName(roomName);

		return this._convertToRocketlet(room);
	}

	convertRocketletRoom(room) {
		if (!room) {
			return undefined;
		}

		const creator = RocketChat.models.Users.findOneById(room.creator.id);

		return {
			_id: room.id,
			u: {
				_id: creator._id,
				username: creator.username
			},
			ts: room.createdAt,
			t: room.type,
			name: room.name,
			msgs: room.messageCount || 0,
			default: typeof room.isDefault === 'undefined' ? false : room.isDefault,
			_updatedAt: room.updatedAt,
			lm: room.lastModifiedAt,
			usernames: room.usernames
		};
	}

	_convertToRocketlet(room) {
		if (!room) {
			return undefined;
		}

		let creator;
		if (room.u) {
			creator = this.orch.getConverters().get('users').convertById(room.u._id);
		}

		return {
			id: room._id,
			name: room.name,
			type: this._convertTypeToRocketlet(room.t),
			creator,
			usernames: room.usernames,
			isDefault: typeof room.default === 'undefined' ? false : room.default,
			messageCount: room.msgs,
			createdAt: room.ts,
			updatedAt: room._updatedAt,
			lastModifiedAt: room.lm
		};
	}

	_convertTypeToRocketlet(typeChar) {
		switch (typeChar) {
			case 'c':
				return RoomType.CHANNEL;
			case 'p':
				return RoomType.PRIVATE_GROUP;
			case 'd':
				return RoomType.DIRECT_MESSAGE;
			case 'lc':
				return RoomType.LIVE_CHAT;
			default:
				throw new Error(`Unknown room type of: "${ typeChar }"`);
		}
	}
}
