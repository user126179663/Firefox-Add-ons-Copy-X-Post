class ShadowElement {
	
	static {
		
		this.$ac = Symbol('ShadowElement.ac'),
		this.$observedAttributes = Symbol('ShadowElement.observedAttributes'),
		
		this.parser = new DOMParser(),
		
		this.defined = {},
		
		this.tag = 'wrapper',
		
		this.shadowRootOption = { mode: 'open' };
		
	}
	
	static async define() {
		
		const { defined, parser, tag, templateURL } = this;
		
		defined[tag] =
			templateURL ?	fetch(browser.runtime.getURL(templateURL)).then(response => response.text()).
								then	(
											text =>	(
														this.template =	parser.parseFromString(text, 'text/html').
																			querySelector('template'),
														this
													)
										) :
								Promise.resolve(this);
		
	}
	
	static create(tag, element) {
		
		return this.defined[tag]?.then?.
			(object => ShadowElement.isPrototypeOf(object) && new Proxy((object = new object(element)).element, object));
		
	}
	
	static isPrototypeProperty(proto, key) {
		
		const { hasOwn } = Object;
		
		while ((proto = Object.getPrototypeOf(proto)) && !hasOwn(proto, key));
		
		return !!proto;
		
	}
	
	static composedSelect(rootNode, all, ...selectors) {
		
		const { length } = selectors, l = length - 1;
		let i, selector, selected;
		
		i = -1, rootNode ||= document;
		while	(
					++i < length &&
					typeof (selector = selectors[i]) === 'string' &&
					(selected = rootNode['querySelector' + (all && i === l ? 'All' : '')](selector)) &&
					((all && i === l) || (rootNode = selected?.shadowRoot))
				);
		
		return i >= length - 1 ? selected ?? null : (all ? [] : null);
		
	}
	
	static setBoundToCSSVar(...sources) {
		
		const { hasOwn } = Object, { isArray } = Array, [ target ] = sources, { style } = target;
		let i,l, k,v, src, bound, pseudoElt;
		
		i = -1, l = sources.length;
		while (++i < l) {
			
			typeof (src = sources[i]) === 'string' && (src = [ src ]),
			isArray(src) && (src = { element: src }),
			bound = {},
			pseudoElt = '';
			
			if (!(src instanceof Element)) {
				
				if (src && typeof src === 'object') {
					
					if (isArray(src.element)) {
						
						let rootNode, element;
						
						typeof (element = src.element)[0] === 'string' ||
							(rootNode = element[0], element = element.slice(1));
						
						const	elements =	ShadowElement.composedSelect
												(rootNode ? target.getRootNode() : rootNode, true, ...element),
								//elements = [ ...(root || target.getRootNode())?.querySelectorAll?.(src.element) ],
								{ length } = elements,
								values = [];
						let i;
						
						i = -1;
						while (++i < length) values[i] = { ...src, element: (element = elements[i]) };
						
						sources.splice(i, 1, ...values),
						l += values.length - 1,
						src = sources[i];
						
					}
					
					if (hasOwn(src, 'pseudoElt') && typeof (pseudoElt = src.pseudoElt) === 'string') {
						
						hasOwn(src, 'element') || (src.element = target);
						
						if (src.element instanceof Element) {
							
							const computed = getComputedStyle(src.element ?? target, pseudoElt);
							
							if (computed instanceof CSSStyleDeclaration) {
								
								const { left, top, width, height, right, bottom } = computed;
								
								bound.x = left,
								bound.y = top,
								bound.width = width,
								bound.height = height,
								bound.top = top,
								bound.right = right,
								bound.bottom = bottom,
								bound.left = left,
								
								pseudoElt = '-' + pseudoElt.replaceAll(':', '') + '-';
								
							} else continue;
							
						} else continue;
						
					} else if (!((src = src.element) instanceof Element)) continue;
					
				} else continue;
				
			}
			
			if (src instanceof Element) {
				
				const rect = src.getBoundingClientRect();
				
				for (k in rect) typeof (v = rect[k]) === 'number' && (bound[k] = v + 'px');
				
			}
			
			const	prefixId = src.id && ('--bound-' + src.id + '-' + pseudoElt),
					prefixIndex = '--bound-' + i + '-' + pseudoElt;
			
			for (k in bound)	v = bound[k],
								src === target && style.setProperty('--bound-' + k, v),
								prefixId && style.setProperty(prefixId + k, v),
								style.setProperty(prefixIndex + k, v);
			
		}
		
		style.setProperty('--scroll-x', scrollX + 'px'),
		style.setProperty('--scroll-y', scrollY + 'px');
		
	}
	
	static whenDefinedAll() {
		
		return Promise.all(Object.values(this.defined));
		
	}
	
	constructor(element = 'div') {
		
		const { constructor: { tag, template } } = this;
		
		if ((typeof element === 'string' ? (element = document.createElement(element)) : element) instanceof Node) {
			
			if (template instanceof HTMLTemplateElement) {
				
				const { runtime } = browser, cloned = template.content.cloneNode(true);
				
				for (const resource of cloned.querySelectorAll('[data-resource-href]'))
					resource.rel = 'stylesheet',
					resource.href = runtime.getURL(resource.dataset.resourceHref);
				
				(this.shadowRoot = element.attachShadow(ShadowElement.shadowRootOption)).appendChild(cloned);
				
			}
			
			(this.element = element).handler = this,
			element.setAttribute('shadow', tag);
			
		}
		
	}
	
	abortLifetimeEvent() {
		
		this.ac.abort();
		
	}
	
	addLifetimeEvent(type, handler, option, target = this.element) {
		
		typeof option === 'boolean' && (option = { useCapture: option }),
		(option && typeof option === 'object') || (option = {}),
		
		option.signal = this.ac.signal,
		
		target.addEventListener(type, handler, option);
		
	}
	
	get(target, prop, receiver) {
		
		const	isThis = typeof prop === 'symbol' ? ShadowElement.isPrototypeProperty(this, prop) : prop in this,
				v = Reflect.get(isThis ? this : target, prop, isThis ? receiver : target);
		
		return	typeof v === 'function' && !isThis ?
					function () { return v.apply(this === receiver ? target : this, arguments); } : v;
		
	}
	
	purge(preserves, removeOnce) {
		
		const { element } = this, { shadowRoot } = element;
		
		removeOnce ||= preserves,
		
		this.abortLifetimeEvent();
		
		for (const child of element.querySelectorAll('[shadow]')) child?.handler?.purge?.(removeOnce);
		
		if (shadowRoot instanceof ShadowRoot) {
			
			for (const element of shadowRoot.querySelectorAll('[shadow]')) element?.handler?.purge?.(removeOnce);
			
		}
		
		preserves || element.remove();
		
	}
	
	set(target, prop, value, receiver) {
		
		const isThis = typeof prop === 'symbol' ? !ShadowElement.isPrototypeProperty(target, prop) : prop in this;
		
		return Reflect.set(isThis ? this : target, prop, value, isThis ? receiver : target);
		
	}
	
	get ac() {
		
		const { $ac } = ShadowElement, ac = this[$ac] ??= new AbortController();
		
		return ac.signal.aborted ? (this[$ac] = new AbortController()) : ac;
		
	}
	
}

