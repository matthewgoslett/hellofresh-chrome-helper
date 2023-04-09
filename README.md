# hellofresh-chrome-helper

hellofresh-chrome-helper is a free addon created to enhance one's experience when selecting recipes on the HelloFresh
website.

I created it for my personal use so that I could make calorie conscious choices on the recipe listing page, without
needing to click through to each recipe.

It is an unofficial addon and is not supported by the HelloFresh team. HelloFresh is a trademark of HelloFresh SE and
the bundled logo is copyrighted by and remains the property of HelloFresh SE.

![screenshot](images/screenshot1.png?raw=true "screenshot")

## Installation

This extension is currently pending review on the Chrome Web Store.

To install manually, you'll need to load it as an unpacked extension in developer mode.

See https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked for instructions.

## Building locally

1. `yarn install`
2. `make`

## Features

* Show calorie counts on the recipe listing page.
* Automatically sort by calorie count.
* Make recipe images always clickable to each recipe.
* Hide noisy addons on the recipe listing page.
* Hide sold out recipes.
* Hide individual recipe addons.
* Hide premium recipes (recipes which cost extra €€€)

## Wishlist

1. Make settings customisable in extension - not hard-coded.
2. Add ability to exclude based on keywords: eg, fish
3. Look at switching to typescript?
