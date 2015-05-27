@ChatMessages = (->
	self = {}

	init = ->
		wrapper = $(".messages-container").find(".wrapper")
		input = $(".input-message").get(0)
		self.scrollable = false
		wrapper.bind "scroll", ->
			scrollable()
		$(".input-message").autogrow
			postGrowCallback: ->
				resize()
				toBottom() if self.scrollable

		$(".input-message").textcomplete [ {
			match: /\B:([\-+\w]*)$/
			search: (term, callback) ->
				results = []
				$.each emojione.emojioneList, (shortname, data) ->
					if shortname.indexOf(term) > -1
						results.push shortname
					return
				if term.length >= 3
					results.sort (a, b) ->
						a.length > b.length
				callback results
				return
			template: (shortname) ->
				length = emojione.emojioneList[shortname].length
				'<img class="emojione" src="//cdn.jsdelivr.net/emojione/assets/png/' + emojione.emojioneList[shortname][length - 1].toUpperCase() + '.png"> ' + shortname
			replace: (shortname) ->
				event.stopPropagation()
				event.preventDefault()
				shortname
			index: 1
			maxCount: 10
		} ], footer: '', placement: 'top'

		return

	isScrollable = ->
		self.scrollable

	resize = ->
		dif = 60 + $(".messages-container").find("footer").outerHeight()
		$(".messages-box").css
			height: "calc(100% - #{dif}px)"

	scrollable = ->
		wrapper = $(".messages-container").find(".wrapper")
		top = wrapper.scrollTop() + wrapper.outerHeight()
		if top == wrapper.get(0).scrollHeight
			self.scrollable = true
		else
			self.scrollable = false

	toBottom = ->
		wrapper = $(".messages-container").find(".wrapper")
		wrapper.scrollTop 50000

	send = (rid, input) ->
		if _.trim(input.value) isnt ''
			KonchatNotification.removeRoomNotification(rid)
			message = input.value
			input.value = ''
			stopTyping()
			Meteor.call 'sendMessage', {rid: rid, message: message, day: window.day }

	update = (id, input) ->
		if _.trim(input.value) isnt ''
			message = input.value
			input.value = ''
			Meteor.call 'updateMessage', {id: id, message: message }

	startTyping = (rid, input) ->
		unless self.typingTimeout
			if Meteor.userId()?
				Meteor.call 'typingStatus', { rid: rid }, true

			self.typingTimeout = Meteor.setTimeout ->
				stopTyping()
			, 30000

	stopTyping = ->
		self.typingTimeout = null

	startEditingLastMessage = (rid, imput) ->
		lastMessage = ChatMessage.findOne { rid: rid, t: {$exists: false}, uid: Meteor.userId() }, { sort: { ts: -1 } }
		if not lastMessage?
			return

		console.log 'chatWindowDashboard.startEditingLastMessage', lastMessage if window.rocketDebug

		Session.set 'editingMessageId', lastMessage._id

		Meteor.defer ->
			$('.input-message-editing').select().autogrow()

	stopEditingLastMessage = ->
		Session.set 'editingMessageId', undefined
		Meteor.defer ->
			$('.input-message').select()

	keydown = (rid, event) ->
		input = event.currentTarget
		k = event.which
		resize(input)
		console.log "1 - here"
		if k is 13 and not event.shiftKey
			event.preventDefault()
			event.stopPropagation()
			send(rid, input)
		else
			console.log "2 - here"
			keyCodes = [
				20,  # Caps lock
				16,  # Shift
				9,   # Tab
				27,  # Escape Key
				17,  # Control Key
				91,  # Windows Command Key
				19,  # Pause Break
				18,  # Alt Key
				93,  # Right Click Point Key
				45,  # Insert Key
				34,  # Page Down
				35,  # Page Up
				144, # Num Lock
				145  # Scroll Lock
			]
			keyCodes.push i for i in [35..40] # Home, End, Arrow Keys
			keyCodes.push i for i in [112..123] # F1 - F12
			unless k in keyCodes
				startTyping(rid, input)
			else if k is 38 # Arrow Up
				emojs = document.querySelector "ul.dropdown-menu"
				if not emojs or emojs.style.display is "none"
					startEditingLastMessage(rid, input)

	keydownEditing = (id, event) ->
		input = event.currentTarget
		k = event.which
		resize(input)
		if k is 13 and not event.shiftKey
			event.preventDefault()
			event.stopPropagation()
			update(id, input)
			stopEditingLastMessage()
		else if k is 27 # ESC
			event.preventDefault()
			event.stopPropagation()
			stopEditingLastMessage()

	isScrollable: isScrollable
	toBottom: toBottom
	keydown: keydown
	keydownEditing: keydownEditing
	stopEditingLastMessage: stopEditingLastMessage
	send: send
	init: init
)()