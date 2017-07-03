
export default function (chainVal) {
  const loaded = /^loaded|^i|^c/.test(document.readyState);
  const DOMContentLoaded = 'DOMContentLoaded';
  const load = 'load';

  return new Promise((resolve) => {
    if (loaded) {
      resolve(chainVal);
      return;
    }

    function onReady() {
      resolve(chainVal);
      document.removeEventListener(DOMContentLoaded, onReady);
      window.removeEventListener(load, onReady);
    }

    document.addEventListener(DOMContentLoaded, onReady);
    window.addEventListener(load, onReady);
  });
}
