const settings = {
  showCalories: true,
  autoSortByCalorieCount: true,
  hideAddons: true,
  hideSoldOutRecipes: true,
  hideRecipeAddons: true,
  hidePremiumRecipes: true,
};

let menus = {};
let recipes = {};

chrome.runtime.onMessage.addListener((request) => {
  if (request.event) {
    if (request.event === "FETCHED_MENU") {
      console.debug(
        "HelloFreshChromeHelper > Received menu from background worker:",
        request.menu
      );

      menus[request.menu.week] = request.menu;

      recipes = { ...recipes, ...request.menu.recipes };

      renderRecipeListingPageWhenReady();
    } else if (request.event === "NAVIGATED_TO_RECIPE_LISTING") {
      renderRecipeListingPageWhenReady();
    }
  }
});

const getAllRecipeBlocks = () => {
  return document.querySelectorAll("[data-recipe-id]");
};

const renderRecipeListingPageWhenReady = () => {
  console.debug(
    "HelloFreshChromeHelper > Checking if we are ready to render recipe listing page..."
  );

  const timer = setInterval(() => {
    if (getAllRecipeBlocks().length > 0) {
      clearInterval(timer);
      renderRecipeListingPage();
    }
  }, 500);
};

const renderRecipeListingPage = () => {
  console.debug("HelloFreshChromeHelper > Rendering recipe listing page");

  getAllRecipeBlocks().forEach((recipeBlock) => {
    const id = recipeBlock.dataset.recipeId;
    const recipe = recipes[id] || undefined;

    if (recipe) {
      const calories = recipe["nutrition"]["calories"];

      recipeBlock.dataset.calories = calories;

      if (settings.showCalories) {
        addCalorieCountToRecipeBlock(recipeBlock, calories);
      }

      // When an account is de-activated, the recipe image isn't clickable.  This wraps each image in an anchor to the
      // full recipe page.
      ensureRecipeImageIsWrappedInAnchor(recipeBlock, recipe);
    }
  });

  if (settings.autoSortByCalorieCount) {
    sortRecipeBlocksByCalorieCount();
  }

  if (settings.hideAddons) {
    hideAddons();
  }

  if (settings.hideSoldOutRecipes) {
    hideSoldOutRecipes();
  }

  if (settings.hideRecipeAddons) {
    hideRecipeAddons();
  }

  if (settings.hidePremiumRecipes) {
    hidePremiumRecipes();
  }
};

const addCalorieCountToRecipeBlock = (recipeBlock, calories) => {
  const id = recipeBlock.dataset.recipeId;
  console.debug(
    `HelloFreshChromeHelper > Adding calorie count block (${calories}) to recipe ${id}`
  );

  const descriptionBlock = recipeBlock.querySelector(
    "[data-test-id='recipe-card-title-description-block']"
  );

  if (descriptionBlock) {
    const existingExtraAttributesContainer = descriptionBlock.querySelector(
      ".hfch-extra-attributes-container"
    );

    if (existingExtraAttributesContainer) {
      existingExtraAttributesContainer.remove();
    }

    const extraAttributesContainer = document.createElement("div");
    extraAttributesContainer.className = "hfch-extra-attributes-container";

    const caloriesAttribute = document.createElement("div");
    caloriesAttribute.className = `hfch-extra-attribute ${getCaloriesClass(
      calories
    )}`;
    caloriesAttribute.innerHTML = `<strong>Calories:</strong>&nbsp;${calories} kcal`;

    extraAttributesContainer.appendChild(caloriesAttribute);

    descriptionBlock.appendChild(extraAttributesContainer);
  }
};

const ensureRecipeImageIsWrappedInAnchor = (recipeBlock, recipe) => {
  const id = recipeBlock.dataset.recipeId;
  const recipeImage = recipeBlock.querySelector(
    "[data-test-id='select-meal-image']"
  );

  if (recipeImage) {
    const parentOfRecipeImage = recipeImage.parentElement;

    if (parentOfRecipeImage.tagName.toLowerCase() !== "a") {
      console.debug(
        `HelloFreshChromeHelper > Wrapping recipe image for recipe ${id} in anchor to:`,
        recipe["websiteURL"]
      );

      parentOfRecipeImage.removeChild(recipeImage);

      const anchor = document.createElement("a");
      anchor.href = recipe["websiteURL"];

      anchor.appendChild(recipeImage);

      parentOfRecipeImage.appendChild(anchor);
    }
  }
};

const getCaloriesClass = (calories) => {
  if (calories <= 650) {
    return "hfch-calories-low";
  } else if (calories <= 800) {
    return "hfch-calories-med";
  } else {
    return "hfch-calories-high";
  }
};

const sortRecipeBlocksByCalorieCount = (direction) => {
  direction = direction || "asc";

  console.debug(
    `HelloFreshChromeHelper > Sorting recipe blocks by calorie count ${direction}`
  );

  const recipeBlocks = getAllRecipeBlocks();

  const sortableNodes = [];

  recipeBlocks.forEach((recipeBlock) => {
    const courseCard = recipeBlock.closest(
      "[data-test-id='course-card'], [data-test-id='sold-out-course-card']"
    );

    if (courseCard) {
      sortableNodes.push({
        courseCard: courseCard,
        calories: recipeBlock.dataset.calories || 99999,
      });
    }
  });

  sortableNodes.sort((sortableNodeA, sortableNodeB) => {
    if (direction === "asc") {
      return sortableNodeA["calories"] - sortableNodeB["calories"];
    } else {
      return sortableNodeB["calories"] - sortableNodeA["calories"];
    }
  });

  sortableNodes.forEach((sortableNode) => {
    const courseCard = sortableNode["courseCard"];
    const container = courseCard.parentElement;

    container.removeChild(courseCard);
    container.appendChild(courseCard);
  });
};

const hideAddons = () => {
  console.debug("HelloFreshChromeHelper > Hiding addons container");

  const addonContainer = document.querySelector(
    "[data-test-id='add-ons-all-meals']"
  );

  if (addonContainer) {
    addonContainer.style.display = "none";
  }
};

const hideSoldOutRecipes = () => {
  console.debug("HelloFreshChromeHelper > Hiding sold out recipes");

  const soldOutCourseCards = document.querySelectorAll(
    "[data-test-id='sold-out-course-card']"
  );

  soldOutCourseCards.forEach((soldOutCourseCard) => {
    soldOutCourseCard.style.display = "none";
  });
};

const hideRecipeAddons = () => {
  console.debug("HelloFreshChromeHelper > Hiding recipe addons");

  const addonBlocks = document.querySelectorAll(
    "[data-test-id='addons-modularity-selector-block']"
  );

  addonBlocks.forEach((addonBlock) => {
    addonBlock.style.display = "none";
  });
};

const hidePremiumRecipes = () => {
  console.debug("HelloFreshChromeHelper > Hiding premium recipes");

  const nodes = document.querySelectorAll(
    "[data-test-id='multiple-up-extra-price']"
  );

  nodes.forEach((node) => {
    const courseCard = node.closest("[data-test-id='course-card']");

    if (courseCard) {
      courseCard.style.display = "none";
    }
  });
};
