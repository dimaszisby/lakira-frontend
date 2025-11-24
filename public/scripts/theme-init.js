(() => {
  try {
    const key = "lakira.theme";
    let theme = localStorage.getItem(key);

    if (theme !== "light" && theme !== "dark") {
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      theme = prefersDark ? "dark" : "light";
    }

    document.documentElement.setAttribute("data-theme", theme || "light");
  } catch (error) {
    // Swallow errors silently to avoid blocking render
  }
})();