class ShadowAnimationConditionsElement extends ShadowElement {
	
	static {
		
		this.SUFFIX_COMPOSED_EVENT_TYPE = '-composed',
		this.tag = 'anime-conditions',
		this.state =	{
							animationcancel: 'cancel',
							animationend: 'end',
							animationiteration: 'iteration',
							animationstart: 'begin',
							transitioncancel: 't-cancel',
							transitionend: 't-end',
							transitionrun: 't-run',
							transitionstart: 't-start'
						},
		
		this[this.$observedAttributes] = [ 'begin', 'end' ];
		
	}
	
	//static get observedAttributes() {
	//	
	//	return this[ShadowElement.$observedAttributes];
	//	
	//}
	
	static animated(event) {
		
		const	{ isArray } = Array,
				{ SUFFIX_COMPOSED_EVENT_TYPE } = ShadowAnimationConditionsElement,
				{ length: SUFFIX_LENGTH } = SUFFIX_COMPOSED_EVENT_TYPE;
		let { type } = event, detail, originalEvent, stateValue;
		
		if (type.lastIndexOf(SUFFIX_COMPOSED_EVENT_TYPE) === type.length - SUFFIX_LENGTH) {
			
			type = type.slice(0, -SUFFIX_LENGTH),
			originalEvent = (detail = event.detail).event;
			
		} else {
			
			detail = { event: (originalEvent = event) };
			
		}
		
		const	{ animationName, elapsedTime, propertyName, pseudoElement, target } = originalEvent,
				{ path = detail.path = [] } = detail,
				{ gather, handleClassList, handleDataset, handleProperties, setBoundToCSSVar, state } =
					ShadowAnimationConditionsElement,
				{ conditions, element } = this,
				gathered =	gather	(
										gather(conditions, 'state', stateValue = state[type]),
										'name',
										stateValue.indexOf('t-') === -1 ? animationName : propertyName
									),
				propDescriptors = [],
				classListDescriptors = [],
				dsDescriptors = [],
				boundings = [];
		let i,l, v, matches, purges;
		
		i = -1, l = gathered.length;
		while (++i < l)	(matches = (v = gathered[i]).matches) && !target.matches(matches) ?
							(gathered.splice(i--, 1), --l) :
							(
								v.prop && propDescriptors.push(...v.prop),
								v.class && classListDescriptors.push(...v.class),
								v.dataset && dsDescriptors.push(...v.dataset),
								v.measures &&
									(boundings[0] = element, isArray(v.measures) && boundings.push(...v.measures)),
								purges = v.purges
							);
		//coco boundings
		
		propDescriptors.length && handleProperties(element, propDescriptors),
		classListDescriptors.length && handleClassList(element, classListDescriptors),
		dsDescriptors.length && handleDataset(element, dsDescriptors),
		boundings.length && setBoundToCSSVar(...boundings),
		
		path[path.length] = this.element,
		
		purges && this.purge(),
		
		// 以下の dispatchEvent で detail を指定すると、Restricted と表示される。
		// 恐らく composed されて別のドキュメントに移動すると、移動前のドキュメント内で作られたオブジェクトはそのままでは参照できなくなる。
		element.parentElement?.dispatchEvent?.
			(new AnimationEvent(type, { animationName, elapsedTime, composed: true, pseudoElement }));
		
	}
	
