function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    let results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

let fishTank = getUrlParameter('fishtank');

let bttv = getUrlParameter('bttv');

let seventv = getUrlParameter('7tv');

let ffz = getUrlParameter('ffz');

let emoteSize = getUrlParameter('size');

let customSize = getUrlParameter('customsize');
customSize = parseInt(customSize);

let botUser = getUrlParameter('bot');

let effect = getUrlParameter('effect');

if (!effect) {
    effect = '';
}

// default value if size is not set in url
if (!emoteSize) {
    emoteSize = 3;
}

if (emoteSize !== 'random') {
    // convert size string to integer
    emoteSize = parseInt(emoteSize);
}

let animationSpeed = getUrlParameter('speed');

// default value if speed is not set in url
if (!animationSpeed) {
    animationSpeed = 5000;
}

// convert animationSpeed string to integer
animationSpeed = parseInt(animationSpeed);

let duration = getUrlParameter('duration');
duration = parseInt(duration);

if (!duration) {
    duration = 5000;
}

let channelName = getUrlParameter('channel');

if (channelName === '') {
    alert('Channel name is missing. Set ?channel=yourTwitchChannel in the URL and reload the browser');
}

let emoteLimit = getUrlParameter('emoteLimit');

if (!emoteLimit) {
    emoteLimit = 50;
}

let bttvEmotes = '';

let seventvEmotes = '';

let ffzEmotes = '';

// Dynamically get browser window width/height and set the #container.
$(document).ready(function() {
    $('#container').css({'height':window.innerHeight, 'width':window.innerWidth});
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
    return Math.floor(Math.random()*(max-min+1)+min);
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
    $.getJSON("https://twitchapi.teklynk.com/getbttvemotes.php?channel=" + channelName, function (result) {
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
    $.getJSON("https://twitchapi.teklynk.com/get7tvemotes.php?channel=" + channelName, function (result) {
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
    $.getJSON("https://twitchapi.teklynk.com/getffzemotes.php?channel=" + channelName, function (result) {
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

function fadeInOut(item) {
    item.fadeIn(2000).delay(duration).fadeOut(2000, function () {
        if (item.next().length) {
            fadeInOut(item.next());
        } else {
            fadeInOut(item.siblings(':first'));
        }
        $('.latestblock:first-child').remove();
    });
}

const client = new tmi.Client({
    options: {
        debug: true,
        skipUpdatingEmotesets: true
    },
    connection: {reconnect: true},
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
        let randomNumHeight = Math.floor(Math.random() * (window.innerHeight - 1 + 1)) + 1;
        let randomNumWidth = Math.floor(Math.random() * (window.innerWidth - 1 + 1)) + 1;
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

        let randomEffect;
        let effectsArray = ['fade','grow','rotate','skew'];

        if (effect === 'random') {
            randomEffect = effectsArray[Math.floor(Math.random()*effectsArray.length)];
        }

        // Debugging
        //console.log(limitedEmoteArr);

        if (limitedEmoteArr.length !== 0) {

            $.each(limitedEmoteArr, function (key, value) {
                if (value > "" || value !== null) {

                    // randomize location
                    $("<div class='latestblock'><img src='" + value + "' /></div>").appendTo("#container").css({
                        top: randomNumHeight + 'px',
                        left: randomNumWidth + 'px'
                    });

                    if (effect) {
                        if (effect === 'random') {
                            console.log(randomEffect);
                            $('.latestblock img:first-child').addClass(randomEffect);
                        } else {
                            $('.latestblock img:first-child').addClass(effect);
                        }
                    }

                    if (fishTank === 'false' || fishTank === '' || !fishTank) {
                        fadeInOut($('.latestblock img:first-child'));
                    } else {
                        $('.latestblock img').fadeIn(animationSpeed);
                    }

                }
            });

        }

        if (bttv === 'true') {
            // BetterTTV Emotes
            if (BetterTTVEmoteArr.length !== 0) {

                $.each(BetterTTVEmoteArr, function (key, value) {
                    if (value > "" || value !== null) {

                        // randomize location
                        $("<div class='latestblock'><img src='" + value + "' /></div>").appendTo("#container").css({
                            top: randomNumHeight + 'px',
                            left: randomNumWidth + 'px'
                        });

                        if (effect) {
                            $('.latestblock img:first-child').addClass(effect);
                        }

                        if (fishTank === 'false' || fishTank === '' || !fishTank) {
                            fadeInOut($('.latestblock img:first-child'));
                        } else {
                            $('.latestblock img').fadeIn(animationSpeed);
                        }

                    }
                });

            }
        }

        if (seventv === 'true') {
            // SevenTV Emotes
            if (SevenTVEmoteArr.length !== 0) {

                $.each(SevenTVEmoteArr, function (key, value) {
                    if (value > "" || value !== null) {

                        // randomize location
                        $("<div class='latestblock'><img src='" + value + "' /></div>").appendTo("#container").css({
                            top: randomNumHeight + 'px',
                            left: randomNumWidth + 'px'
                        });

                        if (effect) {
                            $('.latestblock img:first-child').addClass(effect);
                        }

                        if (fishTank === 'false' || fishTank === '' || !fishTank) {
                            fadeInOut($('.latestblock img:first-child'));
                        } else {
                            $('.latestblock img').fadeIn(animationSpeed);
                        }

                    }
                });

            }
        }

        if (ffz === 'true') {
            // FFZ Emotes
            if (ffzEmoteArr.length !== 0) {

                $.each(ffzEmoteArr, function (key, value) {
                    if (value > "" || value !== null) {

                        // randomize location
                        $("<div class='latestblock'><img src='" + value + "' /></div>").appendTo("#container").css({
                            top: randomNumHeight + 'px',
                            left: randomNumWidth + 'px'
                        });

                        if (effect) {
                            $('.latestblock img:first-child').addClass(effect);
                        }

                        if (fishTank === 'false' || fishTank === '' || !fishTank) {
                            fadeInOut($('.latestblock img:first-child'));
                        } else {
                            $('.latestblock img').fadeIn(animationSpeed);
                        }

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
            maxY = cPos.top + cHeight - bHeight - pad;
            maxX = cPos.left + cWidth - bWidth - pad;

            // set minimum position
            minY = cPos.top + pad;
            minX = cPos.left + pad;

            // set new position
            newY = randomFromTo(minY, maxY);
            newX = randomFromTo(minX, maxX);

            obj.animate({
                top: newY,
                left: newX
            }, animationSpeed, function () {
                moveRandom(obj);
            });
        }

        $('.latestblock').each(function () {
            moveRandom($(this));
        });
    }

});