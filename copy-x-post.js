//todo
//  ページ読み込み時に既にカーソルがenter状態の時の判定処理(無理？)
//	mousedown mouseup のイベントリスナーの実装
// hintからのmouseenter mouseleaveイベントの分離

class CopyXPost {
	
	static {
		
		this.SELECTOR_MAIN_NODE = 'main[role="main"]',
		this.SELECTOR_POST = 'article[data-testid="tweet"]',
		this.SELECTOR_CXP = 'div[shadow="cxp"]',
		this.SELECTOR_CARET = '[data-testid="caret"]',
		this.POST_TEXT_SELECTOR = '[data-testid="tweetText"]',
		this.ATTR_MODIFIED = 'data-modified',
		this.rxEmoji = /^https:\/\/.*?\.twimg\.com\/emoji\/.*?$/,
		
		this.bodyObserverInit = { childList: true, subtree: true },
		this.mainObserverInit = { childList: true, subtree: true },
		
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
		let copyLabel, link;
		
		(copyLabel = document.createElement('span')).slot = 'copy-label',
		shadowRoot.querySelector('#root').style.display = 'none',
		node.appendChild(copyLabel).textContent = '📋',
		(link = document.createElement('link')).rel = 'stylesheet',
		shadowRoot.appendChild(link).href = browser.runtime.getURL('shadow-copy-x-post-element-injected.css');
		
		for (const button of shadowRoot.querySelectorAll('#buttons button')) {
			
			await ShadowElement.create('interactive', button);
			
			for (const label of button.querySelectorAll('.label')) await ShadowElement.create('interactive', label);
			
		}
		
		node.id = 'cxp-' + crypto.randomUUID();
		
		return node;
		
	}
	
	static async enteredButton(event) {
		
		const { target } = event, { dataset: { constrainedHint } } = target, label = target.querySelector('.label');
		let hintNode;
		
		//label &&	(
		//				label.toggleAttribute('data-cxp-label-exited', false),
		//				void label.offsetWidth,
		//				label.toggleAttribute('data-cxp-label-entered', true)
		//			);
		
		(constrainedHint && (hintNode = document.getElementById(constrainedHint))) ||
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
			
			handler.addLifetimeEvent('animationend', exitedAnimation),
			
			target.querySelector(SELECTOR_CARET)?.parentElement.prepend?.(node = node.element);
			
		}
		
