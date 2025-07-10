import React, { useState } from 'react';
import ReactBitPlayer from './Player';

const App: React.FC = () => {

    // const [played, setPlayed] = useState(0);

    // const handleChange = (value: number) => {
    //     setPlayed(value);
    //     console.log("Slider value changed:", value);
    // }
    return <div className='pt-5 pl-5' style={{ width: "80%" }}>
        <ReactBitPlayer />
        {/* <Slider
            maxValue={50}
            onValueChange={handleChange}
            played={played}
        /> */}
    </div>;
};

export default App;
