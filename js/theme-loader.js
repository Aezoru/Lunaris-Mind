// js/theme-loader.js
(function() {
    const savedTheme = localStorage.getItem('lunaris-theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
})();
