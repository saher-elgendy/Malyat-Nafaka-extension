chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ date: {day: '', month: '', year: ''} });
  chrome.storage.sync.set({note:''});
  chrome.storage.sync.set({storedDrugs: []})
});