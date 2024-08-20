class CopyXPost extends CXPBasement {
	
	static {
		
		this[Logger.$icon] = '󠁪󠁪󠁪󠀽𝕏';
		
		this.SELECTOR_REACT_ROOT = '#react-root',
		this.SELECTOR_NEW_POST_BUTTON = 'header[role="banner"] a[data-testid="SideNav_NewTweet_Button"]',
		this.SELECTOR_POST = 'main[role="main"] article[data-testid="tweet"]',
		this.SELECTOR_CXP = 'div[shadow="cxp"]',
		this.SELECTOR_CARET = '[data-testid="caret"]',
		this.POST_TEXT_SELECTOR = '[data-testid="tweetText"]',
		this.ATTR_MODIFIED = 'data-modified',
		this.DEFAULT_INTERFACE = 'less-anime'
		this.rxEmoji = /^https:\/\/.*?\.twimg\.com\/emoji\/.*?$/,
		
		this.bodyObserverInit = { childList: true, subtree: true },
		this.rootObserverInit = { childList: true, subtree: true },
		this.mainObserverInit = { childList: true, subtree: true },
		this.bannerObserverInit = { childList: true, subtree: true },
		
		this.configuration = {
			
			settings: {
				
				interfaceName: {
					
					remove(value) {
						
						const { constructor: { DEFAULT_INTERFACE } } = this;
						
						for (const shadow of document.querySelectorAll('[shadow]'))
							shadow.dataset.cxpInterface = DEFAULT_INTERFACE;
						
					},
					
					update(value) {
						
						for (const shadow of document.querySelectorAll('[shadow]')) shadow.dataset.cxpInterface = value;
						
					}
					
				}
				
			}
			
		};
		
	}
	
	static messageHandler = {
		
		object: {
			
			['scrape-element-identified'](message, sender, sendResponse) {
				
				const scraped = this.constructor.scrapePost(this.targetElement = browser.menus.getTargetElement(message.info.targetElementId));
				
				sendResponse({ ...message, scraped });
				
			},
			
			['clicked-menu-item'](message, sender, sendResponse) {
				
				const { plainPostText } = this.constructor.scrapePost(browser.menus.getTargetElement(message.info.targetElementId) || this.targetElement);
				
				plainPostText && navigator.clipboard.writeText(plainPostText.join(''));
				
			}
			
		}
		
	};
	
	static bound = {
		
		async enteredPost(event) {
			
			const { target } = event;
			let node, handler;
			
			if (node = target.querySelector(CopyXPost.SELECTOR_CXP)) {
				
				handler = node.handler,
				node.toggleAttribute('data-cxp-left', false);
				
			} else {
				
				node = this.constructor.setCXP(target, this.stored.settings).element;
				
				//handler = node.handler;
				//
				//for (const button of shadowRoot.querySelectorAll('#buttons button'))
				//	handler.addLifetimeEvent('mouseenter', enteredButton, undefined, button);
				//
				////target.querySelector(SELECTOR_CARET)?.parentElement.prepend?.(node = node.element);
				//target.querySelector(SELECTOR_CARET)?.parentElement.parentElement.parentElement.parentElement.
				//	prepend?.(node = node.element);
				
			}
			
			node instanceof Element && handler instanceof ShadowElement &&
				(
					node.toggleAttribute('data-cxp-exited', false)
				);
			
		},
		
		shownContextMenu(event) {
			
			const { plainPostText } = this.constructor.scrapePost(this.contextualElement = event.target);
			
			plainPostText && navigator.clipboard.writeText(plainPostText.join(''));
			
			//this.contextualElement = event.target;
			//const { SELECTOR_POST } = CopyXPost, post = event.target.closest(SELECTOR_POST);
			//
			//if (post) {
			//	
			//	const	{ $scrapers, scrape } = ShadowScraperElement,
			//			scraped = ShadowScraperElement.scrape(post, ShadowCopyXPostElement[$scrapers]),
			//			{ plainPostText } = scraped;
			//	
			//	plainPostText && navigator.clipboard.writeText(plainPostText.join(''));
			//	
			//}
			
		}
		
	};
	
	// このメソッドは this を用いるため、コンストラクターのオブジェクト.scrapePost() 形式で呼び出す必要がある。
	static scrapePost(element) {
		
		if (element instanceof Element) {
			
			const	{ SELECTOR_POST, composedClosest } = this,
					post = composedClosest(element, SELECTOR_POST);
			
			if (post) {
				
				const { $scrapers, scrape } = ShadowScraperElement;
				
				return scrape(post, ShadowCopyXPostElement[$scrapers]);
				
			}
			
		}
		
		return {};
		
	}
	
	static async setCXP(post, settings) {
		
		const	{ SELECTOR_CARET, createCXP, enteredButton, exitedAnimation, leftButton, leftPost } = CopyXPost,
				node = await createCXP(settings),
				{ element, handler, shadowRoot } = node;
		
		for (const button of shadowRoot.querySelectorAll('#buttons button'))
			handler.addLifetimeEvent('mouseenter', enteredButton, undefined, button);
		
		//target.querySelector(SELECTOR_CARET)?.parentElement.prepend?.(node = node.element);
		post.querySelector(SELECTOR_CARET)?.
			parentElement.parentElement.parentElement.parentElement.prepend?.(element);
		
		return node;
		
	}
	
	static async createCXP(settings) {
		
		const	node = await ShadowElement.create('cxp'),
				{ shadowRoot } = node;
		let copyLabel, link, button;
		
		(copyLabel = document.createElement('span')).slot = 'copy-label',
		shadowRoot.querySelector('#root').style.display = 'none',
		node.appendChild(copyLabel).textContent = '📋',
		(link = document.createElement('link')).rel = 'stylesheet',
		shadowRoot.appendChild(link).href = browser.runtime.getURL('css/shadow-copy-x-post-element-injected.css');
		
		for (button of shadowRoot.querySelectorAll('#buttons button')) {
			
			(button = await ShadowElement.create('interactive', button)).enterAnime = 'bounce',
			button.initiateAnime = 'spawn fade-in in noop-initiate',
			button.leaveAnime = 'exit fade-out out noop-leave',
			button.pressAnime = 'bounce-press press down noop-press',
			button.releaseAnime = 'bounce-release release up noop-release';
			
			for (const label of button.querySelectorAll('.label')) await ShadowElement.create('interactive', label);
			
		}
		
		node.id = 'cxp-' + crypto.randomUUID(),
		node.leaveAnime = 'exit fade-out out noop-leave',
		node.purgeAfterAnime = 'leave-anime-ended',
		node.dataset.cxpInterface = settings.interfaceName;
		
		return node;
		
	}
	
	static async constrainedHint(target) {
		
		const hintNode = await ShadowElement.create('hint');
		
		hintNode.constrained = target,
		hintNode.enterAnime = 'hint-spawn',
		hintNode.leaveAnime = 'hint-exit',
		hintNode.sbcvAfterAnime = 'enter-anime-begun',
		hintNode.purgeAfterAnime = 'leave-anime-ended';
		
		return hintNode;
	}
	
	static changedStorage(changes, areaName) {
		
		const { configuration } = CopyXPost, { stored } = this;
		let k,k0, changed, configurationItem, nv,ov;
		
		for (k in changes) 'newValue' in (changed = changes[k]) ? (stored[k] = changed.newValue) : delete stored[k];
		
		//coco storage内のデータの処理をconfigurationオブジェクトに一任させる作業の続き。
		// できてる？
		for (k in changes) {
			
			if (k in configuration) {
				
				configurationItem = configuration[k];
				
				if ('newValue' in (changed = changes[k])) {
					
					
					for (k0 in (nv = changed.newValue))
						k0 in configurationItem && configurationItem[k0]?.update?.call?.(this, nv[k0]);
					
					for (k0 in (ov = changed.oldValue))
						k0 in configurationItem && !(k0 in nv) && configurationItem[k0]?.remove?.call?.(this, ov[k0]);
					
				}
				
			}
			// 以下の処理を除去できるようにする。
			//switch (k) {
			//	
			//	case 'settings':
			//	
			//	if ('newValue' in (change = changes[k])) {
			//		
			//		const changed = change.newValue;
			//		let k0;
			//		
			//		for (k0 in changed) {
			//			
			//			settings[k0] = changed;
			//			
			//			switch (k0) {
			//				
			//				case 'interface':
			//				
			//				const v = changed[k0];
			//				
			//				for (const shadow of document.querySelectorAll('[shadow]'))
			//					shadow.dataset.cxpInterface = v;
			//				
			//				break;
			//				
			//			}
			//			
			//		}
			//		
			//	} else if ('oldValue' in change) {
			//		
			//		const changed = change.oldValue;
			//		let k0;
			//		
			//		for ()
			//		
			//	}
			//	
			//	break;
			//	
			//}
			
		}
		
	}
	
	static async enteredButton(event) {
		
		event.stopPropagation();
		
		const { target } = event, { dataset: { constrainedAboutHint } } = target;
		
		(constrainedAboutHint && document.getElementById(constrainedAboutHint)) ||
			document.body.prepend((await CopyXPost.constrainedHint(target)).element);
		
	}
	
	static initializing(rs, rj) {
		
		const { constructor: { SELECTOR_REACT_ROOT, bodyObserverInit } } = this;
		
		(this.XRootNode = document.querySelector(SELECTOR_REACT_ROOT)) ?
			rs(this.XRootNode) :
			(
				this.bodyObserver =
					new MutationObserver
						(
							mrs =>	{
										const	XRootNode =
													document.querySelector(SELECTOR_REACT_ROOT);
										
										XRootNode &&	(
															this.bodyObserver.disconnect(),
															rs(this.XRootNode = XRootNode)
														);
									}
						)
			).observe(document.body, bodyObserverInit);
		
	}
	
	static leftPost(event) {
		
		event.target.querySelector(CopyXPost.SELECTOR_CXP)?.toggleAttribute?.('data-cxp-left', true);
		
	}
	
	static loading(storage) {
		
		const { changedStorage, initializing, startup } = this;
		
		this.stored = storage,
		
		browser.storage.local.onChanged.addListener(changedStorage);
		
		return storage?.settings?.interfaceName === 'disuse' || new Promise(initializing).then(startup);
		
	}
	
	//static async mutatedRootNodeChildList(mrs) {
	//	
	//	const	{ runtime } = browser,
	//			{ getElementsFromMRs } = ShadowElement,
	//			{
	//				constructor: { SELECTOR_CXP, SELECTOR_NEW_POST_BUTTON, SELECTOR_POST, setCXP },
	//				stored: { settings = {} }
	//			} = this,
	//			{ added: posts, removed: removedPosts } = getElementsFromMRs(mrs, SELECTOR_POST, true),
	//			{ length: postsLength } = posts,
	//			{ added: [ newPostButton ] } = getElementsFromMRs(mrs, SELECTOR_NEW_POST_BUTTON, true);
	//	
	//	if (settings.interfaceName !== 'disabled' && postsLength) {
	//		
	//		if (settings.visibleAlways) {
	//			
	//			let i;
	//			
	//			i = -1, this.mutePosts(posts);
	//			while (++i < postsLength) setCXP(posts[i], settings);
	//			
	//		} else this.listenPosts(posts);
	//		
	//	} 
	//	
	//	removedPosts.length && this.mutePosts(removedPosts),
	//	
	//	newPostButton &&
	//		document.body.style.setProperty('--accent-color', getComputedStyle(newPostButton).backgroundColor);
	//	
	//}
	
	static closestAll(targets, selector) {
		
		const { length } = targets;
		
		if (length) {
			
			const results = [];
			let i,i0, v;
			
			i = i0 = -1;
			while (++i < length)
				(v = (v = targets[i])?.matches?.(selector) || v?.closest?.(selector)) && (results[++i0] = v);
			
			return results;
			
		}
		
		return [];
		
	}
	
	static async mutatedRootNodeChildList(mrs) {
		
		const	{ runtime } = browser,
				{ getElementsFromMRs } = ShadowElement,
				{
					constructor: { SELECTOR_CARET, SELECTOR_NEW_POST_BUTTON, SELECTOR_POST, closestAll },
					stored: { settings = {} }
				} = this,
				{ added: carets, removed: removedCarets } = getElementsFromMRs(mrs, SELECTOR_CARET),
				posts = closestAll(carets, SELECTOR_POST),
				removedPosts = closestAll(removedCarets, SELECTOR_POST),
				{ length: postsLength } = posts,
				{ added: [ newPostButton ] } = getElementsFromMRs(mrs, SELECTOR_NEW_POST_BUTTON, true);
		
		if (settings.interfaceName !== 'disabled' && postsLength) {
			
			if (settings.visibleAlways) {
				
				const { constructor: { setCXP } } = this;
				let i;
				
				i = -1, this.mutePosts(posts);
				while (++i < postsLength) setCXP(posts[i], settings);
				
			} else this.listenPosts(posts);
			
		} 
		
		removedPosts.length && this.mutePosts(removedPosts),
		
		newPostButton &&
			document.body.style.setProperty('--accent-color', getComputedStyle(newPostButton).backgroundColor);
		
	}
	
	static startup(XRootNode) {
		
		const	{
					constructor:	{
										SELECTOR_CARET,
										SELECTOR_POST,
										closestAll,
										listenPosts,
										rootObserverInit
									},
					shownContextMenu,
					stored: { settings },
				} = this,
				{ addsContextMenu, copiesWhenContextMenuIsShown, interfaceName, visibleAlways } = settings,
				posts = closestAll(XRootNode.querySelectorAll(SELECTOR_CARET), SELECTOR_POST),
				{ length } = posts;
		
		copiesWhenContextMenuIsShown ?
			addEventListener('contextmenu', shownContextMenu, { signal: this.getSignal('post') }) :
			removeEventListener('contextmenu', shownContextMenu);
		
		if (interfaceName !== 'disabled' && length) {
			
			if (visibleAlways) {
				
				const { constructor: { setCXP } } = this;
				let i;
				
				i = -1, this.mutePosts(posts);
				while (++i < length) setCXP(posts[i], settings);
				
			} else this.listenPosts(posts);
			
		}
		
		(this.rootObserver = new MutationObserver(this.mutatedRootNodeChildList)).observe(XRootNode, rootObserverInit);
		
	}
	
	constructor() {
		
		super();
		
		const	{
					constructor:	{
										changedStorage,
										initializing,
										loading,
										mutatedRootNodeChildList,
										startup
									}
				} = this;
		
		this.ac = {},
		
		//browser.menus.onClicked.addListener((info, tab) => hi(info.targetElementId,browser.menus.getTargetElement(info.targetElementId))),
		
		//browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
		//	
		//	if (message && typeof message === 'object') {
		//		switch (message.type) {
		//			
		//			case 'menu':
		//			hi(message, message.info.targetElementId, browser.menus.getTargetElement(message.info.targetElementId));
		//			break;
		//			
		//		}
		//	}
		//	
		//}),
		
		this.changedStorage = changedStorage.bind(this),
		this.initializing = initializing.bind(this),
		this.loading = loading.bind(this),
		this.mutatedRootNodeChildList = mutatedRootNodeChildList.bind(this),
		this.startup = startup.bind(this);
		
	}
	
	//abort(key) {
	//	
	//	const { ac } = this;
	//	
	//	return key in ac && !!ac[key].abort();
	//	
	//}
	
	purge() {
		
		const { bodyObserver, changedStorage, intersectionObserver, rootObserver } = this;
		
		this.abort('post'),
		
		browser.storage.local.onChanged.removeListener(changedStorage),
		
		bodyObserver?.disconnect?.(),
		rootObserver?.disconnect?.();
		
	}
	
	//getSignal(key) {
	//	
	//	const { ac } = this;
	//	
	//	return ((key in ac && !ac[key].signal.aborted) ? ac[key] : (ac[key] = new AbortController())).signal;
	//	
	//}
	
	init() {
		
		return	this.initialized =	fetch(browser.runtime.getURL('storage-default.json')).
										then(response => response.json()).
										then(key => browser.storage.local.get(key)).
										then(this.loading);
		
	}
	
	listenPosts(posts) {
		
		if (posts && typeof posts === 'object') {
			
			const { length } = posts;
			
			if (length ? posts : posts instanceof Element && (posts = [ posts ])) {
				
				const	{ SELECTOR_CXP, SELECTOR_CARET, leftPost } = CopyXPost,
						{ enteredPost } = this,
						eventOption = { signal: this.getSignal('post') };
				let i, post;
				
				i = -1;
				while (++i < length)	(
											(post = posts[i]) instanceof Element &&
											!post.querySelector(SELECTOR_CXP) &&
											post.querySelector(SELECTOR_CARET)
										) &&
											(
												post.addEventListener('mouseenter', enteredPost, eventOption),
												post.addEventListener('mouseleave', leftPost, eventOption)
											);
				
			}
			
		}
		
	}
	
	mutePosts(posts) {
		
		if (posts && typeof posts === 'object') {
			
			const { length } = posts;
			
			if (length ? posts : posts instanceof Element && (posts = [ posts ])) {
				
				const { leftPost } = CopyXPost, { enteredPost } = this;
				let i, post;
				
				i = -1;
				while (++i < length)	(post = posts[i]) instanceof Element &&
											(
												post.removeEventListener('mouseenter', enteredPost),
												post.removeEventListener('mouseleave', leftPost)
											);
				
			}
			
		}
		
	}
	
}

