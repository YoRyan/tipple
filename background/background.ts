const pinDelayMs = 3000;
let pinState: ["confirm" | "done", number] | undefined = undefined;

browser.action.onClicked.addListener(async tab => {
    const { cookieStoreId } = tab;
    if (cookieStoreId === undefined) return;

    const { isOnToolbar } = await browser.action.getUserSettings();
    if (isOnToolbar === true) {
        if (pinState === undefined || pinState[0] === "done") {
            return pinConfirm();
        } else {
            await pinDone();
            return clearBrowsingData(cookieStoreId);
        }
    } else {
        await pinReset();
        return clearBrowsingData(cookieStoreId);
    }
});

async function pinConfirm() {
    pinClearTimer();
    pinState = ["confirm", setTimeout(pinReset, pinDelayMs)];
    return browser.action.setBadgeText({ text: "Wt" });
}

async function pinDone() {
    pinClearTimer();
    pinState = ["done", setTimeout(pinReset, pinDelayMs)];
    return browser.action.setBadgeText({ text: "Ok" });
}

async function pinReset() {
    pinClearTimer();
    pinState = undefined;
    return browser.action.setBadgeText({ text: "" });
}

function pinClearTimer() {
    if (pinState !== undefined) {
        const [, timer] = pinState;
        clearTimeout(timer);
    }
}

async function clearBrowsingData(cookieStoreId: string) {
    const options: browser.browsingData.RemovalOptions = {
        cookieStoreId,
        originTypes: {
            unprotectedWeb: true,
            protectedWeb: false,
            extension: false,
        },
    };
    return Promise.all([
        browser.browsingData.removeCookies(options),
        browser.browsingData.removeLocalStorage(options),
    ]);
}
