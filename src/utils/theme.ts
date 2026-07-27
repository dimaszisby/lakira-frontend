export const setTheme = (theme: "light" | "dark") => {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("lakira.theme", theme);
};
export const getStoredTheme = (): "light" | "dark" | null => {
  const storedTheme = localStorage.getItem("lakira.theme");
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }
  return null;
};

export const getSystemTheme = (): "light" | "dark" => {
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};

export const initializeTheme = () => {
  const storedTheme = getStoredTheme();
  if (storedTheme) {
    setTheme(storedTheme);
  } else {
    const systemTheme = getSystemTheme();
    setTheme(systemTheme);
  }
};
// You can call initializeTheme() on app load to set the initial theme based on user preference or system setting.

export const toggleTheme = () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  if (currentTheme === "dark") {
    setTheme("light");
  } else {
    setTheme("dark");
  }
};

export const isDarkTheme = (): boolean => {
  return document.documentElement.getAttribute("data-theme") === "dark";
};

export const isLightTheme = (): boolean => {
  return document.documentElement.getAttribute("data-theme") === "light";
};
// You can use isDarkTheme() and isLightTheme() to conditionally render components or styles based on the current theme.

export const applyThemeClass = (element: HTMLElement) => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  if (currentTheme) {
    element.setAttribute("data-theme", currentTheme);
  }
};
export const removeThemeClass = (element: HTMLElement) => {
  element.removeAttribute("data-theme");
};
// You can use applyThemeClass() and removeThemeClass() to manage theme attributes on specific elements if needed.

export const getOppositeTheme = (theme: "light" | "dark"): "light" | "dark" => {
  return theme === "light" ? "dark" : "light";
};
// This function can be useful for toggling themes or displaying theme options to users.

export const prefersDarkMode = (): boolean => {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
};
// You can use prefersDarkMode() to check if the user has a system preference for dark mode.

export const prefersLightMode = (): boolean => {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
};
// You can use prefersLightMode() to check if the user has a system preference for light mode.

export const resetTheme = () => {
  localStorage.removeItem("lakira.theme");
  const systemTheme = getSystemTheme();
  setTheme(systemTheme);
};
// You can call resetTheme() to clear user preference and revert to system theme.

export const isSystemTheme = (): boolean => {
  const storedTheme = getStoredTheme();
  return storedTheme === null;
};
// You can use isSystemTheme() to determine if the current theme is based on system settings.

export const watchSystemThemeChanges = () => {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    const storedTheme = getStoredTheme();
    if (!storedTheme) {
      const newSystemTheme = e.matches ? "dark" : "light";
      setTheme(newSystemTheme);
    }
  });
};
// You can call watchSystemThemeChanges() on app load to automatically adapt to system theme changes.

export const stopWatchingSystemThemeChanges = () => {
  window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", () => {});
};
// You can call stopWatchingSystemThemeChanges() to stop listening for system theme changes if needed.
// This utility file provides comprehensive functions to manage light and dark themes in a Next.js application.