class ShadowCXPInteractiveElement extends ShadowInteractiveElement {
	
	static {
		
		this[Logger.$icon] = '󠁪󠁪󠁪󠀽🧩:' + CopyXPost[Logger.$icon];
		this[Logger.$name] = CopyXPost[Logger.$name],
		this[Logger.$namePrefix] = CopyXPost[Logger.$namePrefix],
		this[Logger.$nameSuffix] = CopyXPost[Logger.$nameSuffix];
		
	}
	
	constructor() {
		
		super();
		
		const { constructor } = this;
		
		const boundFunctions = this.getBound(constructor.merge(constructor, 'bound'));
		
		for (const k in boundFunctions) this[k] = boundFunctions[k];
		
	}
	
}

class ShadowScraperElement extends ShadowCXPInteractiveElement {
	
	static {
		
		this.$scrapers = Symbol('ShadowScraperElement.scrapers');
		
	}
	
	static scrape(node, scrapers) {
		
		if (node instanceof Element) {
			
			const { assign } = Object, scraped = {};
			let i,l, v;
			
			i = -1, l = (Array.isArray(scrapers) ? scrapers : [ scrapers ]).length;
			while (++i < l)	typeof (typeof (v = scrapers[i]) === 'function' ?
								(v = v(node, scraped)) : v) && typeof v === 'object' && assign(scraped, v);
			
			return scraped;
			
		}
		
		return {};
		
	}
	
