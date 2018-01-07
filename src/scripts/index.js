import { fail } from "assert";

var $ = require("jquery");
var fetch = require('graphql-fetch')('https://api.annict.com/graphql')

var defaults = {
  token: ""
}
var access_token = "";

chrome.storage.sync.get(
  defaults,
  function (items) {
    access_token = items.token

    if (access_token == "") {
      showMessage("The access token of `Annict` does not exist.")
    }
  }
)

// メッセージ用のボックスをInjectする
$("<style type='text/css'> .dialog {  position: fixed;  bottom: 60px;  right: 10px; border: 1px solid #888888;  padding: 2pt;  background-color: #ffffff;  filter: alpha(opacity=85);  -moz-opacity: 0.85;  -khtml-opacity: 0.85;  opacity: 0.85;      text-shadow: 0 -1px 1px #FFF, -1px 0 1px #FFF, 1px 0 1px #aaa;  -webkit-box-shadow: 1px 1px 2px #eeeeee;  -moz-box-shadow: 1px 1px 2px #eeeeee;  -webkit-border-radius: 3px;  -moz-border-radius: 3px; display: none;} </style>").appendTo("head");
$("<div/>").addClass("dialog").text('Message').appendTo("body");

// Controllerが表示されていたら移動させたい
// dialog.animate({'bottom':'10px','right':'10px'},500);
// dialog.animate({'bottom':'60px','right':'10px'},500);

var nextButton = $(".nextButton").get(0)
nextButton.addEventListener("click", function (e) { sendAnnict() });

var video = $("#video").get(0);
video.addEventListener("ended", function (e) { sendAnnict() });


function sendAnnict() {
  if (access_token == "") {
    return
  }
  var animeTitle = $(".backInfoTxt1").text();
  var animeEpisodeNumber = $(".backInfoTxt2").text();
  var animeEpisodeTitle = $(".backInfoTxt3").text();


  var k = (/ |　|・|～/g);
  var ext2 = animeTitle.split(k);
  var animeNumber = title2number(animeEpisodeNumber)

  fetchWork(ext2[0], function (result) {
    for (var i = 0; i < result.length; ++i) {
      var node = result[i].node
      var checkState = checkTitle(animeTitle, node.title)

      if (checkState) {
        console.log(node.title)
        var episodes = node.episodes.edges
        if (episodes.length <= 0) {
          console.log("no episodes.")
          break
        }
        for (var j = 0; j < episodes.length; ++j) {
          var episode = episodes[j].node

          var episodeNumber = title2number(episode.numberText)
          var episodeCheck = checkTitle(animeEpisodeTitle, episode.title)

          if (episodeNumber == animeNumber || episodeCheck) {
            postRecord(episode.annictId, function (status) {
              showMessage(animeTitle + " " + animeEpisodeNumber + " Annict send " + status + ".")
            })
            break
          }
        }
        break
      }
    }
  })
}

function showMessage(message) {
  var dialog = $(".dialog")
  dialog.text(message)
  dialog.hide().fadeIn('slow', function () {
    setTimeout(function () {
      dialog.fadeOut('slow')
    }, 5000);
  })
}

function postRecord(episodeId, callBack) {
  var url = "https://api.annict.com/v1/me/records?episode_id=" + episodeId + "&access_token=" + access_token;
  $.post(url, function (data, status) {
    callBack(status)
  });
}

function getWorkId(titleText, callback) {
  var myObject = {
    "filter_title": titleText,
    "per_page": 1,
    "fields": "id,title",
    "filter_status": "watching"
  };

  var url = "https://api.annict.com/v1/me/works?access_token=" + access_token;

  $.getJSON(
    url,
    $.param(myObject, true),
    function (data, status) {
      if (status == "success") {
        var count = data["works"].length
        if (count > 0) {
          var id = data["works"][0]["id"];
          callback(id);
        }
        else {
          showMessage("`" + titleText + "` did not exist.")
        }
      }
      else {
        showMessage("Get Work data error.")
      }
    }
  );
}

function getEpisodeId(episodeText, workId, callback) {

  var myObject = {
    "filter_work_id": workId,
    "sort_id": "asc"
  };

  var url = "https://api.annict.com/v1/episodes?access_token=" + access_token;

  $.getJSON(
    url,
    $.param(myObject, true),
    function (data, status) {
      if (status == "success") {
        var episodes = data["episodes"]
        var isCall = false
        for (var i = 0; i < episodes.length; i++) {
          var episode = episodes[i]
          if (episode["title"] == episodeText) {
            callback(episode["id"])
            isCall = true
            break
          }
        }

        if (isCall == false) {
          showMessage("`" + episodeText + "` did not exist.")
        }
      }
      else {
        showMessage("Get episode data error.")
      }
    }
  );
}

function fetchWork(title, callback) {
  var query = `
  query {
      searchWorks(
        titles:"`+ title + `",
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
    }
  `
  var queryVars = {
  }

  var myHeaders = new Headers();
  myHeaders.append('Authorization', 'Bearer ' + access_token);

  var opts = {
    headers: myHeaders
  }

  fetch(query, queryVars, opts).then(function (results) {
    if (results.errors) {
      callback({})
      return
    }
    var edges = results.data.searchWorks.edges
    callback(edges)
  })
}

function title2number(str) {
  if (str === "") {
    return ""
  }
  var converted = str.replace(/[０-９]/g, function (s) {
    return String.fromCharCode(s.charCodeAt(0) - 65248);
  });

  var str2 = converted.match(/\d+/g);
  return parseInt(str2, 10);
}

function checkTitle(title1, title2) {

  if (title1 == "" || title2 == "" ||
    title1 === undefined || title2 == undefined) {
    return false
  }

  var k = (/ |　|・|～/g);
  var title1Array = title1.split(k);

  var title2Array = title2.split(k);
  var check = true
  for (var j = 0; j < title1Array.length; ++j) {
    var ee = title1Array[j]
    if (title2Array.indexOf(ee) == -1) {
      check = false
      break
    }
  }

  return check
}

