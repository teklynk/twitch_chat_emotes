# Twitch chat emotes animated overlay

## What is this?

This is a Twitch OBS overlay that displays emotes from Twitch chat. Emotes fly across the screen or stay on screen and
pile up. Tested with 1000 emotes on screen at the same time. Emotes first appear from a random location on the screen
and randomly move across the screen.

## Example Videos

![Standard Mode](https://github.com/teklynk/twitch_chat_emotes/blob/master/sample_standard.gif?raw=true "Standard Mode")

![Fishtank Mode](https://github.com/teklynk/twitch_chat_emotes/blob/master/sample_fishtank.gif?raw=true "Fishtank Mode")

### Try it!

[https://twitch-chat-emotes.pages.dev/](https://twitch-chat-emotes.pages.dev/)

## URL parameters

***speed***=transition speed, as well as fade-in/fade-out speed (milliseconds value. 5000 = 5 seconds)

***duration***=how long the emotes stay on screen (milliseconds value. 5000 = 5 seconds)

***channel***=your main twitch channel

***bot*** (optional)=If set, this will only display emotes from the bot account/user. Great for alerts that use a bot
account.

***size***=1,2,3 Twitch emotes come in 3 different sizes. 28x28, 56x56, 112x112. Default is 3 (112x112). Changing this
can help performance.

***customsize***=pixel value. (ie: 200 = 200px)

***fishtank***=true/false If **fishtank=true**, emotes will persist on screen until you refresh the browser source in
OBS. You can refresh the browser source by clicking "Refresh cache of current page" in the browser source properties.

http://example.com/bot.html?channel=MrStreamer&speed=5000&duration=15000&size=3&customsize=150&fishtank=false

## How do I use this?

* Add URL as a browser source in OBS.

* Set the width and height to 1920x1080.

* Be sure that channel= is set to your Twitch channel.

* Try to avoid using a speed less than 5000 (5 seconds)

### Modify the CSS by adding this to the CSS section in your OBS browser source.

```
#container {
    width: 1920px;
    height: 1080px;
    padding: 0;
    margin: 0;
}

.latestblock,
.latestblock img {
    max-width: 112px;
    max-height: 112px;
    min-width: 28px;
    min-height: 28px;
}
```

# Setup:

Just clone or [download](https://github.com/teklynk/twitch_chat_emotes/archive/refs/heads/master.zip) the repo and
open "bot.html" in your browser. **No web server needed!** Everything runs client-side using plain old javascript, html
and css.

You can even set /filepath/twitch-chat-emotes/bot.html as the browser source by clicking "Local File" in your OBS
browser source properties.