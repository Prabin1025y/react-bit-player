import { Expand, FastForward, Loader2, Minimize, Pause, PictureInPicture, Play, Volume2, VolumeOff } from 'lucide-react';
import { TbRewindBackward10, TbRewindForward10 } from "react-icons/tb";
import { MdSpeed } from "react-icons/md";
import { FaClosedCaptioning } from "react-icons/fa6";

import React, { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import ReactPlayer from 'react-player';
import type { ReactPlayerProps } from 'react-player/dist/types';
import { formatTime, parseVTT } from './utils';
import Slider from './components/Slider';
import Table from './Table';
import './global.css';
import './output.css';

type UnUsedProps = Omit<ReactPlayerProps, "src" | "playing" | "volume" | "loop" | "muted" | "pip" | "controls" | "playbackRate" | "onReady" | "onWaiting" | "onCanPlay" | "onPlaying" | "onRateChange" | "onEnded" | "onTimeUpdate" | "onProgress" | "onDurationChange">;

type ReactBitPlayerProps = {
    src: string;
    subtitles?: { lang: string, url: string }[];
    seekBarColor?: string;
    volumeBarColor?: string;
    playbackRates?: string[];
    playing?: boolean;
    ref?: RefObject<HTMLVideoElement | null>;
    loop?: boolean;
    volume?: number;
    muted?: boolean;
    style?: React.CSSProperties;
    className?: string;

    onReady?: () => void;
    onEnded?: React.ReactEventHandler<HTMLVideoElement>;
    onPlaying?: React.ReactEventHandler<HTMLVideoElement>;
    onProgress?: React.ReactEventHandler<HTMLVideoElement>;
    onDurationChange?: React.ReactEventHandler<HTMLVideoElement>;
    onRateChange?: React.ReactEventHandler<HTMLVideoElement>;
    onCanPlay?: React.ReactEventHandler<HTMLVideoElement>;
    onWaiting?: React.ReactEventHandler<HTMLVideoElement>;
    onTimeUpdate?: React.ReactEventHandler<HTMLVideoElement>;
} & UnUsedProps;

const ReactBitPlayer = (
    {
        src: propSrc,
        subtitles: propSubtitles = [],
        seekBarColor = 'cyan',
        volumeBarColor = 'yellow',
        playbackRates = [ '0.5', '0.75', '1.0', '1.25', '1.5', '2.0' ],
        playing: propPlaying = true,
        ref: refProp,
        loop: propLoop = false,
        volume: propVolume = 1,
        muted: propMuted = false,
        style: propStyle = {},
        className: propClassName = '',

        onReady: onReadyProp,
        onEnded: onEndedProp,
        onPlaying: onPlayingProp,
        onProgress: onProgressProp,
        onDurationChange: onDurationChangeProp,
        onRateChange: onRateChangeProp,
        onCanPlay: onCanPlayProp,
        onWaiting: onWaitingProp,
        onTimeUpdate: onTimeUpdateProp,
        ...restProps
    }: ReactBitPlayerProps
) => {




    const playerRef = useRef<HTMLVideoElement | null>(null);

    const captionButtonRef = useRef<HTMLSpanElement | null>(null);
    const playbackButtonRef = useRef<HTMLSpanElement | null>(null);
    const captionTableRef = useRef<HTMLDivElement | null>(null);
    const playbackTableRef = useRef<HTMLDivElement | null>(null);
    const playerContainerRef = useRef<HTMLDivElement | null>(null);

    const skipIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const initialState = {
        src: undefined,
        pip: false,
        playing: propPlaying,
        controls: false,
        light: false,
        volume: propVolume,
        muted: propMuted,
        played: 0,
        loaded: 0,
        duration: 0,
        loop: propLoop,
        seeking: false,
        loadedSeconds: 0,
        playedSeconds: 0,
        isLoading: true,
        // isFullscreen: false,

        showCaptionSelect: false,
        showPlaybackSelect: false,
    };

    type PlayerState = Omit<typeof initialState, 'src'> & {
        src?: string;
    };

    // Initialize state with the initial state
    useEffect(() => {
        setState(prevState => ({
            ...prevState,
            playing: propPlaying,
            loop: propLoop,
            volume: propVolume,
            muted: propMuted,
        }));

        return () => {
            setState(prevState => ({
                ...prevState,
                playing: false,
                loop: false,
                volume: 1,
                muted: false,
            }));
        };
    }, [ propPlaying, propLoop, propVolume, propMuted ]);



    const playBackRatesArray = playbackRates;

    const [ state, setState ] = useState<PlayerState>(initialState);
    const [ isFullScreen, setIsFullScreen ] = useState<boolean>(false);
    const [ subtitlesData, setSubtitlesData ] = useState<Record<string, { start: number; end: number; text: string }[]>>({});
    const [ currentSubtitles, setCurrentSubtitles ] = useState<string[]>([]);
    const [ currentSubtitleLanguage, setCurrentSubtitleLanguage ] = useState<string>('None');
    const [ playbackRate, setPlaybackRate ] = useState<string>('1.0');
    const [ timeStampData, setTimeStampData ] = useState<{
        isMouseInSeekbar: boolean;
        leftValue: number;
        timeInSeconds: number;
    }>({
        isMouseInSeekbar: false,
        leftValue: 0,
        timeInSeconds: 0,
    });
    const [ skipIndicatorInfo, setSkipIndicatorInfo ] = useState<{ forward: boolean, backward: boolean }>({
        forward: false,
        backward: false,
    });

    // Show/hide video controls on mouse or touch movement (desktop & mobile)
    useEffect(() => {
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
    }, [ state.playing ]);

    //Load current subtitle if it is not already loaded
    useEffect(() => {

        if (currentSubtitleLanguage == "None")
            return;

        if (!subtitlesData[ currentSubtitleLanguage ]) {
            const subtitle = propSubtitles.find(sub => sub.lang === currentSubtitleLanguage);
            if (subtitle) {
                loadSubtitleFile(subtitle.url, currentSubtitleLanguage);
            } else {
                console.warn(`No subtitle found for language: ${currentSubtitleLanguage}`);
            }
        }
    }, [ currentSubtitleLanguage ])

    // Sync fullscreen state with document's fullscreen change events
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isNowFullscreen = !!document.fullscreenElement;
            setIsFullScreen(isNowFullscreen);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);




    // Initial load function
    const load = (src?: string) => {
        setState(prevState => ({
            ...prevState,
            src,
            played: 0,
            loaded: 0,
            pip: false,
            // isLoading: false
        }));
    };

    // Hide caption and playback tables when clicking outside
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

    // Function to check if the device is iOS
    function isIOS(): boolean {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    // Function to handle fullscreen toggle
    const handleEnterFullScreen = async () => {
        const playerContainer = playerContainerRef.current;
        if (!playerContainer) return;

        if (isIOS() && (playerContainer as any).webkitRequestFullscreen) {
            (playerContainer as any).webkitRequestFullscreen();
            return;
        }
        // Enter fullscreen
        if (playerContainer.requestFullscreen) {
            console.log("Requesting fullscreen");
            await playerContainer.requestFullscreen();
            setIsFullScreen(true);
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
    }

    const handleExitFullScreen = async () => {
        console.log("Fullscreen disabled");
        // Exit fullscreen
        if (document.exitFullscreen) {
            await document.exitFullscreen();
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


    const handlePlayPause = () => {
        setState(prevState => ({ ...prevState, playing: !prevState.playing }));
    };

    const handleToggleMuted = () => {
        setState(prevState => ({ ...prevState, muted: !prevState.muted }));
    };

    const handleRateChange = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        onRateChangeProp && onRateChangeProp(e);
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

        showSkipIndicator('forward');
    }

    const showSkipIndicator = (type: 'forward' | 'backward') => {
        setSkipIndicatorInfo({ forward: false, backward: false });
        if (skipIndicatorTimeoutRef.current)
            clearTimeout(skipIndicatorTimeoutRef.current);

        setSkipIndicatorInfo({ forward: type === 'forward', backward: type === 'backward' });

        skipIndicatorTimeoutRef.current = setTimeout(() => {
            setSkipIndicatorInfo({ forward: false, backward: false });
        }, 1000);
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

        showSkipIndicator('backward');
    };

    const handlePlay = () => {
        setState(prevState => ({ ...prevState, playing: true }));
    };

    const handlePause = () => {
        setState(prevState => ({ ...prevState, playing: false }));
    };

    const handleProgress = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        onProgressProp && onProgressProp(e);
        const player = playerRef.current;
        // We only want to update time slider if we are not currently seeking
        if (!player || state.seeking || !player.buffered?.length) return;


        setState(prevState => ({
            ...prevState,
            loadedSeconds: player.buffered?.end(player.buffered?.length - 1),
            loaded: player.buffered?.end(player.buffered?.length - 1) / player.duration,
        }));
    };

    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        onTimeUpdateProp && onTimeUpdateProp(e);

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
        const currentSubtitleData = subtitlesData[ currentSubtitleLanguage ];
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

    const handleEnded = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        onEndedProp && onEndedProp(e);
        setState(prevState => ({ ...prevState, playing: prevState.loop }));
    };

    const handleDurationChange = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        onDurationChangeProp && onDurationChangeProp(e);

        const player = playerRef.current;
        if (!player) return;
        setState(prevState => ({ ...prevState, duration: player.duration }));
    };

    const onReadyHandler = () => {
        onReadyProp && onReadyProp();
        setState(prevState => ({ ...prevState, isLoading: false }));
    }

    const onWaitingHandler = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        onWaitingProp && onWaitingProp(e);
        setState(prevState => ({ ...prevState, isLoading: true }));
    }

    const onCanPlayHandler = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        onCanPlayProp && onCanPlayProp(e);
        setState(prevState => ({ ...prevState, isLoading: false }));
    }

    const onPlayingHandler = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        onPlayingProp && onPlayingProp(e);
        setState(prevState => ({ ...prevState, isLoading: false }));
    }

    const handleSeek = (value: number) => {
        const player = playerRef.current;
        if (!player) return;

        // Convert value (0-100) to seconds based on the video's duration
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
                [ languageCode ]: parsedSubtitles
            }));

        } catch (error) {
            console.error(`Error loading subtitles for ${languageCode}:`, error);
        }
    };

    // Handle mouse enter, move, and leave events for the seek bar
    const handleSeekMouseEnterAndMove = (e: React.MouseEvent<HTMLDivElement>) => {
        //do nothing if the target is a thumbnail
        if ((e.target as HTMLElement).classList.contains('thumbnail')) return;

        const targetLeft = (e.currentTarget as HTMLDivElement).getBoundingClientRect().left;

        const width = (e.currentTarget as HTMLDivElement).getBoundingClientRect().width;
        const fraction = (e.clientX - targetLeft) / width;
        const timeInSeconds = fraction * state.duration;

        const diffDistanceInPixels = e.clientX - targetLeft;
        setTimeStampData({ isMouseInSeekbar: true, leftValue: diffDistanceInPixels, timeInSeconds: timeInSeconds });
    }

    const handleSeekMouseLeave = () => {
        setTimeStampData(prev => ({ ...prev, isMouseInSeekbar: false }));
    }

    const setPlayerRef = useCallback((player: HTMLVideoElement) => {
        if (!player) return;
        playerRef.current = player;
        if (refProp !== undefined)
            refProp.current = player;
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
    } = state;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts if user is typing in an input
            if ((e.target instanceof Element) && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
                return;
            }

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    setState(prevState => ({
                        ...prevState,
                        playing: !prevState.playing
                    }));
                    break;

                case 'ArrowLeft':
                    e.preventDefault();
                    // Seek backward 10 seconds
                    handleSkipBackward();
                    break;

                case 'ArrowRight':
                    e.preventDefault();
                    // Seek forward 10 seconds
                    handleSkipForward();
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    // Volume up
                    const newVolumeUp = Math.min(1, volume + 0.1);
                    setState(prev => ({ ...prev, volume: newVolumeUp, muted: false }));
                    break;

                case 'ArrowDown':
                    e.preventDefault();
                    // Volume down
                    const newVolumeDown = Math.max(0, volume - 0.1);
                    setState(prev => ({ ...prev, volume: newVolumeDown }));
                    break;

                case 'KeyM':
                    e.preventDefault();
                    setState(prev => ({ ...prev, muted: !prev.muted }));
                    break;

                case 'KeyF':
                    e.preventDefault();
                    if (!!document.fullscreenElement)
                        handleExitFullScreen();
                    else
                        handleEnterFullScreen();
                    break;

                // case 'KeyC':
                //     e.preventDefault();
                //     setSelectedLanguage("None");
                //     break;

                case 'Comma':
                    if (e.shiftKey) {
                        e.preventDefault();
                        // Decrease playback speed
                        const currentIndex = playbackRates.indexOf(playbackRate);
                        if (currentIndex > 0) {
                            setPlaybackRate(playbackRates[ currentIndex - 1 ]);
                        }
                    }
                    break;

                case 'Period':
                    if (e.shiftKey) {
                        e.preventDefault();
                        // Increase playback speed
                        const currentIndex = playbackRates.indexOf(playbackRate);
                        if (currentIndex < playbackRates.length - 1) {
                            setPlaybackRate(playbackRates[ currentIndex + 1 ]);
                        }
                    }
                    break;

                case 'Digit0':
                case 'Digit1':
                case 'Digit2':
                case 'Digit3':
                case 'Digit4':
                case 'Digit5':
                case 'Digit6':
                case 'Digit7':
                case 'Digit8':
                case 'Digit9':
                    e.preventDefault();
                    if (!playerRef.current)
                        return;
                    // Jump to percentage of video (0-9 = 0%-90%)
                    const percentage = parseInt(e.code.slice(-1)) / 10;
                    playerRef.current.currentTime = playerRef.current?.duration * percentage;
                    break;

                case 'Home':
                    e.preventDefault();
                    // Go to beginning
                    if (!playerRef.current)
                        return;
                    playerRef.current.currentTime = 0;
                    break;

                case 'End':
                    e.preventDefault();
                    // Go to end
                    if (!playerRef.current)
                        return;
                    playerRef.current.currentTime = playerRef.current.duration;
                    break;

                default:
                    break;
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    if (!src)
        return (<div className="player-container">
            <div className='placeholder-container'>
                <Play fill='white' className='placeholder-icon' size={60} onClick={() => load(propSrc)} />
            </div>
        </div>)


    return (
        <div ref={playerContainerRef} style={propStyle} className={`${!controls && 'cursor-none'} ${propClassName} player-container`}>
            {isLoading && (
                <div className="LoaderOverlay">
                    <Loader2 className="loader-class" />
                </div>
            )}

            {!playing && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <Play fill='white' size={100} className='text-white opacity-80' />
                </div>
            )}

            {skipIndicatorInfo.forward && (
                <div className="absolute text-white right-48 animate-ping top-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none z-20">
                    <FastForward fill='white' size={60} />
                    <p>+10 sec</p>
                </div>
            )}

            {skipIndicatorInfo.backward && (
                <div className="absolute text-white left-48 animate-ping top-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none z-20">
                    <FastForward fill='white' size={60} className='rotate-180' />
                    <p>-10 sec</p>
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
                onReady={onReadyHandler}
                onWaiting={onWaitingHandler}
                onCanPlay={onCanPlayHandler}
                onPlaying={onPlayingHandler}
                onRateChange={handleRateChange}
                onEnded={handleEnded}
                onTimeUpdate={handleTimeUpdate}
                onProgress={handleProgress}
                onDurationChange={handleDurationChange}
                {...restProps}
            />

            {/* PlayPauseClick Sensor */}
            <div onClick={handlePlayPause} className={`sensor`} />

            {/* Subtitles Overlay */}
            {true && (
                <div className="subtitle-parent">
                    <p className='control-saver'>.</p>
                    {currentSubtitles.map((subtitle, index) => (
                        <p key={index} dangerouslySetInnerHTML={{ __html: subtitle }} />
                    ))}
                </div>
            )}




            {/* subtitle table */}
            {showCaptionSelect && <div ref={captionTableRef} className='subtitle-table'>
                <Table title='Subtitles' selected={currentSubtitleLanguage} setSelected={setCurrentSubtitleLanguage} data={[ "None", ...propSubtitles.map(d => d.lang) ]} />
            </div>}

            {showPlaybackSelect && <div ref={playbackTableRef} className='subtitle-table'>
                <Table title='Playback Speed' selected={playbackRate.toString()} setSelected={setPlaybackRate} data={playBackRatesArray} />
            </div>}

            <div className={`control-container ${controls ? 'flex' : 'hidden'}`}>
                {/* Slider for duration of video */}
                <div onMouseEnter={handleSeekMouseEnterAndMove} onMouseMove={handleSeekMouseEnterAndMove} onMouseLeave={handleSeekMouseLeave} className="seeker-container relative">
                    <div style={{ left: `${timeStampData.leftValue}px` }} className={`${timeStampData.isMouseInSeekbar ? 'opacity-100' : 'opacity-0'} thumbnail absolute bg-white text-black px-1 py-1 rounded-sm text-xs border border-black bottom-3 -translate-x-1/2`}>{formatTime(timeStampData.timeInSeconds)}</div>
                    {/* <div style={{ left: `${timeStampData.leftValue}px` }} className={`${timeStampData.isMouseInSeekbar ? 'opacity-100' : 'opacity-0'} thumbnail absolute w-36 h-24 bg-white text-black overflow-hidden rounded-sm text-xs border border-black bottom-3 -translate-x-1/2 flex flex-col`}>
                        <img className='thumbnail w-full h-[calc(100%-20px)]' src="https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png" alt="hello" />
                        <p className='thumbnail h-5 w-full flex justify-center items-center'>{formatTime(timeStampData.timeInSeconds)}</p>
                    </div> */}
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
                        {isFullScreen ? <Minimize onClick={handleExitFullScreen} className='cursor-pointer size-4 sm:size-6' size={24} /> : <Expand onClick={handleEnterFullScreen} className='cursor-pointer size-4 sm:size-6' size={24} />}
                    </div>
                </div>
            </div>
        </div >
    )
}

export default ReactBitPlayer;
