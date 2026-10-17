# Horizon Trail Travel

CSS describes how HTML content should look. It keeps presentation separate from the text, so colors, spacing, and type can change without rewriting the page. That keeps a site consistent. A CSS rule has a selector, a property, and a value. In style.css, the rule `label { color: #222222; }` uses the element selector `label`, the property `color`, and the value `#222222`, which paints every form label Airbnb-style soft black.

Each page of this site uses one CSS method. The home page uses inline CSS: a style attribute on the element itself. It is easy to see, but the same colors have to be repeated. The packages page uses embedded CSS, written in a style element in the head, so those rules apply only to that document. The booking page uses external CSS. The rules live in style.css and the page links to that file. One stylesheet can be reused and cached, and the HTML stays free of presentation.

CSS1 covered fonts, colors, margins, and simple backgrounds. CSS2 and CSS2.1 added positioning and a layout model browsers could share. Current CSS is published as modules, so Grid, Flexbox, and media queries advance on their own instead of waiting for one new edition.

Support still differs between browsers, so a valid property can look wrong or be ignored. I opened all three pages in Google Chrome and Safari on macOS. Both showed the navigation, the beach image, the package table, and the booking form. In Chrome, an empty required field, an email without an @ sign, a five-character password, and an age of 12 were rejected before the form could be sent.

The article around the Bali tour is semantic HTML: it marks a self-contained description. The div with class layout is non-semantic: it only places that article beside the booking tip.
