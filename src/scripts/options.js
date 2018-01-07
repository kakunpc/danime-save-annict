
var $ = require("jquery");

// メッセージ用のボックスをInjectする
var s = document.createElement('script');
s.src = chrome.extension.getURL('js/iziToast.min.js');
s.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

var link = document.createElement("link");
link.href = chrome.extension.getURL("styles/iziToast.min.css");
link.type = "text/css";
link.rel = "stylesheet";
(document.head || document.documentElement).appendChild(link);

$(function () {
    $("#shawOAuth").click(function () {
        window.open("https://kakunpc.com/danime/openAnnict.php", '', 'location=no, width=640, height=480');
    });

    $("#save").click(function () {
        var token = $("#message").val()
        chrome.storage.sync.set({ token: token }, function () {
            iziToast.show({
                title: "OK",
                message: "保存しました"
            })
        })
    });

    var defaults = {
        token: ""
    }
    chrome.storage.sync.get(
        defaults,
        function (items) {
            $("#message").val(items.token);
        }
    )
});