	constructor() {
		
		super();
		
		const	{ $scrapers } = ShadowScraperElement,
				scrapers = this.constructor[$scrapers] ?? [], _scrapers = this[$scrapers] = [];
		let i,l, v;
		
		i = -1, l = (Array.isArray(scrapers) ? scrapers : [ scrapers ]).length;
		while (++i < l) typeof (v = scrapers[i]) === 'function' && (_scrapers[i] = v.bind(this));
		
	}
	
	scrape(node) {
		
		return ShadowScraperElement.scrape(node, this[ShadowScraperElement.$scrapers]);
		
	}
	
}

class ShadowCopyXPostElement extends ShadowScraperElement {
	
	static {
		
		this.SELECTOR_POST = CopyXPost.SELECTOR_POST,
		
		this.tag = 'cxp',
		this.templateURL = 'html/shadow-copy-x-post-element.html';
		
	}
	
	static [ShadowScraperElement.$scrapers] = [
		
		this.convertPostToText
		
	];
	
	static clickedCopyButton(event) {
		
		event.preventDefault(), event.stopPropagation();
		
		const	{ constructor: { SELECTOR_POST, copied }, element } = this,
				{ target } = event,
				scraped = this.scrape(element.closest(SELECTOR_POST)),
				{ plainPostText } = scraped;
		
		plainPostText &&	navigator.clipboard.writeText(plainPostText.join('')).
								then(text => copied.call(this, target, text, scraped));
		
	}
	
