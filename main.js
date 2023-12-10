// ==UserScript==
// @name         b站自律脚本
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  1.除了搜索、视频页、私信页之外的任何页都会被重定向到搜索页；2.视频页去掉相关推荐，并且非自己的视频去掉评论。(使用时请打开“设置”-“通用”-“仅在顶层页面（框架）运行”，否则会加载次数过多)
// @author       shandianchengzi
// @match        https://*.bilibili.com/*
// @icon         https://cdn2.iconfinder.com/data/icons/project-management-24/48/62-1024.png
// @grant        none
// ==/UserScript==

// remove ads
async function removeAds(){
    var vcd = document.getElementsByClassName('vcd');
    if (vcd.length > 0) {
        for (var i = 0; i < vcd.length; i++) {
            vcd[i].style.display = 'none';
        }
    }
    var vote = document.getElementById('activity_vote');
    if (vote != null) {
        vote.style.display = 'none';
    }
    console.log('removeAds success');
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
        var upAvatarHrefArr = upAvatarHref.split('/');
        var uid = upAvatarHrefArr[upAvatarHrefArr.length - 1];
        // get cookie
        var cookie = document.cookie;
        // get DedeUserID
        var DedeUserID = cookie.split('DedeUserID=')[1].split(';')[0];
        console.log('DedeUserID', DedeUserID);
        // compare uid and DedeUserID
        if (DedeUserID == uid) {
            myVideoPage = true;
        }
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
    //针对b站的脚本，1.除了搜索、视频页、私信页之外的任何页都会被重定向到搜索页；2.视频页去掉相关推荐，并且非自己的视频去掉评论。
    // for bilibili
    // not redirect:
    // 1. search: https://search.bilibili.com/
    // 2. video: https://www.bilibili.com/video/
    // 3. message: https://message.bilibili.com/
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
        var relatedVideos = document.getElementById('reco_list');
        relatedVideos.style.visibility = 'hidden';
        // 2.2 remove ads
        await try_catch_function(removeAds);
        var isMyVideoPage = await checkMyVideoPage();
        // for not my video page, remove comments
        if (isMyVideoPage == false) {
            // remove //*[@id="comment"]
            var comment = document.getElementById('comment');
            comment.style.display = 'none';
        }
        // 2.2 for my video page, remove comments
        else {
            console.log('my video page');
        }
    }
    // 3. for message page,
    else if (urlArr[2] == 'message.bilibili.com') {
        console.log('message page');
        // do nothing
    }
    // for other pages, redirect to search page
    else {
        console.log('other page');
        window.location.href = 'https://search.bilibili.com/';
    }
}

(function() {
    'use strict';
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