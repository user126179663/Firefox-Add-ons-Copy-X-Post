// このオブジェクトの動作には grapheme-splitter.js, eastasianwidth.js が必要。
class Basement extends WXLogger {
	
	static {
		
		this.$ac = Symbol('Basement.ac'),
		
		this.eaFWProperties = [ 'A', 'F', 'W' ],
		
		this.graphemeSplitter = new GraphemeSplitter(),
		
		this.ellipsis = this.graphemeSplitter.splitGraphemes('…'),
		
		this.storageHandler = {};
		
	}
	
	static bound = {
		
		changedStorage(changes, areaName) {
			
			const { constructor: { storageHandler }, stored = {} } = this;
			let k,k0, handler, change, newValue,oldValue,current,last, changed;
			
			for (k in changes) {
				
				change = changes[k], handler = storageHandler;
				
				switch (k) {
					
					case 'settings':
					
					handler = handler.settings, oldValue = change.oldValue;
					
					for (k0 in ((newValue = change.newValue) || oldValue)) {
						
						(
							changed =	newValue ?
											oldValue && k0 in oldValue ?
												(current = newValue[k0]) !== (last = oldValue[k0]) &&
													{ current, last } :
												{ current: newValue[k0] } :
											{ last: oldValue[k0] }
						) && handler?.[k0]?.call?.(this, changed, change, stored) !== false &&
							(
								newValue ?	((stored.settings ??= {})[k0] = changed.current) :
											delete (stored.settings ??= {})[k0]
							);
						
					}
					
					break;
					
				}
				
			}
			
		},
		
		receivedMessage(message, sender, sendResponse) {
			
			const { constructor: { messageHandler } } = this;
			
			if (messageHandler && typeof messageHandler === 'object') {
			
				const type = typeof message;
				
				(message && type === 'object' ? messageHandler.object?.[message.type] : messageHandler[type])?.
					call?.(this, message, sender, sendResponse);
				
			}
			
		}
		
	};
	
	static fetchJSON(url) {
		
		return fetch(url).then(Basement.responseJSON);
		
	}
	
	static getEAStrLength(str, eaFWProperties = this.eaFWProperties || Basement.eaFWProperties) {
		
		const { length } = Array.isArray(str) ? str : (str = this.splitGraphemes(str));
		let i,l;
		
		i = -1, l = 0;
		while (++i < length && (l += 1 + eaFWProperties.includes(eaw.eastAsianWidth(str[i]))));
		
		return l;
		
	}
	
	static getDateTimeStr(date = new Date()) {
		
		return	date.getFullYear() + '-' +
				(date.getMonth() + 1 + '').padStart(2, '0') + (''+date.getDate()).padStart(2, '0') + '-' +
				(''+date.getHours()).padStart(2, '0') + (''+date.getMinutes()).padStart(2, '0') + '-' +
				(''+date.getSeconds()).padStart(2, '0');
		
	}
	
	static composedClosest(target, selector) {
		
		return	target instanceof Element || (target instanceof ShadowRoot && (target = target.host)) ?
					(target.closest(selector) || Basement.composedClosest(target.getRootNode(), selector)) : null;
		
	}
	
	static recursiveGet(object, ...keys) {
		
		return	keys.length ? object && typeof object === 'object' ?
					Basement.recursiveGet(object[keys[0]], ...keys.slice(1)) : undefined : object;
		
	}
	
	static responseJSON(response) {
		
		return response.json();
		
	}
	
	static setDefault(target, source) {
		
		if (source && typeof source === 'object') {
			
			const { setDefault } = Basement;
			let k,v;
			
			(target && typeof target === 'object') || (target = {});
			
			for (k in source)	k in target ?
									(v = target[k]) && typeof v === 'object' && setDefault(v, source[k]) :
									(target[k] = (v = source[k]) && typeof v === 'object' ? setDefault({}, v) : v);
			
		} else target = source;
		
		return target;
		
	}
	
	static splitGraphemes(str) {
		
		return (this.graphemeSplitter || Basement.graphemeSplitter).splitGraphemes(''+str);
		
	}
	
	static truncateEAStr(str, max, ellipsis = this.ellipsis, eaFWProperties = this.eaFWProperties) {
		
		const { isArray } = Array;
		
		if (this.getEAStrLength(isArray(str) ? str : (str = this.splitGraphemes(str)), eaFWProperties) > max) {
			
			const length = this.getEAStrLength(isArray(ellipsis) ? ellipsis : (ellipsis = this.splitGraphemes(ellipsis)), eaFWProperties);
			let i,l;
			
			i = -1, l = 0;
			while ((l += 1 + eaFWProperties.includes(eaw.eastAsianWidth(str[++i]))) < max);
			
			++i, l = 0;
			while (--i && (l += 1 + eaFWProperties.includes(eaw.eastAsianWidth(str[i]))) < length);
			
			return str.slice(0, i).join('') + ellipsis.join('');
			
		}
		
		return str.join('');
		
	}
	
	constructor() {
		
		super();
		
		const	{ runtime, storage: { local } } = browser,
				{ constructor } = this,
				boundFunctions = this.getBound(constructor.merge(constructor, 'bound'));
		
		this.uid = crypto.randomUUID(),
		this[Basement.$ac] = {};
		
		for (const k in boundFunctions) this[k] = boundFunctions[k];
		
		const { changedStorage, receivedMessage } = this;
		
		local.onChanged.addListener(changedStorage),
		runtime.onMessage?.addListener?.(receivedMessage);
		
	}
	
	abort(key) {
		
		const ac = this[Basement.$ac];
		
		return key in ac && !!ac[key].abort();
		
	}
	
	getSignal(key) {
		
		const ac = this[Basement.$ac];
		
		return ((key in ac && !ac[key].signal.aborted) ? ac[key] : (ac[key] = new AbortController())).signal;
		
	}
	
}
class CXPBasement extends Basement {
	
	static {
		
		this[Logger.$name] = browser.runtime.getManifest().short_name.toUpperCase(),
		this[Logger.$namePrefix] = '[',
		this[Logger.$nameSuffix] = ']';
		
	}
	
	constructor() { super(); }
	
}