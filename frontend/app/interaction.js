// Selecting Elements

const loginForm = document.querySelector(".login");
const signupForm = document.querySelector(".signup");

const showSignup = document.getElementById("showSignup");
const showLogin = document.getElementById("showLogin");

const leftTitle = document.querySelector(".left-content h1");
const leftText = document.querySelector(".left-content p");
const leftButton = document.getElementById("left-btn");

// Show Signup

showSignup.addEventListener("click", () => {

    loginForm.style.opacity = "0";

    setTimeout(() => {

        loginForm.classList.remove("active");
        loginForm.style.display = "none";

        signupForm.style.display = "block";

        setTimeout(() => {
            signupForm.classList.add("active");
            signupForm.style.opacity = "1";
        }, 50);

    }, 250);

    // Change left panel content

    leftTitle.innerHTML = "Join<br>AssetFlow";

    leftText.innerHTML =
        "Create your account and start managing your organizational assets efficiently.";

    leftButton.innerText = "Sign Up";
});

// Show Login

showLogin.addEventListener("click", () => {

    signupForm.style.opacity = "0";

    setTimeout(() => {

        signupForm.classList.remove("active");
        signupForm.style.display = "none";

        loginForm.style.display = "block";

        setTimeout(() => {
            loginForm.classList.add("active");
            loginForm.style.opacity = "1";
        }, 50);

    }, 250);

    // Restore left panel

    leftTitle.innerHTML = "Welcome<br>to AssetFlow";

    leftText.innerHTML =
        "Track, manage and monitor your organizational assets with ease.";

    leftButton.innerText = "Sign In";
});

// Left Button Functionality

leftButton.addEventListener("click", () => {

    if (signupForm.style.display === "block") {

        showLogin.click();

    } else {

        showSignup.click();

    }

});