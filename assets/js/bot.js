function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    let results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

let fishTank = getUrlParameter('fishtank');

let emoteSize = getUrlParameter('size');

let customSize = getUrlParameter('customsize');
customSize = parseInt(customSize);

let botUser = getUrlParameter('bot');

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
            if (typeof mote == 'string') {
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

function fadeInOut(item) {
    item.fadeIn(1000).delay(duration).fadeOut(1000, function () {
        if (item.next().length) {
            fadeInOut(item.next());
        } else {
            fadeInOut(item.siblings(':first'));
        }
        $('.latestblock:first-child').remove();
    });

}

const client = new tmi.Client({
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
        let randomNum = Math.floor((Math.random() * 1000) + 1);
        let chatemotes = tags.emotes;

        // Ignore echoed messages.
        if (self) return;

        let chatEmote = formatEmotes('', chatemotes);

        let chatEmoteArr = chatEmote.split(',');
        chatEmoteArr = chatEmoteArr.filter(Boolean);

        if (chatEmoteArr.length !== 0) {

            $.each(chatEmoteArr, function (key, value) {
                if (value !== "" || value !== null) {

                    $("<div class='latestblock'><img src=" + value + " /></div>").appendTo("#container").css({
                        top: randomNum + 'px',
                        left: randomNum + 'px'
                    });

                    if (fishTank === 'false' || fishTank === '' || !fishTank) {
                        fadeInOut($('.latestblock img:first-child'));
                    } else {
                        $('.latestblock img').fadeIn(animationSpeed);
                    }

                }
            });

        }

        //do this after dom latestblock have been created
        if (customSize) {
            $(".latestblock, .latestblock img").css({'max-width': customSize + 'px', 'max-height': customSize + 'px', 'width': customSize + 'px', 'height': customSize + 'px'});
        }

        function randomFromTo(from, to) {
            return Math.floor(Math.random() * (to - from + 1) + from);
        }

        function moveRandom(obj) {
            /* get container position and size
             * -- access method : cPos.top and cPos.left */
            var cPos = $('#container').offset();
            var cHeight = $('#container').height();
            var cWidth = $('#container').width();

            // get box padding (assume all padding have same value)
            var pad = parseInt($('#container').css('padding-top').replace('px', ''));

            // get movable box size
            var bHeight = obj.height();
            var bWidth = obj.width();

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