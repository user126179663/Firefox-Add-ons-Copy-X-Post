class Options extends CXPBasement {
	
	static {
		
		this[Logger.$icon] = '󠁪󠁪󠁪󠀽⚙️';
		
		this.defaultStorage = this.DEFAULT_STORAGE = {},
		
		this.defaultInterface = 'less-anime',
		
		this.interfaceDescriptors = [
			{
				label: '非表示',
				value: 'disuse'
			},
			{
				label: 'アニメーションなし',
				value: 'no-anime'
			},
			{
				label: '既定',
				value: 'less-anime'
			},
			{
				label: 'オリジナル',
				value: 'original'
			}
		],
		
		this.urls = {
			defaultStorageFile: 'storage-default.json',
			storageVerifierFile: 'storage-verifier.json'
		};
		
		for (const k in this.urls)
			Object.defineProperty(this, k, { get: (url => () => browser.runtime.getURL(url))(this.urls[k]) });
		
	}
	
	static bound = {
		
		loadedStorage(stored) {
			
			this.abort('loaded-storage'),
			
			(location.protocol === 'file:' || location.host === 'localhost') &&
				document.documentElement.classList.add('dev local');
			
			const
			{
				changedAddsContextMenu,
				changedStorageImportFile,
				clickedDisableDevButton,
				clickedStorageCopyButton,
				clickedStorageExportButton,
				clickedStorageImportButton,
				clickedStorageInitializeButton,
				clickedWakeupBackgroundButton
			} = this,
			gathered = Options.gather(),
			{
				checkboxAddsContextMenu,
				disableDevButton,
				storageCopyButton,
				storageExportButton,
				storageImportButton,
				storageImportFile,
				storageInitializeButton,
				wakeupBackgroundButton
			} = gathered,
			{ settings: { addsContextMenu } } = stored,
			eventOption = { signal: this.getSignal('loaded-storage') };
			
			disableDevButton.addEventListener('click', clickedDisableDevButton, eventOption),
			
			this.changeAddsContextMenu(addsContextMenu),
			checkboxAddsContextMenu.addEventListener('change', changedAddsContextMenu, eventOption),
			
			storageExportButton.addEventListener('click', clickedStorageExportButton, eventOption),
			storageImportButton.addEventListener('click', clickedStorageImportButton, eventOption),
			storageImportFile.addEventListener('change', changedStorageImportFile, eventOption),
			storageInitializeButton.addEventListener('click', clickedStorageInitializeButton, eventOption),
			storageCopyButton.addEventListener('click', clickedStorageCopyButton, eventOption),
			wakeupBackgroundButton.addEventListener('click', clickedWakeupBackgroundButton, eventOption);
			
			return this.startup(stored, gathered);
			
		},
		
		changedAddsContextMenu(event) {
			
			this.changeAddsContextMenu(event.target.checked);
			
		},
		
		clickedDisableDevButton(event) {
			
			document.documentElement.classList.toggle('dev');
			
		},
		
		clickedStorageCopyButton(event) {
			
			browser.storage.local.get().
				then(storage => navigator.clipboard.writeText(JSON.stringify(storage, undefined, '\t')));
			
		},
		
		clickedStorageExportButton(event) {
			
			browser.storage.local.get().then(storage => {
				
				const downloader = document.createElement('a');
				
				downloader.setAttribute
					(
						'href',
						'data:text/plain;chaset=utf-8,' + encodeURIComponent(JSON.stringify(storage, undefined, '\t'))
					),
				downloader.setAttribute('download', Options.getDateTimeStr() + '.json'),
				
				document.body.appendChild(downloader),
				downloader.click(),
				downloader.remove();
				
			});
			
		},
		
		clickedStorageImportButton(event) {
			
			//fetch(browser.runtime.getURL('storage-verifier.json')).then(response => response.json()).
			//	then(verifier => ShadowAnimationConditionsElement.require())
			document.getElementById('storage-import-file').showPicker();
			
		},
		
		clickedWakeupBackgroundButton(event) {
			
			browser.runtime.sendMessage({ type: 'ping', timestamp: Date.now() });
			
		},
		
		changedStorage(changes, areaName) {
			
			Object.getPrototypeOf(this.constructor).bound.changedStorage.call(this, ...arguments),
			
			document.getElementById('storage-viewer').value = JSON.stringify(this.stored, undefined, '  ');
			
		},
		
		changedStorageImportFile(event) {
			
			const { target: { files: [ file ] } } = event;
			
			if (file instanceof File && file.type === 'application/json') {
				
				const	ac = new AbortController(),
						eventOption = { signal: ac.signal },
						cancel = event => ac.abort(),
						fr = new FileReader();
				
				fr.addEventListener('abort', cancel, eventOption),
				fr.addEventListener('error', cancel, eventOption),
				fr.addEventListener(
					'load',
					event => {
						
						const { constructor: { fetchJSON, storageVerifierFile } } = this;
						
						ac.abort(),
						
						fetchJSON(storageVerifierFile).
							then	(
										verifier =>	{
														
														const	{ flatten, requireAny } =
																	ShadowAnimationConditionsElement,
																{ result } = fr;
														let imported;
														
														try {
															
															imported = JSON.parse(result);
															
														} catch (error) {
															
															console.warn(error);
															
															return;
															
														}
														
														requireAny(imported, ...flatten(verifier)) &&
															browser.storage.local.set(imported);
														
													}
									);
						
					},
					eventOption
				),
				
				fr.readAsText(file);
				
			}
			
		},
		
		changedVisibleAlways(event) {
			
			this.changeVisibleAlways(event.target.checked);
			
		},
		
		clickedStorageInitializeButton(event) {
			
			Options.fetchJSON(this.constructor.defaultStorageFile).
				then(defaultStorage => browser.storage.local.set(defaultStorage));
			
		},
		
		inputInterface(event) {
			
			this.changeInterface(this.constructor.interfaceDescriptors[event.target.value]);
			
		}
		
	};
	
	static storageHandler = {
		
		settings: {
			
			interfaceName({ current, last }, change, stored) {
				
				(current === 'disuse' || last === 'disuse') &&
					(stored.settings.interfaceName = current, this.startup(stored));
				
			},
			
			visibleAlways(value, change, stored) {
				
				const	preview = document.getElementById('preview'),
						previewParent = preview?.parentElement;
				
				if (preview) {
					
					for (const shadow of document.querySelectorAll('[shadow]'))
						shadow?.handler?.purge?.(undefined, true);
					
					preview.remove(),
					previewParent.append(preview);
					
				}
				
			}
			
		}
		
	};
	
	static gather(rootNode = document) {
		
		const gathered = {};
		let i,l, keys,key;
		
		for (const element of rootNode.querySelectorAll(':not(template) [id], :not(template) [data-id]')) {
			
			i = 0, l = (keys = (element.dataset.id || element.id).split('-')).length, key = keys[0];
			while (++i < l) key += keys[i][0].toUpperCase() + keys[i].slice(1);
			
			gathered[key] = element;
			
		}
		
		return gathered;
		
	}
	
	static getInterfaceDescriptor(name) {
		
		const { interfaceDescriptors } = this, { length } = interfaceDescriptors;
		let i;
		
		i = -1;
		while (++i < length && interfaceDescriptors[i].value !== name);
		
		if (i === length) {
			
			const { defaultInterface } = this;
			
			i = -1;
			while (++i < length && interfaceDescriptors[i].value !== defaultInterface);
			
		}
		
		return interfaceDescriptors[i];
		
	}
	
	static async construct(updates) {
		
		const { DEFAULT_STORAGE, defaultStorage, defaultStorageFile } = this;
		
		(defaultStorage === DEFAULT_STORAGE || updates) &&
			await Options.fetchJSON(defaultStorageFile).then(defaultStorage => (this.defaultStorage = defaultStorage));
		
		return new Options();
		
	}
	
	constructor() {
		
		super();
		
	}
	
	changeAddsContextMenu(value) {
		
		document.getElementById('checkbox-adds-context-menu').checked = value;
		
		return this.save({ value }, (detail, settings) => (settings.addsContextMenu = detail.value));
		
	}
	
	changeInterface(interfaceDescriptor) {
		
		document.querySelector('.view-type').textContent = interfaceDescriptor.label,
		document.getElementById('range-interface').value =
			this.constructor.interfaceDescriptors.indexOf(interfaceDescriptor);
		
		return this.save(interfaceDescriptor, (detail, settings) => (settings.interfaceName = detail.value));
		
	}
	
	changeVisibleAlways(value) {
		
		document.getElementById('checkbox-visible-always').checked = value;
		
		return this.save({ value }, (detail, settings) => (settings.visibleAlways = detail.value));
		
	}
	
	init() {
		
		const { storage: { local } } = browser, { constructor: { defaultStorage }, loadedStorage } = this;
		
		return local.get().then(storage => local.set(Options.setDefault(storage, defaultStorage)).then(() => loadedStorage(storage)));
		
	}
	
	save(detail, permitted, unpermitted = permitted) {
		
		const { permissions, storage: { local } } = browser, { permission, skipsSave } = detail;
		
		return	(
					permission ?
						permissions.contains(permission).
							then(contained => contained || permissions.request(permission)) :
						Promise.resolve(true)
				).then	(
							async saves =>	local.get('settings').
												then(
														async ({ settings = {} }) =>
															(
																await Reflect.apply	(
																						saves ? permitted : unpermitted,
																						this,
																						[ detail, settings ]
																					),
																skipsSave?.[save] || local.set({ settings })
															)
													)
						);
		
	}
	
	startup(storage, gathered = this.constructor.gather()) {
		
		this.cdp?.purge?.(),
		
		this.abort('startup');
		
		const
		{ enteredButton } = CopyXPost,
		{ constructor: { gather, interfaceDescriptors }, changedStorage, changedVisibleAlways, inputInterface } = this,
		{ settings: { addsContextMenu, interfaceName, visibleAlways } } = this.stored = storage,
		{ reactRoot, templatePreview } = gathered,
		interfaceDescriptor = this.constructor.getInterfaceDescriptor(interfaceName),
		preview = templatePreview.cloneNode(true).content.querySelector('#preview'),
		eventOption = { signal: this.getSignal('startup') };
		
		reactRoot.replaceChildren(preview);
		
		const { checkboxVisibleAlways, rangeInterface } = gather(preview);
		
		for (const node of document.querySelectorAll('[shadow]')) node.dataset.cxpInterface = interfaceName;
		
		for (const node of document.querySelectorAll('.help'))
			node.addEventListener('mouseenter', enteredButton, eventOption);
		
		this.changeInterface(interfaceDescriptor),
		rangeInterface.addEventListener('input', inputInterface, eventOption),
		
		this.changeVisibleAlways(visibleAlways),
		checkboxVisibleAlways.addEventListener('change', changedVisibleAlways, eventOption),
		
		browser.storage.local.onChanged.addListener(changedStorage);
		
		return (this.cdp = new CopyDummyPost()).init();
		
	}
	
}

