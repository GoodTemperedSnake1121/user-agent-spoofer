(() => {
    "use strict";

    const DEFAULT_USER_AGENT =
        "Mozilla/5.0 (X11; Linux x86_64; rv:142.0) Gecko/20100101 Firefox/142.0";

    const DEFAULT_PROFILE = {
        userAgent: DEFAULT_USER_AGENT,
        appVersion: DEFAULT_USER_AGENT,
        appName: "Netscape",
        platform: "Linux x86_64",
        vendor: "",
        product: "Gecko"
    };

    function applyProfile(profile) {
        const values = {
            userAgent: profile.userAgent || DEFAULT_PROFILE.userAgent,
            appVersion: profile.appVersion || profile.userAgent || DEFAULT_PROFILE.appVersion,
            appName: profile.appName || DEFAULT_PROFILE.appName,
            platform: profile.platform || DEFAULT_PROFILE.platform,
            vendor: profile.vendor ?? DEFAULT_PROFILE.vendor,
            product: profile.product || DEFAULT_PROFILE.product
        };

        const NavigatorPrototype = Object.getPrototypeOf(navigator);

        function override(name, value) {
            try {
                Object.defineProperty(NavigatorPrototype, name, {
                    configurable: true,
                    get() {
                        return value;
                    }
                });
            } catch (error) {
                console.warn(
                    `User-Agent Spoofer: could not override navigator.${name}`,
                    error
                );
            }
        }

        override("userAgent", values.userAgent);
        override("appVersion", values.appVersion);
        override("appName", values.appName);
        override("platform", values.platform);
        override("vendor", values.vendor);
        override("product", values.product);
    }

    browser.storage.local.get("profile").then(result => {
        if (result.profile) {
            applyProfile(result.profile);
            return;
        }

        browser.storage.local.get("userAgent").then(uaResult => {
            const userAgent = uaResult.userAgent || DEFAULT_USER_AGENT;

            applyProfile({
                ...DEFAULT_PROFILE,
                userAgent,
                appVersion: userAgent
            });
        });
    });
})();
