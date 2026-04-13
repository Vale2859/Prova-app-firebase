(function(){
  var path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  document.documentElement.classList.add('mobile-only-mode');
  document.body && document.body.classList.remove('home-desktop');
  document.querySelectorAll('.home-desktop-nav,.home-nav-actions').forEach(function(el){el.remove();});
  document.querySelectorAll('[data-desktop-only], .desktop-only').forEach(function(el){el.remove();});
})();
(function(){
  document.documentElement.classList.remove('mobile-preload');
  document.body && document.body.classList.add('mobile-ready');
})();
