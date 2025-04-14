type TippleStorage = { clearMinutesAgo?: number };

type TimeMenuId =
    | "0_five-minutes"
    | "1_two-hours"
    | "2_one-day"
    | "3_everything";
const timeMenu: Record<TimeMenuId, [i18n: string, minutes: number]> = {
    "0_five-minutes": ["setTimeFiveMinutes", 5],
    "1_two-hours": ["setTimeTwoHours", 2 * 60],
    "2_one-day": ["setTimeOneDay", 24 * 60],
    "3_everything": ["setTimeEverything", 0],
};

const pinDelayMs = 3000;
let pinState: [phase: "confirm" | "done", timer: number] | undefined =
    undefined;

browser.runtime.onInstalled.addListener(async () => {
    const { clearMinutesAgo } = await getStorage();
    for (const [id, [i18n, minutes]] of Object.entries(timeMenu)) {
        browser.menus.create({
            id,
            title: browser.i18n.getMessage(i18n),
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

browser.commands.onCommand.addListener(async command => {
    switch (command) {
        case "clear-data":
            const tab = await browser.tabs.getCurrent();
            if (tab === undefined) return;
            const { cookieStoreId } = tab;
            if (cookieStoreId === undefined) return;

            return clearBrowsingData(cookieStoreId);
    }
});

async function pinConfirm() {
    pinClearTimer();
    pinState = ["confirm", setTimeout(pinReset, pinDelayMs)];
    await browser.action.setBadgeText({ text: "?" });
    await setActionTitle("actionTitleConfirm");
}

async function pinDone() {
    pinClearTimer();
    pinState = ["done", setTimeout(pinReset, pinDelayMs)];
    await browser.action.setBadgeText({ text: "X" });
    await setActionTitle("actionTitleDone");
}

async function pinReset() {
    pinClearTimer();
    pinState = undefined;
    await browser.action.setBadgeText({ text: "" });
    await setActionTitle("actionTitleDefault");
}

function pinClearTimer() {
    if (pinState !== undefined) {
        const [, timer] = pinState;
        clearTimeout(timer);
    }
}

async function setActionTitle(i18n: string) {
    const title =
        browser.i18n.getMessage("extensionName") +
        " - " +
        browser.i18n.getMessage(i18n);
    return browser.action.setTitle({ title });
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
