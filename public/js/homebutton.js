let timeout;
const homeButton = document.querySelector(".home-button");

function hideHomeButton() {
    homeButton.classList.add("hidden-home-button");
}

function showHomeButton() {
    homeButton.classList.remove("hidden-home-button");
    clearTimeout(timeout);
    timeout = setTimeout(hideHomeButton, 5000);
}

document.addEventListener("mousemove", showHomeButton);
document.addEventListener("touchstart", showHomeButton);

timeout = setTimeout(hideHomeButton, 5000);
