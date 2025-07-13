import { Expand, Loader2, Minimize, Pause, PictureInPicture, Play, Volume2, VolumeOff } from 'lucide-react';
import { TbRewindBackward10, TbRewindForward10 } from "react-icons/tb";
import { MdSpeed } from "react-icons/md";
import { FaClosedCaptioning } from "react-icons/fa6";

import React, { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import ReactPlayer from 'react-player';
import { formatTime, parseVTT } from './utils';
import Slider from './components/Slider';
import Table from './Table';
import './global.css';

type ReactBitPlayerProps = {
    src: string;
    subtitles?: { lang: string, url: string }[];
    seekBarColor?: string;
    volumeBarColor?: string;
    playbackRates?: string[];
    playing?: boolean;
    videoRef?: RefObject<HTMLVideoElement | null>;
}

const ReactBitPlayer = (
    {
        src: propSrc,
        subtitles: propSubtitles = [],
        seekBarColor = 'cyan',
        volumeBarColor = 'yellow',
        playbackRates = ['0.5', '0.75', '1.0', '1.25', '1.5', '2.0'],
        playing: propPlaying = true,
        videoRef
    }: ReactBitPlayerProps
) => {
    const playerRef = useRef<HTMLVideoElement | null>(null);

    const captionButtonRef = useRef<HTMLSpanElement | null>(null);
    const playbackButtonRef = useRef<HTMLSpanElement | null>(null);
    const captionTableRef = useRef<HTMLDivElement | null>(null);
    const playbackTableRef = useRef<HTMLDivElement | null>(null);
    const playerContainerRef = useRef<HTMLDivElement | null>(null);

    const initialState = {
        src: undefined,
        pip: false,
        playing: propPlaying,
        controls: false,
        light: false,
        volume: 1,
        muted: false,
        played: 0,
        loaded: 0,
        duration: 0,
        loop: false,
        seeking: false,
        loadedSeconds: 0,
        playedSeconds: 0,
        isLoading: true,
        isFullscreen: false,

        showCaptionSelect: false,
        showPlaybackSelect: false,
    };

    type PlayerState = Omit<typeof initialState, 'src'> & {
        src?: string;
    };

    useEffect(() => {
      setState(prevState => ({
        ...prevState,
        playing: propPlaying,
      }));
    
      return () => {
        setState(prevState => ({
          ...prevState,
          playing: false,
        }));
      };
    }, [propPlaying]);



    const playBackRatesArray = playbackRates;

    const [state, setState] = useState<PlayerState>(initialState);
    const [subtitlesData, setSubtitlesData] = useState<Record<string, { start: number; end: number; text: string }[]>>({});
    const [currentSubtitles, setCurrentSubtitles] = useState<string[]>(['This is current subtitle example.', 'This is another subtitle line.', 'This is another subtitle line.', 'This is another subtitle line.', 'This is another subtitle line.']);
    const [currentSubtitleLanguage, setCurrentSubtitleLanguage] = useState<string>('None');
    const [playbackRate, setPlaybackRate] = useState<string>('1.0');

    useEffect(() => {
        // Show/hide video controls on mouse or touch movement (desktop & mobile)
        // On desktop: listen for mousemove
        // On mobile: listen for touchstart/touchmove
        // Controls auto-hide after 3s of inactivity while playing

        let timeout: NodeJS.Timeout;

        // Handler to show controls and reset hide timer
        const showAndAutoHideControls = () => {
            setState(prevState => ({ ...prevState, controls: true }));
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (state.playing) setState(prevState => ({ ...prevState, controls: false }));
            }, 3000);
        };

        // Attach both mouse and touch listeners for cross-device support
        document.addEventListener('mousemove', showAndAutoHideControls);
        document.addEventListener('touchstart', showAndAutoHideControls);
        document.addEventListener('touchend', showAndAutoHideControls);
        document.addEventListener('click', hideTables);

        return () => {
            document.removeEventListener('mousemove', showAndAutoHideControls);
            document.removeEventListener('touchstart', showAndAutoHideControls);
            document.removeEventListener('touchend', showAndAutoHideControls);
            document.removeEventListener('click', hideTables);
            clearTimeout(timeout);
        };
    }, [state.playing]);

    useEffect(() => {

        if (currentSubtitleLanguage == "None")
            return;

        if (!subtitlesData[currentSubtitleLanguage]) {
            const subtitle = propSubtitles.find(sub => sub.lang === currentSubtitleLanguage);
            if (subtitle) {
                loadSubtitleFile(subtitle.url, currentSubtitleLanguage);
            } else {
                console.warn(`No subtitle found for language: ${currentSubtitleLanguage}`);
            }
        }
    }, [currentSubtitleLanguage])

    useEffect(() => {
        if(!playerRef.current || !videoRef) return;

        videoRef.current = playerRef.current;
    }, [playerRef.current])
    


    const load = (src?: string) => {
        setState(prevState => ({
            ...prevState,
            src,
            played: 0,
            loaded: 0,
            pip: false,
        }));
    };

    const hideTables = (e: MouseEvent) => {
        const target = e.target as Node;

        // If click is outside the caption button, hide the caption table
        if (captionButtonRef.current && !captionButtonRef.current.contains(target) && !captionTableRef.current?.contains(target)) {
            setState(prevState => ({ ...prevState, showCaptionSelect: false }));
        }
        // If click is outside the playback button, hide the playback table
        if (playbackButtonRef.current && !playbackButtonRef.current.contains(target) && !playbackTableRef.current?.contains(target)) {
            setState(prevState => ({ ...prevState, showPlaybackSelect: false }));
        }
    }

    function isIOS(): boolean {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    const handleClickFullscreen = async () => {
        const playerContainer = playerContainerRef.current;;
        if (!playerContainer) return;

        if (!state.isFullscreen) {
            if (isIOS()) {
            }

            // Enter fullscreen
            if (playerContainer.requestFullscreen) {
                playerContainer.requestFullscreen();
                setState(prevState => ({ ...prevState, isFullscreen: true }));
            }

            //try auto rotating screen to landscape mode in mobile devices
            try {
                const orientation = screen.orientation as ScreenOrientation & { lock: (orientation: string) => Promise<void> };
                if (orientation) {
                    await orientation.lock("landscape");
                }
            } catch (err) {
                console.warn("Orientation lock failed:", err);
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setState(prevState => ({ ...prevState, isFullscreen: false }));
            }

            //try auto unlocking screen orientation in mobile devices
            try {
                if (screen.orientation && screen.orientation.unlock) {
                    screen.orientation.unlock();
                }
            } catch (err) {
                console.warn("Orientation unlock failed:", err);
            }
        }
    };

    const handlePlayPause = () => {
        setState(prevState => ({ ...prevState, playing: !prevState.playing }));
    };

    const handleToggleMuted = () => {
        setState(prevState => ({ ...prevState, muted: !prevState.muted }));
    };

    const handleRateChange = () => {
        const player = playerRef.current;
        if (!player) return;

        setPlaybackRate(player.playbackRate.toString());
    };

    const handleTogglePIP = () => {
        setState(prevState => ({ ...prevState, pip: !prevState.pip }));
    };

    const handleSkipForward = () => {
        const player = playerRef.current;
        if (!player) return;

        const newTime = player.currentTime + 10; // Skip forward 10 seconds
        if (newTime < player.duration) {
            player.currentTime = newTime;
        } else {
            player.currentTime = player.duration - 1; // Prevent going beyond duration
        }
    }

    const handleSkipBackward = () => {
        const player = playerRef.current;
        if (!player) return;

        const newTime = player.currentTime - 10; // Skip backward 10 seconds
        if (newTime > 0) {
            player.currentTime = newTime;
        } else {
            player.currentTime = 0; // Prevent going below 0
        }
    };

    const handlePlay = () => {
        console.log('onPlay');
        setState(prevState => ({ ...prevState, playing: true }));
    };

    const handleEnterPictureInPicture = () => {
        console.log('onEnterPictureInPicture');
        setState(prevState => ({ ...prevState, pip: true }));
    };

    const handleLeavePictureInPicture = () => {
        console.log('onLeavePictureInPicture');
        setState(prevState => ({ ...prevState, pip: false }));
    };

    const handlePause = () => {
        console.log('onPause');
        setState(prevState => ({ ...prevState, playing: false }));
    };

    const handleProgress = () => {
        const player = playerRef.current;
        // We only want to update time slider if we are not currently seeking
        if (!player || state.seeking || !player.buffered?.length) return;

        console.log('onProgress');

        setState(prevState => ({
            ...prevState,
            loadedSeconds: player.buffered?.end(player.buffered?.length - 1),
            loaded: player.buffered?.end(player.buffered?.length - 1) / player.duration,
        }));
    };

    const handleTimeUpdate = () => {
        const player = playerRef.current;
        // We only want to update time slider if we are not currently seeking
        if (!player || state.seeking) return;

        if (!player.duration) return;
        setState(prevState => ({
            ...prevState,
            playedSeconds: player.currentTime,
            played: player.currentTime / player.duration,
        }));

        // Update current subtitle line based on the current time
        const currentSubtitleData = subtitlesData[currentSubtitleLanguage];
        if (currentSubtitleLanguage !== "None" && currentSubtitleData) {
            const timeDelay = 0.2 //to synchronize subtitles with video
            const currentTime = player.currentTime + timeDelay;

            //todo: need adjustment, this brings only one line, not effective for multiple lines
            const subtitles = currentSubtitleData.filter((sub) =>
                currentTime >= sub.start && currentTime <= sub.end
            );
            setCurrentSubtitles(subtitles.length > 0 ? subtitles.map(sub => sub.text) : []);
        } else {
            setCurrentSubtitles([]);
        }
    };

    const handleEnded = () => {
        console.log('onEnded');
        setState(prevState => ({ ...prevState, playing: prevState.loop }));
    };

    const handleDurationChange = () => {
        const player = playerRef.current;
        if (!player) return;

        console.log('onDurationChange', player.duration);
        setState(prevState => ({ ...prevState, duration: player.duration }));
    };

    // const handleClickFullscreen = () => {
    //     const reactPlayer = document.querySelector('.player-container');
    //     if (reactPlayer) screenfull.toggle(reactPlayer);
    // };

    const handleSeek = (value: number) => {
        const player = playerRef.current;
        if (!player) return;

        // Convert value (0-100) to seconds based on the video's duration
        // player.pause();
        const newTime = (value / 100) * player.duration;
        player.currentTime = newTime;

        setState(prevState => ({
            ...prevState,
            played: value / 100,
            playedSeconds: newTime,
        }));
    }

    const handleVolumeChange = (value: number) => {
        setState(prevState => ({
            ...prevState,
            volume: value,
            muted: value === 0 ? true : false, // Mute if volume is 0
        }));
    }

    const handleShowCaption = () => {
        setState(prevState => ({
            ...prevState,
            showCaptionSelect: !prevState.showCaptionSelect,
            showPlaybackSelect: false // Hide playback select when showing caption select
        }));
    }

    const handleShowPlaybackTable = () => {
        setState(prevState => ({
            ...prevState,
            showCaptionSelect: false,
            showPlaybackSelect: !prevState.showPlaybackSelect
        }));
    }

    //fetch subtitle from url, parse it and set it to the state
    const loadSubtitleFile = async (url: string, languageCode: string) => {
        try {
            // Ignore the thumbnails track. It is for displaying timestamp images, not subtitles.
            if (languageCode == "thumbnails")
                return;

            //fetch data from subtitle url 
            const response = await fetch(url);
            const vttContent = await response.text();
            if (!response.ok || !vttContent) {
                if (process.env.NODE_ENV === 'development')
                    console.warn(`Failed to load subtitles for ${languageCode} from ${url}`);
                return;
            }

            //parse the vtt content to individual lines with start and end times
            const parsedSubtitles = parseVTT(vttContent);
            if (!parsedSubtitles || parsedSubtitles.length === 0) {
                if (process.env.NODE_ENV === 'development') {
                    console.warn(`No valid subtitles found for ${languageCode} in ${url}`);
                }
                return;
            }

            //set the subtitles to the state
            setSubtitlesData(prev => ({
                ...prev,
                [languageCode]: parsedSubtitles
            }));

        } catch (error) {
            console.error(`Error loading subtitles for ${languageCode}:`, error);
        }
    };

    const setPlayerRef = useCallback((player: HTMLVideoElement) => {
        if (!player) return;
        playerRef.current = player;
        console.log(player);
    }, []);

    const {
        src,
        playing,
        controls,
        light,
        volume,
        muted,
        loop,
        played,
        loaded,
        duration,
        pip,
        isLoading,
        showCaptionSelect,
        showPlaybackSelect,
        isFullscreen
    } = state;

    if (!src)
        return (<div className="player-container">
            <div className='placeholder-container'>
                <Play fill='white' className='placeholder-icon' size={60} onClick={() => load(propSrc)} />
            </div>
        </div>)


    return (
        <div ref={playerContainerRef} className="player-container">
            {isLoading && (
                <div className="LoaderOverlay">
                    <Loader2 className="loader-class" />
                </div>
            )}

            <ReactPlayer
                ref={setPlayerRef}
                className="react-player"
                style={{ width: '100%', height: 'auto', aspectRatio: '16/9' }}
                src={src}
                pip={pip}
                playing={playing}
                controls={false}
                light={light}
                loop={loop}
                playbackRate={Number(playbackRate)}
                volume={volume}
                muted={muted}
                config={{
                    youtube: {
                        color: 'white'
                    },
                    vimeo: {
                        color: 'ffffff'
                    }
                }}
                // onPlay={handlePlay}
                onEnterPictureInPicture={handleEnterPictureInPicture}
                onLeavePictureInPicture={handleLeavePictureInPicture}
                onReady={() => setState(prevState => ({ ...prevState, isLoading: false }))}
                onWaiting={() => setState(prevState => ({ ...prevState, isLoading: true }))}
                onCanPlay={() => setState(prevState => ({ ...prevState, isLoading: false }))}
                onRateChange={handleRateChange}
                onEnded={handleEnded}
                onTimeUpdate={handleTimeUpdate}
                onProgress={handleProgress}
                onDurationChange={handleDurationChange}
            />

            {/* PlayPauseClick Sensor */}
            <div onClick={handlePlayPause} className={`sensor`} />

            {/* Subtitles Overlay */}
            {true && (
                <div className="subtitle-parent">
                    <p style={{color: "transparent", backgroundColor: "transparent"}}>.</p>
                    {currentSubtitles.map((subtitle, index) => (
                        <p key={index} dangerouslySetInnerHTML={{ __html: subtitle }} />
                    ))}
                </div>
            )}


            {/* subtitle table */}
            {showCaptionSelect && <div ref={captionTableRef} className='subtitle-table'>
                <Table title='Subtitles' selected={currentSubtitleLanguage} setSelected={setCurrentSubtitleLanguage} data={["None", ...propSubtitles.map(d => d.lang)]} />
            </div>}

            {showPlaybackSelect && <div ref={playbackTableRef} className='subtitle-table'>
                <Table title='Playback Speed' selected={playbackRate.toString()} setSelected={setPlaybackRate} data={playBackRatesArray} />
            </div>}

            <div className={`control-container ${controls ? 'flex' : 'hidden'}`}>
                {/* Slider for duration of video */}
                <div className="seeker-container">
                    <Slider
                        color={seekBarColor}
                        defaultValue={0}
                        played={played ? played * 100 : 0}
                        loaded={loaded ? loaded * 100 : 0}
                        maxValue={100}
                        onValueChange={handleSeek}
                    />
                </div>

                {/* Control buttons */}
                <div className='control-buttons'>
                    <div className='control-left'>
                        {playing ? <Pause fill='white' onClick={handlePause} className='size-6 cursor-pointer' />
                            : <Play fill='white' onClick={handlePlay} className='size-4 sm:size-6 cursor-pointer' />
                        }

                        {muted || volume == 0 ?
                            <VolumeOff fill='white' onClick={handleToggleMuted} className='size-4 sm:size-6 cursor-pointer' />
                            : <Volume2 fill='white' onClick={handleToggleMuted} className='size-4 sm:size-6 cursor-pointer' />
                        }

                        {/* Volume slider */}
                        <div style={{ width: "100px" }}>
                            <Slider
                                color={volumeBarColor}
                                onValueChange={handleVolumeChange}
                                defaultValue={0.8}
                                maxValue={1}
                                played={muted ? 0 : volume}
                            />
                        </div>
                        <span className='text-xs sm:text-base'>{formatTime(played * duration)} / {formatTime(duration)}</span>
                    </div>
                    <div className='control-right'>
                        <TbRewindBackward10 onClick={handleSkipBackward} className='cursor-pointer size-4 sm:size-6' size={24} />
                        <TbRewindForward10 onClick={handleSkipForward} className='cursor-pointer size-4 sm:size-6' size={24} />
                        <span ref={captionButtonRef}><FaClosedCaptioning onClick={handleShowCaption} className='cursor-pointer size-4 sm:size-6' size={24} /></span>
                        <span ref={playbackButtonRef}><MdSpeed fill='white' onClick={handleShowPlaybackTable} className='cursor-pointer size-4 sm:size-6' size={24} /></span>

                        <PictureInPicture onClick={handleTogglePIP} className='cursor-pointer' size={24} />
                        {isFullscreen ? <Minimize onClick={handleClickFullscreen} className='cursor-pointer size-4 sm:size-6' size={24} /> : <Expand onClick={handleClickFullscreen} className='cursor-pointer size-4 sm:size-6' size={24} />}
                    </div>
                </div>
            </div>
        </div >
    )
}

export default ReactBitPlayer