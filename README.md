<h1 align='center'>
  ReactBitPlayer
</h1>

<p align='center'>
  <a href='https://www.npmjs.com/package/react-player'><img src='https://img.shields.io/npm/v/react-bit-player.svg' alt='Latest npm version'></a>
  <a href='https://github.com/Prabin1025y/react-bit-player/blob/main/LICENSE'><img src='https://img.shields.io/npm/l/react-bit-player.svg' alt='Test Coverage'></a>
</p>

<p align='center'>
  An easy-to-use React video player component built on top of  <a href="https://www.npmjs.com/package/react-player">ReactPlayer</a>, featuring a beautiful UI with modern controls. Perfect for embedding YouTube, Vimeo, or local videos with minimal setup.
</p>

---

### 🔗 Live Demo

Check out the live demo here: 
***Coming soon*** 
<!-- 👉 [Example Website](https://your-example-site.com)-->

See the player in action and explore its features in a real-world setup!


### Usage

```bash
npm install react-bit-player
```

```jsx
import React from 'react';
import ReactBitPlayer from 'react-bit-player';

const  App  = () => {
const  playerRef  =  useRef<HTMLVideoElement  |  null>(null)

return (
	<div style={{ width:  '50vw', height:  '40vh' }}>
		<ReactBitPlayer 
			src='https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8' 
			ref={playerRef} 
		/>
	</div>
)};
export  default  App;

```

### Props
> Since this is wrapped around ReactPlayer, you have access to all ReactPlayer props along with few exclusive to ReactBitPlayer

### ReactBitPlayer Exclusive Props
Prop | Description | Default
---- | ----------- | -------
`subtitles` | An array of subtitles tracks of type `Subtitle (see type section)` | `[]`
`seekBarColor` | Color for played section of seekbar. Loaded color also derives from here. Accepts Css color notation. | `cyan`
`volumeBarColor` | Color for volume bar. | `yellow`
`playbackRates` | An array of all playback rates available. | `[ '0.5', '0.75', '1.0', '1.25', '1.5', '2.0' ]`
`ref` | A ref to internal video element of type `RefObject<HTMLVideoElement  |  null>`. See example usage above. | `null`

#### Subtitle type
Subtitle prop should be an array of type 
```js
lang: "string",
url: "string"
```
Also only vtt type is supported for now.
```jsx
const captions = [
	{lang: "English", url: "https://path-to-english-subtitle.vtt"},
	{lang: "Spanish", url: "https://path-to-spanish-subtitle.vtt"},
]

<ReactBitPlayer src="xyz.m3u8" subtitles={captions}/>
```

### ReactPlayer Props (Copied from <a href="https://www.npmjs.com/package/react-player">ReactPlayer</a> docs)

Prop | Description | Default
---- | ----------- | -------
`src` | The url of a video or song to play | `undefined`
`playing` | Set to `true` or `false` to play or pause the media | `undefined`
`preload` | Applies the `preload` attribute where supported | `undefined`
`playsInline` | Applies the `playsInline` attribute where supported | `false`
`crossOrigin` | Applies the `crossOrigin` attribute where supported | `undefined`
`loop` | Set to `true` or `false` to loop the media | `false`
`volume` | Set the volume of the player, between `0` and `1`<br/>&nbsp; ◦ &nbsp;`null` uses default volume on all players [`#357`](https://github.com/cookpete/react-player/issues/357) | `null`
`muted` | Mutes the player | `false`
`playbackRate` | Set the playback rate of the player<br />&nbsp; ◦ &nbsp;Only supported by YouTube, Wistia, and file paths | `1`
`width` | Set the width of the player | `320px`
`height` | Set the height of the player | `180px`
`style` | Add [inline styles](https://facebook.github.io/react/tips/inline-styles.html) to the root element | `{}`
`light` | Set to `true` to show just the video thumbnail, which loads the full player on click<br />&nbsp; ◦ &nbsp;Pass in an image URL to override the preview image | `false`
`fallback` | Element or component to use as a fallback if you are using lazy loading | `null`
`wrapper` | Element or component to use as the container element | `null`
`playIcon` | Element or component to use as the play icon in light mode
`previewTabIndex` | Set the tab index to be used on light mode | `0`

#### Callback props

Callback props take a function that gets fired on various player events:

Prop | Description
---- | -----------
`onClickPreview` | Called when user clicks the `light` mode preview
`onReady` | Called when media is loaded and ready to play. If `playing` is set to `true`, media will play immediately
`onStart` | Called when media starts playing
`onPlay` | Called when the `playing` prop is set to true
`onPlaying` | Called when media actually starts playing
`onProgress` | Called when media data is loaded
`onTimeUpdate` | Called when the media's current time changes
`onDurationChange` | Callback containing duration of the media, in seconds
`onPause` | Called when media is paused
`onWaiting` | Called when media is buffering and waiting for more data
`onSeeking` | Called when media is seeking
`onSeeked` | Called when media has finished seeking
`onRateChange` | Called when playback rate of the player changed<br />&nbsp; ◦ &nbsp;Only supported by YouTube, Vimeo ([if enabled](https://developer.vimeo.com/player/sdk/reference#playbackratechange)), Wistia, and file paths
`onEnded` | Called when media finishes playing<br />&nbsp; ◦ &nbsp;Does not fire when `loop` is set to `true`
`onError` | Called when an error occurs whilst attempting to play media
`onEnterPictureInPicture` | Called when entering picture-in-picture mode
`onLeavePictureInPicture` | Called when leaving picture-in-picture mode

#### Config prop

There is a single `config` prop to override settings for each type of player:

```jsx
<ReactPlayer
  src={src}
  config={{
    youtube: {
      color: 'white',
    },
  }}
/>
```

Settings for each player live under different keys:

Key | Options
--- | -------
`youtube` | https://developers.google.com/youtube/player_parameters#Parameters
`vimeo` | https://developer.vimeo.com/player/sdk/embed
`hls` | https://github.com/video-dev/hls.js/blob/master/docs/API.md#fine-tuning


### Supported media

* [Supported file types](https://developer.mozilla.org/en-US/docs/Web/HTML/Supported_media_formats) are playing using [`<video>`](https://developer.mozilla.org/en/docs/Web/HTML/Element/video) or [`<audio>`](https://developer.mozilla.org/en/docs/Web/HTML/Element/audio) elements
* HLS streams are played using [`hls.js`](https://github.com/video-dev/hls.js)
* DASH streams are played using [`dash.js`](https://github.com/Dash-Industry-Forum/dash.js)
* Mux videos use the [`<mux-player>`](https://github.com/muxinc/elements/blob/main/packages/mux-player/README.md) element
* YouTube videos use the [YouTube iFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
* Vimeo videos use the [Vimeo Player API](https://developer.vimeo.com/player/sdk)
* Wistia videos use the [Wistia Player API](https://wistia.com/doc/player-api)


### 🤝 Contributing

Contributions are welcome!  
If you'd like to improve this project, feel free to fork the repo, make your changes, and open a pull request.

For major changes, please open an issue first to discuss what you'd like to change.

Let's build better together! 🚀
<a href="https://github.com/Prabin1025y/react-bit-player">Contribute here</a>

## Contributors ✨


<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/Prabin1025y"><img src="https://avatars.githubusercontent.com/u/109074721?v=4" width="80px;" alt="" style="border-radius:50%" /><br /><sub><b>Prabin1025y</b></sub></a><br />
  </tr>
</table>
<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->