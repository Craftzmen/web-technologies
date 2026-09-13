(function () {
    var STYLE = [
        ".search { cursor: pointer; }",
        ".search:hover { border-color: var(--gray-300); background: #fff; }",
        ".search:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }",
        ".search-overlay {",
        "  position: fixed; inset: 0; z-index: 80;",
        "  display: flex; justify-content: center;",
        "  padding: 12vh 1.25rem 2rem;",
        "  background: rgba(17, 24, 39, 0.45);",
        "}",
        ".search-overlay[hidden] { display: none; }",
        ".search-dialog {",
        "  width: 100%; max-width: 36rem; max-height: min(32rem, 70vh);",
        "  display: flex; flex-direction: column;",
        "  background: #fff; border: 1px solid var(--gray-200);",
        "  border-radius: 1rem;",
        "  box-shadow: 0 24px 48px rgba(17, 24, 39, 0.18);",
        "  overflow: hidden;",
        "}",
        ".search-field {",
        "  display: flex; align-items: center; gap: 0.75rem;",
        "  padding: 0.875rem 1rem;",
        "  border-bottom: 1px solid var(--gray-200);",
        "  color: var(--gray-500);",
        "}",
        ".search-field input {",
        "  flex: 1; min-width: 0; border: 0; outline: none;",
        "  font: inherit; font-size: 0.9375rem; color: var(--gray-900);",
        "  background: transparent;",
        "}",
        ".search-field input::placeholder { color: var(--gray-400); }",
        ".search-field kbd {",
        "  font-family: var(--font); font-size: 0.6875rem; color: var(--gray-500);",
        "  border: 1px solid var(--gray-200); background: var(--gray-50);",
        "  border-radius: 0.25rem; padding: 0.05rem 0.35rem;",
        "}",
        ".search-results { overflow-y: auto; padding: 0.5rem; }",
        ".search-group-label {",
        "  margin: 0; padding: 0.5rem 0.75rem 0.25rem;",
        "  font-size: 0.75rem; font-weight: 600; color: var(--gray-500);",
        "}",
        ".search-item {",
        "  display: block; padding: 0.625rem 0.75rem; border-radius: 0.5rem;",
        "  color: inherit; text-decoration: none;",
        "}",
        ".search-item:hover, .search-item.active { background: var(--primary-bg); }",
        ".search-item-title {",
        "  display: block; font-size: 0.875rem; font-weight: 600; color: var(--gray-900);",
        "}",
        ".search-item-text {",
        "  display: block; margin-top: 0.15rem;",
        "  font-size: 0.75rem; line-height: 1.45; color: var(--gray-500);",
        "}",
        ".search-item mark {",
        "  background: rgba(13, 147, 115, 0.18); color: inherit;",
        "  border-radius: 0.2rem; padding: 0 0.1em;",
        "}",
        ".search-empty {",
        "  margin: 0; padding: 2rem 1rem; text-align: center;",
        "  font-size: 0.875rem; color: var(--gray-500);",
        "}",
        "@media (max-width: 640px) {",
        "  .search-overlay { padding: 0; align-items: stretch; }",
        "  .search-dialog { max-width: none; max-height: 100%; border-radius: 0; }",
        "}"
    ].join("\n");

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function highlight(text, query) {
        var safe = escapeHtml(text);
        if (!query) return safe;
        return safe.replace(new RegExp("(" + escapeRegExp(query) + ")", "ig"), "<mark>$1</mark>");
    }

    function snippet(text, query) {
        var clean = text.replace(/\s+/g, " ").trim();
        if (!clean) return "";
        var limit = 110;
        if (!query) return clean.length > limit ? clean.slice(0, limit) + "…" : clean;
        var index = clean.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return clean.length > limit ? clean.slice(0, limit) + "…" : clean;
        var start = Math.max(0, index - 28);
        var end = Math.min(clean.length, start + limit);
        return (start > 0 ? "…" : "") + clean.slice(start, end) + (end < clean.length ? "…" : "");
    }

    function collectItems() {
        var items = [];
        var seen = Object.create(null);

        document.querySelectorAll("a.card").forEach(function (card) {
            var href = card.getAttribute("href");
            if (!href || seen[href]) return;
            seen[href] = true;
            var titleEl = card.querySelector(".card-title");
            var textEl = card.querySelector(".card-text");
            var section = card.closest("section");
            var groupEl = section && section.querySelector("h2");
            items.push({
                title: (titleEl ? titleEl.textContent : card.textContent).replace(/\s+/g, " ").trim(),
                text: textEl ? textEl.textContent.replace(/\s+/g, " ").trim() : "",
                href: href,
                group: groupEl ? groupEl.textContent.trim() : "Pages"
            });
        });

        document.querySelectorAll("section[id]").forEach(function (section) {
            if (section.querySelector("a.card")) return;
            var href = "#" + section.id;
            if (seen[href]) return;
            var heading = section.querySelector("h2");
            if (!heading) return;
            seen[href] = true;
            var paragraph = section.querySelector("p");
            var sideLink = document.querySelector('.side-link[href="' + href + '"]');
            var groupTitle = sideLink && sideLink.closest(".group") && sideLink.closest(".group").querySelector(".group-title");
            items.push({
                title: heading.textContent.replace(/\s+/g, " ").trim(),
                text: paragraph ? paragraph.textContent.replace(/\s+/g, " ").trim() : "",
                href: href,
                group: groupTitle ? groupTitle.textContent.trim() : "On this page"
            });
        });

        return items;
    }

    function matches(item, query) {
        if (!query) return true;
        var q = query.toLowerCase();
        return [item.title, item.text, item.group].some(function (value) {
            return value.toLowerCase().indexOf(q) !== -1;
        });
    }

    function init() {
        var trigger = document.querySelector(".search");
        if (!trigger) return;

        var items = collectItems();
        if (!items.length) return;

        var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");
        var shortcut = isMac ? "⌘ K" : "Ctrl K";
        var triggerKbd = trigger.querySelector("kbd");
        if (triggerKbd) triggerKbd.textContent = shortcut;

        trigger.setAttribute("role", "button");
        trigger.setAttribute("tabindex", "0");
        trigger.setAttribute("aria-label", "Search");

        var style = document.createElement("style");
        style.textContent = STYLE;
        document.head.appendChild(style);

        var overlay = document.createElement("div");
        overlay.className = "search-overlay";
        overlay.hidden = true;
        overlay.innerHTML =
            '<div class="search-dialog" role="dialog" aria-modal="true" aria-label="Search">' +
                '<div class="search-field">' +
                    '<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd"/></svg>' +
                    '<input type="search" placeholder="Search pages and topics..." autocomplete="off" spellcheck="false">' +
                    "<kbd>ESC</kbd>" +
                "</div>" +
                '<div class="search-results"></div>' +
            "</div>";
        document.body.appendChild(overlay);

        var input = overlay.querySelector("input");
        var resultsEl = overlay.querySelector(".search-results");
        var dialog = overlay.querySelector(".search-dialog");
        var visible = [];
        var activeIndex = 0;

        function render(query) {
            visible = items.filter(function (item) { return matches(item, query); });
            activeIndex = 0;

            if (!visible.length) {
                resultsEl.innerHTML = '<p class="search-empty">No results for “' + escapeHtml(query) + '”</p>';
                return;
            }

            var html = "";
            var lastGroup = null;
            visible.forEach(function (item, index) {
                if (item.group !== lastGroup) {
                    html += '<p class="search-group-label">' + escapeHtml(item.group) + "</p>";
                    lastGroup = item.group;
                }
                var extra = /\.pdf($|[?#])/i.test(item.href) ? ' target="_blank" rel="noopener"' : "";
                html +=
                    '<a class="search-item' + (index === 0 ? " active" : "") + '" href="' + escapeHtml(item.href) +
                    '" data-index="' + index + '"' + extra + ">" +
                        '<span class="search-item-title">' + highlight(item.title, query) + "</span>" +
                        (item.text ? '<span class="search-item-text">' + highlight(snippet(item.text, query), query) + "</span>" : "") +
                    "</a>";
            });
            resultsEl.innerHTML = html;
        }

        function setActive(next) {
            if (!visible.length) return;
            activeIndex = (next + visible.length) % visible.length;
            var nodes = resultsEl.querySelectorAll(".search-item");
            nodes.forEach(function (node, index) {
                node.classList.toggle("active", index === activeIndex);
            });
            if (nodes[activeIndex]) nodes[activeIndex].scrollIntoView({ block: "nearest" });
        }

        function open() {
            overlay.hidden = false;
            document.body.style.overflow = "hidden";
            input.value = "";
            render("");
            requestAnimationFrame(function () { input.focus(); });
        }

        function close() {
            overlay.hidden = true;
            document.body.style.overflow = "";
            trigger.focus();
        }

        trigger.addEventListener("click", open);
        trigger.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                open();
            }
        });

        overlay.addEventListener("click", function (event) {
            if (event.target === overlay) close();
        });

        dialog.addEventListener("click", function (event) {
            event.stopPropagation();
        });

        input.addEventListener("input", function () {
            render(input.value.trim());
        });

        input.addEventListener("keydown", function (event) {
            if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive(activeIndex + 1);
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive(activeIndex - 1);
            } else if (event.key === "Enter") {
                event.preventDefault();
                var current = resultsEl.querySelectorAll(".search-item")[activeIndex];
                if (current) current.click();
            } else if (event.key === "Escape") {
                event.preventDefault();
                close();
            }
        });

        resultsEl.addEventListener("mousemove", function (event) {
            var item = event.target.closest(".search-item");
            if (!item) return;
            setActive(Number(item.getAttribute("data-index")));
        });

        resultsEl.addEventListener("click", function (event) {
            var item = event.target.closest(".search-item");
            if (!item) return;
            var href = item.getAttribute("href") || "";
            if (href.charAt(0) === "#") {
                event.preventDefault();
                close();
                var target = document.getElementById(href.slice(1));
                if (target) {
                    history.pushState(null, "", href);
                    target.scrollIntoView({ behavior: "smooth" });
                }
            } else {
                close();
            }
        });

        document.addEventListener("keydown", function (event) {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                if (overlay.hidden) open();
                else close();
            } else if (event.key === "Escape" && !overlay.hidden) {
                close();
            }
        });
    }

    function initNav() {
        var toggle = document.querySelector(".nav-toggle");
        var links = document.querySelector(".nav-links");
        var navbar = document.querySelector(".navbar");
        if (!toggle || !links || !navbar) return;

        function setOpen(open) {
            links.classList.toggle("is-open", open);
            navbar.classList.toggle("is-menu-open", open);
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
            toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        }

        toggle.addEventListener("click", function () {
            setOpen(!links.classList.contains("is-open"));
        });

        links.addEventListener("click", function (event) {
            if (event.target.closest("a")) setOpen(false);
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") setOpen(false);
        });

        window.addEventListener("resize", function () {
            if (window.getComputedStyle(toggle).display === "none") setOpen(false);
        });
    }

    function initTopics() {
        var toggle = document.querySelector(".topics-toggle");
        var sidebar = document.querySelector(".sidebar");
        var backdrop = document.querySelector(".drawer-backdrop");
        if (!toggle || !sidebar) return;

        if (!backdrop) {
            backdrop = document.createElement("div");
            backdrop.className = "drawer-backdrop";
            backdrop.hidden = true;
            document.body.appendChild(backdrop);
        }

        function setOpen(open) {
            sidebar.classList.toggle("is-open", open);
            backdrop.hidden = !open;
            document.body.classList.toggle("drawer-open", open);
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
        }

        toggle.addEventListener("click", function () {
            setOpen(!sidebar.classList.contains("is-open"));
        });
        backdrop.addEventListener("click", function () {
            setOpen(false);
        });
        sidebar.addEventListener("click", function (event) {
            if (event.target.closest("a")) setOpen(false);
        });
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") setOpen(false);
        });
        window.addEventListener("resize", function () {
            if (window.getComputedStyle(toggle).display === "none") setOpen(false);
        });
    }

    function start() {
        init();
        initNav();
        initTopics();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
})();
