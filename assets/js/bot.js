const urlParams = new URLSearchParams(window.location.search);

let fishTank = urlParams.get('fishtank') || '';

let bttv = urlParams.get('bttv') || '';

let seventv = urlParams.get('7tv') || '';

let ffz = urlParams.get('ffz') || '';

let emoteSize = urlParams.get('size');

let customSize = parseInt(urlParams.get('customsize')) || 0;

let botUser = urlParams.get('bot') || '';

let effect = urlParams.get('effect') || '';

// default value if size is not set in url
if (!emoteSize) {
    emoteSize = 3;
}

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

const API_SERVER = 'https://twitchapi.teklynk.com';

// Dynamically get browser window width/height and set the #container.
$(document).ready(function () {
    $('#container').css({ 'height': window.innerHeight, 'width': window.innerWidth });
});

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

// BTTV emotes
if (bttv === 'true') {
    // https://gist.github.com/chuckxD/377211b3dd3e8ca8dc505500938555eb
    // Twitch API Gateway to lookup bttv emotes using the twitch channelName and user_id.
    $.getJSON(API_SERVER + "/getbttvemotes.php?channel=" + channelName, function (result) {
        bttvEmotes = result;
    });
}

function doBttvEmotes(chatMessage) {

    let bttvEmotesStr = '';

    let chatMessageArr = chatMessage.split(' ');

    chatMessageArr.forEach(function (item) {
        for (let x in bttvEmotes) {
            if (item === bttvEmotes[x]['code']) {
                bttvEmotesStr += 'https://cdn.betterttv.net/emote/' + bttvEmotes[x]['id'] + '/' + emoteScale(emoteSize) + 'x,';
            }
        }
    });

    bttvEmotesStr = bttvEmotesStr.slice(0, -1);

    return bttvEmotesStr;

}

// 7TV Emotes
if (seventv === 'true') {
    // Twitch API Gateway to lookup 7tv emotes using the twitch channelName and user_id.
    $.getJSON(API_SERVER + "/get7tvemotes.php?channel=" + channelName, function (result) {
        seventvEmotes = result;
    });
}

function do7tvEmotes(chatMessage) {

    let seventvEmotesStr = '';

    let chatMessageArr = chatMessage.split(' ');

    chatMessageArr.forEach(function (item) {
        for (let x in seventvEmotes) {
            if (item === seventvEmotes[x]['code']) {
                seventvEmotesStr += 'https://cdn.7tv.app/emote/' + seventvEmotes[x]['id'] + '/' + emoteScale(emoteSize) + 'x.webp,';
            }
        }
    });

    seventvEmotesStr = seventvEmotesStr.slice(0, -1);

    return seventvEmotesStr;

}

// FFZ Emotes
if (ffz === 'true') {
    // Twitch API Gateway to lookup ffz emotes using the twitch channelName and user_id.
    $.getJSON(API_SERVER + "/getffzemotes.php?channel=" + channelName, function (result) {
        ffzEmotes = result;
    });
}

function doffzEmotes(chatMessage) {

    let ffzEmotesStr = '';

    let chatMessageArr = chatMessage.split(' ');

    chatMessageArr.forEach(function (item) {
        for (let x in ffzEmotes) {
            if (item === ffzEmotes[x]['code']) {
                ffzEmotesStr += 'https://cdn.frankerfacez.com/emote/' + ffzEmotes[x]['id'] + '/2,';
            }
        }
    });

    ffzEmotesStr = ffzEmotesStr.slice(0, -1);

    return ffzEmotesStr;

}

const client = new tmi.Client({
    options: {
        debug: true,
        skipUpdatingEmotesets: true
    },
    connection: { reconnect: true },
    channels: [channelName]
});

client.connect().catch(console.error);