	static clickedDevCopyButton(event) {
		
		navigator.clipboard.writeText(this.element.closest(ShadowCopyXPostElement.SELECTOR_POST).outerHTML);
		
		event.preventDefault(), event.stopPropagation();
		
	}
	
	static convertPostToText(post, scraped) {
		
		const	{ POST_TEXT_SELECTOR, rxEmoji } = CopyXPost,
				textNode = post.querySelector(POST_TEXT_SELECTOR),
				{ children } = textNode,
				{ length } = children,
				text = [];
		let i,i0, child;
		
		i = i0 = -1;
		while (++i < length) {
			
			switch ((child = children[i]).tagName.toLowerCase()) {
				
				case 'img':
				if (rxEmoji.test(child.src)) {
					
					text[++i0] = child.getAttribute('alt');
					
				}
				break;
				
				default:
				text[++i0] = child.textContent;
				break;
				
			}
			
		}
		
		return i0 === -1 ? null : { plainPostText: text };
		
	}
	
	static notifyEndToBalloon(event) {
		
		const { target } = event, { dataset: { constrainedAboutBalloon } } = target;
		
		if (constrainedAboutBalloon) {
			
			const	{ animationName, type } = event,
					{ handler } = target,
					balloon = document.getElementById(constrainedAboutBalloon);
			
			balloon?.hasAttribute?.('leave-anime-begun') ||
				(
					balloon ?
						handler.leaveAnime.includes(animationName) ?
							(balloon.handler.resetAnime(), balloon.handler.finish = true) :
							balloon.handler.finish && balloon.handler.resetAnime() :
						target.removeEventListener(type, ShadowCopyXPostElement.notifyEndToBalloon)
				);
			
		}
		
	}
	
