type TippleStorage = { clearMinutesAgo?: number };

type TimeMenuId =
    | "0_five-minutes"
    | "1_two-hours"
    | "2_one-day"
    | "3_everything";
const timeMenu: Record<TimeMenuId, [title: string, minutes: number]> = {
    "0_five-minutes": ["Limit to last five minutes", 5],
    "1_two-hours": ["Limit to last two hours", 2 * 60],
    "2_one-day": ["Limit to last 24 hours", 24 * 60],
    "3_everything": ["Clear everything", 0],
};

const pinDelayMs = 3000;
let pinState: [phase: "confirm" | "done", timer: number] | undefined =
    undefined;

browser.runtime.onInstalled.addListener(async () => {
    const { clearMinutesAgo } = await getStorage();
    for (const [id, [title, minutes]] of Object.entries(timeMenu)) {
        browser.menus.create({
            id,
            title,
            type: "radio",
            checked:
                clearMinutesAgo === minutes ||
                (clearMinutesAgo == undefined && id === "3_everything"),
            contexts: ["action"],
        });
    }
});

browser.menus.onClicked.addListener(async ({ menuItemId }, tab) => {
    if (tab === undefined) return;
    const { cookieStoreId } = tab;
    if (cookieStoreId == undefined) return;

    switch (menuItemId) {
        case "0_five-minutes":
        case "1_two-hours":
        case "2_one-day":
        case "3_everything":
            const [, clearMinutesAgo] = timeMenu[menuItemId];
            const storage: TippleStorage = { clearMinutesAgo };
            return browser.storage.local.set(storage);
    }
});

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
    const { clearMinutesAgo } = await getStorage();
    let since: number;
    if (clearMinutesAgo === undefined || clearMinutesAgo <= 0) {
        since = 0;
    } else {
        since = new Date().getTime() - clearMinutesAgo * 60 * 1000;
    }

    const options: browser.browsingData.RemovalOptions = {
        cookieStoreId,
        since,
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

async function getStorage(): Promise<TippleStorage> {
    try {
        return await browser.storage.local.get();
    } catch {
        return {};
    }
}
