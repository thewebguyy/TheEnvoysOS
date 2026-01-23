import { useState, useEffect } from 'react';
import { displayManager } from '../utils/DisplayManager';

export function useDisplayCount() {
    const [displayCount, setDisplayCount] = useState(0);
    const [isSupported, setIsSupported] = useState(false);
    const [screens, setScreens] = useState([]);

    useEffect(() => {
        const checkSupport = async () => {
            const supported = 'getScreenDetails' in window;
            setIsSupported(supported);

            if (supported) {
                // We can't call getScreenDetails here without a user gesture usually, 
                // but we can check if we already have permission or screens.
                // Actually, initial check might be limited. 
                // We'll rely on the user triggering init() via the manager, 
                // but we can try to get screen count if permission is already granted.

                try {
                    // Check checking permission query if needed, but let's just default to 0 and update when manager inits
                    // If we already initialized manager elsewhere:
                    const currentScreens = displayManager.getScreens();
                    if (currentScreens.length > 0) {
                        setScreens(currentScreens);
                        setDisplayCount(currentScreens.length);
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        };

        checkSupport();
    }, []);

    // A method to trigger detection (must be bound to click)
    const detectDisplays = async () => {
        await displayManager.init();
        const currentScreens = displayManager.getScreens();
        setScreens(currentScreens);
        setDisplayCount(currentScreens.length);
        return currentScreens.length;
    };

    return { displayCount, isSupported, detectDisplays, screens };
}
