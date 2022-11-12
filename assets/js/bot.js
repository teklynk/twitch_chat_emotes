function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    let results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

let fishTank = getUrlParameter('fishtank');

let bttv = getUrlParameter('bttv');

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

// convert emoteQuality string to integer
emoteSize = parseInt(emoteSize);

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
                splitText.splice(mote[0], 0, "https://static-cdn.jtvnw.net/emoticons/v2/" + i + "/default/dark/" + emoteSize + ".0,");
            }
        }
    }
    return htmlEntities(splitText).join('')
}

if (bttv === 'true') {
    // https://gist.github.com/chuckxD/377211b3dd3e8ca8dc505500938555eb
    // Twitch API Gateway to lookup bttv emotes using the twitch channelName and user_id.
    $.getJSON("https://twitchapi.teklynk.com/getbttvemotes.php?channel=" + channelName, function (result) {
        bttvEmotes = result['sharedEmotes'];
    });
}

function doBttvEmotes(chatMessage, emoteSize) {

    let bttvEmotesStr = '';

    let chatMessageArr = chatMessage.split(' ');

    chatMessageArr.forEach(function (item) {
        for (let x in bttvEmotes) {
            if (item === bttvEmotes[x]['code']) {
                bttvEmotesStr += 'https://cdn.betterttv.net/emote/' + bttvEmotes[x]['id'] + '/' + emoteSize + 'x,';
            }
        }
    });

    bttvEmotesStr = bttvEmotesStr.slice(0, -1);

    return bttvEmotesStr;

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
        let chatEmote = formatEmotes('', chatemotes);

        // Create emotes array
        let chatEmoteArr = chatEmote.split(',');
        chatEmoteArr = chatEmoteArr.filter(Boolean);

        let bttvStr = doBttvEmotes(message, emoteSize);

        // Set a limit on how many emotes can be displayed from each message
        let limitedEmoteArr = chatEmoteArr.filter((val, i) => i < parseInt(emoteLimit));

        let BetterTTVEmoteArr = bttvStr.split(',');
        BetterTTVEmoteArr = BetterTTVEmoteArr.filter((val, i) => i < parseInt(emoteLimit));

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