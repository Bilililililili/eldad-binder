var siteData;

const managementSheet = 'https://docs.google.com/spreadsheets/d/1PXbL9Ucf8s4-4seusrccddy33aeo8y5YmQ7WQ2nydjc/gviz/tq';

async function readManagementRows(gid) {
    const url = new URL(managementSheet);
    const callback = 'binderSheet';
    url.search = new URLSearchParams({ gid, headers: 1, tq: 'select A,B,C,D,E', tqx: 'out:json;responseHandler:' + callback });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
        const response = await fetch(url, { credentials: 'omit', signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Management sheet unavailable');
        const body = (await response.text()).trim();
        const prefix = '/*O_o*/\n' + callback + '(';
        if (!body.startsWith(prefix) || !body.endsWith(');')) throw new Error('Invalid management sheet format');
        const result = JSON.parse(body.slice(prefix.length, -2));
        if (result.status !== 'ok' || !Array.isArray(result.table?.rows)) throw new Error('Invalid management rows');
        return result.table.rows.map(row => row.c.map(cell => String(cell?.v ?? '').trim()));
    } finally {
        clearTimeout(timeout);
    }
}

function embedUrl(source) {
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Use an HTTPS source');
    if (url.hostname === 'docs.google.com') {
        const doc = url.pathname.match(/^\/document\/d\/([\w-]+)/);
        const slides = url.pathname.match(/^\/presentation\/d\/([\w-]+)/);
        if (doc) return url.origin + '/document/d/' + doc[1] + '/preview';
        if (slides) return url.origin + '/presentation/d/' + slides[1] + '/embed?start=false';
    }
    if (url.hostname === 'vimeo.com' && /^\/\d+\/?$/.test(url.pathname)) {
        return 'https://player.vimeo.com/video/' + url.pathname.split('/')[1];
    }
    if (url.origin === window.location.origin) throw new Error('Use the original source address');
    return url.href;
}

async function applyManagementSheet(fallback) {
    try {
        const [visible, hidden] = await Promise.all([readManagementRows('1663950710'), readManagementRows('729104220')]);
        const menu = Object.create(null);
        const routes = Object.create(null);
        const labels = Object.create(null);
        const usedNames = new Set();
        const clownChildren = [];
        let home;
        for (const [name, source, group, type, key] of [...visible, ...hidden]) {
            if (!name || !source || !key || Object.hasOwn(routes, key)) continue;
            let target;
            try { target = embedUrl(source); } catch (_) { continue; }
            const inMenu = group === 'תפריט ראשי' || group === 'תחת הליצן איקס';
            if (inMenu && usedNames.has(name)) continue;
            routes[key] = target;
            if (!inMenu) continue;
            usedNames.add(name);
            menu[key] = target;
            labels[key] = name;
            if (group === 'תחת הליצן איקס') clownChildren.push(name);
            if (type === 'ראשי' && group === 'תפריט ראשי') home = key;
        }
        if (!home || !Object.hasOwn(menu, 'הליצן איקס')) return fallback;
        return { ...fallback, menu, routes, labels, home, clownChildren };
    } catch (_) {
        return fallback;
    }
}



$(function() {

	//load the json
	$.get( "info.json", function( data ) {

		//did it load json data as string or as an object?
		if (typeof data == "string")
			data = $.parseJSON(data);

		applyManagementSheet(data).then(function (data) {
		siteData = data;

		//create the title
		document.title = data.title; 
		
		//create the navigation
		var links = $('#navigation');
		Object.keys(data.menu).forEach(function (key) {
            const label = data.labels?.[key] || key;
            const link = $('<a>').attr('href', '#' + encodeURIComponent(key)).text(label);
            $('<li class="menu-item">').append(link).appendTo(links);
        });

		//create the about section
		var about = $('.about');
		about.html(data.about);

		//load the google doc
		locationHashChanged();

		$('#menu-open').click(function(){
			$("#navigation").toggle();
			$("#menu").toggleClass("border");
		});

		$("#menu").draggable({ cancel: "li" });
    	// $( "div, p" ).disableSelection();
        });
	});

    // Keep navigation from getting borked when dragged on wider views
    // and reset it gracefully when transitioning to narrower views
    // 768 matches the CSS mobile breakpoint, if you change it here
    // change it in the CSS as well. Thanks!
    //
    // N.B. If touch-punch is imported, this doesn't prevent moving the menu
    // around on touch devices. If you don't like that remove touch-punch.
    $(window).resize(function() {
        if(window.innerWidth < 768) {
            $("#menu").draggable('disable').attr('style','');
        } else if(window.innerWidth > 768) {
            $("#menu").draggable('enable');
            $("#navigation").attr('style','');
        };
    });
	
	//little fix for the iframe size on mobile
	//mobile hack
	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
 		mobile = true;
        // Add body class to target styles for touch devices with CSS
        $('body').addClass('touch-device');
	}

});

function locationHashChanged() {
	var item = window.location.hash;
	item = item.replace('#','');
	item = decodeURI(item);//thanks Eran! 
	$('li a').removeClass('active');

	if (siteData.routes && Object.hasOwn(siteData.routes, item)) {
        $('#backgrnd').attr('src', siteData.routes[item]);
        markMenuItem(item);
    } else if (item === 'wikipedia') {
        $('#backgrnd').attr('src', 'https://he.wikipedia.org/wiki/%D7%90%D7%9C%D7%93%D7%93_%D7%A4%D7%A8%D7%99%D7%91%D7%A1');
    } else if (item === 'agency') {
        $('#backgrnd').attr('src', 'https://www.zohar-agency.com/actor/%D7%90%D7%9C%D7%93%D7%93-%D7%A4%D7%A8%D7%99%D7%91%D7%A1/');
    } else if (item === 'himalaya') {
        $('#backgrnd').attr('src', 'https://player.vimeo.com/video/912989415');
    } else if (item === 'red-nose') {
        $('#backgrnd').attr('src', 'https://www.cultureunplugged.com/documentary/watch-online/play/9611/red-nose');
    } else if (siteData.menu.hasOwnProperty(item)){
		$('#backgrnd').attr('src', siteData.menu[item]);
		markMenuItem(item);
	} else {
		//load the first one
		const home = siteData.home || Object.keys(siteData.menu)[0];
        $('#backgrnd').attr('src', siteData.menu[home]);
        markMenuItem(home);
	}
}

function markMenuItem(key) {
    $('#navigation a').filter(function () {
        return this.getAttribute('href') === '#' + encodeURIComponent(key);
    }).addClass('active');
}

window.onhashchange = function () {
    if (siteData) locationHashChanged();
};