		node instanceof Element && handler instanceof ShadowElement &&
			node.toggleAttribute('data-cxp-exited', false);
		
	}
	
	static exitedAnimation(event) {
		
		event.stopPropagation();
		
		const { animationName, target } = event;
		
		animationName === 'exit' && target?.handler?.purge?.(undefined, true);
		
	}
	
	static leftPost(event) {
		
		event.target.querySelector(CopyXPost.SELECTOR_CXP)?.toggleAttribute?.('data-cxp-left', true);
		
	}
	
	static async mutatedMainNodeChildList(mrs) {
		
		const	{ runtime } = browser,
				{ SELECTOR_CXP, SELECTOR_POST } = CopyXPost,
				{ added: posts, removed: removedPosts } = ShadowElement.getElementsFromMRs(mrs, SELECTOR_POST),
				{ length: postsLength } = posts,
				{ length: removedPostsLength } = removedPosts;
		
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
		
	}
	
	static startup(mainNode) {
		
		const { mainObserverInit } = CopyXPost, { mutatedMainNodeChildList } = this;
		
		this.mainObserver = new MutationObserver(mutatedMainNodeChildList).observe(mainNode, mainObserverInit);
		
	}
	
	constructor() {
		
		const { mutatedMainNodeChildList, startup } = CopyXPost;
		
		this.mutatedMainNodeChildList = mutatedMainNodeChildList.bind(this),
		this.startup = startup.bind(this);
		
	}
	
	init() {
		
		const	{ SELECTOR_MAIN_NODE, bodyObserverInit } = CopyXPost,
				{ startup } = this,
				initializing = (rs, rj) => {
					
					(this.mainNode = document.querySelector(SELECTOR_MAIN_NODE)) ?
						rs(this.mainNode) :
						(
							this.bodyObserver =
								new MutationObserver
									(
										mrs =>	{
													const mainNode = document.querySelector(SELECTOR_MAIN_NODE);
													
													mainNode &&	(
																	this.bodyObserver.disconnect(),
																	rs(this.mainNode = mainNode)
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
		this.templateURL = 'shadow-copy-x-post-element.html';
		
	}
	
	static [ShadowScraperElement.$scrapers] = [
		
		this.convertPostToText
		
	];
	
	static clickedCopyButton(event) {
		
		const	scraped = this.scrape(this.element.closest(ShadowCopyXPostElement.SELECTOR_POST)),
				{ plainPostText } = scraped;
		hi(scraped);
		plainPostText && navigator.clipboard.writeText(plainPostText.join(''));
		
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
		this.addLifetimeEvent	(
									'click',
									this.clickedDevCopyButton = clickedDevCopyButton.bind(this),
									undefined,
									shadowRoot.getElementById('dev-copy-button')
								);
		
	}
	
}
ShadowCopyXPostElement.define();

class ShadowHintElement extends ShadowInteractiveElement {
	
	static {
		
		this.$constrained = Symbol('ShadowHintElement.constrained');
		
		this.tag = 'hint',
		
		this.observedAttributeInit = { attributes: true, attributeFilter: [ 'id' ] },
		
		this.resetAnimeTriggerBefore =
			{
				attr:	[
							{ method: 'remove', name: 'enter-anime-begun' },
							{ method: 'remove', name: 'enter-anime-ended' },
							{ method: 'remove', name: 'entered' },
							{ method: 'remove', name: 'left' },
							{ method: 'remove', name: 'leave-anime-begun' },
							{ method: 'remove', name: 'leave-anime-ended' },
							{ method: 'remove', name: 'press-anime-begun' },
							{ method: 'remove', name: 'press-anime-ended' },
							{ method: 'remove', name: 'pressed' },
							{ method: 'remove', name: 'release-anime-begun' },
							{ method: 'remove', name: 'release-anime-ended' },
							{ method: 'remove', name: 'release-anime-begun' },
							{ method: 'remove', name: 'released' },
							{ method: 'remove', name: 'exiting' }
						]
			};
		
	}
	
	static attributeChangedCallback(mrs) {
		
		const { length } = mrs;
		let i;
		
		i = -1;
		while (++i < length) {
			
			switch (mrs[i].attributeName) {
				
				case 'id':
				
				const { constrained } = this;
				
				constrained instanceof Element && (constrained.dataset.constrainedHint = this.element.id);
				
				break;
				
			}
			
		}
		
	}
	
	static changedAnimationState(event) {
		
		Object.getPrototypeOf(this.constructor).changedAnimationState.call(this, event, this.constrained);
		
	}
	
	// このイベントハンドラーは、既に場に現われたヒントが、いったんそれに紐付けられた要素からカーソルが外れ、
	// 退出処理（アニメ）が開始され始めた時に、再度紐付けられた要素にカーソルが合わせられた時にのみ起動することを想定している。
	// 現状は問題ないが、例えば mouseenter 以外の方法でヒントを表示した場合に対応できないなど、汎用的な仕様ではないことが想像される。
	static enteredConstrained(event) {
		hi();
		this.resetAnime();
		
	}
	
	static leftConstrained(event) {
		
		this.enterAnimeBegun ? (this.exiting = true) : this.purge(undefined, true);
		
	}
	
	constructor() {
		
		super();
		
		const	{
					attributeChangedCallback,
					began,
					condition,
					enteredConstrained,
					leftConstrained,
					observedAttributeInit
				} = ShadowHintElement;
		
		this.enteredConstrained = enteredConstrained.bind(this),
		this.leftConstrained = leftConstrained.bind(this),
		
		(new MutationObserver(this.attributeChangedCallback = attributeChangedCallback.bind(this))).
			observe(this.element, observedAttributeInit);
		
	}
	
	constrain(constrained) {
		
		const	{ $constrained } = ShadowHintElement,
				handler = this instanceof ShadowHintElement ? this : this.handler,
				{ enteredConstrained, leftConstrained } = handler,
				lastConstrained = handler[$constrained];
		
		constrained = handler[$constrained] =
			constrained instanceof Element ? constrained :
				constrained instanceof ShadowElement ? constrained.element :
					constrained === undefined ? lastConstrained : null,
		
		lastConstrained instanceof Element && (!constrained || constrained !== lastConstrained) && 
			(
				delete lastConstrained.dataset.constrainedHint,
				lastConstrained.removeEventListener('mouseenter', enteredConstrained),
				lastConstrained.removeEventListener('mouseleave', leftConstrained)
			);
		
		if (constrained) {
			
			const { element } = handler, { dataset } = constrained;
			
			(element.id ||= crypto.randomUUID()) === dataset.constrainedHint || (dataset.constrainedHint = element.id),
			element.dataset.alt = dataset.hintAlt,
			ShadowElement.setBoundToCSSVar(element, constrained),
			
			handler.addLifetimeEvent('mouseenter', enteredConstrained, undefined, constrained),
			handler.addLifetimeEvent('mouseleave', leftConstrained, undefined, constrained);
			
		}
		
	}
	
	get constrained() {
		
		return this[ShadowHintElement.$constrained];
		
	}
	set constrained(v) {
		
		this.constrain(v);
		
	}
	get exiting() {
		
		return this.element.hasAttribute('exiting');
		
	}
	set exiting(v) {
		
		this.constrain(),
		
		this.element.toggleAttribute('exiting', !!v);
		
	}
	
}
//class ShadowHintElement extends ShadowInteractiveElement {
//	
//	static {
//		
//		this.$constrained = Symbol('ShadowHintElement.constrained');
//		
//		this.condition = { state: 'end', name: 'hint-exit', purges: true },
//		this.resetAnimeTriggerBefore =
//			{ attr: [ { method: 'remove', name: 'exiting' }, { method: 'remove', name: 'spawned' } ] },
//		this.tag = 'hint',
//		
//		this.observedAttributeInit = { attributes: true, attributeFilter: [ 'exit-name', 'id' ] };
//		
//	}
//	
//	static attributeChangedCallback(mrs) {
//		
//		const { length } = mrs;
//		let i;
//		
//		i = -1;
//		while (++i < length) {
//			
//			switch (mrs[i].attributeName) {
//				
//				case 'exit-name':
//				this.conditions = [ { ...ShadowHintElement.condition, name: this.exitName } ];
//				break;
//				
//				case 'id':
//				
//				const { constrained } = this;
//				
//				constrained instanceof Element && (constrained.dataset.constrainedHint = this.element.id);
//				
//				break;
//				
//			}
//			
//		}
//		
//	}
//	
//	static began(event) {
//		
//		const { animationName } = event, { exitName, spawnName } = this;
//		
//		((animationName === spawnName && (this.spawned = true)) || animationName === exitName) &&
//			this.constrain();
//		
//	}
//	
//	static enteredConstrained(event) {
//		
//		this.resetAnime();
//		
//	}
//	
//	static leftConstrained(event) {
//		
//		this.enterAnimeBegun ? (this.exiting = true) : this.purge(undefined, true);
//		
//	}
//	
//	constructor() {
//		
//		super();
//		
//		const	{
//					attributeChangedCallback,
//					began,
//					condition,
//					enteredConstrained,
//					leftConstrained,
//					observedAttributeInit
//				} = ShadowHintElement;
//		
//		this.enteredConstrained = enteredConstrained.bind(this),
//		this.leftConstrained = leftConstrained.bind(this),
//		
//		(new MutationObserver(this.attributeChangedCallback = attributeChangedCallback.bind(this))).
//			observe(this.element, observedAttributeInit),
//		
//		this.conditions = [ { ...condition } ],
//		
//		this.addLifetimeEvent('animationstart', this.began = ShadowHintElement.began.bind(this));
//		
//	}
//	
//	constrain(constrained) {
//		
//		const	{ $constrained } = ShadowHintElement,
//				handler = this instanceof ShadowHintElement ? this : this.handler,
//				{ enteredConstrained, leftConstrained } = handler,
//				lastConstrained = handler[$constrained];
//		
//		lastConstrained instanceof Element &&
//			(
//				delete lastConstrained.dataset.constrainedHint,
//				lastConstrained.removeEventListener('mouseenter', enteredConstrained),
//				lastConstrained.removeEventListener('mouseleave', leftConstrained)
//			);
//		
//		if (
//				constrained = handler[$constrained] =	constrained instanceof Element ? constrained :
//															constrained instanceof ShadowElement ? constrained.element :
//																constrained === undefined ? lastConstrained : null
//		) {
//			
//			const { element } = this, { dataset } = constrained;
//			
//			(element.id ||= crypto.randomUUID()) === dataset.constrainedHint || (dataset.constrainedHint = element.id),
//			element.dataset.alt = dataset.hintAlt,
//			ShadowElement.setBoundToCSSVar(element, constrained),
//			
//			this.addLifetimeEvent('mouseenter', enteredConstrained, undefined, constrained),
//			this.addLifetimeEvent('mouseenter', leftConstrained, undefined, constrained);
//			
//		}
//		
//	}
//	
//	get constrained() {
//		
//		return this[ShadowHintElement.$constrained];
//		
//	}
//	set constrained(v) {
//		
//		this.constrain(v);
//		
//	}
//	get exiting() {
//		
//		return this.element.hasAttribute('exiting');
//		
//	}
//	set exiting(v) {
//		
//		this.constrain(),
//		
//		this.element.toggleAttribute('exiting', !!v);
//		
//	}
//	get exitName() {
//		
//		return this.element.getAttribute('exit-name');
//		
//	}
//	set exitName(v) {
//		
//		this.element.setAttribute('exit-name', v);
//		
//	}
//	get spawned() {
//		
//		return this.element.hasAttribute('spawned');
//		
//	}
//	set spawned(v) {
//		
//		this.element.toggleAttribute('spawned', !!v);
//		
//	}
//	get spawnName() {
//		
//		return this.element.getAttribute('spawn-name');
//		
//	}
//	set spawnName(v) {
//		
//		this.element.setAttribute('spawn-name', v);
//		
//	}
//	
//}
ShadowHintElement.define();