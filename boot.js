/* Webtract - boot.js
   Runs first. Decides if the intro animation should play.
   Intro plays once per visit, only on the home page, and never
   for people who have "reduce motion" turned on. */
(function () {
  var d = document.documentElement;
  d.classList.add('js');
  try {
    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var seen = sessionStorage.getItem('wt_intro');
    var home = /\/(index\.html)?$/.test(location.pathname);
    if (home && !calm && !seen) { d.classList.add('intro'); }
  } catch (e) { /* storage blocked: skip the intro */ }

  /* Safety net: if anything goes wrong, never leave the page stuck. */
  setTimeout(function () {
    d.classList.remove('intro');
    d.classList.add('go');
  }, 7000);
})();
