console.log(`
    Okay, it's time to focus on developing something more competent.

    The first step is for me to get an idea of which pages are including which scripts.
`);


function onPageLoad() {
    const pageScripts = Array.from(document.querySelectorAll('script[type="module"]'));
    if (!pageScripts.length) {
        console.log('No module scripts found on this page.');
        return;
    }
    const firstHeadingOrLandmark = document.querySelector('h1, h2, h3, h4, h5, h6, main, [role="main"]');
    // insert a list of scripts after the first heading or landmark
    const container = document.createElement('div');
    container.style.border = '1px solid #ccc';
    container.style.padding = '10px';
    container.style.margin = '10px 0';
    container.style.backgroundColor = '#f9f9f9';
}

const SCRIPT_TIMEOUT = 300;
// Wait for the page to load and then check for module scripts
window.addEventListener('load', () => {
    setTimeout(onPageLoad, SCRIPT_TIMEOUT);
});