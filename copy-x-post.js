class CopyXPost {
	
	static {
		
		this.SELECTOR_REACT_ROOT = '#react-root',
		this.SELECTOR_MAIN_NODE = 'main[role="main"]',
		this.SELECTOR_NEW_POST_BUTTON = 'header[role="banner"] a[data-testid="SideNav_NewTweet_Button"]',
		this.SELECTOR_POST = 'main[role="main"] article[data-testid="tweet"]',
		this.SELECTOR_CXP = 'div[shadow="cxp"]',
		this.SELECTOR_CARET = '[data-testid="caret"]',
		this.POST_TEXT_SELECTOR = '[data-testid="tweetText"]',
		this.ATTR_MODIFIED = 'data-modified',
		this.rxEmoji = /^https:\/\/.*?\.twimg\.com\/emoji\/.*?$/,
		
		this.bodyObserverInit = { childList: true, subtree: true },
		this.rootObserverInit = { childList: true, subtree: true },
		this.mainObserverInit = { childList: true, subtree: true },
		this.bannerObserverInit = { childList: true, subtree: true },
		
		this.cxpAnimationButtonConditions = [
			{
				dataset: [ { name: 'cxpSpawned', value: '' } ],
				name: 'spawn',
				state: 'end'
			},
			{
				dataset: [ { name: 'cxpSpawned' }, { name: 'cxpEntered' }, { name: 'cxpLeft' } ],
				name: 'exit',
				state: 'end'
			}
		];
		
	}
	
	static async createCXP() {
		
		const	{ cxpAnimationButtonConditions } = CopyXPost,
				node = await ShadowElement.create('cxp'),
				{ shadowRoot } = node;
		let copyLabel, link, button;
		
		(copyLabel = document.createElement('span')).slot = 'copy-label',
		shadowRoot.querySelector('#root').style.display = 'none',
		node.appendChild(copyLabel).textContent = '📋',
		(link = document.createElement('link')).rel = 'stylesheet',
		shadowRoot.appendChild(link).href = browser.runtime.getURL('css/shadow-copy-x-post-element-injected.css');
		
		for (button of shadowRoot.querySelectorAll('#buttons button')) {
			
			(button = await ShadowElement.create('interactive', button)).enterAnime = 'bounce',
			button.initiateAnime = 'spawn',
			button.leaveAnime = 'exit',
			button.pressAnime = 'press',
			button.releaseAnime = 'shake';
			
			for (const label of button.querySelectorAll('.label')) await ShadowElement.create('interactive', label);
			
		}
		
		node.id = 'cxp-' + crypto.randomUUID(),
		node.leaveAnime = 'exit',
		node.purgeAfterAnime = 'leave-anime-ended';
		
		return node;
		
	}
	
	static async enteredButton(event) {
		
		const { target } = event, { dataset: { constrainedAboutHint } } = target, label = target.querySelector('.label');
		let hintNode;
		
		(constrainedAboutHint && (hintNode = document.getElementById(constrainedAboutHint))) ||
			(
				(hintNode = await ShadowElement.create('hint')).constrained = target,
				hintNode.enterAnime = 'hint-spawn',
				hintNode.leaveAnime = 'hint-exit',
				hintNode.sbcvAfterAnime = 'enter-anime-begun',
				hintNode.purgeAfterAnime = 'leave-anime-ended',
				document.body.prepend(hintNode.element)
			),
		
		event.stopPropagation();
		
	}
	
	static async enteredPost(event) {
		
		const { target } = event;
		let node, handler;
		
		if (node = target.querySelector(CopyXPost.SELECTOR_CXP)) {
			
			handler = node.handler,
			node.toggleAttribute('data-cxp-left', false);
			
		} else {
			
			const	{ SELECTOR_CARET, createCXP, enteredButton, exitedAnimation, leftButton, leftPost } = CopyXPost,
					{ shadowRoot } = node = await createCXP();
			
			handler = node.handler;
			
			for (const button of shadowRoot.querySelectorAll('#buttons button'))
				handler.addLifetimeEvent('mouseenter', enteredButton, undefined, button);
			
			//target.querySelector(SELECTOR_CARET)?.parentElement.prepend?.(node = node.element);
			target.querySelector(SELECTOR_CARET)?.parentElement.parentElement.parentElement.parentElement.
				prepend?.(node = node.element);
			
		}
		
		node instanceof Element && handler instanceof ShadowElement &&
			node.toggleAttribute('data-cxp-exited', false);
		
	}
	
	static leftPost(event) {
		
		event.target.querySelector(CopyXPost.SELECTOR_CXP)?.toggleAttribute?.('data-cxp-left', true);
		
	}
	
	static async mutatedRootNodeChildList(mrs) {
		
		const	{ runtime } = browser,
				{ getElementsFromMRs } = ShadowElement,
				{ SELECTOR_CXP, SELECTOR_NEW_POST_BUTTON, SELECTOR_POST } = CopyXPost,
				{ added: posts, removed: removedPosts } = getElementsFromMRs(mrs, SELECTOR_POST),
				{ added: newPostButtons } = getElementsFromMRs(mrs, SELECTOR_NEW_POST_BUTTON),
				{ length: postsLength } = posts,
				{ length: removedPostsLength } = removedPosts,
				{ length: newPostButtonsLength } = newPostButtons;
		
		if (postsLength) {
			
			const { SELECTOR_CARET, enteredPost, leftPost } = CopyXPost;
			let i, post;
			
			i = -1;
			while (++i < postsLength)	(
											!(post = posts[i]).querySelector(SELECTOR_CXP) &&
											post.querySelector(SELECTOR_CARET)
										) &&
											(
												post.addEventListener('mouseenter', enteredPost),
												post.addEventListener('mouseleave', leftPost)
											);
			
		}
		
		if (removedPostsLength) {
			
			const { enteredPost, leftPost } = CopyXPost;
			let i, post;
			
			i = -1;
			while (++i < removedPostsLength)	(post = removedPosts[i]).removeEventListener('mouseenter', enteredPost),
												post.removeEventListener('mouseleave', leftPost);
			
		}
		
		newPostButtonsLength &&
			document.body.style.setProperty('--accent-color', getComputedStyle(newPostButtons[0]).backgroundColor);
		
	}
	
	static startup(xRootNode) {
		
		(this.rootObserver = new MutationObserver(this.mutatedRootNodeChildList)).
			observe(xRootNode, CopyXPost.rootObserverInit);
		
	}
	
	constructor() {
		
		const { mutatedRootNodeChildList, startup } = CopyXPost;
		
		this.mutatedRootNodeChildList = mutatedRootNodeChildList.bind(this),
		this.startup = startup.bind(this);
		
	}
	
	init() {
		
		const	{ SELECTOR_REACT_ROOT, bodyObserverInit } = CopyXPost,
				{ startup } = this,
				initializing = (rs, rj) => {
					
					(this.xRootNode = document.querySelector(SELECTOR_REACT_ROOT)) ?
						rs(this.xRootNode) :
						(
							this.bodyObserver =
								new MutationObserver
									(
										mrs =>	{
													const xRootNode = document.querySelector(SELECTOR_REACT_ROOT);
													
													xRootNode &&	(
																		this.bodyObserver.disconnect(),
																		rs(this.xRootNode = xRootNode)
																	);
												}
									)
						).observe(document.body, bodyObserverInit);
					
				};
		
		return this.initialized = new Promise(initializing).then(startup);
		
	}
	
}

