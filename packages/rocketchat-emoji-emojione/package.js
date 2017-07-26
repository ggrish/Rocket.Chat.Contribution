Package.describe({
	name: 'rocketchat:emoji-emojione',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate emojis',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'emojione:emojione@2.2.6',
		'rocketchat:emoji',
		'rocketchat:lib'
	]);

	api.addFiles('emojiPicker.js', ['client', 'server']);

	api.addFiles('rocketchat.js', ['client', 'server']);

	api.addFiles('sprites.css', 'client');
	api.addFiles('callBacks.js', 'server');
});