	static async copied(element, data, scraped) {
		
		let balloon;
		
		if (!(balloon = document.getElementById(element.dataset.constrainedAboutBalloon))) {
			
			const balloonContent = document.createElement('div');
			
			balloon = await ShadowElement.create('balloon'),
			
			element.handler.addLifetimeEvent('animationstart', ShadowCopyXPostElement.notifyEndToBalloon),
			
			balloonContent.classList.add('content'),
			balloon.appendChild(balloonContent),
			
			balloon.classList.add('checked', 'flat'),
			balloon.enterAnime = 'balloon-spawn balloon-less-anime-initiate noop-initiate',
			balloon.leaveAnime = 'exit balloon-less-anime-leave noop-leave',
			//balloon.sbcvAfterAnime = 'enter-anime-begun',
			balloon.purgeAfterAnime = 'leave-anime-ended',
			//balloon.dataset.cxpInterface = element.getRootNode().host.dataset.cxpInterface,
			balloon.dataset.cxpInterface = (element.getRootNode()?.host ?? element).dataset.cxpInterface,
			document.body.prepend(balloon.element),
			balloon.constrained = element;
			
		}
		
		this.info(scraped),
		
		balloon.handler.resetAnime();
		
	}
	
	constructor() {
		
		super();
		
		const	{ SELECTOR_POST, clickedCopyButton, clickedDevCopyButton } = ShadowCopyXPostElement,
				{ shadowRoot } = this,
				devCopyLabel = document.createElement('span');
		
		devCopyLabel.slot = 'dev-copy-label',
		devCopyLabel.textContent = '🔬',
		this.element.appendChild(devCopyLabel),
		
		this.addLifetimeEvent	(
									'click',
									this.clickedCopyButton = clickedCopyButton.bind(this),
									undefined,
									shadowRoot.getElementById('copy-button')
								),
		shadowRoot.getElementById('dev-copy-button') &&
			this.addLifetimeEvent	(
										'click',
										this.clickedDevCopyButton = clickedDevCopyButton.bind(this),
										undefined,
										shadowRoot.getElementById('dev-copy-button')
									);
		
	}
	
}
ShadowCopyXPostElement.define();

