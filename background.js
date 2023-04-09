const menuRequestFilter = {
  urls: [
    "https://www.hellofresh.nl/gw/my-deliveries/menu*",
    "https://www.hellofresh.de/gw/my-deliveries/menu*",
  ],
};
let authToken;
let menus = {};

// We bind a listener and hook into the HTTP call that HelloFresh does when they fetch their menu.  We intercept
// here so that we can store the JWT auth token. We can then use this auth token when we need to do any other
// API call to their backend.
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    details.requestHeaders.forEach((header) => {
      if (header.name.toLowerCase() === "authorization") {
        console.debug(
          "HelloFreshChromeHelper > Setting auth token to:",
          header.value
        );
        authToken = header.value;
      }
    });
  },
  menuRequestFilter,
  ["requestHeaders"]
);

// We bind a listener to detect navigation changes within the tab. When we navigate to a new menu page, we'll send
// a message to the active tab and let it know. The content script can then do anything it needs to do, such as
// re-render the recipe listing.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (
    changeInfo.url &&
    changeInfo.url.toLowerCase().indexOf("/my-account/deliveries/menu") >= 0
  ) {
    const message = { event: "NAVIGATED_TO_RECIPE_LISTING" };

    console.debug(
      `HelloFreshChromeHelper > Sending message to tab ${tab.id}:`,
      message
    );

    await chrome.tabs.sendMessage(tab.id, message);
  }
});

const saveMenu = async (week, meals) => {
  const recipes = {};

  meals.forEach((meal) => {
    const recipe = meal["recipe"];
    recipes[recipe["id"]] = recipe;
  });

  const menu = {
    week,
    recipes,
  };

  console.debug(`HelloFreshChromeHelper > Saving menu for week ${week}:`, menu);

  menus[week] = menu;

  await sendMenuToContentScript(menu);
};

// We bind a listener to when HelloFresh fetches the given week's menu from their backend. We then do the same so that
// we have access to the menu response within our content script. This unfortunately is a double hit to the backend,
// but I can't find any other way to hook into the response in the webRequest API.
chrome.webRequest.onCompleted.addListener((details) => {
  const menuUrl = details.url;
  const queryParams = new Proxy(new URLSearchParams(menuUrl), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  if (queryParams.hfch) {
    return;
  }

  const week = queryParams.week || undefined;

  if (week) {
    console.debug(
      "HelloFreshChromeHelper > Intercepted a request to fetch menu:",
      menuUrl
    );

    // noinspection JSIgnoredPromiseFromCall
    fetchMenu(details.url);
  }
}, menuRequestFilter);

const fetchMenu = async (menuUrl) => {
  // We append a hfch query string parameter to avoid an infinite loop in the webRequest listener. Without it,
  // the original HelloFresh call to fetch the menu will cause us do a fetchMenu, which would then cause the listener
  // to trigger another call, and so on.
  menuUrl += "&hfch=true";

  console.debug("HelloFreshChromeHelper > Fetching menu from:", menuUrl);

  const response = await fetch(menuUrl, {
    headers: { authorization: authToken },
  });

  const responseBody = await response.json();

  console.debug(
    "HelloFreshChromeHelper > Received menu response:",
    responseBody
  );

  await saveMenu(responseBody["week"], responseBody["meals"]);
};

const sendMenuToContentScript = async (menu) => {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  const message = { event: "FETCHED_MENU", menu };

  if (tab) {
    console.debug(
      `HelloFreshChromeHelper > Sending message to tab ${tab.id}:`,
      message
    );

    await chrome.tabs.sendMessage(tab.id, message);
  }
};
