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
    const box = document.getElementById("cookie-box");
    const acceptBtn = document.getElementById("cookie-accept");
    const rejectBtn = document.getElementById("cookie-reject");

    const cookieName = "dingir-cookie-consent";

    function setConsent(value) {
        // keep consent for 180 days (instead of deleting immediately)
        const maxAge = 60 * 60 * 24 * 180;
        document.cookie = `${cookieName}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
    }

    function getCookie(name) {
        return document.cookie
            .split("; ")
            .find((row) => row.startsWith(name + "="))
            ?.split("=")[1];
    }

    function hideBanner() {
        overlay.hidden = true;
        box.hidden = true;
        document.documentElement.classList.remove("modal-open");
        document.body.classList.remove("modal-open");
    }

    function showBanner() {
        overlay.hidden = false;
        box.hidden = false;
        document.documentElement.classList.add("modal-open");
        document.body.classList.add("modal-open");
    }

// Only wire banner if all elements exist
    if (overlay && box && acceptBtn && rejectBtn) {
        acceptBtn.addEventListener("click", () => {
            setConsent("accept");
            hideBanner();
        });

        rejectBtn.addEventListener("click", () => {
            setConsent("reject");
            hideBanner();
            alert("Cookies rejected! Some functionality may be limited.");
        });

        const consent = getCookie(cookieName);
        if (consent === "accept" || consent === "reject") hideBanner();
        else showBanner();
    }

    //cart logic

    const CART_KEY = "dingir-cart-v1";

    function loadCart() {
        try {
            const raw = localStorage.getItem(CART_KEY);
            const cart = raw ? JSON.parse(raw) : [];
            return Array.isArray(cart) ? cart : [];
        } catch {
            return [];
        }
    }

    function saveCart(cart) {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
        } catch {
            // ignore
        }
    }

    function addToCart(item) {
        const cart = loadCart();

        // If same product + plan exists, increase qty
        const existing = cart.find(
            (x) => x.id === item.id && x.plan === item.plan
        );

        if (existing) {
            existing.qty += item.qty ?? 1;
        } else {
            cart.push({
                id: item.id,
                name: item.name,
                plan: item.plan ?? "Standard",
                priceCents: Number(item.priceCents ?? 0),
                qty: Number(item.qty ?? 1),
            });
        }

        saveCart(cart);
    }

    function removeFromCart(id, plan) {
        const cart = loadCart().filter((x) => !(x.id === id && x.plan === plan));
        saveCart(cart);
    }

    function clearCart() {
        saveCart([]);
    }

    function formatEUR(cents) {
        const euros = (cents / 100).toFixed(2).replace(".", ",");
        return `€ ${euros}`;
    }

    function calcTotal(cart) {
        return cart.reduce((sum, item) => sum + item.priceCents * item.qty, 0);
    }

    function renderCart() {
        const container = document.getElementById("basket-items");
        const totalEl = document.getElementById("basket-total");
        const emptyEl = document.getElementById("basket-empty");

        // If this page doesn't have cart UI, do nothing
        if (!container || !totalEl) return;

        const cart = loadCart();

        container.innerHTML = "";

        if (emptyEl) emptyEl.hidden = cart.length !== 0;

        if (cart.length === 0) {
            totalEl.textContent = formatEUR(0);
            return;
        }

        for (const item of cart) {
            const row = document.createElement("div");
            row.className = "basket-row";

            const left = document.createElement("div");
            left.className = "basket-info";
            left.innerHTML = `
      <strong>${item.name}</strong><br>
      <span>Modell: ${item.plan}</span><br>
      <span>Menge: ${item.qty}</span>
    `;

            const right = document.createElement("div");
            right.className = "basket-actions";

            const price = document.createElement("span");
            price.textContent = formatEUR(item.priceCents * item.qty);

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "button";
            btn.textContent = "Entfernen";
            btn.addEventListener("click", () => {
                removeFromCart(item.id, item.plan);
                renderCart();
            });

            right.appendChild(price);
            right.appendChild(document.createTextNode(" "));
            right.appendChild(btn);

            row.appendChild(left);
            row.appendChild(right);

            container.appendChild(row);
        }

        totalEl.textContent = formatEUR(calcTotal(cart));
    }

// Hook up "Add to cart" buttons anywhere
    function setupAddToCartButtons() {
        const buttons = document.querySelectorAll("[data-add-to-cart]");
        if (!buttons.length) return;

        buttons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id") || "unknown";
                const name = btn.getAttribute("data-name") || "Produkt";
                const plan = btn.getAttribute("data-plan") || "Standard";
                const priceCents = Number(btn.getAttribute("data-price-cents") || "0");

                addToCart({ id, name, plan, priceCents, qty: 1 });

                // Optional feedback
                alert(`${name} wurde zum Warenkorb hinzugefügt.`);
            });
        });
    }

    function setupCheckoutButton() {
        const checkoutBtn = document.getElementById("basket-checkout");
        if (!checkoutBtn) return;

        checkoutBtn.addEventListener("click", () => {
            const cart = loadCart();
            if (cart.length === 0) {
                alert("Dein Warenkorb ist leer.");
                return;
            }

            // Mock purchase
            clearCart();
            renderCart();
            alert("Vielen Dank für den Einkauf!");
        });
    }

// Call these after your DOMContentLoaded setup has run:
    setupAddToCartButtons();
    renderCart();
    setupCheckoutButton();
});