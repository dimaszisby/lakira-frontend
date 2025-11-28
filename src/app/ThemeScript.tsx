import Script from "next/script";

const ThemeScript = () => {
  return <Script id="theme-script" src="/scripts/theme-init.js" strategy="beforeInteractive" />;
};

export default ThemeScript;
