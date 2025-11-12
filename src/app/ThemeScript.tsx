// src/app/ThemeScript.tsx
import Script from "next/script";

const ThemeScript = () => {
  const js = `
    try {
      var k='lakira.theme';
      var t = localStorage.getItem(k);
      if (t !== 'light' && t !== 'dark') {
        t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark':'light';
      }
      document.documentElement.setAttribute('data-theme', t);
    } catch(e) {}
  `;
  return (
    <Script id="theme-script" strategy="beforeInteractive">
      {js}
    </Script>
  );
};
export default ThemeScript;