	static gather(descriptors, keys, values) {
		
		const { isArray } = Array;
		
		isArray(descriptors) || (descriptors = [ descriptors ]),
		isArray(keys) || (keys = [ keys ]),
		isArray(values) || (values = [ values ]);
		
		const { length } = descriptors, gathered = [];
		let i,i0, k,k0, descriptor;
		
		i = i0 = -1;
		while (++i < length) {
			
			if ((descriptor = descriptors[i]) && typeof descriptor === 'object') {
				
				for (k in descriptor) if (keys.includes(k) && values.includes(descriptor[k]) && (k0 = k)) break;
				
				k0 && (k0 = void (gathered[++i0] = descriptor));
				
			}
			
		}
		
		return gathered;
		
	}
	
	static handleProperties(target, descriptors) {
		
		const { isArray } = Array, { length } = descriptors;
		let i, descriptor, v;
		
		i = -1;
		while (++i < length)
			(descriptor = descriptors[i]).assigns ?
				(target[descriptor.name] = descriptor.value) :
				target[descriptor.name]?.(...(isArray(v = descriptor.args ?? descriptor.value) ? v : [ v ]));
		
	}
	static handleClassList(target, descriptors) {
		
		const { isArray } = Array, { classList } = target, { length } = descriptors;
		let i, descriptor, v;
		
		i = -1;
		while (++i < length)
			classList[(descriptor = descriptors[i]).method]?.(...(isArray(v = descriptor.value) ? v : [ v ]));
		
	}
	static handleDataset(target, descriptors) {
		
		const { dataset } = target, { length } = descriptors;
		let i, descriptor;
		
		i = -1;
		while (++i < length)	'value' in (descriptor = descriptors[i]) ?
									(dataset[descriptor.name] = descriptor.value) : delete dataset[descriptor.name];
		
	}
	
