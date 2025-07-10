import React, { useEffect, useRef, useState } from 'react'

type SliderProps = {
    played?: number;
    loaded?: number; // Optional loaded value
    onValueChange?: (value: number) => void;
    color?: string; // Optional color prop for customization
    defaultValue?: number; // Optional default value
    maxValue?: number; // Optional maximum value for the slider
}

const Slider = ({ played = 0, loaded = 0, onValueChange, color = "red", defaultValue = 0, maxValue = 100 }: SliderProps) => {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const calculatePercentage = (event: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
        if (sliderRef.current) {
            const rect = sliderRef.current.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const percentage = (clickX / rect.width) * maxValue;

            // Ensure percentage is between 0 and maxValue
            return Math.max(0, Math.min(maxValue, percentage));
        }
        return 0;
    };

    const handleSliderClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) {
            const clampedPercentage = calculatePercentage(event);
            if (onValueChange) {
                onValueChange(clampedPercentage);
            }
        }
    };

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        const clampedPercentage = calculatePercentage(event);
        if (onValueChange) {
            onValueChange(clampedPercentage);
        }

        // Add global mouse event listeners
        const handleMouseMove = (e: MouseEvent) => {
            const percentage = calculatePercentage(e);
            if (onValueChange) {
                onValueChange(percentage);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div
            ref={sliderRef}
            className='slider-parent cursor-pointer'
            onClick={handleSliderClick}
            onMouseDown={handleMouseDown}
        >
            <div
                className='slider-loaded'
                style={{ width: `${(loaded / maxValue) * 100}%`, backgroundColor: color, opacity: 0.2 }}
            ></div>
            <div
                className='slider-played'
                style={{ width: `${(played / maxValue) * 100}%`, backgroundColor: color }}
            ></div>
            {/* <div className='slider-thumb'
                style={{ left: `calc(${(played / maxValue) * 100}% - 0.375rem)` }}
            ></div> */}
        </div>
    )
}

export default Slider