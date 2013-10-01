var regex = /citation needed/;
if (regex.test(document.body.innerText)) {
   document.body.innerHTML = document.body.innerHTML.replace(new RegExp("citation needed", "g"), "10000");
   chrome.extension.sendRequest({}, function(response) {});
} else {
  // All the claims are cited in this page.
}
