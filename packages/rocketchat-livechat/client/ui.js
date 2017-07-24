AccountBox.addItem({
	name: 'Livechat',
	icon: 'comment-alt',
	href: 'livechat-current-chats',
	sideNav: 'livechatFlex',
	condition: () => {
		return RocketChat.settings.get('Livechat_enabled') && RocketChat.authz.hasAllPermission('view-livechat-manager');
	}
});

RocketChat.TabBar.addButton({
	groups: ['live'],
	id: 'visitor-info',
	i18nTitle: 'Visitor_Info',
	icon: 'icon-info-circled',
	template: 'visitorInfo',
	order: 0
});

// RocketChat.TabBar.addButton({
// 	groups: ['livechat'],
// 	id: 'visitor-navigation',
// 	i18nTitle: 'Visitor_Navigation',
// 	icon: 'icon-history',
// 	template: 'visitorNavigation',
// 	order: 10
// });

RocketChat.TabBar.addButton({
	groups: ['live'],
	id: 'visitor-history',
	i18nTitle: 'Past_Chats',
	icon: 'icon-chat',
	template: 'visitorHistory',
	order: 11
});

RocketChat.TabBar.addGroup('message-search', ['live']);
RocketChat.TabBar.addGroup('starred-messages', ['live']);
RocketChat.TabBar.addGroup('uploaded-files-list', ['live']);
RocketChat.TabBar.addGroup('push-notifications', ['live']);
RocketChat.TabBar.addGroup('video', ['live']);

RocketChat.TabBar.addButton({
	groups: ['live'],
	id: 'external-search',
	i18nTitle: 'Knowledge_Base',
	icon: 'icon-lightbulb',
	template: 'externalSearch',
	order: 10
});

RocketChat.MessageTypes.registerType({
	id: 'livechat-close',
	system: true,
	message: 'Conversation_closed',
	data(message) {
		return {
			comment: message.msg
		};
	}
});
