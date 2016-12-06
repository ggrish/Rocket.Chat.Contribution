/*globals OAuth*/

const Services = {};

export class CustomOAuth {
	constructor(name, options) {
		this.name = name;
		if (!Match.test(this.name, String)) {
			throw new Meteor.Error('CustomOAuth: Name is required and must be String');
		}

		if (Services[this.name]) {
			Services[this.name].configure(options);
			return;
		}

		Services[this.name] = this;

		this.configure(options);

		this.userAgent = 'Meteor';
		if (Meteor.release) {
			this.userAgent += '/' + Meteor.release;
		}

		Accounts.oauth.registerService(this.name);
		this.registerService();
	}

	configure(options) {
		if (!Match.test(options, Object)) {
			throw new Meteor.Error('CustomOAuth: Options is required and must be Object');
		}

		if (!Match.test(options.serverURL, String)) {
			throw new Meteor.Error('CustomOAuth: Options.serverURL is required and must be String');
		}

		if (!Match.test(options.tokenPath, String)) {
			options.tokenPath = '/oauth/token';
		}

		if (!Match.test(options.identityPath, String)) {
			options.identityPath = '/me';
		}

		this.serverURL = options.serverURL;
		this.tokenPath = options.tokenPath;
		this.identityPath = options.identityPath;
		this.tokenSentVia = options.tokenSentVia;

		if (!/^https?:\/\/.+/.test(this.tokenPath)) {
			this.tokenPath = this.serverURL + this.tokenPath;
		}

		if (!/^https?:\/\/.+/.test(this.identityPath)) {
			this.identityPath = this.serverURL + this.identityPath;
		}

		if (Match.test(options.addAutopublishFields, Object)) {
			Accounts.addAutopublishFields(options.addAutopublishFields);
		}
	}

	getAccessToken(query) {
		const config = ServiceConfiguration.configurations.findOne({service: this.name});
		if (!config) {
			throw new ServiceConfiguration.ConfigError();
		}

		let response = undefined;
		try {
			response = HTTP.post(this.tokenPath, {
				auth: config.clientId + ':' + OAuth.openSecret(config.secret),
				headers: {
					Accept: 'application/json',
					'User-Agent': this.userAgent
				},
				params: {
					code: query.code,
					client_id: config.clientId,
					client_secret: OAuth.openSecret(config.secret),
					redirect_uri: OAuth._redirectUri(this.name, config),
					grant_type: 'authorization_code',
					state: query.state
				}
			});
		} catch (err) {
			const error = new Error(`Failed to complete OAuth handshake with ${this.name} at ${this.tokenPath}. ${err.message}`);
			throw _.extend(error, {response: err.response});
		}

		if (response.data.error) { //if the http response was a json object with an error attribute
			throw new Error(`Failed to complete OAuth handshake with ${this.name} at ${this.tokenPath}. ${response.data.error}`);
		} else {
			return response.data.access_token;
		}
	}

	getIdentity(accessToken) {
		const params = {};
		const headers = {
			'User-Agent': this.userAgent // http://doc.gitlab.com/ce/api/users.html#Current-user
		};

		if (this.tokenSentVia === 'header') {
			headers['Authorization'] = 'Bearer ' + accessToken;
		} else {
			params['access_token'] = accessToken;
		}

		try {
			const response = HTTP.get(this.identityPath, {
				headers: headers,
				params: params
			});

			if (response.data) {
				return response.data;
			} else {
				return JSON.parse(response.content);
			}
		} catch (err) {
			const error = new Error(`Failed to fetch identity from ${this.name} at ${this.identityPath}. ${err.message}`);
			throw _.extend(error, {response: err.response});
		}
	}

	registerService() {
		const self = this;
		OAuth.registerService(this.name, 2, null, (query) => {
			const accessToken = self.getAccessToken(query);
			// console.log 'at:', accessToken

			let identity = self.getIdentity(accessToken);

			if (identity) {
				// Fix for Reddit
				if (identity.result) {
					identity = identity.result;
				}

				// Fix WordPress-like identities having 'ID' instead of 'id'
				if (identity.ID && !identity.id) {
					identity.id = identity.ID;
				}

				// Fix Auth0-like identities having 'user_id' instead of 'id'
				if (identity.user_id && !identity.id) {
					identity.id = identity.user_id;
				}

				if (identity.CharacterID && !identity.id) {
					identity.id = identity.CharacterID;
				}

				// Fix Dataporten having 'user.userid' instead of 'id'
				if (identity.user && identity.user.userid && !identity.id) {
					identity.id = identity.user.userid;
					identity.email = identity.user.email;
				}

				// Fix general 'phid' instead of 'id' from phabricator
				if (identity.phid && !identity.id) {
					identity.id = identity.phid;
				}

				// Fix Keycloak-like identities having 'sub' instead of 'id'
				if (identity.sub && !identity.id) {
					identity.id = identity.sub;
				}

				// Fix general 'userid' instead of 'id' from provider
				if (identity.userid && !identity.id) {
					identity.id = identity.userid;
				}
			}

			// console.log 'id:', JSON.stringify identity, null, '  '

			const serviceData = {
				_OAuthCustom: true,
				accessToken: accessToken
			};

			_.extend(serviceData, identity);

			const data = {
				serviceData: serviceData,
				options: {
					profile: {
						name: identity.name || identity.username || identity.nickname || identity.CharacterName || identity.userName || identity.preferred_username || (identity.user && identity.user.name)
					}
				}
			};

			// console.log data

			return data;
		});
	}

	retrieveCredential(credentialToken, credentialSecret) {
		return OAuth.retrieveCredential(credentialToken, credentialSecret);
	}
}
