const DEFAULT_USER_AGENT =
    "Mozilla/5.0 (X11; Linux x86_64; rv:142.0) Gecko/20100101 Firefox/142.0";

let currentUserAgent = DEFAULT_USER_AGENT;

browser.storage.local.get("userAgent").then(result => {
    if (result.userAgent) {
        currentUserAgent = result.userAgent;
    }
});

browser.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.userAgent) {
        currentUserAgent = changes.userAgent.newValue;
    }
});

browser.webRequest.onBeforeSendHeaders.addListener(
    details => {
        const headers = details.requestHeaders || [];

        let found = false;

        for (const header of headers) {
            if (header.name.toLowerCase() === "user-agent") {
                header.value = currentUserAgent;
                found = true;
                break;
            }
        }

        if (!found) {
            headers.push({
                name: "User-Agent",
                value: currentUserAgent
            });
        }

        return {
            requestHeaders: headers
        };
    },
    {
        urls: ["<all_urls>"]
    },
    ["blocking", "requestHeaders"]
);

console.log("User-Agent Spoofer HTTP layer loaded!");