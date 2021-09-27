# Twitch chat emotes animated overlay

# Meat of the project
[bot.js](https://raw.githubusercontent.com/teklynk/twitch_chat_emotes/master/assets/js/bot.js)

# URL parameters

***speed***=transition speed, as well as fade-in/fade-out speed

***channel***=your main twitch channel

***size***=1,2,3

* Twitch emotes come in 3 different sizes. 28x28, 56x56, 112x112. Default is 3 (112x112). Changing this can help performance. 

***fishtank***=true/false

* if **fishtank=true**, emotes will persist on screen until you refresh the browser source in OBS. 
You can refresh the browser source by clicking "Refresh cache of current page" in the browser source properties.

***customsize***=pixel size 

http://example.com/bot.html?channel=MrStreamer&speed=5000&size=3&fishtank=true

# Example Videos
* [sample1 video - Standard: fade-in/fade-out effect](https://github.com/teklynk/twitch_chat_emotes/blob/master/sample_standard.mp4?raw=true)

* [sample2 video - Fishtank: persistent emotes effects](https://github.com/teklynk/twitch_chat_emotes/blob/master/sample_fishtank.mp4?raw=true)

# How do I use this?
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

Just clone or [download](https://github.com/teklynk/twitch_chat_emotes/archive/refs/heads/master.zip) the repo and open "bot.html" in your browser. **No web server needed!** Everything runs client-side using plain old javascript, html and css.

You can even set /filepath/twitch-chat-emotes/bot.html as the browser source by clicking "Local File" in your OBS browser source properties.

# Try it!
[https://twitch-chat-emotes.pages.dev/](https://twitch-chat-emotes.pages.dev/)