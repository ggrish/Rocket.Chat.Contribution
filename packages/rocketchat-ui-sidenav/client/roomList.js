/* globals KonchatNotification */

Template.roomList.helpers({
	rooms() {
		if (this.identifier == 'unread') {
			const query = {
				alert: true,
				open: true,
				hideUnreadStatus: { $ne: true }
			};
			return ChatSubscription.find(query, { sort: { 't': 1, 'name': 1 }});
		}

		if (this.anonymous) {
			return RocketChat.models.Rooms.find({t: 'c'}, { sort: { name: 1 } });
		}


		const favoritesEnabled = RocketChat.settings.get('Favorite_Rooms');

		const query = {
			open: true
		};
		let sort = { 't': 1, 'name': 1 };
		if (this.identifier === 'f') {
			query.f = favoritesEnabled;
		} else {
			let types = [this.identifier];
			if (this.identifier === 'activity') {
				types = ['c', 'p', 'd'];
				sort = { _updatedAt : -1};
			}
			if (this.identifier === 'channels' || this.identifier === 'unread') {
				types= [ 'c', 'p'];
			}
			const user = Meteor.user();
			if (user && user.settings && user.settings.preferences && user.settings.preferences.roomsListExhibitionMode === 'unread') {
				query.$or = [
					{ alert: { $ne: true } },
					{ hideUnreadStatus: true }
				];
			}
			query.t = { $in: types };
			query.f = { $ne: favoritesEnabled };
		}



		return ChatSubscription.find(query, { sort });
	},

	roomData(room) {
		let name = room.name;
		if (RocketChat.settings.get('UI_Use_Real_Name') && room.fname) {
			name = room.fname;
		}

		let unread = false;
		if (((FlowRouter.getParam('_id') !== room.rid) || !document.hasFocus()) && (room.unread > 0)) {
			unread = room.unread;
		}

		let active = false;
		if (Session.get('openedRoom') && Session.get('openedRoom') === room.rid || Session.get('openedRoom') === room._id) {
			active = true;
		}

		const archivedClass = room.archived ? 'archived' : false;

		let alertClass = false;
		if (!room.hideUnreadStatus && (FlowRouter.getParam('_id') !== room.rid || !document.hasFocus()) && room.alert) {
			alertClass = 'sidebar-content-unread';
		}

		let statusClass = false;

		if (room.t === 'd') {
			switch (RocketChat.roomTypes.getUserStatus(room.t, room.rid)) {
				case 'online':
					statusClass = 'general-success-background';
					break;
				case 'away':
					statusClass = 'general-pending-background';
					break;
				case 'busy':
					statusClass = 'general-error-background';
					break;
				case 'offline':
					statusClass = 'general-inactive-background';
					break;
				default:
					statusClass = 'general-inactive-background';
			}
		}

		// Sound notification
		if (!(FlowRouter.getParam('name') === room.name) && !room.ls && room.alert === true) {
			KonchatNotification.newRoom(room.rid);
		}

		return {
			...room,
			icon: RocketChat.roomTypes.getIcon(room.t),
			route: RocketChat.roomTypes.getRouteLink(room.t, room),
			name,
			unread,
			active,
			archivedClass,
			alertClass,
			statusClass
		};
	},

	isLivechat() {
		return this.identifier === 'l';
	},

	shouldAppear(group, rooms) {
		/*
		if is a normal group ('channel' 'private' 'direct')
		or is favorite and has one room
		or is unread and has one room
		*/

		return !['unread', 'f'].includes(group.identifier) || rooms.count();
	},

	hasMoreChannelsButton(room) {
		return room.identifier === 'c' || room.anonymous;
	},

	hasMoreGroupsButton(room) {
		return room.identifier === 'p';
	}
});

Template.roomList.events({
	'click .more'(e, t) {
		if (t.data.identifier === 'p') {
			SideNav.setFlex('listPrivateGroupsFlex');
		} else if (t.data.isCombined) {
			SideNav.setFlex('listCombinedFlex');
		} else {
			SideNav.setFlex('listChannelsFlex');
		}

		return SideNav.openFlex();
	}
});