	static equarlsAll(a, ...bs) {
		
		const { equarls } = ShadowAnimationConditionsElement, { length } = bs;
		let i;
		
		i = -1;
		while (++i < length && equarls(a, bs[i]));
		
		return i === length;
		
	}
	// 第一引数 a と等しい値が、第二引数以降に指定した引数の中に存在した場合、その位置を数値にして返す。
	// 存在しない場合 -1 を返す。仮に一致を示す値が複数存在した場合、一番最初に一致した値の位置を返す。
	static indexOf(a, ...bs) {
		
		const { equarls } = ShadowAnimationConditionsElement, { length } = bs;
		let i;
		
		i = -1;
		while (++i < length && !equarls(a, bs[i]));
		
		return i === length ? -1 : i;
		
	}
	// 引数 a, b が等しければ true、そうでなければ false を返す。
	// オブジェクトを指定した場合、参照ではなくそのプロパティの値を比較する。
	// オブジェクトがネストしている場合、比較は再帰して行なわれる。
	// オブジェクトは Object, Array のみ対応し、それ以外のオブジェクトは参照比較のみ行なわれる。
	// 循環参照の確認は非対応で、等価を示す循環参照するオブジェクトを指定すると無限ループを起こす。
	static equarls(a, b) {
		
		const type = typeof a;
		
		if (type === typeof b) {
			
			if (a && type === 'object') {
				
				const { getPrototypeOf, prototype } = Object, { isArray } = Array;
				
				if (getPrototypeOf(a) === prototype) {
					
					if (getPrototypeOf(b) === prototype) {
						
						const { hasOwn, keys } = Object, ks = keys(a);
						
						if (ks.length === keys(b).length) {
							
							const { equarls } = ShadowAnimationConditionsElement;
							let k;
							
							for (k in b) if (ks.indexOf(k) === -1 || !hasOwn(a, k) || !equarls(a[k], b[k])) return false;
							
						} else return false;
						
					} else return false;
					
				} else if (isArray(a)) {
					
					if (isArray(b)) {
						
						const { length } = a;
						
						if (length === b.length) {
							
							const { equarls } = ShadowAnimationConditionsElement;
							let i;
							
							i = -1;
							while (++i < length && equarls(a[i], b[i]));
							if (i !== length) return false;
							
						} else return false;
						
					} else return false;
					
				} else return a === b;
				
			} else return Object.is(a, b);
			
		} else return false;
		
		return true;
		
	};
	
	constructor() {
		
		super(...arguments);
		
		const	{ SUFFIX_COMPOSED_EVENT_TYPE, animated, state } = ShadowAnimationConditionsElement,
				boundAnimated = this.animated = animated.bind(this);
		
		for (const k in state)	this.addLifetimeEvent(k, boundAnimated),
								this.addLifetimeEvent(k + SUFFIX_COMPOSED_EVENT_TYPE, boundAnimated);
		
	}
	//attributeChangedCallback(name, last, current) {
	//	
	//	switch (name) {
	//		case 'begin':
	//		case 'end':
	//		
	//	}
	//	
	//}
	addAnimationConditions() {
		
		const { conditions = [] } = this, { length } = arguments;
		let i;
		
		i = -1;
		while (++i < length) conditions[i] = arguments[i];
		
		this.conditions = conditions;
		
	}
	gatherAnimationConditions() {
		
		return ShadowAnimationConditionsElement.gather(this.conditioins, ...arguments);
		
	}
	// this.conditions が示す Array の中から、引数に指定した任意の数の記述子と値が完全一致する記述子を取り除く。
	// 値の一致の確認は再帰して行なわれる。
	removeAnimeCondition() {
		
		const { indexOf } = ShadowAnimationConditionsElement, { conditions } = this;
		let i, index, conditionsLength;
		
		i = -1, conditionsLength = conditions.length;
		while (++i < conditionsLength)
			(index = indexOf(conditions[i], ...arguments)) === -1 || (conditions.splice(i--, 1), --conditionsLength);
		
		this.conditions = conditioins;
		
	}
	
	get conditions() {
		
		return JSON.parse(this.element.getAttribute('conditions'));
		
	}
	set conditions(v) {
		
		this.element.setAttribute('conditions', JSON.stringify(v));
		
	}
	
}
ShadowAnimationConditionsElement.define();