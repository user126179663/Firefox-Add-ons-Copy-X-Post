typeof browser === 'undefined' &&
(
	window.browser = {
		
		getDirPath(url) {
			
			const lastItemIndex = (url = url.split('?')[0]).lastIndexOf('/');
			
			return url.indexOf('.', lastItemIndex) === -1 ? url : url.substring(0, lastItemIndex + 1);
			
		},
		
		i18n: {
			
			fetch(locale = 'ja_JP') {
				
				return	fetch(browser.runtime.getURL('_locales/' + locale + '/messages.json')).
							then(response => response.json()).
								then(messages => browser.messages = messages);
				
			},
			
			getMessage(messageName) {
				
				return browser.messages[messageName]?.message ?? '';
				
			}
			
		},
		
		get localStorage() {
			
			const storage = localStorage[location.href] ??= '{}';
			
			try {
				
				return JSON.parse(storage);
				
			} catch (error) {
				
				console.warn(error);
				
				return storage;
				
			}
			
		},
		set localStorage(v) {
			
			try {
				
				localStorage[location.href] = JSON.stringify(v);
				
			} catch (error) {
				
				console.warn(error);
				
			}
			
		},
		
		permissions: {
			
			contains(permission) {
				
				const	{ permitted: { origins: permittedOrigins, permissions: permitted } } = browser,
						{ origins = [], permissions = [] } = permission;
				let i,l;
				
				i = -1, l = origins.length;
				while (++i < l && permittedOrigins.includes(origins[i]));
				
				if (i === l) {
					
					i = -1, l = permissions.length;
					while (++i < l && permitted.includes(permissions[i]));
					
				}
				
				return Promise.resolve(i === l);
				
			},
			
			getAll() {
				
				return Promise.resolve(structuredClone(browser.permitted));
				
			},
			
			request(permission) {
				
				const	{ permitted: { origins: permittedOrigins, permissions: permitted } } = browser,
						{ origins = [], permissions = [] } = permission;
				let i,l,l0;
				
				i = -1, l = origins.length, l0 = permittedOrigins.length;
				while (++i < l) permittedOrigins[i + l0] = origins[i];
				
				i = -1, l = permissions.length, l0 = permitted.length;
				while (++i < l) permitted[i + l0] = permissions[i];
				
				return Promise.resolve(true);
				
			}
			
		},
		
		permitted: {
			
			origins: [],
			
			permissions: []
			
		},
		
		runtime: {
			
			getURL(relPath) {
				
				return new URL(relPath, browser.baseURL);
				
			}
			
		},
		
		storage: {
			
			local: {
				
				clear() {
					
					const { localStorage, storage } = browser, changes = {};
					let k;
					
					for (k in localStorage) changes[k] = { oldValue: localStorage }, delete localStorage[k];
					
					storage.local.onChanged.emit(changes);
					
					return Promise.resolve();
					
				},
				
				get(keys) {
					
					const { localStorage } = browser;
					let result;
					
					if (keys === null || keys === undefined) {
						
						result = localStorage;
						
					} else {
						
						typeof keys === 'object' || (keys = [ keys ]);
						
						const	{ hasOwn, keys: getKeys } = Object,
								isArrayKeys = Array.isArray(keys),
								ks = isArrayKeys ? keys : getKeys(keys),
								{ length } = ks;
						let i;
						// 現状シャローコピーが行なわれるだけで厳密なものではない。ディープコピーを行なうようにすべきかもしれない？
						i = -1, result = isArrayKeys ? {} : { ...keys };
						while (++i < length) hasOwn(localStorage, k = ks[i]) && (result[k] = localStorage[k]);
						
					}
					
					return Promise.resolve(result);
					
				},
				
				onChanged: {
					
					addListener(listener) {
						
						if (typeof listener === 'function') {
							
							const { listeners } = this, index = listeners.indexOf(listener);
							
							index === -1 || listeners.splice(index, 1),
							listeners[listeners.length] = listener;
							
						}
						
					},
					
					emit(changes) {
						
						const { listeners } = this, { length } = listeners, areaName = 'local';
						let i;
						
						i = -1;
						while (++i < length) listeners[i]?.(changes, areaName);
						
					},
					
					hasListener(listener) {
						
						return typeof listener === 'function' && this.listeners.indexOf(listener) !== -1;
						
					},
					
					listeners: [],
					
					removeListener(listener) {
						
						if (typeof listener === 'function') {
							
							const { listeners } = this, index = listeners.indexOf(listener);
							
							index === -1 || listeners.splice(index, 1);
							
						}
						
					}
					
				},
				
				remove(keys) {
					
					return	new Promise((rs, rj) => {
									
									typeof keys === 'string' && (keys = [ keys ]);
									
									if (Array.isArray(keys)) {
										
										const	{ hasOwn } = Object,
												{ localStorage, storage } = browser,
												{ length } = keys,
												changes = {};
										let i, k;
										
										i = -1;
										while (++i < length)	hasOwn(localStorage, k = keys[i]) &&
																	(
																		changes[k] = { oldValue: localStorage[k] },
																		delete localStorage[k]
																	);
										
										storage.local.onChanged.emit(changes),
										
										rs();
										
									} else rj(new TypeError());
									
								})
					
				},
				
				set(keys) {
					
					return	keys && typeof keys === 'object' ?
								new Promise((rs, rj) => {
									
									const	{ assign, hasOwn } = Object,
											{ localStorage, storage } = browser,
											changes = {},
											data = {};
									let k,v, change;
									
									for (k in keys) {
										
										change = changes[k] = {},
										hasOwn(localStorage, k) && (change.oldValue = structuredClone(localStorage[k]));
										
										data[k] = (v = change.newValue = keys[k]) && typeof v === 'object' &&
											(v0 = localStorage[k]) && typeof v0 === 'object' ?
												assign(v0, v) : v;
										
									}
									
									browser.localStorage = data,
									
									storage.local.onChanged.emit(changes),
									
									rs();
									
								}) :
								Promise.reject(new TypeError());
					
				}
				
			}
		}
		
	},
	
	browser.baseURL = browser.getDirPath(document.currentScript.src)
	
);