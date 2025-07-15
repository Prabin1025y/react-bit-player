import React from 'react';
import ReactBitPlayer from './Player';

const App: React.FC = () => {

    // const [played, setPlayed] = useState(0);

    // const handleChange = (value: number) => {
    //     setPlayed(value);
    //     console.log("Slider value changed:", value);
    // }
    return <div className='pt-5 pl-5' style={{ width: "80%" }}>
        <ReactBitPlayer src='https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8' subtitles={[{lang: 'en', url: 'https://raw.githubusercontent.com/1c7/vtt-test-file/refs/heads/master/vtt%20files/3.%20Contain%20Comment.vtt'}]} />
        {/* <Table/> */}
        {/* <Slider
            maxValue={50}
            onValueChange={handleChange}
            played={played}
        /> */}
        {/* <p className='bg-red-500'>prabin acharya</p> */}
    </div>;
};

export default App;
