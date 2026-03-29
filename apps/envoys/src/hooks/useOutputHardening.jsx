import { useEffect } from 'react';
import toast from 'react-hot-toast';

export const useOutputHardening = (autoFullscreen = false) => {
    useEffect(() => {
        let wakeLock = null;

        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await navigator.wakeLock.request('screen');
                    console.log('Wake Lock active');

                    wakeLock.addEventListener('release', () => {
                        console.log('Wake Lock released');
                    });
                }
            } catch (err) {
                console.error(`${err.name}, ${err.message}`);
            }
        };

        const handleVisibilityChange = async () => {
            if (wakeLock !== null && document.visibilityState === 'visible') {
                await requestWakeLock();
            }
        };

        // Initial Request
        requestWakeLock();

        // Re-request on visibility change (e.g. switching tabs momentarily)
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Fullscreen Logic
        const enterFullscreen = async () => {
            try {
                if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                }
            } catch (e) {
                // User interaction required usually
                console.warn('Fullscreen request failed (user interaction needed)', e);
            }
        };

        if (autoFullscreen) {
            // Browsers block this without user interaction. 
            // We can attach it to the first click if not already in fullscreen.
            const handleClick = () => {
                enterFullscreen();
                // We might want to keep the listener to re-enter if exited
            };
            document.addEventListener('click', handleClick, { once: true });
        }

        return () => {
            if (wakeLock) wakeLock.release();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [autoFullscreen]);
};
