const
hi = console.log.bind(console, '📍'),
asArray =	(value, adds) =>
				Array.isArray(value) ? value : !adds && (value === undefined || value === null) ? [] : [ value ],
isNullish = v => v === null || v === undefined,
killEvent = event => (event.stopPropagation(), event.preventDefault()),
setBoundToCSSVar = (target, ...sources) => {
	
	const srcs = new Set(sources), { scrollX, scrollY } = window, { style } = target;
	let i,k,v;
	
	srcs.add(target);
	
	i = -1;
	for (const src of srcs) {
		
		const rect = src?.getBoundingClientRect?.();
		
		if (rect && typeof rect === 'object') {
			
			++i;
			
			const prefix = '--bound-' + (src.id || i) + '-';
			
			for (k in rect)	typeof (v = rect[k]) === 'number' &&
								(
									src === target && style.setProperty('--bound-' + k, v + 'px'),
									style.setProperty(prefix + k, v + 'px')
								);
			
		}
		
	}
	
	style.setProperty('--scroll-x', scrollX + 'px'),
	style.setProperty('--scroll-y', scrollY + 'px');
	
};