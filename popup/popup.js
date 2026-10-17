const profileSelect = document.getElementById("profile");
const searchBox = document.getElementById("search");
const userAgentBox = document.getElementById("userAgent");
const customUserAgentBox = document.getElementById("customUserAgent");
const saveCustomButton = document.getElementById("saveCustom");
const applyButton = document.getElementById("apply");
const statusText = document.getElementById("statusText");

const browserInfo = document.getElementById("browserInfo");
const osInfo = document.getElementById("osInfo");
const deviceInfo = document.getElementById("deviceInfo");
const versionInfo = document.getElementById("versionInfo");

let profiles = [];
let lastRandomProfileId = null;
let curlClicks = 0;
let secretUnlocked = false;

function showInfo(profile) {
if (!profile) {
browserInfo.textContent = "—";
osInfo.textContent = "—";
deviceInfo.textContent = "—";
versionInfo.textContent = "—";
return;
}


browserInfo.textContent =
    profile.browser || "—";

osInfo.textContent =
    profile.os || "—";

deviceInfo.textContent =
    profile.device || "—";

versionInfo.textContent =
    profile.version || "—";


}

function unlockSecret() {
if (secretUnlocked) {
return;
}


secretUnlocked = true;

const existingSecret =
    profileSelect.querySelector(
        'option[value="__secret__"]'
    );

if (existingSecret) {
    return;
}

const secret = document.createElement("option");

secret.value = "__secret__";
secret.textContent = "secret";

profileSelect.appendChild(secret);

statusText.textContent =
    "🤫 Secret profile unlocked.";


}

function countCurlClick() {
if (profileSelect.value !== "curl") {
return;
}


curlClicks++;

if (curlClicks >= 4) {
    unlockSecret();
}


}

async function chooseRandomProfile() {
    // Random selection uses the bundled profile database only.
    // Custom and secret entries are not part of that database.
    const eligibleProfiles = profiles.filter(function(profile) {
        return Boolean(profile && profile.id && profile.userAgent);
    });

    if (eligibleProfiles.length === 0) {
        statusText.textContent = "No eligible profiles are available.";
        return;
    }

    let choices = eligibleProfiles;

    // Prefer a different profile when Random is selected repeatedly.
    if (eligibleProfiles.length > 1 && lastRandomProfileId) {
        const alternatives = eligibleProfiles.filter(function(profile) {
            return profile.id !== lastRandomProfileId;
        });
        if (alternatives.length > 0) {
            choices = alternatives;
        }
    }

    const selected = choices[Math.floor(Math.random() * choices.length)];
    lastRandomProfileId = selected.id;

    // Show the concrete profile selected, not the Random command.
    profileSelect.value = selected.id;
    userAgentBox.value = selected.userAgent || "";
    showInfo(selected);

    // Apply immediately, as requested by the feature proposal.
    await browser.storage.local.set({
        profile: selected,
        userAgent: selected.userAgent
    });

    statusText.textContent = "🎲 Randomly selected and applied: " +
        (selected.name || selected.id);
}

function selectProfile() {
const selected = profiles.find(function(profile) {
return profile.id === profileSelect.value;
});


if (!selected) {
    return;
}

userAgentBox.value =
    selected.userAgent || "";

showInfo(selected);


}

async function loadProfiles() {
const response = await fetch(
browser.runtime.getURL("profiles/uas.json")
);


if (!response.ok) {
    throw new Error(
        "Failed to load UA database: HTTP " +
        response.status
    );
}

const data = await response.json();

if (!Array.isArray(data.profiles)) {
    throw new Error(
        "UA database does not contain a profiles array."
    );
}

profiles = data.profiles;

profileSelect.innerHTML = "";

const randomOption = document.createElement("option");
randomOption.value = "__random__";
randomOption.textContent = "🎲 Random User-Agent";
profileSelect.appendChild(randomOption);

const groups = new Map();

for (const profile of profiles) {
    const browserName =
        profile.browser || "Other";

    if (!groups.has(browserName)) {
        groups.set(browserName, []);
    }

    groups.get(browserName).push(profile);
}

for (const [browserName, browserProfiles] of groups) {
    const group =
        document.createElement("optgroup");

    group.label = browserName;

    for (const profile of browserProfiles) {
        const option =
            document.createElement("option");

        option.value = profile.id;

        option.textContent =
            (profile.name || profile.id) +
            " — " +
            (profile.os || "Unknown");

        group.appendChild(option);
    }

    profileSelect.appendChild(group);
}

const custom =
    document.createElement("option");

custom.value = "__custom__";
custom.textContent =
    "✏️ Custom User-Agent";

profileSelect.appendChild(custom);

if (profileSelect.options.length > 1) {
    // Keep the initial selection on a real profile, not the Random command.
    profileSelect.selectedIndex = 1;
    selectProfile();
}


}

