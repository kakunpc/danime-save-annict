
// メッセージ用のボックスをInjectする
const s = document.createElement('script');
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

window.onload = function () {
    $("#save").on("click", function () {
        chrome.storage.sync.set({
            token: $("#token").val(),
            nextButtonSend: $("#nextButtonSend").val(),
            sendDelaySecond: $("#sendDelaySecond").val()
        });
        iziToast.show({
            title: "OK",
            message: "保存しました"
        })
    });

    $("#shawOAuth").click(function () {
        window.open("https://kakunpc.com/danime/openAnnict.php", '', 'location=no, width=640, height=480');
    });

    chrome.storage.sync.get(
        {
            token: "",
            nextButtonSend: false,
            sendDelaySecond: 300
        },
        items => {
            $("#token").val(items.token);
            $("#nextButtonSend").prop('checked', items.nextButtonSend);
            $("#sendDelaySecond").val(items.sendDelaySecond);
        }
    );
};
