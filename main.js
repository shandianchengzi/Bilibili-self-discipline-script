// ==UserScript==
// @name         b站自律脚本
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  1.除了搜索、视频页、私信页、个人主页、专栏之外的任何页都会被重定向到搜索页；2.视频页去掉相关推荐，并且非自己的视频去掉评论。(使用时请打开“设置”-“通用”-“仅在顶层页面（框架）运行”，否则会加载次数过多)
// @author       shandianchengzi
// @match        https://*.bilibili.com/*
// @icon         https://cdn2.iconfinder.com/data/icons/project-management-24/48/62-1024.png
// @grant        none
// ==/UserScript==

var skips = {
    2: ['message.bilibili.com', 'member.bilibili.com'], // 这些是个人消息管理的一些域名，我是UP主，所以需要查看这些，所以不禁用这些域名
    3: ['opus', 'read'] // opus and read is 专栏
};

var ad_class = ['vcd', 'ad-floor-cover', 'inside-wrp', 'activity_vote', 'pop-live-small-mode', 'ad-floor-exp'];

// remove ads
async function removeAds(){
    var isMyVideoPage = await checkMyVideoPage();
    // 等commentapp加载完毕, 每秒检查一次内容不为空或者不是在自己的视频里面的时候，再删除广告节点, 删除时连续删除5次
    var interval_func = setInterval(function(){
        var commentapp = document.getElementById('commentapp');
        if (commentapp != null) {
            if (commentapp.innerHTML != '' || isMyVideoPage == false) {
                for (var ii = 0; ii < 5; ii++) {
                    setTimeout(function(){
                        for (var i = 0; i < ad_class.length; i++) {
                            var ad = document.getElementsByClassName(ad_class[i]);
                            if (ad.length > 0) {
                                for (var j = 0; j < ad.length; j++) {
                                    // 直接把这个节点删除
                                    ad[j].parentNode.removeChild(ad[j]);
                                }
                            }
                        }
                    }, 1000*ii);
                }
                console.log('removeAds success');
                // remove interval
                clearInterval(interval_func);
            }
        }
    }
    , 1000);
}


// check if it is my space page, use the link and cookie to check
async function checkSpaceLink(link) {
  var checkSpaceLink = false;
  var uidArr = link.split('space.bilibili.com/');
  // use '/' or '?' to split the link
  var uid = uidArr[1].split('/')[0].split('?')[0];
  console.log('Check uid', uid);
  // get cookie
  var cookie = document.cookie;
  // get DedeUserID
  var DedeUserID = cookie.split('DedeUserID=')[1].split(';')[0];
  console.log('DedeUserID', DedeUserID);
  // compare uid and DedeUserID
  if (DedeUserID == uid) {
      checkSpaceLink = true;
  }
  return checkSpaceLink;
}


// check if it is my video page, use the href of class 'up-avatar' and 'header-entry-avatar' to check
async function checkMyVideoPage() {
  return new Promise((resolve, reject) => {
      console.log('checkMyVideoPage');
      var myVideoPage = false;
      // get the href of class 'up-avatar'
      var upAvatar = document.getElementsByClassName('up-avatar');
      var upAvatarHref = upAvatar[0].href;
      console.log('upAvatarHref', upAvatarHref);
      // split the href to get the uid
      myVideoPage = checkSpaceLink(upAvatarHref);
      resolve(myVideoPage);
  });
}


// sleep
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// try again 3 seconds later, max 10 times
async function try_catch_function(func) {
  var count = 0;
  var maxCount = 10;
  var interval = 3000;
  while (count < maxCount) {
      try {
          var result = await func();
          console.log('try_catch_function success');
          break;
      } catch (err) {
          console.log('try_catch_function failed', err);
          count += 1;
          if (count < maxCount) {
              await sleep(interval);
          }
      }
  }
}


async function mainFunc(){
  // for bilibili
  // not redirect:
  // 1. search: https://search.bilibili.com/
  // 2. video: https://www.bilibili.com/video/
  // 3. message: https://message.bilibili.com/
  // 4. space: https://space.bilibili.com/
  console.log('usualFunc');
  var url = window.location.href;
  var urlArr = url.split('/');
  // 1. for search page,
  if (urlArr[2] == 'search.bilibili.com') {
      // do nothing
      console.log('search page');
  }
  // 2. for video page,
  else if (urlArr[3] == 'video') {
      console.log('video page');
      // remove related videos and other nouseful things
      // 2.1 remove //*[@id="reco_list"] is the related videos
      var relatedVideos = document.getElementById('reco_list') || document.getElementsByClassName('recommend-list-v1');
      // 如果得到的结果是个列表就取第一个，但是如果没有length属性，就不是列表，就不用取第一个
      if (relatedVideos.length != undefined && relatedVideos.length > 0) {
          relatedVideos = relatedVideos[0];
      }
      relatedVideos.style.visibility = 'hidden';
      // 2.2 remove ads
      await try_catch_function(removeAds);
      var isMyVideoPage = await checkMyVideoPage();
      // for not my video page, remove comments
      if (isMyVideoPage == false) {
          console.log('not my video page');
          // remove //*[@id="comment"]
          var comment = document.getElementById('comment') || document.getElementById('commentapp');
          comment.style.display = 'none';
      }
      // 2.3 for my video page, remove comments
      else {
          console.log('my video page');
      }
      // 2.4 remove slide_ad
      var slide_ad = document.getElementById('slide_ad');
      if (slide_ad != null) {
          slide_ad.style.display = 'none';
      }
  }
  // for other pages
  else{
      // 3. for all the skip pages and skip domains,
      for (var key in skips) {
          for (var i = 0; i < skips[key].length; i++) {
              if (urlArr[key] == skips[key][i]) {
                  console.log('skip page');
                  // do nothing
                  return;
              }
          }
      }
      // 4. for space page,
      if (urlArr[2] == 'space.bilibili.com') {
          var isMyPage = await checkSpaceLink(url);
          // for my space page, do nothing
          if (isMyPage == true) {
              console.log('my space page');
              // do nothing
          }
          // for other space page, redirect to search page
          else if (isMyPage == false) {
              window.location.href = 'https://search.bilibili.com/';
          }
      }
      // for other pages, redirect to search page
      else {
          console.log('other page');
          window.location.href = 'https://search.bilibili.com/';
      }
  }
}

(function() {
  'use strict';
  // 只在顶层页面运行
  if (window.top !== window.self) {
      return;
  }
  // add mainFunc to onload
  console.log('add mainFunc to onload');
  var oldonload = window.onload;
  if (typeof window.onload != 'function') {
      mainFunc();
  }
  else {
      window.onload = function() {
          oldonload();
          console.log('oldonload success');
          mainFunc();
          console.log('mainFunc success');
      }
  }
  // Your code here...
})();