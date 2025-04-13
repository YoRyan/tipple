browser.action.onClicked.addListener(async tab => {
    const { cookieStoreId } = tab;
    if (cookieStoreId === undefined) return;

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
});
