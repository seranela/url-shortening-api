/* --- Mobile Menu --- */

const button = document.querySelector('#menu-toggle');
const nav = document.querySelector('#nav-header');

// Browser resize handler
function resizeUpdate() {
	// If user resizes browser into breakpoint...
	if (document.body.offsetWidth >= 768) {
		// Make sure mobile menu is hidden
		nav.setAttribute('aria-expanded', false);
		nav.classList.remove('nav-header-show');
		button.classList.remove('nav-header-button-close');
	}
}

// Show / Hide Mobile Menu
function toggleMenu() {
	if (nav.getAttribute('aria-expanded') === 'false') {
		nav.setAttribute('aria-expanded', true);
		nav.classList.add('nav-header-show');
		button.classList.add('nav-header-button-close');
		document.body.style.overflow = 'hidden';
	} else {
		nav.setAttribute('aria-expanded', false);
		nav.classList.remove('nav-header-show');
		button.classList.remove('nav-header-button-close');
		document.body.style.overflow = 'auto';
	}
}

window.addEventListener('resize', resizeUpdate);
button.addEventListener('click', toggleMenu);

/* --- Copy URL to Clipboard (with Fallback) --- */

function copyURLFallback(url) {
	// Create a temp element to temporarily copy link into
	let textArea = document.createElement('textarea');
	textArea.value = url;

	// Avoid scrolling to bottom
	textArea.style.top = '0';
	textArea.style.left = '0';
	textArea.style.position = 'fixed';

	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();

	try {
		let successful = document.execCommand('copy');
		e.target.innerText = 'Copied!';
		e.target.classList.add('shorten-url-copy-button-copied');
	} catch (err) {
		console.error('Error copying link to clipboard.', err);
	}

	document.body.removeChild(textArea);
}

function copyURL(e) {
	const url = e.target.value;

	if (!navigator.clipboard) {
		// If navigator.clipboard isn't supported, use fallback method
		copyURLFallback(url);
		return;
	}

	navigator.clipboard.writeText(url).then(() => {
		e.target.innerText = 'Copied!';
		e.target.classList.add('shorten-url-copy-button-copied');
	}, (err) => {
		console.error('Error copying link to clipboard.', err);
	});
}

/* --- Storage --- */

function addURLToStorage(fullURL, shortURL) {
	// Get stored shortened links
	const storage = localStorage.getItem('shortening-urls');

	// Create a new urls array or append on existing stored data
	let urls = [];
	if (!storage) {
		urls.push({full: fullURL, short: shortURL});
	} else {
		urls = JSON.parse(storage);
		urls.push({full: fullURL, short: shortURL});

		// Limit the number of stored URLs to 3
		if (urls.length > 3) {
			urls.shift();
		}
	}

	// Update storage
	localStorage.setItem('shortening-urls', JSON.stringify(urls));
}

/* --- Shorten URL --- */

const inputURL = document.querySelector('#link-to-shorten');
const inputURLErrorMessage = document.querySelector('.input-error-message');

// Create a shortened link list item for display
function createListItem(fullURL, shortURL) {
	const shortURLList = document.querySelector('.shorten-url-list');

	const listItem = document.createElement('li');

	const listItemOriginal = document.createElement('span');
	listItemOriginal.className = 'shorten-url-original';
	listItemOriginal.innerText = fullURL;
	listItem.appendChild(listItemOriginal);

	const listItemShortened = document.createElement('span');
	listItemShortened.className = 'shorten-url-shortened';
	listItemShortened.innerText = shortURL;
	listItem.appendChild(listItemShortened);

	const listItemButton = document.createElement('button');
	listItemButton.className = 'shorten-url-copy-button';
	listItemButton.innerText = 'Copy';
	listItemButton.value = shortURL;
	listItemButton.addEventListener('click', copyURL);
	listItem.appendChild(listItemButton);

	// Show new short URL at top of list
	shortURLList.insertBefore(listItem, shortURLList.firstChild);

	// Limit number of URLs shown to 3
	if (shortURLList.children.length > 3) {
		// Make sure we get only 'li' elements and not other node types
		const listItems = shortURLList.getElementsByTagName('li');
		shortURLList.removeChild(listItems[listItems.length-1]);
	}

	// Clear the input for new user input
	inputURL.value = '';
}

// Shortens submitted link
function shortenURL(e) {
	e.preventDefault();

	// Check submitted URL validity
	if (!inputURL.validity.valid) {
		inputURL.classList.add('input-error');
		inputURLErrorMessage.style.display = 'block';
	} else {
		inputURL.classList.remove('input-error');
		inputURLErrorMessage.style.display = 'none';

		// External API for link shortening
		let requestURL = new URL('https://api.shrtco.de/v2/shorten');
		const fullURL = inputURL.value.trim();
		requestURL.searchParams.set('url', fullURL);

		// Get data via Fetch API
		if (window.fetch) {
			fetch(requestURL, { method: 'GET', cache: 'no-cache' })
				.then(response => response.json())
				.then(data => {
					if (data.ok) {
						addURLToStorage(fullURL, data.result.full_short_link);
						createListItem(fullURL, data.result.full_short_link);
					}
				})
				.catch(err => console.error(err));
		}
		// Get data via XMLHttpRequest (Fallback)
		else {
			const sendRequest = (method, url) => {
				const promise = new Promise((resolve, reject) => {
					const xhr = new XMLHttpRequest();
					xhr.open(method, url);
					xhr.responseType = 'json';
					xhr.setRequestHeader('Cache-Control', 'no-cache');
					xhr.onload = () => {
						if (xhr.status >= 400) {
							reject(xhr.response);
						}
						resolve(xhr.response);
					};
					xhr.send();
				});
				return promise;
			};
			const getData = async () => {
				try {
					const response = await sendRequest('GET', requestURL);
					if (response.ok) {
						addURLToStorage(fullURL, response.result.full_short_link);
						createListItem(fullURL, response.result.full_short_link);
					}
				} catch (err) {
					console.error(err);
				}
			};
			getData();
		}
	}
}

const shortenURLButton = document.querySelector('#button-shorten-url');
shortenURLButton.addEventListener('click', shortenURL);

/* --- Window Load --- */

function initPage() {
	const storage = localStorage.getItem('shortening-urls');
	// If short URLs exist in storage, display them
	if (storage) {
		const urls = JSON.parse(storage);
		urls.forEach((url) => {
			createListItem(url.full, url.short);
		});
	}
}

window.addEventListener('load', initPage);