profileSelect.addEventListener(
"change",
async function() {
if (profileSelect.value === "__random__") {
    await chooseRandomProfile();
    return;
}

if (profileSelect.value === "**custom**") {
showInfo(null);


        userAgentBox.value =
            customUserAgentBox.value || "";

        return;
    }

    if (profileSelect.value === "__secret__") {
        showInfo(null);

        userAgentBox.value = "secret";

        return;
    }

    selectProfile();

    countCurlClick();
}


);

profileSelect.addEventListener(
"click",
function() {
countCurlClick();
}
);

searchBox.addEventListener(
"input",
function() {
const query =
searchBox.value
.trim()
.toLowerCase();


    if (!query) {
        return;
    }

    const match = profiles.find(
        function(profile) {
            const searchableText = [
                profile.name,
                profile.browser,
                profile.os,
                profile.device,
                profile.version,
                profile.category,
                profile.userAgent
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(query);
        }
    );

    if (!match) {
        return;
    }

    profileSelect.value = match.id;

    userAgentBox.value =
        match.userAgent || "";

    showInfo(match);
}


);

customUserAgentBox.addEventListener(
"input",
function() {
if (profileSelect.value === "**custom**") {
userAgentBox.value =
customUserAgentBox.value;
}
}
);

saveCustomButton.addEventListener(
"click",
async function() {
const customUA =
customUserAgentBox.value.trim();


    if (!customUA) {
        statusText.textContent =
            "Enter a custom User-Agent first.";

        return;
    }

    await browser.storage.local.set({
        profile: {
            id: "__custom__",
            name: "Custom User-Agent",
            browser: "Custom",
            os: "Unknown",
            device: "Unknown",
            version: "Custom",
            userAgent: customUA
        },

        userAgent: customUA
    });

    userAgentBox.value = customUA;

    statusText.textContent =
        "Custom User-Agent saved.";
}


);

applyButton.addEventListener(
"click",
async function() {
if (profileSelect.value === "**secret**") {
await browser.storage.local.set({
profile: {
id: "**secret**",
name: "secret",
browser: "secret",
os: "secret",
device: "secret",
version: "secret",
userAgent: "secret"
},


            userAgent: "secret"
        });

        window.close();

        return;
    }

    if (profileSelect.value === "__custom__") {
        const customUA =
            customUserAgentBox.value.trim();

        if (!customUA) {
            statusText.textContent =
                "Enter a custom User-Agent first.";

            return;
        }

        await browser.storage.local.set({
            profile: {
                id: "__custom__",
                name: "Custom User-Agent",
                browser: "Custom",
                os: "Unknown",
                device: "Unknown",
                version: "Custom",
                userAgent: customUA
            },

            userAgent: customUA
        });

        userAgentBox.value = customUA;

        statusText.textContent =
            "Custom User-Agent applied.";

        window.close();

        return;
    }

    const selected = profiles.find(
        function(profile) {
            return profile.id === profileSelect.value;
        }
    );

    if (!selected) {
        return;
    }

    await browser.storage.local.set({
        profile: selected,
        userAgent: selected.userAgent
    });

    window.close();
}


);

loadProfiles().catch(
function(error) {
console.error(
"User-Agent Spoofer: failed to load UA database",
error
);


    statusText.textContent =
        "Failed to load profiles.";
}


);
