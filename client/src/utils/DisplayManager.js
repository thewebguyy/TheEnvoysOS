/**
 * DisplayManager.js
 * 
 * Manages multi-display output routing using the Window Management API (Screen API).
 * Handles:
 * - Detecting connected displays
 * - Assigning specific views (Audience, Stage, Stream) to specific displays
 * - Launching and managing window lifecycles
 * - Fallback for browsers without Screen API support
 */

class DisplayManager {
    constructor() {
        this.screens = [];
        this.windows = {
            audience: null,
            stage: null,
            stream: null
        };
        this.isSupported = 'getScreenDetails' in window;
    }

    /**
     * Request permission and get screen details
     */
    async init() {
        if (!this.isSupported) {
            console.warn('Window Management API not supported');
            return false;
        }

        try {
            const screenDetails = await window.getScreenDetails();
            this.screens = screenDetails.screens;

            // Listen for changes
            screenDetails.addEventListener('screenschange', () => {
                this.screens = screenDetails.screens;
                console.log('Screens changed:', this.screens);
                // Potential logic to move windows if a screen is disconnected
            });

            return true;
        } catch (err) {
            console.error('Failed to get screen details:', err);
            return false;
        }
    }

    getScreens() {
        return this.screens;
    }

    /**
     * Launch a specific output to a specific screen index or default behavior
     * @param {string} type - 'audience', 'stage', 'stream'
     * @param {string} path - URL path (e.g., '/audience')
     * @param {number} screenIndex - Preferred screen index (0 is usually primary/dashboard)
     */
    launchOutput(type, path, screenIndex = -1) {
        // If window already exists/open, focus it
        if (this.windows[type] && !this.windows[type].closed) {
            this.windows[type].focus();
            return;
        }

        const features = [
            'width=800',
            'height=600',
            'menubar=no',
            'toolbar=no',
            'location=no',
            'status=no',
            'resizable=yes',
            'scrollbars=no'
        ];

        let targetScreen = null;

        // Attempt to place on specific screen if API supported and available
        if (this.isSupported && this.screens.length > 0 && screenIndex >= 0 && screenIndex < this.screens.length) {
            targetScreen = this.screens[screenIndex];
            features.push(`left=${targetScreen.availLeft}`);
            features.push(`top=${targetScreen.availTop}`);
            features.push(`width=${targetScreen.availWidth}`);
            features.push(`height=${targetScreen.availHeight}`);
        } else {
            // Fallback centering or browser default
        }

        const win = window.open(path, `Envoys_${type}`, features.join(','));

        if (win) {
            this.windows[type] = win;

            // Trigger fullscreen on the new window if possible
            // Note: Browsers block programmatic fullscreen without user interaction on that specific document.
            // The child page should handle entering fullscreen on load or first interaction.

            // Should optional: win.moveTo if window.open coordinates were ignored (older way)
            if (targetScreen) {
                // Some browsers might ignore left/top in window.open features
                // win.moveTo(targetScreen.availLeft, targetScreen.availTop);
            }
        } else {
            console.error(`Failed to open ${type} window. Popups blocked?`);
        }
    }

    /**
     * Auto-assign outputs to available screens
     * Strategy:
     * Screen 0: Dashboard (Current)
     * Screen 1: Audience
     * Screen 2: Stage
     * Screen 3 or fallback: Stream (Stream usually is internal or OBS, maybe just a window?)
     */
    async launchAll() {
        const hasPermission = await this.init();

        // If we have screens, try to distribute
        // We assume launch is triggered by user click, so we can open windows.

        // Priority: Audience -> External 1 (Index 1)
        // Stage -> External 2 (Index 2)
        // Stream -> Separate Window (Index 3 or just open)

        if (hasPermission && this.screens.length > 1) {
            // We have multiple screens
            this.launchOutput('audience', '/audience', 1);

            if (this.screens.length > 2) {
                this.launchOutput('stage', '/stage', 2);
            } else {
                this.launchOutput('stage', '/stage', -1); // Windowed
            }

            this.launchOutput('stream', '/stream', -1); // Windowed
        } else {
            // Fallback: Open all as separate windows
            this.launchOutput('audience', '/audience');
            this.launchOutput('stage', '/stage');
            this.launchOutput('stream', '/stream');
        }
    }

    closeAll() {
        Object.values(this.windows).forEach(win => {
            if (win && !win.closed) win.close();
        });
        this.windows = { audience: null, stage: null, stream: null };
    }
}

export const displayManager = new DisplayManager();
export default DisplayManager;