client.on('message', (channel, tags, message, self) => {

    let username = `${tags.username}`;

    if (botUser === username) {
        doEmotes(); // bot user only
    } else if (botUser === '') {
        doEmotes(); // all users
    }

    function doEmotes() {
        function randomFromTo(from, to) {
            return Math.floor(Math.random() * (to - from + 1) + from);
        }

        function moveRandom(obj) {
            /* get container position and size
             * -- access method : cPos.top and cPos.left */
            let cPos = $('#container').offset();
            let cHeight = $('#container').height();
            let cWidth = $('#container').width();

            // get box padding (assume all padding have same value)
            let pad = parseInt($('#container').css('padding-top').replace('px', ''));

            // get movable box size
            let bHeight = obj.height();
            let bWidth = obj.width();

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
                moveRandom(obj);
            });
        }

        let chatemotes = tags.emotes;

        // Ignore echoed messages.
        if (self) return;

        // If Twitch emotes
        let chatEmote = formatEmotes('', chatemotes, emoteScale);

        // Create emotes array
        let chatEmoteArr = chatEmote.split(',');
        chatEmoteArr = chatEmoteArr.filter(Boolean);

        let bttvStr = doBttvEmotes(message, emoteScale);

        let seventvStr = do7tvEmotes(message, emoteScale);

        let ffzStr = doffzEmotes(message, emoteScale);

        // Set a limit on how many emotes can be displayed from each message
        let limitedEmoteArr = chatEmoteArr.filter((val, i) => i < parseInt(emoteLimit));

        let BetterTTVEmoteArr = bttvStr.split(',');
        BetterTTVEmoteArr = BetterTTVEmoteArr.filter((val, i) => i < parseInt(emoteLimit));
        BetterTTVEmoteArr = BetterTTVEmoteArr.filter(Boolean);

        let SevenTVEmoteArr = seventvStr.split(',');
        SevenTVEmoteArr = SevenTVEmoteArr.filter((val, i) => i < parseInt(emoteLimit));
        SevenTVEmoteArr = SevenTVEmoteArr.filter(Boolean);

        let ffzEmoteArr = ffzStr.split(',');
        ffzEmoteArr = ffzEmoteArr.filter((val, i) => i < parseInt(emoteLimit));
        ffzEmoteArr = ffzEmoteArr.filter(Boolean);

        let effectsArray = ['fade', 'grow', 'rotate', 'skew'];

        if (limitedEmoteArr.length !== 0) {

            $.each(limitedEmoteArr, function (key, value) {
                if (value > "" || value !== null) {
                    let randomNumHeight = Math.floor(Math.random() * (window.innerHeight - 1 + 1)) + 1;
                    let randomNumWidth = Math.floor(Math.random() * (window.innerWidth - 1 + 1)) + 1;

                    // randomize location
                    let $emoteDiv = $("<div class='latestblock'><img src='" + value + "' /></div>").appendTo("#container").css({
                        top: randomNumHeight + 'px',
                        left: randomNumWidth + 'px'
                    });
                    let $emoteImg = $emoteDiv.find('img');

                    if (effect) {
                        let currentEffect = effect;
                        if (effect === 'random') {
                            currentEffect = effectsArray[Math.floor(Math.random() * effectsArray.length)];
                        }
                        $emoteImg.addClass(currentEffect);
                    }

                    if (fishTank === 'false' || fishTank === '' || !fishTank) {
                        $emoteImg.fadeIn(2000).delay(duration).fadeOut(2000, function () {
                            $emoteDiv.remove();
                        });
                    } else {
                        $emoteImg.fadeIn(animationSpeed);
                    }

                    moveRandom($emoteDiv);
                }
            });

        }

        if (bttv === 'true') {
            // BetterTTV Emotes
            if (BetterTTVEmoteArr.length !== 0) {

                $.each(BetterTTVEmoteArr, function (key, value) {
                    if (value > "" || value !== null) {
                        let randomNumHeight = Math.floor(Math.random() * (window.innerHeight - 1 + 1)) + 1;
                        let randomNumWidth = Math.floor(Math.random() * (window.innerWidth - 1 + 1)) + 1;

                        // randomize location
                        let $emoteDiv = $("<div class='latestblock'><img src='" + value + "' /></div>").appendTo("#container").css({
                            top: randomNumHeight + 'px',
                            left: randomNumWidth + 'px'
                        });
                        let $emoteImg = $emoteDiv.find('img');

                        if (effect) {
                            let currentEffect = effect;
                            if (effect === 'random') {
                                currentEffect = effectsArray[Math.floor(Math.random() * effectsArray.length)];
                            }
                            $emoteImg.addClass(currentEffect);
                        }

                        if (fishTank === 'false' || fishTank === '' || !fishTank) {
                            $emoteImg.fadeIn(2000).delay(duration).fadeOut(2000, function () {
                                $emoteDiv.remove();
                            });
                        } else {
                            $emoteImg.fadeIn(animationSpeed);
                        }

                        moveRandom($emoteDiv);
                    }
                });

            }
        }

        if (seventv === 'true') {
            // SevenTV Emotes
            if (SevenTVEmoteArr.length !== 0) {

                $.each(SevenTVEmoteArr, function (key, value) {
                    if (value > "" || value !== null) {
                        let randomNumHeight = Math.floor(Math.random() * (window.innerHeight - 1 + 1)) + 1;
                        let randomNumWidth = Math.floor(Math.random() * (window.innerWidth - 1 + 1)) + 1;

                        // randomize location
                        let $emoteDiv = $("<div class='latestblock'><img src='" + value + "' /></div>").appendTo("#container").css({
                            top: randomNumHeight + 'px',
                            left: randomNumWidth + 'px'
                        });
                        let $emoteImg = $emoteDiv.find('img');

                        if (effect) {
                            let currentEffect = effect;
                            if (effect === 'random') {
                                currentEffect = effectsArray[Math.floor(Math.random() * effectsArray.length)];
                            }
                            $emoteImg.addClass(currentEffect);
                        }

                        if (fishTank === 'false' || fishTank === '' || !fishTank) {
                            $emoteImg.fadeIn(2000).delay(duration).fadeOut(2000, function () {
                                $emoteDiv.remove();
                            });
                        } else {
                            $emoteImg.fadeIn(animationSpeed);
                        }

                        moveRandom($emoteDiv);
                    }
                });

            }
        }

        if (ffz === 'true') {
            // FFZ Emotes
            if (ffzEmoteArr.length !== 0) {

                $.each(ffzEmoteArr, function (key, value) {
                    if (value > "" || value !== null) {
                        let randomNumHeight = Math.floor(Math.random() * (window.innerHeight - 1 + 1)) + 1;
                        let randomNumWidth = Math.floor(Math.random() * (window.innerWidth - 1 + 1)) + 1;

                        // randomize location
                        let $emoteDiv = $("<div class='latestblock'><img src='" + value + "' /></div>").appendTo("#container").css({
                            top: randomNumHeight + 'px',
                            left: randomNumWidth + 'px'
                        });
                        let $emoteImg = $emoteDiv.find('img');

                        if (effect) {
                            let currentEffect = effect;
                            if (effect === 'random') {
                                currentEffect = effectsArray[Math.floor(Math.random() * effectsArray.length)];
                            }
                            $emoteImg.addClass(currentEffect);
                        }

                        if (fishTank === 'false' || fishTank === '' || !fishTank) {
                            $emoteImg.fadeIn(2000).delay(duration).fadeOut(2000, function () {
                                $emoteDiv.remove();
                            });
                        } else {
                            $emoteImg.fadeIn(animationSpeed);
                        }

                        moveRandom($emoteDiv);
                    }
                });

            }
        }

        //do this after dom latestblock have been created
        if (customSize > 0) {
            $(".latestblock, .latestblock img").css({
                'max-width': customSize + 'px',
                'max-height': customSize + 'px',
                'width': customSize + 'px',
                'height': customSize + 'px'
            });
        }

    }

});