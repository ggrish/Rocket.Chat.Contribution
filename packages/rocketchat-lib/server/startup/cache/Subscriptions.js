/* eslint new-cap: 0 */

RocketChat.cache.Subscriptions = new (class CacheUser extends RocketChat.cache._Base {
	constructor() {
		super('Subscriptions');

		this.ensureIndex('rid', 'array');
		this.ensureIndex(['rid', 'u._id'], 'unique');
	}

	findByUserId(userId, options) {
		return this.find({'u._id': userId}, options);
	}
});

RocketChat.cache.Rooms.hasMany('Subscriptions', {
	field: 'usernames',
	link: {
		local: '_id',
		remote: 'rid',
		transform(room, subscription) {
			return subscription.u.username;
		},
		remove(arr, subscription) {
			if (arr.indexOf(subscription.u.username) > -1) {
				arr.splice(arr.indexOf(subscription.u.username), 1);
			}
		}
	}
});


RocketChat.cache.Subscriptions.hasOne('Rooms', {
	field: '_room',
	link: {
		local: 'rid',
		remote: '_id'
	}
});


RocketChat.cache.Users.load();
RocketChat.cache.Rooms.load();
RocketChat.cache.Subscriptions.load();


RocketChat.cache.Users.addDynamicView('highlights').applyFind({
	'settings.preferences.highlights': {$size: {$gt: 0}}
});

RocketChat.cache.Subscriptions.addDynamicView('notifications').applyFind({
	$or: [
		{desktopNotifications: {$in: ['all', 'nothing']}},
		{mobilePushNotifications: {$in: ['all', 'nothing']}}
	]
});