class ShadowConstrainedElement extends ShadowCXPInteractiveElement {
	
	static {
		
		this.$attrObserver = Symbol('ShadowConstrainedElement.attrObserver'),
		this.$constrained = Symbol('ShadowConstrainedElement.constrained'),
		this.$defaultAbout = Symbol('ShadowConstrainedElement.defaultAbout'),
		
		this[this.$defaultAbout] = 'undefined',
		this.tag = 'constrained',
		
		this.observedAttributeInit = { attributes: true, attributeFilter: [ 'about', 'id' ], attributeOldValue: true };
		
	}
	
	static attributeChangedCallback(mrs) {
		
		const { length } = mrs;
		let i, mr, constrained;
		
		i = -1;
		while (++i < length) {
			
			switch ((mr = mrs[i]).attributeName) {
				
				case 'about':
				
				if (constrained = this.constrained) {
					
					const { about, id } = this;
					
					constrained.removeAttribute(mr.oldValue),
					constrained.setAttribute('data-constrained-about-' + about, id);
					
				}
				
				break;
				
				case 'id':
				
				if (constrained = this.constrained) {
					
					const { about, id } = this;
					
					constrained.setAttribute('data-constrained-about-' + about, id);
					
				}
				
				break;
				
			}
			
		}
		
	}
	
