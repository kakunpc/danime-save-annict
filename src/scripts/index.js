const k = / |　|・|～|-|&|＆|#|＃/g;

let DsaDialog;
let AccessToken = "";
let NextButtonSend = false;
let SendDelaySecond = 300;
chrome.storage.sync.get(
  {
    token: "",
    nextButtonSend: false,
    sendDelaySecond: 300
  },
  storage => {
    AccessToken = storage.token
    NextButtonSend = storage.nextButtonSend;
    SendDelaySecond = storage.sendDelaySecond;
    if (AccessToken == "") {
      showMessage("The access token of `Annict` does not exist.")
    }
  }
);

window.onload = function () {
  // メッセージ用のボックスをInjectする
  $("<style>", { type: 'text/css' })
    .append(".dsa-dialog { position: fixed;  bottom: 60px;  right: 10px; border: 1px solid #888888;  padding: 2pt;  background-color: #ffffff;  filter: alpha(opacity=85);  -moz-opacity: 0.85;  -khtml-opacity: 0.85;  opacity: 0.85;      text-shadow: 0 -1px 1px #FFF, -1px 0 1px #FFF, 1px 0 1px #aaa;  -webkit-box-shadow: 1px 1px 2px #eeeeee;  -moz-box-shadow: 1px 1px 2px #eeeeee;  -webkit-border-radius: 3px;  -moz-border-radius: 3px; display: none;}")
    .appendTo("head");
  $("<div>").addClass("dsa-dialog").text('Message').appendTo("body");
  DsaDialog = $(".dsa-dialog")

  if (NextButtonSend) {
    const nextButton = $(".nextButton").get(0)
    nextButton.addEventListener("click", function (e) { sendAnnict() });
  }

  const video = $("#video").get(0);
  video.addEventListener("ended", function (e) { sendAnnict() });
  video.addEventListener("loadstart", () => {
    IsSended = false;
    setTimeout(() => {
      sendAnnict();
    }, SendDelaySecond * 1000)
  });

  let IsSended = false;

  async function sendAnnict() {
    if (AccessToken == "" || IsSended) {
      return
    }
    console.log("send Start")
    const animeTitle = $(".backInfoTxt1").text();
    const animeEpisodeNumber = $(".backInfoTxt2").text();
    const animeEpisodeTitle = $(".backInfoTxt3").text();


    const ext2 = animeTitle.split(k);
    const animeNumber = title2number(animeEpisodeNumber)

    const result = await fetchWork(ext2[0])

    if (result.length <= 0) {
      console.log(`No Hit Title. ${ext2[0]}`)
      showMessage(`No Hit Title. ${animeTitle}`)
      return
    }
    let sendResult = false
    for (var i = 0; i < result.length; ++i) {
      const node = result[i].node
      const checkState = checkTitle(animeTitle, node.title)
      if (checkState) {
        console.log(node.title)
        const episodes = node.episodes.edges
        if (episodes.length <= 0) {
          console.log("no episodes.")
          break
        }
        for (var j = 0; j < episodes.length; ++j) {
          const episode = episodes[j].node

          const episodeNumber = title2number(episode.numberText)
          const episodeCheck = checkTitle(animeEpisodeTitle, episode.title)

          if (episodeNumber == animeNumber || episodeCheck) {
            const status = await postRecord(episode.annictId)
            if (status >= 200 && status < 300) {
              showMessage(`${animeTitle} ${animeEpisodeNumber} Annict send success.`);
            }
            else {
              showMessage(`${animeTitle} ${animeEpisodeNumber} Annict send failure.`);
            }
            sendResult = true
            break
          }
        }
        break
      }
    }
    if (sendResult == false) {
      showMessage(`${animeTitle} ${animeEpisodeNumber} Annict send failure.`);
    }
    IsSended = true;
  }
}

function showMessage(message) {
  DsaDialog.text(message)
  DsaDialog.hide().fadeIn('slow', function () {
    setTimeout(function () {
      DsaDialog.fadeOut('slow')
    }, 5000);
  })
}

async function postRecord(episodeId) {
  const url = `https://api.annict.com/v1/me/records?episode_id=${episodeId}&access_token=${AccessToken}`;
  return await fetch(url, { method: "POST" }).then(res => res.status);
}

async function fetchWork(title) {
  const query = `
  { searchWorks(
          titles:"${title}",
          orderBy: { field: WATCHERS_COUNT, direction: DESC },
      ) {
          edges {
              node {
                  title
                  episodes(
                      orderBy: { field: SORT_NUMBER, direction: ASC },
                  ) {
                      edges {
                          node {
                          annictId
                          numberText
                          title
                          }
                      }
                  }
              }
          }
      }
  }`.replace(/\n/g, "");
  const graphql_url = `https://api.annict.com/graphql?query=${query}`;
  const headers = {
    'Authorization': `Bearer ${AccessToken}`
  };
  const opts = {
    method: "POST",
    headers: headers
  };
  return await fetch(graphql_url, opts)
    .then(res => res.json())
    .then(jsoned => jsoned.errors ? {} : jsoned.data.searchWorks.edges);
}

function title2number(str) {
  if (str === "") {
    return ""
  }
  const converted = str.replace(/[０-９]/g, function (s) {
    return String.fromCharCode(s.charCodeAt(0) - 65248);
  });

  const str2 = converted.match(/\d+/g);
  return parseInt(str2, 10);
}

function checkTitle(title1, title2) {

  if (title1 == "" || title2 == "" ||
    title1 === undefined || title2 == undefined) {
    return false
  }

  const title1Array = title1.split(k);

  const title2Array = title2.split(k);
  let check = true
  for (var j = 0; j < title1Array.length; ++j) {
    const ee = title1Array[j]
    if (title2Array.indexOf(ee) == -1) {
      check = false
      break
    }
  }

  return check
}

