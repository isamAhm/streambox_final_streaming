import { useEffect } from 'react';

/**
 * Hook to disable developer tools in production
 * Note: This is not foolproof but deters casual users
 */
const useDevToolsProtection = () => {
    useEffect(() => {
        // Only run in production
        if (process.env.NODE_ENV !== 'production') {
            return;
        }

        // Disable right-click context menu
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            return false;
        };

        // Disable specific keyboard shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            // F12
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }

            // Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                return false;
            }

            // Ctrl+Shift+J (Windows/Linux) or Cmd+Option+J (Mac)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
                e.preventDefault();
                return false;
            }

            // Ctrl+Shift+C (Windows/Linux) or Cmd+Option+C (Mac)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                return false;
            }

            // Ctrl+U (View Source)
            if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                e.preventDefault();
                return false;
            }

            // Ctrl+S (Save Page)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                return false;
            }
        };

        // Detect if DevTools is open
        const detectDevTools = () => {
            const threshold = 160;
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;

            if (widthThreshold || heightThreshold) {
                // DevTools detected - redirect or show warning
                document.body.innerHTML = `
          <div style="
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: #000;
            color: #fff;
            font-family: system-ui, -apple-system, sans-serif;
            text-align: center;
            padding: 20px;
          ">
            <div>
              <h1 style="font-size: 2rem; margin-bottom: 1rem;">⚠️ Access Restricted</h1>
              <p style="font-size: 1.2rem; color: #999;">Developer tools are disabled on this site.</p>
              <button 
                onclick="window.location.reload()" 
                style="
                  margin-top: 2rem;
                  padding: 12px 24px;
                  background: #3b82f6;
                  color: white;
                  border: none;
                  border-radius: 8px;
                  font-size: 1rem;
                  cursor: pointer;
                "
              >
                Reload Page
              </button>
            </div>
          </div>
        `;
            }
        };

        // Disable console methods in production
        const disableConsole = () => {
            const noop = () => { };
            console.log = noop;
            console.warn = noop;
            console.error = noop;
            console.info = noop;
            console.debug = noop;
        };

        // Detect debugger
        const detectDebugger = () => {
            setInterval(() => {
                const before = new Date().getTime();
                debugger; // This will pause if DevTools is open
                const after = new Date().getTime();

                if (after - before > 100) {
                    // Debugger was active
                    window.location.reload();
                }
            }, 1000);
        };

        // Apply protections
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);

        // Check for DevTools periodically
        const devToolsInterval = setInterval(detectDevTools, 1000);

        // Disable console
        disableConsole();

        // Start debugger detection (optional - can be aggressive)
        // detectDebugger();

        // Cleanup
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            clearInterval(devToolsInterval);
        };
    }, []);
};

export default useDevToolsProtection;