	constructor() {
		
		super();
		
		const	{ $attrObserver } = ShadowConstrainedElement,
				{ constructor: { attributeChangedCallback, observedAttributeInit }, element } = this;
		
		(this[$attrObserver] = new MutationObserver(this.attributeChangedCallback = attributeChangedCallback.bind(this))).
			observe(element, observedAttributeInit);
		
	}
	
	constrain(constrained) {
		
		const	{ $constrained } = ShadowHintElement,
				handler = this instanceof ShadowHintElement ? this : this.handler,
				lastConstrained = handler[$constrained],
				about = 'data-constrained-about-' + this.about;
		
		constrained = handler[$constrained] =
			constrained instanceof Element ? constrained :
				constrained instanceof ShadowElement ? constrained.element :
					constrained === undefined ? lastConstrained : null,
		
		lastConstrained instanceof Element && (!constrained || constrained !== lastConstrained) && 
			(lastConstrained.removeAttribute(about), this.detach?.(lastConstrained));
		
		if (constrained) {
			
			const { element } = handler, { dataset } = constrained;
			
			(element.id ||= 'constrained-' + crypto.randomUUID()) === element.getAttribute(about) ||
				constrained.setAttribute(about, element.id),
			
			handler.attach?.(constrained);
			
		}
		
		return constrained;
		
	}
	
	get about() {
		
		const { $defaultAbout } = ShadowConstrainedElement;
		
		return this.element.getAttribute('about') || this[$defaultAbout] || this.constructor[$defaultAbout];
		
	}
	set about(v) {
		
		this.element.setAttribute('about', v);
		
	}
	get constrained() {
		
		const v = this[ShadowHintElement.$constrained];
		
		return v instanceof Element ? v : null;
		
	}
	set constrained(v) {
		
		this.constrain(v);
		
	}
	get id() {
		
		return this.element.id;
		
	}
	set id(v) {
		
		this.element.id = v;
		
	}
	
}

class ShadowPopupElement extends ShadowConstrainedElement {
	
	static {
		
		this[ShadowConstrainedElement.$defaultAbout] = 'popup',
		
		this.tag = 'popup',
		
		this.resetAnimeTriggerBefore =
			{ attr:	[ ...super.resetAnimeTriggerBefore.attr, { method: 'remove', name: 'exiting' } ] };
		
	}
	
