# tipple

A Firefox extension that cleans cookie and local storage data from the active tab's container using the [browsingData.removeCookies()](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browsingData/removeCookies) and [browsingData.removeLocalStorage()](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browsingData/removeLocalStorage) calls. Nothing more, nothing less. This is the same method used by the "Clear storage and cookies" [function](https://github.com/mozilla/multi-account-containers/issues/303) of Mozilla's Multi-Account Containers addon.

There are other API's that websites can use to store persistent data, like [sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage) and [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), so it is technically possible for a website to circumvent a cookies and localStorage-only clear. Nevertheless, this method seems to be effective for almost every website you'd encounter in the wild. So while Tipple can't protect you from government adversaries (consider Tor Browser instead), it _can_ clear your YouTube recommendations queue.

Tipple is named after the loading [machinery](https://en.wikipedia.org/wiki/Tipple) that tips over minecarts to unload their ores.

## Build

```bash
npm ci
npx tsc --project background/
```

## Usage

Open a tab in the container you want to clear, and then select Tipple's action icon to clear that container's cookies and storage. This operation comes with severe and irreversible consequences, so if the icon is pinned to the toolbar, there's an additional confirmation step: Select the action icon again within 3 seconds to confirm the clear.

By default, all data that can be cleared is cleared. In the action icon's context menu, you can restrict the operation to a recent time range, similar to Firefox's built-in Forget button.

In addition to containers that you create and manage yourself, Tipple can also be used to clear storage for other containers that are built into Firefox:

- The container for tabs without a defined container (the "no-container")
- The Private Browsing container when the addon is activated for private tabs
- The single container used for all browsing data in Firefox for Android
