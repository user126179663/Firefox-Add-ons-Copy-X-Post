class Background extends CXPBasement {
	
	static {
		
		this[Logger.$icon] = '󠁪󠁪󠁪󠀽🔙',
		
		this.menuItem = [
			{
				id: 'copy-default',
				contexts: [ 'frame', 'image', 'link', 'page', 'selection' ],
				documentUrlPatterns: [ 'https://twitter.com/*', 'https://x.com/*' ],
				title: [ 'ポストをコピー: "', { keys: [ 'plainPostText' ], length: 32 }, '"' ]
			}
		];
		
	}
	
	static storageHandler = {
		
		settings: {
			
			addsContextMenu({ current }, change, stored) {
				
				current ? this.createMenuItem() : browser.menus.remove('sample');
				
			}
			
		}
		
	};
	
	static messageHandler = {
		
		object: {
			
			['default-storage'](message, sender, sendResponse) {
				
				sendResponse({ ...message, defaultStorage: this.defaultStorage });
				
			},
			
			ping(message, sender, sendResponse) {
				
				this.info('👋', message.timestamp);
				
			}
			
		}
		
	};
	
	static bound = {
		
		addedPermissions(permitted) {
			
			const { permissions } = permitted, { length } = permissions;
			let i;
			
			i = -1;
			while (++i < length) {
				
				switch (permissions[i]) {}
				
			}
			
		},
		
		clickedMenuItem(info, tab) {
			
			const { menuItemId } = info;
			
			switch (menuItemId) {
				
				case 'copy-default':
				browser.tabs.sendMessage(tab.id, { type: 'clicked-menu-item', info, tab });
				break;
				
			}
			
		},
		
		hiddenMenu(info, tab) {
			
			const { menus } = browser, { clickedMenuItem, hiddenMenu } = this;
			
			menus.onHidden.removeListener(hiddenMenu),
			menus.onClicked.removeListener(clickedMenuItem),
			
			menus.removeAll();
			
		},
		
		permit(permitted) {
			
			const { permissions } = permitted, { length } = permissions;
			let i, permission;
			
			i = -1;
			while (++i < length) {
				
				switch (permission = permissions[i]) {}
				
			}
			
		},
		
		setMenuItem(response) {
			
			const { scraped } = response;
			
			if (scraped.plainPostText) {
				
				const { menus } = browser, { clickedMenuItem, hiddenMenu } = this;
				
				menus.onHidden.addListener(hiddenMenu),
				menus.onClicked.addListener(clickedMenuItem),
				this.createMenuItem('copy-default', scraped),
				menus.refresh();
				
			};
			
		},
		
		async shownMenu(info, tab) {
			
			await this.initialized;
			
			const { setMenuItem, stored } = this;
			
			stored?.settings?.addsContextMenu &&
				browser.tabs.sendMessage(tab.id, { type: 'scrape-element-identified', info, tab }).then(setMenuItem);
			
		}
		
	};
	
	static getFrom(object, descriptor) {
		
		if (object && typeof object === 'object') {
			
			if (descriptor && typeof descriptor === 'object') {
				
				const { eaFWProperties, ellipsis, join = '', keys, length = -1 } = descriptor;
				let v;
				
				v =	keys === null || keys === undefined ?
						'' : Basement.recursiveGet(object, ...(Array.isArray(keys) ? keys : [ keys ])),
				
				Array.isArray(v) && (v = v.join(join));
				
				return length === -1 ? v : Basement.truncateEAStr(v, length, ellipsis, eaFWProperties);
				
			}
			
		}
		
		return ''+descriptor;
		
	}
	
	constructor() {
		
		super();
		
	}
	
	createMenuItem(id, scraped) {
		
		const { menuItem } = Background, { length } = menuItem;
		let i;
		
		i = -1;
		while (++i < length && menuItem[i].id !== id);
		
		if (i !== length) {
			
			const item = menuItem[i], { title: tv } = item, { length: titleLength } = tv;
			let title;
			
			i = -1, title = '', hi(scraped);
			while (++i < titleLength) title += Background.getFrom(scraped, tv[i]);
			
			browser.menus.create({ ...item, title });
			
		}
		
	}
	
	async init() {
		
		return this.initialized = new Promise(async (rs, rj) => {
			
			const	{ menus, permissions, runtime, storage: { local, session } } = browser,
					{ addedPermissions, changedStorage, clickedMenuItem, hiddenMenu, permit, receivedMessage, shownMenu } =
						this;
			
			menus.onShown.addListener(shownMenu),
			//menus.onClicked.addListener(clickedMenuItem),
			
			permissions.onAdded.addListener(addedPermissions),
			
			fetch(runtime.getURL('storage-default.json')).
				then(response => response.json()).
				then(json => (this.defaultStorage = json, local.get())).
				then(storage => (this.stored = Background.setDefault(storage, this.defaultStorage))).
				then(stored => session.get()).
				then(storage => (this.session = storage).sessioned || session.set({ sessioned: true })).
				then(() => permissions.getAll()).
				then(permit).
				then(rs);
			
		});
		
	}
	
}

new Background().init();