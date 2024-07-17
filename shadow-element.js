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
	
	static isPlainObject(target) {
		
		if (target && typeof target === 'object') {
			
			const { getPrototypeOf, prototype } = Object, targetPrototype = getPrototypeOf(target);
			
			return targetPrototype === prototype || !targetPrototype;
			
		}
		
		return false;
		
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
	
	// 第一引数 mrs に指定された MurationRecords プロパティ addedNodes, removedNodes を対象に、
	// 第二引数 selector に一致する要素ないしその子孫か先祖を Array に列挙して戻り値にする。
	// 未指定の場合、addedNodes, removedNodes に列挙された要素をそのまま返す。
	static getElementsFromMRs(mrs, selector) {
		
		const	{ ELEMENT_NODE } = Node,
				{ length } = mrs,
				added = [],
				removed = [],
				elements = { added, removed };
		let i,i0,l0,i1,l1,i2,l2,i3,ai,ri, targetName, targets,target, selected, selectedNode, nodes;
		
		i = ai = ri = -1, selector = selector && typeof selector === 'string' ? selector : null;
		while (++i < length) {
			
			nodes = undefined;
			while (nodes !== removed) {
				
				nodes ?	(targets = mrs[i].removedNodes, i3 = ri, nodes = removed) :
						(targets = mrs[i].addedNodes, i3 = ai, nodes = added),
				i0 = -1, l0 = targets?.length;
				while (++i0 < l0) {
					
					if ((target = targets[i0]).nodeType === ELEMENT_NODE) {
						
						if (selector) {
							
							target.matches(selector) && (nodes[++i3] = target),
							(selected = target.closest(selector)) && (nodes[++i3] = selected);
							
							if (l1 = (selected = target.querySelectorAll(selector)).length) {
								
								i1 = -1, l2 = i3 + 1;
								while (++i1 < l1) {
									i2 = -1, selectedNode = selected[i1];
									while (++i2 < l2 && nodes[i2] !== selectedNode);
									i2 === l2 && (nodes[i3 = l2++] = selectedNode);
									
								}
								
							}
							
						} else {
							
							i1 = -1, l1 = i3 + 1;
							while (i1 < l1 && nodes[i1] !== target);
							i1 === l1 && (nodes[i3 = l1] = target);
							
						}
						
					}
					
				}
				
				nodes === added ? (ai = i3) : (ri = i3);
				
			}
			
		}
		
		return elements;
		
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
				{ gather, handleData, measures, setBoundToCSSVar, state } = ShadowAnimationConditionsElement,
				{ conditions, element } = this,
				gathered =	gather	(
										gather(conditions, 'state', stateValue = state[type]),
										'name',
										stateValue.indexOf('t-') === -1 ? animationName : propertyName
									),
				boundings = [];
		let i,l, v, matches, purges;
		
		i = -1, l = gathered.length;
		while (++i < l)	(matches = (v = gathered[i]).matches) && !target.matches(matches) ?
							(gathered.splice(i--, 1), --l) :
							(
								handleData(element, v),
								v.measures &&
									(boundings[0] = element, isArray(v.measures) && boundings.push(...v.measures)),
								typeof v.purges === 'boolean' && (purges = v.purges)
							);
		
		boundings.length && setBoundToCSSVar(...boundings),
		
		path[path.length] = this.element,
		
		purges && this.purge(),
		
		// 以下の dispatchEvent で detail を指定すると、Restricted と表示される。
		// 恐らく composed されて別のドキュメントに移動すると、移動前のドキュメント内で作られたオブジェクトはそのままでは参照できなくなる。
		element.parentElement?.dispatchEvent?.
			(new AnimationEvent(type, { animationName, elapsedTime, composed: true, pseudoElement }));
		
	}
	
	// 第一引数 keyValues に指定された値を一定の規則に基づいて展開する。
	// keyValues の値がプリミティブな値だった場合、それは単に Array にラップされて返される。
	// 値が Object だった場合、そのプロパティの値に Array を指定して任意の数の値を列挙すると、
	// 展開後に、その値をそれぞれそのプロパティの値として示す Object が、その Array が示す length の数だけ複製される。
	// 	flatten({a:[0,1,2]}); // [{a:0},{a:1},{a:2}]
	// 別のプロパティも同じように指定されている場合、それらのすべての組み合わせで複製された Object で列挙された Array を返す。
	// 	flatten({a:[0,1,2],b:['hi','ho']});
	// 		// [{a:0,b:'hi'},{a:1,b:'hi'},{a:2,b:'hi'},{a:0,b:'ho'},{a:1,b:'ho'},{a:2,b:'ho'}]
	// プロパティの値が Array だった場合、そのままだとその要素がそのまま展開されてしまうので、あらかじめ Array でラップする必要がある。
	// 	flatten({a:[0,1,2]});	// [{a:0},{a:1},{a:2}]
	// 	flatten({a:[[0,1,2]]});	// [{a:[0,1,2]}]
	// オブジェクトはネストすることもできる。
	// 	flatten({a:{a:[0,1,2]}});	// [{a:{a:0}},{a:{a:1}},{a:{a:2}}]
	// 引数に Array を指定することもでき、その場合は各要素をプロパティとして取り扱い、Object のプロパティに指定された Array と同様の展開が行なわれる。
	// 	flatten([0,1,2]);	// [[0,1,2]]
	// 	flatten([[0,1,2]]);	// [[[0],[1],[2]]]
	// 	// これは一見直感的な結果ではないかもしれないが、以下のように Object に置き換えて考えることができる。
	// 	// [0,1,2] = {'0':0,'1',:1,'2':2} であるとすれば、
	// 	// flatten({'0':0,'1',:1,'2':2}) の結果は [{'0':0,'1',:1,'2':2}] になり、つまり [[0,1,2]] になる。
	// 	// 一方 [[0,1,2]] は、{'0':[0,1,2]} と考えられるため、結果は [{'0':0},{'0':1},{'0':2}] なので、[[0],[1],[2]] になる。
	static flatten(keyValues) {
		
		if (keyValues && typeof keyValues === 'object') {
			
			const	{ assign, getOwnPropertySymbols, keys } = Object,
					{ isArray } = Array,
					{ flatten } = ShadowAnimationConditionsElement,
					asArray = isArray(keyValues),
					ks = [ ...getOwnPropertySymbols(keyValues), ...keys(keyValues) ],
					{ length } = ks,
					results = [],
					tmp = [];
			let i,i0,l0,i1,l1,i2,l2,l3,l4,l5, k,v,v0;
			
			i = -1;
			while (++i < length) {
				
				i0 = -1, l0 = (isArray(v = keyValues[k = ks[i]]) ? v : (v = [ v ])).length,
				l4 = 0, l1 = results.length || 1;
				while (++i0 < l0) {
					
					i1 = -1, l2 = (v0 = flatten(v[i0])).length, l3 = 0;
					while (++i1 < l1) {
						
						i2 = -1, tmp.length = 0;
						while (++i2 < l2) (tmp[i2] = assign(asArray ? [] : {}, results[i1 + l3]))[k] = v0[i2];
						
						results.splice(i1 + l4, 1, ...tmp),
						i1 += (l5 = tmp.length - 1),
						l1 += l5;
						
					}
					
					l4 += i1--;
					
				}
				
			}
			
			return results;
			
		} else return [ keyValues ];
		
	}
	
	static gather(descriptors, keys, values) {
		
		const { isArray } = Array;
		
		isArray(descriptors) || (descriptors = descriptors === undefined ? [] : [ descriptors ]),
		keys !== undefined && !isArray(keys) && (keys = [ keys ]),
		values != undefined && !isArray(values) && (values = [ values ]);
		
		const { length } = descriptors, gathered = [];
		let i,i0, k,k0, descriptor;
		
		i = i0 = -1;
		while (++i < length) {
			
			if ((descriptor = descriptors[i]) && typeof descriptor === 'object') {
				
				for (k in descriptor) {
					
					if ((!keys || keys.includes(k)) && (!values || values.includes(descriptor[k])) && (k0 = k)) {
						
						gathered[++i0] = descriptor;
						
						break;
						
					}
					
				}
				
			}
			
		}
		
		return gathered;
		
	}
	
	static gatherWith(descriptors, requirementKVs) {
		
		(requirementKVs && typeof requirementKVs === 'object') || (requirementKVs = { [requirementKVs]: undefined });
		
		const	{ flatten, requireAny } = ShadowAnimationConditionsElement,
				{ length } = Array.isArray(descriptors) ? descriptors : (descriptors = [ descriptors ]),
				flattened = flatten(requirementKVs),
				gathered = [];
		let i,i0, v, descriptor;
		
		i = i0 = -1;
		while (++i < length) requireAny(v = descriptors[i], ...flattened) && (gathered[++i0] = v);
		
		return gathered;
		
	}
	
	static require(source, requirement) {
		
		if (requirement && typeof requirement === 'object') {
			
			if (source && typeof source === 'object') {
				
				const	{ require } = ShadowInteractiveElement,
						{ getOwnPropertySymbols, keys } = Object,
						ks = [ ...getOwnPropertySymbols(requirement), ...keys(requirement) ],
						{ length } = keys;
				let i, k;
				
				i = -1;
				while (++i < length) {
					if (!(k = ks[i]) in source || !require(source[k], requirement[k])) return false;
				}
				
				return true;
				
			}
			
			return false;
			
		}
		
		return Object.is(requirement, source);
		
	}
	
	static requireAll(source, ...requirements) {
		
		const { require } = ShadowAnimationConditionsElement, { length } = requirements;
		let i;
		
		i = -1;
		while (++i < length && require(source, requirements[i]));
		
		return i === length;
		
	}
	static requireAny(source, ...requirements) {
		
		const { require } = ShadowAnimationConditionsElement, { length } = requirements;
		let i;
		
		i = -1;
		while (++i < length && !require(source, requirements[i]));
		
		return i !== length;
		
	}
	
	//static gather(descriptors, keys, values) {
	//	
	//	const { isArray } = Array;
	//	
	//	isArray(descriptors) || (descriptors = [ descriptors ]),
	//	isArray(keys) || (keys = [ keys ]),
	//	isArray(values) || (values = [ values ]);
	//	
	//	const { length } = descriptors, gathered = [];
	//	let i,i0, k,k0, descriptor;
	//	
	//	i = i0 = -1;
	//	while (++i < length) {
	//		
	//		if ((descriptor = descriptors[i]) && typeof descriptor === 'object') {
	//			
	//			for (k in descriptor) if (keys.includes(k) && values.includes(descriptor[k]) && (k0 = k)) break;
	//			
	//			k0 && (k0 = void (gathered[++i0] = descriptor));
	//			
	//		}
	//		
	//	}
	//	
	//	return gathered;
	//	
	//}
	
	static handleData(target, data) {
		
		if (target instanceof Element && data && typeof data === 'object') {
			
			const	{ handleAttributes, handleClassList, handleDataset, handleProperties } =
						ShadowAnimationConditionsElement;
			let k,v;
			
			for (k in data) {
				
				v = data[k];
				
				switch (k) {
					
					case 'attr':
					handleAttributes(target, v);
					break;
					
					case 'class':
					handleClassList(target, v);
					break;
					
					case 'data':
					handleDataset(target, v);
					break;
					
					case 'prop':
					handleProperties(target, v);
					break;
					
				}
				
			}
			
		}
		
	}
	static handleAttributes(target, descriptors) {
		
		if	(
				Array.isArray(descriptors) ||
					(descriptors && typeof descriptors === 'object' && (descriptors = [ descriptors ]))
			) {
			
			const { length } = descriptors;
			let i, descriptor;
			
			i = -1;
			while (++i < length)
				target[(descriptor = descriptors[i]).method + 'Attribute']?.(descriptor.name, descriptor.value);
			
		}
		
	}
	static handleClassList(target, descriptors) {
		
		const { isArray } = Array;
		
		if	(
				isArray(descriptors) ||
					(descriptors && typeof descriptors === 'object' && (descriptors = [ descriptors ]))
			) {
			
			const { classList } = target, { length } = descriptors;
			let i, descriptor, v;
			
			i = -1;
			while (++i < length)
				classList[(descriptor = descriptors[i]).method]?.(...(isArray(v = descriptor.value) ? v : [ v ]));
			
		}
		
	}
	static handleDataset(target, descriptors) {
		
		if	(
				Array.isArray(descriptors) ||
					(descriptors && descriptors && typeof descriptors === 'object' && (descriptors = [ descriptors ]))
			) {
			
			const { dataset } = target, { length } = descriptors;
			let i, descriptor;
			
			i = -1;
			while (++i < length)	'value' in (descriptor = descriptors[i]) ?
										(dataset[descriptor.name] = descriptor.value) : delete dataset[descriptor.name];
			
		}
		
	}
	static handleProperties(target, descriptors) {
		
		const { isArray } = Array;
		
		if	(
				isArray(descriptors) ||
					(descriptors && typeof descriptors === 'object' && (descriptors = [ descriptors ]))
			) {
			
			const { length } = descriptors;
			let i, descriptor, v;
			
			i = -1;
			while (++i < length)
				(descriptor = descriptors[i]).assigns ?
					(target[descriptor.name] = descriptor.value) :
					target[descriptor.name]?.(...(isArray(v = descriptor.args ?? descriptor.value) ? v : [ v ]));
			
		}
		
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
	
	resetAnime	(
					before = this.resetAnimeTriggerBefore ?? this.constructor.resetAnimeTriggerBefore,
					after = this.resetAnimeTriggerAfter ?? this.constructor.resetAnimeTriggerAfter
				)
	{
		
		//delete this.dataset.cxpHintExiting,
		//delete this.dataset.cxpHintSpawned,
		
		const { handleData } = ShadowAnimationConditionsElement, { element } = this;
		//hi(this.element,before,after);
		before && handleData(element, before),
		//hi(this.element,before,after);
		void element.offsetWidth,
		
		after && handleData(element, after);
		
	}
	
	get conditions() {
		
		return JSON.parse(this.element.getAttribute('conditions'));
		
	}
	set conditions(v) {
		
		this.element.setAttribute('conditions', JSON.stringify(v));
		
	}
	
}
ShadowAnimationConditionsElement.define();

class ShadowInteractiveElement extends ShadowAnimationConditionsElement {
	
	static {
		
		this.tag = 'interactive',
		
		this.requirementsForPurgeAfter = null,
		this.requirementsForSBCVA = null,
		
		this.state = {
			
			anime: [
				{
					eventType: 'animationstart',
					name: 'enterAnimeBegun',
					value: 'enter-anime-begun',
					valueName: 'enterAnime'
				},
				{
					eventType: 'animationstart',
					name: 'leaveAnimeBegun',
					value: 'leave-anime-begun',
					valueName: 'leaveAnime'
				},
				{
					eventType: 'animationstart',
					name: 'pressAnimeBegun',
					value: 'press-anime-begun',
					valueName: 'pressAnime'
				},
				{
					eventType: 'animationstart',
					name: 'releaseAnimeBegun',
					value: 'release-anime-begun',
					valueName: 'releaseAnime'
				},
				{
					eventType: 'animationend',
					name: 'enterAnimeEnded',
					value: 'enter-anime-ended',
					valueName: 'enterAnime'
				},
				{
					eventType: 'animationend',
					name: 'leaveAnimeEnded',
					value: 'leave-anime-ended',
					valueName: 'leaveAnime'
				},
				{
					eventType: 'animationend',
					name: 'pressAnimeEnded',
					value: 'press-anime-ended',
					valueName: 'pressAnime'
				},
				{
					eventType: 'animationend',
					name: 'releaseAnimeEnded',
					value: 'release-anime-ended',
					valueName: 'releaseAnime'
				}
			],
			interactions: [
				{ eventType: 'mouseenter', name: 'entered', resetName: 'entered', value: 'enter' },
				{ eventType: 'mouseleave', name: 'left', resetName: 'left', value: 'leave' },
				{ eventType: 'mousedown', name: 'pressed', resetName: 'pressed', value: 'press' },
				{ eventType: 'mouseup', name: 'released', resetName: 'released', value: 'release' }
			]
			
		},
		
		this.reset = {
			entered:	[
							{
								attr:	[
											{ name: 'enter-anime-begun', method: 'toggle', value: false },
											{ name: 'enter-anime-ended', method: 'toggle', value: false },
											{ name: 'entered', method: 'toggle', value: false },
											{ name: 'leave-anime-begun', method: 'toggle', value: false },
											{ name: 'leave-anime-ended', method: 'toggle', value: false },
											{ name: 'left', method: 'toggle', value: false }
										]
							},
							{ attr: [ { name: 'entered', method: 'toggle', value: true } ] }
						],
			left:		[
							{
								attr:	[
											{ name: 'entered', method: 'toggle', value: false },
											{ name: 'leave-anime-begun', method: 'toggle', value: false },
											{ name: 'leave-anime-ended', method: 'toggle', value: false },
											{ name: 'left', method: 'toggle', value: false }
										]
							},
							{
								attr: [ { name: 'left', method: 'toggle', value: true } ]
							}
						],
			pressed:	[
							{
								attr:	[
											{ name: 'press-anime-begun', method: 'toggle', value: false },
											{ name: 'press-anime-ended', method: 'toggle', value: false },
											{ name: 'pressed', method: 'toggle', value: false },
											{ name: 'release-anime-begun', method: 'toggle', value: false },
											{ name: 'release-anime-ended', method: 'toggle', value: false },
											{ name: 'released', method: 'toggle', value: false }
										]
							},
							{ attr: [ { name: 'pressed', method: 'toggle', value: true } ] }
						],
			released:	[
							{
								attr:	[
											{ name: 'pressed', method: 'toggle', value: false },
											{ name: 'release-anime-begun', method: 'toggle', value: false },
											{ name: 'release-anime-ended', method: 'toggle', value: false },
											{ name: 'released', method: 'toggle', value: false },
										]
							},
							{ attr: [ { name: 'released', method: 'toggle', value: true } ] }
						]
		};
		
	}
	
	//static endedAnime(event, ...elements) {
	//	
	//	const { purgeAfterAnime, enterAnime, leaveAnime, pressAnime, releaseAnime, sbcvAfterAnime } = this;
	//	
	//	switch (event.animationName) {
	//		
	//		case enterAnime:
	//		this.enterAnimeEnded = true, state = 'enter';
	//		break;
	//		
	//		case leaveAnime:
	//		this.leaveAnimeEnded = true, state = 'leave';
	//		break;
	//		
	//		case pressAnime:
	//		this.pressAnimeEnded = true, state = 'press';
	//		break;
	//		
	//		case releaseAnime:
	//		this.releaseAnimeEnded = true, state = 'release';
	//		break;
	//		
	//	}
	//	
	//	sbcvAfterAnime === true || sbcvAfterAnime.includes('ended-' + state) ?
	//		ShadowInteractiveElement.setBoundToCSSVar(...elements) :
	//		this.setBoundToCSSVarAfter({ event }, this.element, ...elements),
	//	
	//	purgeAfterAnime === true || purgeAfterAnime.includes('ended-' + state) ?
	//		this.purge(undefined, true) : this.purgeAfter({ event });
	//	
	//}
	
	static interacted(event, ...elements) {
		
		const { type } = event, { constructor: { state: { interactions } } } = this, { length } = interactions;
		let i,v;
		
		i = -1;
		while (++i < length && (v = interactions[i]).eventType !== type);
		
		if (i !== length) {
			
			//this.resetAnime(...reset[v.resetName]);
			//
			//const requirements = this.getCurrentStateAsRequirements(true);
			//
			//this.setBoundToCSSVarAfter({ event }, requirements, this.element, ...elements),
			//this.purgeAfter({ event }, requirements);
			
			const	{ constructor: { reset }, element, purgeAfterInteractions, sbcvAfterInteractions } = this,
					{ resetName, value } = v;
			let requirements;
			
			this.resetAnime(...reset[resetName]),
			
			sbcvAfterInteractions?.includes?.(value) &&
				this.setBoundToCSSVarAfter	(
												{ event },
												requirements = this.getCurrentStateAsRequirements(true),
												element,
												...elements
											),
			purgeAfterInteractions?.includes?.(value) &&
				this.purgeAfter({ event }, requirements ||= this.getCurrentStateAsRequirements(true));
			
			
		}
		
	}
	//static entered(event) {
	//	
	//	const { purgeAfterInteractions, sbcvAfterInteractions } = this;
	//	
	//	this.resetAnime(...this.constructor.reset.entered),
	//	
	//	sbcvAfterInteractions === true || sbcvAfterInteractions?.includes?.('enter') ?
	//		ShadowInteractiveElement.setBoundToCSSVar(undefined, true) : this.setBoundToCSSVarAfter({ event }),
	//	
	//	purgeAfterInteractions === true || purgeAfterInteractions?.includes?.('enter') ?
	//		this.purge(undefined, true) : this.purgeAfter({ event });
	//	
	//}
	//static left(event) {
	//	
	//	const { purgeAfterInteractions, sbcvAfterInteractions } = this;
	//	
	//	this.resetAnime(...this.constructor.reset.left),
	//	
	//	sbcvAfterInteractions === true || sbcvAfterInteractions?.includes?.('leave') ?
	//		ShadowInteractiveElement.setBoundToCSSVar(undefined, true) : this.setBoundToCSSVarAfter({ event }),
	//	
	//	purgeAfterInteractions === true || purgeAfterInteractions?.includes?.('leave') ?
	//		this.purge(undefined, true) : this.purgeAfter({ event });
	//	
	//}
	//static pressed(event) {
	//	
	//	const { purgeAfterInteractions, sbcvAfterInteractions } = this;
	//	
	//	this.resetAnime(...this.constructor.reset.pressed),
	//	
	//	sbcvAfterInteractions === true || sbcvAfterInteractions?.includes?.('press') ?
	//		ShadowInteractiveElement.setBoundToCSSVar(undefined, true) : this.setBoundToCSSVarAfter({ event }),
	//	
	//	purgeAfterInteractions === true || purgeAfterInteractions?.includes?.('press') ?
	//		this.purge(undefined, true) : this.purgeAfter({ event });
	//	
	//}
	//static released(event) {
	//	
	//	const { purgeAfterInteractions, sbcvAfterInteractions } = this;
	//	
	//	this.resetAnime(...this.constructor.reset.released),
	//	
	//	sbcvAfterInteractions === true || sbcvAfterInteractions?.includes?.('release') ?
	//		ShadowInteractiveElement.setBoundToCSSVar(undefined, true) : this.setBoundToCSSVarAfter({ event }),
	//	
	//	purgeAfterInteractions === true || purgeAfterInteractions?.includes?.('release') ?
	//		this.purge(undefined, true) : this.purgeAfter({ event });
	//	
	//}
	
	static changedAnimationState(event, ...elements) {
		
		const { animationName, type } = event, { constructor: { state: { anime } } } = this, { length } = anime;
		let i, v;
		
		i = -1;
		while (++i < length && ((v = anime[i]).eventType !== type || (this[v.valueName]) !== animationName));
		
		if (i !== length) {
			
			const { element, purgeAfterAnime, sbcvAfterAnime } = this, { name, value } = v;
			let requirements;
			
			this[name] = true,
			
			sbcvAfterAnime?.includes?.(value) &&
				this.setBoundToCSSVarAfter	(
												{ event },
												requirements = this.getCurrentStateAsRequirements(true),
												element,
												...elements
											),
			purgeAfterAnime?.includes?.(value) &&
				this.purgeAfter({ event }, requirements ||= this.getCurrentStateAsRequirements(true));
			
		}
		
		//switch (event.animationName) {
		//	
		//	case enterAnime:
		//	this.enterAnimeBegun = true;
		//	break;
		//	
		//	case leaveAnime:
		//	this.leaveAnimeBegun = true;
		//	break;
		//	
		//	case pressAnime:
		//	this.pressAnimeBegun = true;
		//	break;
		//	
		//	case releaseAnime:
		//	this.releaseAnimeBegun = true;
		//	break;
		//	
		//	default:
		//	return;
		//	
		//}
		//
		//const requirements = this.getCurrentStateAsRequirements(true);
		//
		//this.setBoundToCSSVarAfter({ event }, requirements, this.element, ...elements),
		//this.purgeAfter({ event }, requirements);
		
	}
	
	constructor() {
		
		super(...arguments);
		
		const	{
					constructor:	{
										changedAnimationState,
										interacted,
										requirementsForPurgeAfter,
										requirementsForSBCVA
									}
				} = this;
		let handler;
		
		requirementsForPurgeAfter && (this.requirementsForPurgeAfter = requirementsForPurgeAfter),
		requirementsForSBCVA && (this.requirementsForSBCVA = requirementsForSBCVA),
		
		this.addLifetimeEvent('animationstart', handler = this.changedAnimationState = changedAnimationState.bind(this)),
		this.addLifetimeEvent('animationend', handler),
		
		this.addLifetimeEvent('mouseenter', handler = this.interacted = interacted.bind(this)),
		this.addLifetimeEvent('mouseleave', handler),
		this.addLifetimeEvent('mousedown', handler),
		this.addLifetimeEvent('mouseup', handler);
		
	}
	
	getCurrentStateAsRequirements(merges) {
		
		const	{ isArray } = Array,
				{ constructor: { state: { anime, interactions } } } = this,
				animation = {},
				requirements = [];
		let i,i0,l0, ri,ti, v,v0, cmd, av,iv, allowsAll, type, animationName, requirement;
		
		ri = ti = -1;
		while (cmd !== 'sbcvAfter') {
			
			if (av = this[(cmd = (cmd ? 'sbcv' : 'purge') + 'After') + 'Anime']) {
				
				i = i0 = -1, l0 = anime.length, allowsAll = !(isArray(av) && av.length);
				while (++i0 < l0)
					v = anime[i0],
					(allowsAll || (this[v.name] && av.includes(v.value))) &&
						(
							(type = v.eventType) in animation ?
								(animationName = animation[type].requirement.event.animationName):
								(
									animationName = [],
									animation[type] = requirements[++ri] =
										{ requirement: { event: { animationName, type } } }
								),
							animationName.includes(v0 = this[v.valueName]) ||
								(animationName[animationName.length] = v0)
						);
				
			}
			
			if (iv = this[cmd + 'Interactions']) {
				
				i = i0 = -1, l0 = interactions.length, allowsAll = !(isArray(iv) && iv.length);
				while (++i0 < l0)
					v = interactions[i0],
					(allowsAll || (this[v.name] && iv.includes(v.value))) &&
						(
							(type = (requirement ||= requirements[++ri] = { requirement: { event: { type: [] } } }).type).
								includes(v0 = v.eventType) || (type[++ti] = v0)
						);
				
			}
			
			//anime &&
			//	(
			//		isArray(anime) ?
			//			(
			//				i0 = -1, isBegun = isEnded = false,
			//				(
			//					(enterAnimeBegun && anime.includes('begun-enter') && (isBegun = true)) ||
			//					(enterAnimeEnded && anime.includes('ended-enter') && (isEnded = true))
			//				) && (animationName[++i0] = enterAnime),
			//				(
			//					(leaveAnimeBegun && anime.includes('begun-leave') && (isBegun = true)) ||
			//					(leaveAnimeEnded && anime.includes('ended-leave') && (isEnded = true))
			//				) && (animationName[++i0] = leaveAnime),
			//				(
			//					(pressAnimeBegun && anime.includes('begun-press') && (isBegun = true)) ||
			//					(pressAnimeEnded && anime.includes('ended-press') && (isEnded = true))
			//				) && (animationName[++i0] = pressAnime),
			//				(
			//					(releaseAnimeBegun && anime.includes('begun-release') && (isBegun = true)) ||
			//					(releaseAnimeEnded && anime.includes('ended-release') && (isEnded = true))
			//				) && (animationName[++i0] = releaseAnime),
			//				
			//				i0 = -1,
			//				isBegun && (type[++i0] = 'animationstart'),
			//				isEnded && (type[++i0] = 'animationend')
			//			) :
			//			(
			//				i0 = -1,
			//				animationName[++i0] = enterAnime,
			//				animationName[++i0] = leaveAnime,
			//				animationName[++i0] = pressAnime,
			//				animationName[++i0] = releaseAnime,
			//				
			//				i0 = -1,
			//				type[++i0] = 'animationstart',
			//				type[++i0] = 'animationend'
			//			)
			//	),
			//
			//interactions &&
			//	(
			//		i0 = -1,
			//		((allowsAll = isArray(interactions)) || (isEntered && interactions.includes('enter'))) &&
			//			(type[++i0] = 'mouseenter'),
			//		(allowsAll || (isLeft && interactions.includes('leave'))) &&
			//			(type[++i0] = 'mouseleave'),
			//		(allowsAll || (isPressed && interactions.includes('press'))) &&
			//			(type[++i0] = 'mousedown'),
			//		(allowsAll || (isReleased && interactions.includes('release'))) &&
			//			(type[++i0] = 'mouseup')
			//	);
			
		}
		
		if (merges) {
			
			const { requirementsForPurgeAfter, requirementsForSBCVA } = this;
			
			return	[
						...(
							isArray(requirementsForPurgeAfter) ?
								requirementsForPurgeAfter : [ requirementsForPurgeAfter ]
							),
						...(
							isArray(requirementsForSBCVA) ?
								requirementsForSBCVA : [ requirementsForSBCVA ]
							),
						...requirements
					];
			
		}
		
		return requirements;
		
	}
	//purgeWithAnimeState(source, preserves, removeOnce = true) {
	//	
	//	const { purgeAfterAnime } = this;
	//	
	//	if (purgeAfterAnime) {
	//		
	//		const { enterAnime, leaveAnime, pressAnime, releaseAnime } = this;
	//		let animationName, type;
	//		
	//		if (Array.isArray(purgeAfterAnime)) {
	//			
	//			const	{
	//						enterAnimeBegun, enterAnimeEnded,
	//						leaveAnimeBegun, leaveAnimeEnded,
	//						pressAnimeBegun, pressAnimeEnded,
	//						releaseAnimeBegun, releaseAnimeEnded
	//					} = this;
	//			let i, isBegun,isEnded;
	//			
	//			i = -1,
	//			animationName = [],
	//			type = [],
	//			(
	//				(enterAnimeBegun && purgeAfterAnime.includes('begun-enter') && (isBegun = true)) ||
	//				(enterAnimeEnded && purgeAfterAnime.includes('ended-enter') && (isEnded = true))
	//			) && (animationName[++i] = enterAnime),
	//			(
	//				(leaveAnimeBegun && purgeAfterAnime.includes('begun-leave') && (isBegun = true)) ||
	//				(leaveAnimeEnded && purgeAfterAnime.includes('ended-leave') && (isEnded = true))
	//			) && (animationName[++i] = leaveAnime),
	//			(
	//				(pressAnimeBegun && purgeAfterAnime.includes('begun-press') && (isBegun = true)) ||
	//				(pressAnimeEnded && purgeAfterAnime.includes('ended-press') && (isEnded = true))
	//			) && (animationName[++i] = pressAnime),
	//			(
	//				(releaseAnimeBegun && purgeAfterAnime.includes('begun-release') && (isBegun = true)) ||
	//				(releaseAnimeEnded && purgeAfterAnime.includes('ended-release') && (isEnded = true))
	//			) && (animationName[++i] = releaseAnime);
	//			
	//		} else {
	//			
	//			type = [ 'animationstart', 'animationend' ],
	//			animationName = [ enterAnime, leaveAnime, pressAnime, releaseAnime ];
	//			
	//		}
	//		
	//		if (this.require(source, { event: { type, animationName } }))
	//			return !(void this.purge(preserves, removeOnce));
	//		
	//	}
	//	
	//	return this.purgeAfter(preserves, removeOnce);
	//	
	//}
	
	//purgeWithAnimeState(source, preserves, removeOnce = true) {
	//	
	//	const { purgeAfterAnime } = this;
	//	
	//	if (purgeAfterAnime) {
	//		
	//		const { enterAnime, leaveAnime, pressAnime, releaseAnime } = this;
	//		let animationName, type;
	//		
	//		if (Array.isArray(purgeAfterAnime)) {
	//			
	//			const	{
	//						enterAnimeBegun, enterAnimeEnded,
	//						leaveAnimeBegun, leaveAnimeEnded,
	//						pressAnimeBegun, pressAnimeEnded,
	//						releaseAnimeBegun, releaseAnimeEnded
	//					} = this;
	//			let i, isBegun,isEnded;
	//			
	//			i = -1,
	//			animationName = [],
	//			type = [],
	//			(
	//				(enterAnimeBegun && purgeAfterAnime.includes('begun-enter') && (isBegun = true)) ||
	//				(enterAnimeEnded && purgeAfterAnime.includes('ended-enter') && (isEnded = true))
	//			) && (animationName[++i] = enterAnime),
	//			(
	//				(leaveAnimeBegun && purgeAfterAnime.includes('begun-leave') && (isBegun = true)) ||
	//				(leaveAnimeEnded && purgeAfterAnime.includes('ended-leave') && (isEnded = true))
	//			) && (animationName[++i] = leaveAnime),
	//			(
	//				(pressAnimeBegun && purgeAfterAnime.includes('begun-press') && (isBegun = true)) ||
	//				(pressAnimeEnded && purgeAfterAnime.includes('ended-press') && (isEnded = true))
	//			) && (animationName[++i] = pressAnime),
	//			(
	//				(releaseAnimeBegun && purgeAfterAnime.includes('begun-release') && (isBegun = true)) ||
	//				(releaseAnimeEnded && purgeAfterAnime.includes('ended-release') && (isEnded = true))
	//			) && (animationName[++i] = releaseAnime);
	//			
	//		} else {
	//			
	//			type = [ 'animationstart', 'animationend' ],
	//			animationName = [ enterAnime, leaveAnime, pressAnime, releaseAnime ];
	//			
	//		}
	//		
	//		if (this.require(source, { event: { type, animationName } }))
	//			return !(void this.purge(preserves, removeOnce));
	//		
	//	}
	//	
	//	return this.purgeAfter(preserves, removeOnce);
	//	
	//}
	
	purgeAfter(source, requirements = this.requirementsForPurgeAfter, preserves, removeOnce = true) {
		
		return this.require(source, requirements) && !(void this.purge(preserves, removeOnce));
		
	}
	
	require(source, requirements, defaultValue) {
		hi(requirements);
		if (requirements && typeof requirements === 'object') {
			
			const	{ flatten, requireAny } = ShadowInteractiveElement,
					{ element } = this,
					{ length } = Array.isArray(requirements) ? requirements : (requirements = [ requirements ]);
			let i, v, requirement;
			
			i = -1;
			while	(
						++i < length &&
						!(
							(requirement = requirements[i]) && typeof requirement === 'object' ?
								(!(v = requirement?.requirement) || requireAny(source, ...flatten(v))) &&
								(!(v = requirement?.matches) || element.matches(v)) :
								source === requirement
						)
					);
			
			return i !== length;
			
		}
		
		return !!defaultValue;
		
	}
	
	setBoundToCSSVarAfter(source, requirements = this.requirementsForSBCVA, ...elements) {
		
		return this.require(source, requirements) && !(void ShadowInteractiveElement.setBoundToCSSVar(...elements));
		
	}
	
	get enterAnime() {
		
		return this.element.getAttribute('enter-anime');
		
	}
	set enterAnime(v) {
		
		this.element.setAttribute('enter-anime', v);
		
	}
	get enterAnimeBegun() {
		
		return this.element.hasAttribute('enter-anime-begun');
		
	}
	set enterAnimeBegun(v) {
		
		this.element.toggleAttribute('enter-anime-begun', !!v);
		
	}
	get enterAnimeEnded() {
		
		return this.element.hasAttribute('enter-anime-ended');
		
	}
	set enterAnimeEnded(v) {
		
		this.element.toggleAttribute('enter-anime-ended', !!v);
		
	}
	get entered() {
		
		return this.element.hasAttribute('entered');
		
	}
	set entered(v) {
		
		this.element.toggleAttribute('entered', !!v);
		
	}
	get isLeft() {
		
		return this.element.hasAttribute('left');
		
	}
	set left(v) {
		
		this.element.toggleAttribute('left', !!v);
		
	}
	get pressed() {
		
		return this.element.hasAttribute('pressed');
		
	}
	set pressed(v) {
		
		this.element.toggleAttribute('pressed', !!v);
		
	}
	get released() {
		
		return this.element.hasAttribute('released');
		
	}
	set released(v) {
		
		this.element.toggleAttribute('released', !!v);
		
	}
	get leaveAnime() {
		
		return this.element.getAttribute('leave-anime');
		
	}
	set leaveAnime(v) {
		
		this.element.setAttribute('leave-anime', v);
		
	}
	get leaveAnimeBegun() {
		
		return this.element.hasAttribute('leave-anime-begun');
		
	}
	set leaveAnimeBegun(v) {
		
		this.element.toggleAttribute('leave-anime-begun', !!v);
		
	}
	get leaveAnimeEnded() {
		
		return this.element.hasAttribute('leave-anime-ended');
		
	}
	set leaveAnimeEnded(v) {
		
		this.element.toggleAttribute('leave-anime-ended', !!v);
		
	}
	get pressAnime() {
		
		return this.element.getAttribute('press-anime');
		
	}
	set pressAnime(v) {
		
		this.element.setAttribute('press-anime', v);
		
	}
	get pressAnimeBegun() {
		
		return this.element.hasAttribute('press-anime-begun');
		
	}
	set pressAnimeBegun(v) {
		
		this.element.toggleAttribute('press-anime-begun', !!v);
		
	}
	get pressAnimeEnded() {
		
		return this.element.hasAttribute('press-anime-ended');
		
	}
	set pressAnimeEnded(v) {
		
		this.element.toggleAttribute('press-anime-ended', !!v);
		
	}
	get purgeAfterAnime() {
		
		const { element } = this;
		let v;
		
		return	element.hasAttribute('purge-after-anime') &&
					(!(v = element.getAttribute('purge-after-anime')) || v.split(' '));
		
	}
	set purgeAfterAnime(v) {
		
		typeof v === 'boolean' ?
			this.element.toggleAttribute('purge-after-anime', v) :
			this.element.setAttribute('purge-after-anime', Array.isArray(v) ? v.join(' ') : v);
		
	}
	get purgeAfterInteractions() {
		
		const { element } = this;
		let v;
		
		return	element.hasAttribute('purge-after-interactions') &&
					(!(v = element.getAttribute('purge-after-interactions')) || v.split(' '));
		
	}
	set purgeAfterInteractions(v) {
		
		typeof v === 'boolean' ?
			this.element.toggleAttribute('purge-after-interactions', v) :
			this.element.setAttribute('purge-after-interactions', Array.isArray(v) ? v.join(' ') : v);
		
	}
	get releaseAnime() {
		
		return this.element.getAttribute('release-anime');
		
	}
	set releaseAnime(v) {
		
		this.element.setAttribute('release-anime', v);
		
	}
	get releaseAnimeBegun() {
		
		return this.element.hasAttribute('release-anime-begun');
		
	}
	set releaseAnimeBegun(v) {
		
		this.element.toggleAttribute('release-anime-begun', !!v);
		
	}
	get releaseAnimeEnded() {
		
		return this.element.hasAttribute('release-anime-ended');
		
	}
	set releaseAnimeEnded(v) {
		
		this.element.toggleAttribute('release-anime-ended', !!v);
		
	}
	get requirementsForPurgeAfter() {
		
		return JSON.parse(this.element.getAttribute('purge-after'));
		
	}
	set requirementsForPurgeAfter(v) {
		
		this.element.setAttribute('purge-after', JSON.stringify(v));
		
	}
	get requirementsForSBCVA() {
		
		return JSON.parse(this.element.getAttribute('sbcv-after'));
		
	}
	set requirementsForSBCVA(v) {
		
		this.element.setAttribute('sbcv-after', JSON.stringify(v));
		
	}
	get sbcvAfterAnime() {
		
		const { element } = this;
		let v;
		
		return	element.hasAttribute('sbcv-after-anime') &&
					(!(v = element.getAttribute('sbcv-after-anime')) || v.split(' '));
		
	}
	set sbcvAfterAnime(v) {
		
		typeof v === 'boolean' ?
			this.element.toggleAttribute('sbcv-after-anime', v) :
			this.element.setAttribute('sbcv-after-anime', Array.isArray(v) ? v.join(' ') : v);
		
	}
	get sbcvAfterInteractions() {
		
		const { element } = this;
		let v;
		
		return	element.hasAttribute('sbcv-after-interactions') &&
					(!(v = element.getAttribute('sbcv-after-interactions')) || v.split(' '));
		
	}
	set sbcvAfterInteractions(v) {
		
		typeof v === 'boolean' ?
			this.element.toggleAttribute('sbcv-after-interactions', v) :
			this.element.setAttribute('sbcv-after-interactions', Array.isArray(v) ? v.join(' ') : v);
		
	}
	
}
ShadowInteractiveElement.define();