class CopyDummyPost extends CopyXPost {
	
	static {
		
		super.SELECTOR_POST = 'article#preview.post';
		
	}
	
	constructor() {
		
		super();
		
	}
	
	init() {
		
		return	(browser.i18n.fetch?.() ?? Promise.resolve()).
					then(() => Object.getPrototypeOf(this.constructor).prototype.init.call(this));
		
	}
	
}
ShadowCopyXPostElement.SELECTOR_POST = CopyDummyPost.SELECTOR_POST;

addEventListener('DOMContentLoaded', async event => (await Options.construct()).init(), { once: true });

//const
//{ permissions, runtime, storage: { local } } = browser,
//load = event => ShadowElement.whenDefinedAll().then(() => fetch(runtime.getURL('storage-default.json'))).then(response => response.json()).then(keys => local.get(keys)).then(loadedSettings),
//getDateTimeStr = (date = new Date()) => {
//	
//	return	date.getFullYear() + '-' +
//			(date.getMonth() + 1 + '').padStart(2, '0') + (''+date.getDate()).padStart(2, '0') + '-' +
//			(''+date.getHours()).padStart(2, '0') + (''+date.getMinutes()).padStart(2, '0') + '-' +
//			(''+date.getSeconds()).padStart(2, '0');
//	
//},
//gather = () => {
//	
//	const gathered = {};
//	let i,l, keys,key;
//	
//	for (const element of document.querySelectorAll(':not(template) [id], :not(template) [data-id]')) {
//		
//		i = 0, l = (keys = (element.dataset.id || element.id).split('-')).length, key = keys[0];
//		while (++i < l) key += keys[i][0].toUpperCase() + keys[i].slice(1);
//		
//		gathered[key] = element;
//		
//	}
//	
//	return gathered;
//	
//},
//loadedSettings = storage => {
//	
//	(location.protocol === 'file:' || location.host === 'localhost') && document.documentElement.classList.add('dev');
//	
//	const
//	gathered = gather(),
//	{ storageExportButton, storageImportButton, storageImportFile, storageInitializeButton } = gathered,
//	clickedStorageExportButton = event => {
//		
//		local.get().then(storage => {
//			
//			const downloader = document.createElement('a');
//			
//			downloader.setAttribute
//				('href', 'data:text/plain;chaset=utf-8,' + encodeURIComponent(JSON.stringify(storage, undefined, '\t'))),
//			downloader.setAttribute('download', getDateTimeStr() + '.json'),
//			
//			document.body.appendChild(downloader),
//			downloader.click(),
//			downloader.remove();
//			
//		});
//		
//	},
//	clickedStorageImportButton = event => {
//		
//		//fetch(browser.runtime.getURL('storage-verifier.json')).then(response => response.json()).
//		//	then(verifier => ShadowAnimationConditionsElement.require())
//		storageImportFile.showPicker();
//		
//	},
//	changedStorageImportFile = event => {
//		
//		const { target: { files: [ file ] } } = event;
//		
//		if (file instanceof File && file.type === 'application/json') {
//			
//			const	ac = new AbortController(),
//					eventOption = { signal: ac.signal },
//					cancel = event => ac.abort(),
//					fr = new FileReader();
//			
//			fr.addEventListener('abort', cancel, eventOption),
//			fr.addEventListener('error', cancel, eventOption),
//			fr.addEventListener(
//				'load',
//				event => {
//					
//					ac.abort(),
//					
//					fetch(browser.runtime.getURL('storage-verifier.json')).then(response => response.json()).
//						then(
//								verifier =>	{
//												const	{ flatten, requireAny } = ShadowAnimationConditionsElement,
//														{ result } = fr;
//												let imported;
//												
//												try {
//													
//													imported = JSON.parse(result);
//													
//												} catch (error) {
//												}
//												
//												requireAny(imported, ...flatten(verifier)) &&
//													browser.storage.local.set(imported);
//												
//											});
//					
//				},
//				eventOption
//			),
//			fr.readAsText(file);
//			
//		}
//		
//	},
//	clickedStorageInitializeButton = event => {};
//	
//	storageExportButton.addEventListener('click', clickedStorageExportButton),
//	storageImportButton.addEventListener('click', clickedStorageImportButton),
//	storageImportFile.addEventListener('change', changedStorageImportFile),
//	storageInitializeButton.addEventListener('click', clickedStorageInitializeButton),
//	
//	initialized(storage, gathered);
//	
//},
//initialized = ({ settings = {} }, gathered = gather()) => {
//	
//	const
//	{ reactRoot, templatePreview } = gathered,
//	preview = templatePreview.cloneNode(true).content.querySelector('#preview');
//	
//	reactRoot.replaceChildren(preview);
//	
//	const
//	{ checkboxVisibleAlways, rangeInterface } = gather(),
//	{ enteredButton } = CopyDummyPost,
//	{ interface, visibleAlways } = settings,
//	interfaces = [
//		{
//			label: '右クリックメニュー化',
//			value: 'context-menu',
//			permission: { permissions: [ 'contextMenus' ] }
//		},
//		{
//			label: 'アニメーションなし',
//			value: 'no-anime'
//		},
//		{
//			label: '既定',
//			value: 'less-anime'
//		},
//		{
//			label: 'オリジナル',
//			value: 'original'
//		}
//	],
//	{ length: interfaceTypesLength } = interfaces,
//	inputInterface = event => changeInterface(interfaces[event.target.value]),
//	changeInterface = interface => {
//		
//		document.querySelector('.view-type').textContent = interface.label,
//		
//		apply(interface, (detail, settings) => (settings.interface = detail.value));
//		
//	},
//	changedVisibleAlways = event => changeVisibleAlways(event.target.checked),
//	changeVisibleAlways = value => {
//		
//		apply({ value }, (detail, settings) => (settings.visibleAlways = detail.value));
//		
//	},
//	apply = (detail, permitted, unpermitted = permitted) => {
//		
//		const { permission, skippsSave } = detail;
//		
//		return	(
//					permission ?
//						permissions.contains(permission).
//							then(contained => contained || permissions.request(permission)) :
//						Promise.resolve(true)
//				).then	(
//							async saves =>	local.get('settings').
//												then(
//														async ({ settings = {} }) =>
//															(
//																await Reflect.apply	(
//																						saves ? permitted : unpermitted,
//																						this,
//																						[ detail, settings ]
//																					),
//																skippsSave?.[save] || local.set({ settings })
//															)
//													)
//						);
//		
//	},
//	changedStorage = (changes, areaName) => {
//		
//		let k;
//		hi(changes);
//		for (k in changes) {
//			
//			switch (k) {
//				
//				case 'settings':
//				
//				if ('newValue' in (change = changes[k])) {
//					
//					const changed = change.newValue;
//					let k0, v;
//					
//					for (k0 in changed) {
//						
//						v = (settings[k0] = changed)[k0];
//						
//						switch (k0) {
//							
//							case 'interface':
//							
//							for (const shadow of document.querySelectorAll('[shadow]'))
//								shadow.dataset.cxpViewMode = v;
//							
//							break;
//							
//							case 'visibleAlways':
//							
//							const previewParent = preview.parentElement;
//							
//							for (const shadow of document.querySelectorAll('[shadow]'))
//								shadow?.handler?.purge?.(undefined, true);
//							
//							preview.remove(), previewParent.append(preview);
//							
//							break;
//							
//						}
//						
//					}
//					
//				}
//				
//				break;
//				
//			}
//			
//		}
//		
//	};
//	let i;
//	
//	for (const node of document.querySelectorAll('.help')) node.addEventListener('mouseenter', enteredButton);
//	
//	i = -1;
//	while (++i < interfaceTypesLength && interfaces[i].value !== interface);
//	
//	if (i === interfaceTypesLength) {
//		
//		i = -1;
//		while (++i < interfaceTypesLength && interfaces[i].value !== 'less-anime');
//		
//	}
//	
//	changeInterface(interfaces[rangeInterface.value = i]),
//	rangeInterface.addEventListener('input', inputInterface),
//	
//	changeVisibleAlways(visibleAlways),
//	checkboxVisibleAlways.addEventListener('change', changedVisibleAlways),
//	
//	local.onChanged.addListener(changedStorage),
//	
//	new CopyDummyPost().init();
//	
//};