class ShadowScraperElement extends ShadowInteractiveElement {
	
	static {
		
		this.$scrapers = Symbol('ShadowScraperElement.scrapers');
		
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
		
		if (node instanceof Element) {
			
			const { assign } = Object, { $scrapers } = ShadowScraperElement, scrapers = this[$scrapers], scraped = {};
			let i,l, v;
			
			i = -1, l = (Array.isArray(scrapers) ? scrapers : [ scrapers ]).length;
			while (++i < l)	typeof (typeof (v = scrapers[i]) === 'function' ?
								(v = v(node, scraped)) : v) && typeof v === 'object' && assign(scraped, v);
			
			return scraped;
			
		}
		
		return {};
		
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
		
		const	{ copied } = ShadowCopyXPostElement,
				{ element } = this,
				scraped = this.scrape(element.closest(ShadowCopyXPostElement.SELECTOR_POST)),
				{ plainPostText } = scraped;
		//hi(scraped);
		plainPostText && navigator.clipboard.writeText(plainPostText.join('')).then(copied.bind(this, event.target));
		
		event.preventDefault(), event.stopPropagation();
		
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
						animationName === handler.leaveAnime ?
							(balloon.handler.resetAnime(), balloon.handler.finish = true) :
							balloon.handler.finish && balloon.handler.resetAnime() :
						target.removeEventListener(type, ShadowCopyXPostElement.notifyEndToBalloon)
				);
			
		}
		
	}
	
	static async copied(element) {
		
		let balloon;
		
		if (!(balloon = document.getElementById(element.dataset.constrainedAboutBalloon))) {
			
			const balloonContent = document.createElement('div');
			
			balloon = await ShadowElement.create('balloon'),
			
			element.handler.addLifetimeEvent('animationstart', ShadowCopyXPostElement.notifyEndToBalloon),
			
			balloonContent.classList.add('content'),
			balloon.appendChild(balloonContent),
			
			balloon.classList.add('checked', 'flat'),
			balloon.enterAnime = 'balloon-spawn',
			balloon.leaveAnime = 'exit',
			//balloon.sbcvAfterAnime = 'enter-anime-begun',
			balloon.purgeAfterAnime = 'leave-anime-ended',
			document.body.prepend(balloon.element),
			balloon.constrained = element;
			
		}
		
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

class ShadowConstrainedElement extends ShadowInteractiveElement {
	
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
	
	static changedAnimationState(event) {
		
		//Object.getPrototypeOf(this.constructor).changedAnimationState.call(this, event, this.constrained);
		ShadowInteractiveElement.changedAnimationState.call(this, event, this.constrained);
		
	}
	
	// このイベントハンドラーは、既に場に現われたヒントが、いったんそれに紐付けられた要素からカーソルが外れ、
	// 退出処理（アニメ）が開始され始めた時に、再度紐付けられた要素にカーソルが合わせられた時にのみ起動することを想定している。
	// 現状は問題ないが、例えば mouseenter 以外の方法でヒントを表示した場合に対応できないなど、汎用的な仕様ではないことが想像される。
	static enteredConstrained(event) {
		
		this.resetAnime();
		
	}
	
	static leftConstrained(event) {
		
		this.enterAnimeBegun ? (this.exiting = true) : this.purge(undefined, true);
		
	}
	
	constructor() {
		
		super();
		
		const { enteredConstrained, leftConstrained } = ShadowPopupElement;
		
		this.enteredConstrained = enteredConstrained.bind(this),
		this.leftConstrained = leftConstrained.bind(this);
		
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
		
		const { element } = this;
		
		(v = this.constrain(v)) &&
			(element.dataset.alt = ShadowElement.i18n(v.dataset.hintAlt), ShadowElement.setBoundToCSSVar(element, v));
		
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