document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.classList.add("preload");
    window.addEventListener("load", () => {
        document.documentElement.classList.remove("preload");
    });
    const body = document.body;
    const toggleButton = document.getElementById('mode');

    const footer =
        document.getElementById('footer') ||
        document.querySelector('.bottom-bar');

    const themedElements = [body, footer].filter(Boolean);

    const STORAGE_KEY = 'dingir-theme';

    function getPreferredTheme() {
        // 1) Saved setting (if available)
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'dark' || saved === 'light') return saved;
        } catch (_) {
            // ignore (private mode / blocked storage)
        }

        // 2) System preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        // 3) Default
        return 'light';
    }

    function setTheme(theme) {
        const isDark = theme === 'dark';

        themedElements.forEach((el) => {
            el.classList.remove('light-mode', 'dark-mode');
            el.classList.add(isDark ? 'dark-mode' : 'light-mode');
        });

        if (toggleButton) {
            toggleButton.setAttribute('aria-pressed', String(isDark));
            toggleButton.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        }

        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (_) {
            // ignore
        }
    }

    // Initial theme
    setTheme(getPreferredTheme());

    // Click handler (only if button exists on this page)
    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            const currentlyDark = body.classList.contains('dark-mode');
            setTheme(currentlyDark ? 'light' : 'dark');
        });
    }

    //banner logic

    const overlay = document.getElementById("cookie-overlay");
    const box   = document.getElementById("cookie-box");

    const acceptBtn = document.getElementById("cookie-accept");
    const rejectBtn = document.getElementById("cookie-reject");

    const cookieName =  'dingir-cookie-consent';

    function setConsent(value) {
        document.cookie = `${cookieName}=${value}; Max-Age=${0}; Path=/; SameSite=Lax`;
    }

    function getCookie(name) {
        return document.cookie
            .split("; ")
            .find(row => row.startsWith(name + "="))
            ?.split("=")[1];
    }

    function hideBanner() {
        overlay.hidden = true;
        box.hidden = true;

        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
    }

    function showBanner() {
        overlay.hidden = false;
        box.hidden = false;
        document.documentElement.classList.add('modal-open');
        document.body.classList.add('modal-open');
    }

    acceptBtn.addEventListener('click', () => {
        setConsent('accept');
        hideBanner();
    })

    rejectBtn.addEventListener('click', () => {
        setConsent('reject');
        hideBanner();
        alert('Cookies rejected! Some functionality may be limited.')
    })


    const consent = getCookie(cookieName);
    if (consent=="accept" || consent=="reject") {
        hideBanner();
    } else {
        showBanner();
    }
});