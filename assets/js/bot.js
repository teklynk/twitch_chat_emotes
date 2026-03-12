$(document).ready(async function () {
    const urlParams = new URLSearchParams(window.location.search);

    // Function to randomly select a api server
    async function setRandomServer() {
        let serverArr = [];

        // Custom server url
        let apiServerUrl = (urlParams.get('apiServer') || '').toLowerCase().trim();

        if (apiServerUrl) {
            serverArr = [apiServerUrl];
        } else {
            serverArr = ["https://twitchapi.teklynk.com", "https://twitchapi.teklynk.dev", "https://twitchapi2.teklynk.dev"];
        }

        // set the api gateway servers 
        const servers = serverArr;

        // Shuffle the servers to try them in random order
        for (let i = servers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [servers[i], servers[j]] = [servers[j], servers[i]];
        }

        // Check the server status. If it is down, try the next server.
        for (const server of servers) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                await fetch(server, { method: 'HEAD', signal: controller.signal });
                clearTimeout(timeoutId);
                return server;
            } catch (error) {
                console.warn(`Server ${server} is unreachable. Trying next...`);
            }
        }
        return servers[0];
    }

    // Call the function
    const apiServer = await setRandomServer();

    let fishTank = urlParams.get('fishtank') || '';

    let bttv = urlParams.get('bttv') || '';

    let seventv = urlParams.get('7tv') || '';

    let ffz = urlParams.get('ffz') || '';

    let emoteSize = urlParams.get('size') || 2;

    let customSize = parseInt(urlParams.get('customsize')) || 0;

    let botUser = urlParams.get('bot') || '';

    let effect = urlParams.get('effect') || '';

    if (emoteSize !== 'random') {
        // convert size string to integer
        emoteSize = parseInt(emoteSize);
    }

    let animationSpeed = parseInt(urlParams.get('speed')) || 5000;

    let duration = parseInt(urlParams.get('duration')) || 5000;

    let channelName = (urlParams.get('channel') || '').toLowerCase().trim();

    if (channelName === '') {
        alert('Channel name is missing. Set ?channel=yourTwitchChannel in the URL and reload the browser');
    }

    let emoteLimit = parseInt(urlParams.get('emoteLimit')) || 50;

    let bttvEmotes = '';

    let seventvEmotes = '';

    let ffzEmotes = '';

    // Dynamically get browser window width/height and set the #container.
    $('#container').css({ 'height': window.innerHeight, 'width': window.innerWidth });

    // Apply custom size via a style block for efficiency
    if (customSize > 0) {
        let style = document.createElement('style');
        style.innerHTML =
            `.latestblock, .latestblock img {
                max-width: ${customSize}px;
                max-height: ${customSize}px;
                width: ${customSize}px;
                height: ${customSize}px;
            }`;
        document.head.appendChild(style);
    }
    function htmlEntities(html) {
        function it() {
            return html.map(function (n, i, arr) {

                if (n.length === 1) {
                    return n.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
                        return '&#' + i.charCodeAt(0) + ';';
                    });
                }

                return n;
            });
        }

        let isArray = Array.isArray(html);

        if (!isArray) {
            html = html.split('');
        }

        html = it(html);

        if (!isArray) html = html.join('');

        return html;
    }

    function getRandomNumberBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function emoteScale(emoteSize) {
        if (emoteSize === 'random') {
            return getRandomNumberBetween(1, 3);
        } else {
            return emoteSize;
        }
    }

    function formatEmotes(text, emotes) {
        let splitText = text.split('');
        for (let i in emotes) {
            let e = emotes[i];
            for (let j in e) {
                let mote = e[j];
                if (typeof mote === 'string') {
                    mote = mote.split('-');
                    mote = [parseInt(mote[0]), parseInt(mote[1])];
                    let length = mote[1] - mote[0],
                        empty = Array.apply(null, new Array(length + 1)).map(function () {
                            return ''
                        });
                    splitText = splitText.slice(0, mote[0]).concat(empty).concat(splitText.slice(mote[0] + 1, splitText.length));
                    splitText.splice(mote[0], 0, "https://static-cdn.jtvnw.net/emoticons/v2/" + i + "/default/dark/" + emoteScale(emoteSize) + ".0,");
                }
            }
        }
        return htmlEntities(splitText).join('')
    }

    async function fetchEmoteProvider(endpoint, providerName) {
        try {
            const response = await fetch(`${apiServer}/${endpoint}?channel=${channelName}`);
            if (!response.ok) {
                console.error(`Failed to fetch ${providerName} emotes: ${response.status} ${response.statusText}`);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error(`There was a problem fetching ${providerName} emotes:`, error);
            return null;
        }
    }

    // Fetch all enabled third-party emotes in parallel.
    (async () => {
        const emotePromises = [];
        if (bttv === 'true') {
            emotePromises.push(
                fetchEmoteProvider('getbttvemotes.php', 'BTTV')
                    .then(data => { bttvEmotes = data || bttvEmotes; })
            );
        }
        if (seventv === 'true') {
            emotePromises.push(
                fetchEmoteProvider('get7tvemotes.php', '7TV')
                    .then(data => { seventvEmotes = data || seventvEmotes; })
            );
        }
        if (ffz === 'true') {
            emotePromises.push(
                fetchEmoteProvider('getffzemotes.php', 'FFZ')
                    .then(data => { ffzEmotes = data || ffzEmotes; })
            );
        }
        // Wait for all fetches to settle.
        await Promise.all(emotePromises);
    })();

    function parseThirdPartyEmotes(chatMessage, emoteList, urlTemplate, size) {
        if (!emoteList) return '';

        let emoteStr = '';
        const chatMessageArr = chatMessage.split(' ');
        // Check if the template requires a size replacement.
        const requiresEmoteScale = urlTemplate.includes('{size}');

        chatMessageArr.forEach(function (word) {
            for (const i in emoteList) {
                const emote = emoteList[i];
                if (word === emote.code) {
                    let url = urlTemplate.replace('{id}', emote.id);
                    if (requiresEmoteScale) {
                        url = url.replace('{size}', emoteScale(size));
                    }
                    emoteStr += url + ',';
                }
            }
        });

        return emoteStr.slice(0, -1);
    }

    // Connect to Twitch chat using TMIjs
    const client = new tmi.Client({
        options: {
            debug: true,
            skipUpdatingEmotesets: true
        },
        connection: {
            reconnect: true,
            maxReconnectAttempts: 3
        },
        channels: [channelName]
    });

    client.connect().catch((err) => {
        console.error(err);
    });

    client.on("maxreconnect", () => {
        $("<div class='msg-error'>Failed to connect to Twitch Chat. Please refresh to try again. Twitch Access Token may have also expired.</div>").prependTo('body');
    });

    function randomFromTo(from, to) {
        return Math.floor(Math.random() * (to - from + 1) + from);
    }

    function moveRandom(obj) {
        /* get container position and size
        * -- access method : cPos.top and cPos.left */
        // If the emote has no size yet, wait a bit and try again.
        // This can happen if moveRandom is called before the image has loaded and rendered.
        let bHeight = obj.height();
        let bWidth = obj.width();
        if (bHeight === 0 || bWidth === 0) {
            setTimeout(function() { moveRandom(obj); }, 100);
            return;
        }

        let cPos = $('#container').offset();
        let cHeight = $('#container').height();
        let cWidth = $('#container').width();

        // get box padding (assume all padding have same value)
        let pad = parseInt($('#container').css('padding-top').replace('px', ''));

        // get movable box size
        // set maximum position
        let maxY = cPos.top + cHeight - bHeight - pad;
        let maxX = cPos.left + cWidth - bWidth - pad;

        // set minimum position
        let minY = cPos.top + pad;
        let minX = cPos.left + pad;

        // set new position
        let newY = randomFromTo(minY, maxY);
        let newX = randomFromTo(minX, maxX);

        let newAnimationSpeed = randomFromTo(animationSpeed * 0.75, animationSpeed * 1.5);

        obj.animate({
            top: newY,
            left: newX
        }, newAnimationSpeed, function () {
            if (!obj.data('fading')) {
                moveRandom(obj);
            }
        });
    }

    function createEmote(emoteUrl) {
        if (!emoteUrl || emoteUrl.trim() === '') {
            return;
        }

        let randomNumHeight = Math.floor(Math.random() * (window.innerHeight - 1 + 1)) + 1;
        let randomNumWidth = Math.floor(Math.random() * (window.innerWidth - 1 + 1)) + 1;

        // randomize location
        let $emoteDiv = $("<div class='latestblock'><img src='" + emoteUrl + "' /></div>").appendTo("#container").css({
            top: randomNumHeight + 'px',
            left: randomNumWidth + 'px'
        });
        let $emoteImg = $emoteDiv.find('img');

        if (effect) {
            let currentEffect = effect;
            const effectsArray = ['fade', 'grow', 'rotate', 'skew'];
            if (effect === 'random') {
                currentEffect = effectsArray[Math.floor(Math.random() * effectsArray.length)];
            }
            $emoteImg.addClass(currentEffect);
        }

        if (fishTank === 'false' || fishTank === '' || !fishTank) {
            $emoteImg.fadeIn(2000);
            moveRandom($emoteDiv);
            setTimeout(function () {
                $emoteDiv.data('fading', true);
                // Animate opacity to fade out, without queueing, so it runs in parallel with movement.
                $emoteDiv.animate({
                    opacity: 0
                }, {
                    duration: 2000,
                    queue: false,
                    complete: function () {
                        $(this).remove();
                    }
                });
            }, 2000 + duration);
        } else {
            $emoteImg.fadeIn(animationSpeed);
            moveRandom($emoteDiv);
        }
    }

    function doEmotes(channel, tags, message, self) {
        // Ignore echoed messages.
        if (self) return;

        // If Twitch emotes
        let chatEmote = formatEmotes('', tags.emotes, emoteSize);
        let chatEmoteArr = chatEmote.split(',');

        // 3rd Party Emotes
        let bttvEmoteArr = [];
        if (bttv === 'true') {
            const bttvStr = parseThirdPartyEmotes(message, bttvEmotes, 'https://cdn.betterttv.net/emote/{id}/{size}x', emoteSize);
            bttvEmoteArr = bttvStr.split(',');
        }

        let seventvEmoteArr = [];
        if (seventv === 'true') {
            const seventvStr = parseThirdPartyEmotes(message, seventvEmotes, 'https://cdn.7tv.app/emote/{id}/{size}x.webp', emoteSize);
            seventvEmoteArr = seventvStr.split(',');
        }

        let ffzEmoteArr = [];
        if (ffz === 'true') {
            // FFZ emotes use a hardcoded size in the URL (e.g., /2, /4)
            const ffzStr = parseThirdPartyEmotes(message, ffzEmotes, 'https://cdn.frankerfacez.com/emote/{id}/2', emoteSize);
            ffzEmoteArr = ffzStr.split(',');
        }

        // Combine all emotes from the message, filter out empty strings, and then apply the limit.
        const allEmotes = []
            .concat(chatEmoteArr, bttvEmoteArr, seventvEmoteArr, ffzEmoteArr)
            .filter(Boolean)
            .slice(0, parseInt(emoteLimit));

        // Create emote elements on the screen
        $.each(allEmotes, function (key, emoteUrl) {
            createEmote(emoteUrl);
        });
    }

    client.on('message', (channel, tags, message, self) => {
        let username = `${tags.username}`;

        if (botUser === username) {
            doEmotes(channel, tags, message, self); // bot user only
        } else if (botUser === '') {
            doEmotes(channel, tags, message, self); // all users
        }
    });

});