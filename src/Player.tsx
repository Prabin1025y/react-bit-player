import { Expand, Loader2, Minimize, Pause, Play, Volume2, VolumeOff } from 'lucide-react';
import { TbRewindBackward10, TbRewindForward10 } from "react-icons/tb";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { formatTime } from './utils';
import screenfull from 'screenfull';
import Slider from './components/Slider';

// type ProgressProps = {
//     played: number;
//     playedSeconds: number;
//     loaded: number;
//     loadedSeconds: number;
// }

const ReactBitPlayer = () => {
    const playerRef = useRef<HTMLVideoElement | null>(null);

    const initialState = {
        src: undefined,
        pip: false,
        playing: true,
        controls: false,
        light: false,
        volume: 1,
        muted: false,
        played: 0,
        loaded: 0,
        duration: 0,
        playbackRate: 1.0,
        loop: false,
        seeking: false,
        loadedSeconds: 0,
        playedSeconds: 0,
        isLoading: true
    };

    type PlayerState = Omit<typeof initialState, 'src'> & {
        src?: string;
    };

    const [state, setState] = useState<PlayerState>(initialState);
    const [currentSubtitles, setCurrentSubtitles] = useState<string[]>(['This is current subtitle example.', 'This is another subtitle line.', 'This is another subtitle line.', 'This is another subtitle line.', 'This is another subtitle line.']);

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
        document.addEventListener('touchmove', showAndAutoHideControls);

        return () => {
            document.removeEventListener('mousemove', showAndAutoHideControls);
            document.removeEventListener('touchstart', showAndAutoHideControls);
            document.removeEventListener('touchmove', showAndAutoHideControls);
            clearTimeout(timeout);
        };
    }, [state.playing]);

    const load = (src?: string) => {
        setState(prevState => ({
            ...prevState,
            src,
            played: 0,
            loaded: 0,
            pip: false,
        }));
    };

    const handlePlayPause = () => {
        setState(prevState => ({ ...prevState, playing: !prevState.playing }));
    };

    const handleToggleControls = () => {
        setState(prevState => ({ ...prevState, controls: !prevState.controls }));
    };

    const handleToggleMuted = () => {
        setState(prevState => ({ ...prevState, muted: !prevState.muted }));
    };

    const handleSetPlaybackRate = (event: React.SyntheticEvent<HTMLButtonElement>) => {
        const buttonTarget = event.target as HTMLButtonElement;
        setState(prevState => ({
            ...prevState,
            playbackRate: Number.parseFloat(`${buttonTarget.dataset.value}`)
        }));
    };

    const handleRateChange = () => {
        const player = playerRef.current;
        if (!player) return;

        setState(prevState => ({ ...prevState, playbackRate: player.playbackRate }));
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

    // const handleSeekMouseDown = () => {
    //     setState(prevState => ({ ...prevState, seeking: true }));
    // };

    // const handleSeekChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    //     const inputTarget = event.target as HTMLInputElement;
    //     setState(prevState => ({ ...prevState, played: Number.parseFloat(inputTarget.value) }));
    // };

    // const handleSeekMouseUp = (event: React.SyntheticEvent<HTMLInputElement>) => {
    //     const inputTarget = event.target as HTMLInputElement;
    //     setState(prevState => ({ ...prevState, seeking: false }));
    //     if (playerRef.current) {
    //         playerRef.current.currentTime = Number.parseFloat(inputTarget.value) * playerRef.current.duration;
    //     }
    // };

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

        console.log('onTimeUpdate', player.currentTime);

        if (!player.duration) return;

        setState(prevState => ({
            ...prevState,
            playedSeconds: player.currentTime,
            played: player.currentTime / player.duration,
        }));
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

    const handleClickFullscreen = () => {
        const reactPlayer = document.querySelector('.player-container');
        if (reactPlayer) screenfull.toggle(reactPlayer);
    };

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

    const renderLoadButton = (src: string, label: string) => {
        return (
            <button type="button" onClick={() => load(src)}>
                {label}
            </button>
        );
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
        playbackRate,
        pip,
        isLoading
    } = state;

    if (!src)
        return (<div className="player-container">
            <div className='placeholder-container'>
                <Play fill='white' className='placeholder-icon' size={60} onClick={() => load("https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8")} />
            </div>
        </div>)


    return (
        <div className="player-container">




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
                playbackRate={playbackRate}
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
                    {currentSubtitles.map((subtitle, index) => (
                        <p key={index} dangerouslySetInnerHTML={{ __html: subtitle }} />
                    ))}
                </div>
            )}

            <div className={`control-container ${controls ? 'block' : 'hidden'}`}>
                {/* Slider for duration of video */}
                <div className="seeker-container">
                    <Slider
                        color='cyan'
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
                        {playing ? <Pause onClick={handlePause} className='size-6 cursor-pointer' />
                            : <Play onClick={handlePlay} className='size-4 sm:size-6 cursor-pointer' />
                        }

                        {muted || volume == 0 ?
                            <VolumeOff onClick={handleToggleMuted} className='size-4 sm:size-6 cursor-pointer' />
                            : <Volume2 onClick={handleToggleMuted} className='size-4 sm:size-6 cursor-pointer' />
                        }

                        {/* Volume slider */}
                        <div style={{ width: "100px" }}>
                            <Slider
                                color='yellow'
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

                        {/* Subtitle selection dropdown */}
                        {/* {(tracks?.filter(t => t.lang !== "thumbnails") ?? []).length > 0 && <Select onValueChange={handleLanguageSelect} value={selectedLanguage}>
                                <SelectTrigger className="w-[130px] sm:w-[180px]">
                                    <Captions className='cursor-pointer text-white size-4 sm:size-6' size={24} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Languages</SelectLabel>
                                        <SelectItem key={"None"} value={"None"}>None</SelectItem>
                                        {tracks?.map((track, index) => (track.lang !== "thumbnails" &&
                                            <SelectItem key={track.lang + index} value={track.lang}>{track.lang}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            } */}

                        {/* Playback speed selection dropdown */}
                        {/* <Select onValueChange={(value) => setPlaybackRate(parseFloat(value))} value={playbackRate.toString()}>
                                <SelectTrigger className="w-[130px] sm:w-[180px]">
                                    <MdSpeed className='cursor-pointer text-white size-4 sm:size-6' size={24} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Playback Speed</SelectLabel>
                                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                            <SelectItem key={rate} value={rate.toString()}>{rate}x</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select> */}


                        {/* <PictureInPicture className='cursor-pointer' size={24} /> */}
                        {true ? <Minimize onClick={handleClickFullscreen} className='cursor-pointer size-4 sm:size-6' size={24} /> : <Expand onClick={handleClickFullscreen} className='cursor-pointer size-4 sm:size-6' size={24} />}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ReactBitPlayer