	static bound = {
		
		begunEnterAnime(event) {
			
			const	{ height, width } = visualViewport,
					{ target } = event,
					{ style } = target,
					rect = target.getBoundingClientRect();
			let k,v, top,right,bottom,left;
			
			for (k in rect)	typeof (v = rect[k]) === 'number' &&
								(
									k === 'top' || k === 'left' ?
										(
											style.setProperty
												('--popup-out-of-bounds-' + k, (v = v < 0 ? v * -1 : 0) + 'px'),
											k === 'top' ? (top = v) : (left = v)
										) :
									k === 'right' ?
										style.setProperty
											('--popup-out-of-bounds-' + k, (right = v > width ? v - width : 0) + 'px') :
									k === 'bottom' &&
										style.setProperty
											('--popup-out-of-bounds-' + k, (bottom = v > height ? v - height : 0) + 'px')
								);
			hi(top,right,bottom,left);
			style.setProperty('--popup-out-of-bounds-lr', (left || right) + 'px'),
			style.setProperty('--popup-out-of-bounds-rl', (right || left) + 'px'),
			style.setProperty('--popup-out-of-bounds-tb', (top || bottom) + 'px'),
			style.setProperty('--popup-out-of-bounds-bt', (bottom || top) + 'px');
			
		},
		
		// このイベントハンドラーは、既に場に現われたヒントが、いったんそれに紐付けられた要素からカーソルが外れ、
		// 退出処理（アニメ）が開始され始めた時に、再度紐付けられた要素にカーソルが合わせられた時にのみ起動することを想定している。
		// 現状は問題ないが、例えば mouseenter 以外の方法でヒントを表示した場合に対応できないなど、汎用的な仕様ではないことが想像される。
		enteredConstrained(event) {
			
			this.resetAnime();
			
		},
		
		leftConstrained(event) {
			
			this.enterAnimeBegun ? (this.exiting = true) : this.purge(undefined, true);
			
		}
		
	};
	
	static changedAnimationState(event) {
		
		//Object.getPrototypeOf(this.constructor).changedAnimationState.call(this, event, this.constrained);
		ShadowCXPInteractiveElement.changedAnimationState.call(this, event, this.constrained);
		
	}
	
	constructor() {
		
		super();
		
		this.addLifetimeEvent('enter-anime-begun', this.begunEnterAnime);
		
	}
	
	attach(constrained) {
		
		const { enteredConstrained, leftConstrained } = this;
		
		this.addLifetimeEvent('mouseenter', enteredConstrained, undefined, constrained),
		this.addLifetimeEvent('mouseleave', leftConstrained, undefined, constrained);
		
	}
	detach(lastConstrained) {
		
		const { enteredConstrained, leftConstrained } = this;
		
		lastConstrained.removeEventListener('mouseenter', enteredConstrained),
		lastConstrained.removeEventListener('mouseleave', leftConstrained);
		
	}
	
	set constrained(v) {
		
		if (v = this.constrain(v)) {
			
			const { element } = this, hintAlt = ShadowElement.i18n(v.dataset.hintAlt);
			
			hintAlt &&
				(v.hasAttribute('data-hint-as-html') ? (element.innerHTML = hintAlt) : (element.dataset.alt = hintAlt)),
			ShadowElement.setBoundToCSSVar(element, v);
			
		}
		
	}
	get exiting() {
		
		return this.element.hasAttribute('exiting');
		
	}
	set exiting(v) {
		
		this.constrain(),
		
		this.element.toggleAttribute('exiting', !!v);
		
	}
	
}

class ShadowHintElement extends ShadowPopupElement {
	
	static {
		
		this[ShadowConstrainedElement.$defaultAbout] = 'hint',
		
		this.tag = 'hint';
		
	}
	
	constructor() {
		
		super();
		
	}
	
}
ShadowHintElement.define();

class ShadowBalloonElement extends ShadowConstrainedElement {
	
	static {
		
		this[ShadowConstrainedElement.$defaultAbout] = 'balloon',
		
		this.tag = 'balloon',
		
		this.resetAnimeTriggerBefore =
			{
				attr:	[ ...super.resetAnimeTriggerBefore.attr, { method: 'remove', name: 'finish' } ],
				class: [ { method: 'remove', value: 'initiated' } ]
			},
		this.resetAnimeTriggerAfter = { class: [ { method: 'add', value: 'initiated' } ] };
		
	}
	
	constructor() {
		
		super();
		
	}
	
	set constrained(v) {
		
		(v = this.constrain(v)) && ShadowElement.setBoundToCSSVar(this.element, v);
		
	}
	get finish() {
		
		return this.element.hasAttribute('finish');
		
	}
	set finish(v) {
		
		this.element.toggleAttribute('finish', !!v);
		
	}
	
}
ShadowBalloonElement.define();