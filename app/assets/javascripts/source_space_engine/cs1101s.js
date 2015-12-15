// Place all the behaviors and hooks related to the matching controller here.
// All this logic will automatically be available in application.js.
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Constants = require('../constants/constants.js');

var blackOverlay;
var tween;

module.exports.init = function() {
    blackOverlay = new PIXI.Graphics();
    blackOverlay.beginFill(0, 1);
    blackOverlay.drawRect(0, 0, Constants.screenWidth, Constants.screenHeight);
    blackOverlay.endFill();

    return blackOverlay;
}

function fadeOut(displayObject, cb) {
    if (tween) tween.progress(1).kill();
    tween = TweenLite.to(displayObject, Constants.fadeTime, {
        alpha: 0,
        ease: Power1.easeInOut,
        onComplete: function() {
            displayObject.visible = false;
            cb();
        }
    });
}

function fadeIn(displayObject, cb) {
    displayObject.visible = true;
    if (tween) tween.progress(1).kill();
    tween = TweenLite.to(displayObject, Constants.fadeTime, {
        alpha: 1,
        ease: Power1.easeInOut,
        onComplete: cb
    });
}

function blackTransition(middleSynchronous, callback) {
    callback = callback || Constants.nullFunction;
    blackScreen(function() {
        middleSynchronous();
        setTimeout(function() {
            fadeOut(blackOverlay, callback);
        }, 400);
    });
}
module.exports.blackTransition = blackTransition;

function blackScreen(callback) {
    callback = callback || Constants.nullFunction;
    fadeIn(blackOverlay, callback);
}
module.exports.blackScreen = blackScreen;

},{"../constants/constants.js":2}],2:[function(require,module,exports){
module.exports = {
    screenWidth : 1920,
    screenHeight : 1080,
    storyXMLPath : 'storyXML/',
    locationPath : 'assets/locations/',
    objectPath : 'assets/objects/',
    imgPath : 'assets/images/',
    avatarPath : 'assets/avatars/',
    uiPath: 'assets/UI/',
    fadeTime : 0.3,
    nullFunction : function() {}
};

module.exports.dialogBoxHeight = module.exports.screenHeight / 3;
module.exports.dialogBoxPadding = module.exports.screenHeight / 40;
module.exports.avatarOffset = module.exports.screenWidth / 5;
module.exports.nameOffset = module.exports.screenWidth / 10;
module.exports.namePadding = module.exports.screenWidth / 200;
module.exports.innerDialogPadding = module.exports.screenWidth / 80;
module.exports.fontSize = module.exports.screenWidth / 35;

module.exports.glowDistance = 30;

module.exports.textSpeed = 0.02;

},{}],3:[function(require,module,exports){
var Constants = require('../constants/constants.js');
var LocationManager = require('../location-manager/location-manager.js');
var ObjectManager = require('../object-manager/object-manager.js');
var FilterEffects = require('../filter-effects/filter-effects.js');

var advancePlaceHolder;
var pauseOverlayAction;
var numLines;
var imageGlowTextures;

var blackOverlay;
var pauseObjects;
var pauseOverlay;
var popupImage;
var dialogContainer;
var dialogText;
var leftAvatar;
var rightAvatar;
var leftNameBox;
var leftNameBack;
var leftNameText;
var rightNameBox;
var rightNameText;
var dialogOverlay;

module.exports.init = function() {
    var container = new PIXI.Container();
    // pause objects
    pauseObjects = new PIXI.Container();
    pauseObjects.visible = false;
    container.addChild(pauseObjects);
    // pause overlay to detect click during pause
    pauseOverlay = new PIXI.Graphics();
    pauseOverlay.interactive = true;
    pauseOverlay.hitArea = new PIXI.Rectangle(0, 0, Constants.screenWidth, Constants.screenHeight);
    pauseOverlay.visible = false;
    function onClickPause() {
        pauseOverlay.visible = false;
        pauseOverlayAction();
    }
    pauseOverlay.on('click', onClickPause);
    pauseOverlay.on('tap', onClickPause);
    container.addChild(pauseOverlay);
    // dialog container
    dialogContainer = new PIXI.Container();
    dialogContainer.position.x = Constants.dialogBoxPadding;
    dialogContainer.position.y = Constants.screenHeight - Constants.dialogBoxHeight + Constants.dialogBoxPadding;
    dialogContainer.visible = false;
    container.addChild(dialogContainer);
    // black overlay to darken the background
    blackOverlay = new PIXI.Graphics();
    blackOverlay.beginFill(0, 1);
    blackOverlay.drawRect(0, 0, Constants.screenWidth, Constants.screenHeight);
    blackOverlay.endFill();
    blackOverlay.alpha = 0.5;
    blackOverlay.position.x = -dialogContainer.position.x;
    blackOverlay.position.y = -dialogContainer.position.y;
    blackOverlay.visible = false;
    dialogContainer.addChild(blackOverlay);
    // popup image
    popupImage = new PIXI.Sprite();
    popupImage.anchor.set(0.5, 0.5);
    popupImage.position.set(Constants.screenWidth / 2 - dialogContainer.position.x,
        (Constants.screenHeight - Constants.dialogBoxHeight) / 2 - dialogContainer.position.y);
    dialogContainer.addChild(popupImage);
    // dialog box
    var dialogBox = new PIXI.Graphics();
    dialogBox.beginFill(0xffffff);
    dialogBox.drawRoundedRect(0, 0, Constants.screenWidth - 2*Constants.dialogBoxPadding,
            Constants.dialogBoxHeight - 2*Constants.dialogBoxPadding, 15);
    dialogBox.endFill();
    dialogContainer.addChild(dialogBox);
    // dialog text
    /* word wrapping not working
    dialogText = new PIXI.MultiStyleText("", {
        def: {font: Constants.fontSize + "px Ubuntu Mono"}
    }, {
        wordWrap: true,
        wordWrapWidth: Constants.screenWidth - 2*Constants.dialogBoxPadding - 2*Constants.innerDialogPadding
    });
    */
    dialogText = new PIXI.Text("", {
        font: Constants.fontSize + 'px Ubuntu Mono',
        wordWrap: true,
        wordWrapWidth: Constants.screenWidth - 2*Constants.dialogBoxPadding - 2*Constants.innerDialogPadding,
        lineHeight: Constants.fontSize*1.3
    })
    dialogText.position.x = Constants.innerDialogPadding;
    dialogText.position.y = Constants.innerDialogPadding;
    numLines = Math.round(
        (dialogBox.height - Constants.innerDialogPadding) / dialogText.height);
    dialogContainer.addChild(dialogText);
    // left and right avatars, note that they are children of dialogContainer
    leftAvatar = new PIXI.Sprite();
    leftAvatar.anchor.set(0.5, 1);
    leftAvatar.position.set(Constants.avatarOffset, 0);
    leftAvatar.visible = false;
    dialogContainer.addChild(leftAvatar);

    rightAvatar = new PIXI.Sprite();
    rightAvatar.anchor.set(0.5, 1);
    rightAvatar.position.set(dialogBox.width - Constants.avatarOffset, 0);
    rightAvatar.scale.x = -1;
    rightAvatar.visible = false;
    dialogContainer.addChild(rightAvatar);
    // left name box and text, also children of dialogContainer
    leftNameText = new PIXI.Text("", {
        font: Constants.fontSize + "px Fredoka One"
    });
    leftNameText.anchor.set(0, 1);
    leftNameText.position.set(Constants.namePadding*2, -Constants.namePadding);
    leftNameBack = new PIXI.Graphics();
    leftNameBack.beginFill(0xf14e3b);
    leftNameBack.drawRect(0, -leftNameText.height-2*Constants.namePadding,
            leftNameText.width + 4*Constants.namePadding, leftNameText.height + 2*Constants.namePadding);
    leftNameBack.endFill();
    leftNameBox = new PIXI.Container();
    leftNameBox.position.set(Constants.nameOffset, 3);
    leftNameBox.addChild(leftNameBack);
    leftNameBox.addChild(leftNameText);
    leftNameBox.visible = false;
    dialogContainer.addChild(leftNameBox);
    // right name box and text, also children of dialogContainer
    rightNameText = new PIXI.Text("", {
        font: Constants.fontSize + "px Fredoka One"
    });
    rightNameText.anchor.set(1, 1);
    rightNameText.position.set(-Constants.namePadding*2, -Constants.namePadding);
    rightNameBack = new PIXI.Graphics();
    rightNameBack.beginFill(0xf14e3b);
    rightNameBack.drawRect(-rightNameText.width - 4*Constants.namePadding,
            -rightNameText.height-2*Constants.namePadding,
            rightNameText.width + 4*Constants.namePadding, rightNameText.height + 2*Constants.namePadding);
    rightNameBack.endFill();
    rightNameBox = new PIXI.Container();
    rightNameBox.position.set(dialogBox.width - Constants.nameOffset, 3);
    rightNameBox.addChild(rightNameBack);
    rightNameBox.addChild(rightNameText);
    rightNameBox.visible = false;
    dialogContainer.addChild(rightNameBox);
    // dialog overlay, to control interactivity for dialog
    dialogOverlay = new PIXI.Graphics();
    dialogOverlay.interactive = true;
    dialogOverlay.hitArea = new PIXI.Rectangle(0, 0, Constants.screenWidth, Constants.screenHeight);
    dialogOverlay.position.x = -dialogContainer.position.x;
    dialogOverlay.position.y = -dialogContainer.position.y;
    function onClick() {
        dialogOverlay.interactive = false;
        advancePlaceHolder();
    }
    dialogOverlay.on('click', onClick);
    dialogOverlay.on('tap', onClick);
    dialogContainer.addChild(dialogOverlay);

    return container;
}

function playNarration(node, callback) {
    if (node.tagName != "NARRATION") {
        return;
    }
    dialogText.text = '';
    dialogContainer.visible = true;
    displayDialogText(node.textContent.trim(), function() {
        advancePlaceHolder = callback;
        dialogOverlay.interactive = true;
    });
}

function advancePopup(node, callback) {
    if (!node) {
        callback();
        return;
    }
    function next() {
        advancePopup(node.nextElementSibling, callback);
    }
    if (node.tagName == "NARRATION") {
        playNarration(node, next);
    } else if (node.tagName == "DIALOGUE") {
        playDialogue(node, next);
    }
}

function playPopup(node, callback) {
    if (node.tagName != "POPUP") {
        return;
    }
    var child = node.children[0];
    if (child.tagName != "IMAGE") {
        console.error("POPUP has no IMAGE");
        return;
    }
   popupImage.texture = imageGlowTextures[child.textContent];
   popupImage.visible = true;
   child = child.nextElementSibling;

    var next = function() {
        popupImage.visible = false;
        dialogOverlay.interactive = true;
        callback();
    }

    advancePopup(child, next);
}

function capitalizeName(name) {
    if (!name) {
        return name;
    }
    if (name == 'all') {
        return name;
    }
    function upperCase(text) {
        return text.toUpperCase();
    }
    return name.replace(/(?:^|-)([a-z])/g, upperCase).replace(/-/g, ' ');
}

function isSameName(name1, name2) {
    return capitalizeName(name1) == capitalizeName(name2);
}

function advanceDialogue(node, lastChangeLeft, callback) {
    if (!node) {
        // reset name text
        leftNameText.text = '';
        rightNameText.text = '';
        callback();
        return;
    }
    if (node.tagName != "SPEECH") {
        advanceDialogue(node.nextElementSibling, lastChangeLeft, callback);
    }
    var speaker = node.getAttribute("speaker");
    var expression = node.getAttribute("expression") || "normal";
    var audience = node.getAttribute("audience") || "all";
    var speakerSide;
    var audienceSide;
    var audienceTexture;

    // determine which side to draw on
    if (isSameName(leftNameText.text, speaker)) {
        speakerSide = 'left';
        audienceSide = 'right';
    } else if (isSameName(rightNameText.text, speaker)) {
        audienceSide = 'left';
        speakerSide = 'right';
    } else if ((audience == 'all') || (isSameName(rightNameText.text, audience))) {
        speakerSide = 'left';
        audienceSide = 'right';
    } else if (isSameName(leftNameText.text, audience)) {
        audienceSide = 'left';
        speakerSide = 'right';
    } else {
        speakerSide = lastChangeLeft ? 'right' : 'left';
        audienceSide = lastChangeLeft ? 'left' : 'right';
        lastChangeLeft = !lastChangeLeft;
    }

    // draw the speaker
    if (speakerSide == 'right') {
        // avatar
        rightAvatar.texture = PIXI.Texture
            .fromImage(Constants.avatarPath + speaker + '/' + expression + '.png');
        rightAvatar.visible = true;
        // name
        rightNameText.text = capitalizeName(speaker);
        rightNameBack.width = rightNameText.width + 4*Constants.namePadding;
        rightNameBox.visible = true;
    } else {
        // avatar
        leftAvatar.texture = PIXI.Texture
            .fromImage(Constants.avatarPath + speaker + '/' + expression + '.png');
        leftAvatar.visible = true;
        // name
        leftNameText.text = capitalizeName(speaker);
        leftNameBack.width = leftNameText.width + 4*Constants.namePadding;
        leftNameBox.visible = true;
    }
    // the audience
    if (audience == 'all') {
        // addressing everyone, hide audienceSide
        if (audienceSide == 'left') {
            leftAvatar.visible = false;
        } else {
            rightAvatar.visible = false;
        }
    } else {
        // show the audience, darkened
        if (audienceSide == 'left') {
            if (!isSameName(leftNameText.text, audience)) {
                leftAvatar.texture = FilterEffects.createDarkenedTexture(PIXI.Texture
                    .fromImage(Constants.avatarPath + audience + '/normal.png'));
                leftNameText.text = capitalizeName(audience);
            } else {
                leftAvatar.texture =
                    FilterEffects.createDarkenedTexture(leftAvatar.texture);
            }
            leftAvatar.visible = true;
        } else {
            if (!isSameName(rightNameText.text, audience)) {
                rightAvatar.texture = FilterEffects.createDarkenedTexture(PIXI.Texture
                    .fromImage(Constants.avatarPath + audience + '/normal.png'));
                rightNameText.text = capitalizeName(audience);
            } else {
                rightAvatar.texture =
                    FilterEffects.createDarkenedTexture(rightAvatar.texture);
            }
            rightAvatar.visible = true;
        }
    }
    // hide audienceside name
    if (audienceSide == 'left') {
        leftNameBox.visible = false;
    } else {
        rightNameBox.visible = false;
    }

    // dialog text
    displayDialogText(node.textContent.trim(), function() {
        advancePlaceHolder = function() {
           advanceDialogue(node.nextElementSibling, lastChangeLeft, callback);
        }
        dialogOverlay.interactive = true;
    });
}

function displayDialogText(text, callback) {
    callback = callback || Constants.nullFunction;
    var wrappedText = dialogText.wordWrap(text);
    var lines = wrappedText.split(/(?:\r\n|\r|\n)/);
    var curText = '';
    var tween;
    var temp = {_textLength: 0};
    Object.defineProperty(temp, 'textLength', {
        get: function() {
            return this._textLength;
        },
        set: function(length) {
            this._textLength = length;
            dialogText.text = curText.substring(0, length);
        }
    });
    function displayPart() {
        temp.textLength = 0;
        if (lines.length <= numLines) {
            curText = lines.join('\n');
            tween = TweenLite.to(temp, curText.length * Constants.textSpeed, {
                textLength: curText.length,
                ease: Power0.easeNone,
                onComplete: callback
            });
        } else {
            curText = lines.splice(0, numLines).join('\n');
            tween = TweenLite.to(temp, curText.length * Constants.textSpeed, {
                textLength: curText.length,
                ease: Power0.easeNone,
                onComplete: function() {
                    advancePlaceHolder = function() {
                        displayPart();
                    }
                    dialogOverlay.interactive = true;
                }
            });
        }
        advancePlaceHolder = function() {
            tween.progress(1);
        }
        dialogOverlay.interactive = true;
    }
    displayPart();
}

function playDialogue(node, callback) {
    if (node.tagName != "DIALOGUE") {
        return;
    }
    if (node.children.length <= 0) {
        return callback();
    }
    blackOverlay.visible = true;
    dialogText.text = '';
    dialogContainer.visible = true;
    advanceDialogue(node.children[0], false, function() {
        // hide dialogue layers
        leftAvatar.visible = false;
        rightAvatar.visible = false;
        leftNameBox.visible = false;
        rightNameBox.visible = false;
        blackOverlay.visible = false;
        callback();
    });
}

function playPause(node, callback) {
    if (node.tagName != "PAUSE") {
        return;
    }
    dialogContainer.visible = false;
    pauseObjects.removeChildren();
    function onClick() {
        pauseObjects.visible = false;
        callback();
    }
    for (var i=0; i<node.children.length; i++) {
        var child = node.children[i];
        var object = ObjectManager.parsePauseObject(child, onClick);
        pauseObjects.addChild(object);
    }
    var duration = parseFloat(node.getAttribute("duration"));
    if (duration == 0) {
        pauseOverlayAction = onClick;
        pauseOverlay.visible = true;
    } else if (duration > 0) {
        setTimeout(onClick, 1000*duration);
    }
    pauseObjects.visible = true;
}

function playLocation(node, callback) {
    if (node.tagName != "LOCATION") {
        return;
    }
    dialogContainer.visible = false;
    LocationManager.changeSeqLocation(node, callback);
}

function advanceSequence(node, callback) {
    if (!node) {
        callback();
        return;
    }
    function next() {
        advanceSequence(node.nextElementSibling, callback);
    }
    if (node.tagName == "POPUP") {
        playPopup(node, next);
    } else if (node.tagName == "NARRATION") {
        playNarration(node, next);
    } else if (node.tagName == "DIALOGUE") {
        playDialogue(node, next);
    } else if (node.tagName == "PAUSE") {
        playPause(node, next);
    } else if (node.tagName == "LOCATION") {
        playLocation(node, next);
    } else {
        next();
    }
}

function playSequence(node, callback) {
    if (node.tagName != "SEQUENCE") {
        return;
    }
    if (node.children.length <= 0) {
        callback();
        return;
    }
    // pre-render popup image first
    imageGlowTextures = {};
    var images = node.getElementsByTagName("IMAGE");
    for (var i=0; i<images.length; i++) {
       var rawImage = new PIXI.Sprite.fromImage(Constants.imgPath + images[i].textContent);
       rawImage.anchor.set(0.5, 0.5);
       var glowTexture = FilterEffects.createGlowTexture(rawImage);
       imageGlowTextures[images[i].textContent] = glowTexture;
    }

    ObjectManager.setMapObjectsInteractivity(false);
    ObjectManager.setSeqObjectsVisibility(true);
    advanceSequence(node.children[0], function() {
        // hide sequence layers
        dialogContainer.visible = false;
        ObjectManager.setMapObjectsInteractivity(true);
        ObjectManager.setSeqObjectsVisibility(false);
        callback();
    });
}
module.exports.playSequence = playSequence;

},{"../constants/constants.js":2,"../filter-effects/filter-effects.js":5,"../location-manager/location-manager.js":7,"../object-manager/object-manager.js":10}],4:[function(require,module,exports){
var externalHooks;

var externalOverlay;

module.exports.init = function(hookHandlers) {
    externalHooks = hookHandlers;

    externalOverlay = new PIXI.Container();
    externalOverlay.visible = false;
    return externalOverlay;
}

function getExternalOverlay() {
    return externalOverlay;
}
module.exports.getExternalOverlay = getExternalOverlay;

function playExternalAction(node) {
    if (node.tagName != "EXTERNAL_ACTION") {
        return;
    }
    if (typeof externalHooks[node.getAttribute('name')] != 'function') {
        return;
    }
    var argList = [];
    if (node.children.length > 0) {
        var child = node.children[0];
        while (child) {
            if (child.tagName == "ARGUMENT") {
                argList.push(child.textContent);
            }
            child = child.nextElementSibling;
        }
    }
    externalHooks[node.getAttribute('name')].apply(this, argList);
}
module.exports.playExternalAction = playExternalAction;

},{}],5:[function(require,module,exports){
var Constants = require('../constants/constants.js');
var Utils = require('../utils/utils.js');

var darkFilter = new PIXI.filters.ColorMatrixFilter();
darkFilter.brightness(0.8);

function createTexture(displayObject, filters, width, height) {
    var texture = new PIXI.RenderTexture(Utils.getRenderer(), width, height);
    displayObject.filters = filters;
    texture.render(displayObject);
    return texture;
}

function createFilteredTexture(texture, filters) {
    var sprite = new PIXI.Sprite(texture);
    return createTexture(sprite, filters, texture.width, texture.height);
}

function createGlowTexture(displayObject) {
    var width = displayObject.width + 2*Constants.glowDistance;
    var height = displayObject.height + 2*Constants.glowDistance;
    displayObject.position.x = width/2;
    displayObject.position.y = height/2;
    var container = new PIXI.Container();
    container.addChild(displayObject);
    var glowFilter = new PIXI.filters.GlowFilter(width, height, Constants.glowDistance, 2.5, 0, 0xfffbd6, 0.5);
    glowFilter.padding = Constants.glowDistance;
    return createTexture(container, [glowFilter], width, height);
}
module.exports.createGlowTexture = createGlowTexture;

function createDarkenedTexture(texture) {
    return createFilteredTexture(texture, [darkFilter]);
}
module.exports.createDarkenedTexture = createDarkenedTexture;

},{"../constants/constants.js":2,"../utils/utils.js":16}],6:[function(require,module,exports){
var StoryPlayer = require('./story-xml-player.js');

module.exports = function(container, saveData) {
    var saveData = saveData || loadFromServer();
    StoryPlayer.init(container, saveData, hookHandlers,
        saveToServer, openWristDevice,
        function() {
            StoryPlayer.sendNotification(function() {
                window.alert('you have new notification');
            });
    });
}

function saveToServer(saveData) {
    //TODO
    if(typeof(Storage) !== "undefined") {
        // Code for localStorage/sessionStorage.
        localStorage.setItem('cs1101s', saveData);
    }
}

function loadFromServer() {
    //TODO
    if(typeof(Storage) !== "undefined") {
        // Code for localStorage/sessionStorage.
        return localStorage.getItem('cs1101s');
    }
}

var hookHandlers = {
    startMission: function(number) {
        //TODO
        setTimeout(function() {
            window.alert('mission ' + number + ' will start');
        }, 1000);
    },
    openTemplate: function(name) {
        //TODO
        setTimeout(function() {
            window.alert(name + ' will be displayed');
        }, 1000);
    },
    pickUpCollectible: function(name) {
        //TODO
        window.alert('collectible ' + name + ' is picked up');
    }
}

function openWristDevice() {
    //TODO
    window.alert('Wrist Device will be shown');
}

},{"./story-xml-player.js":14}],7:[function(require,module,exports){
var Constants = require('../constants/constants.js');
var MapManager = require('../map-manager/map-manager.js');
var ObjectManager = require('../object-manager/object-manager.js');
var DialogManager = require('../dialog-manager/dialog-manager.js');
var SaveManager = require('../save-manager/save-manager.js');
var QuestManager = require('../quest-manager/quest-manager.js');
var ExternalManager = require('../external-manager/external-manager.js');
var BlackOverlay = require('../black-overlay/black-overlay.js');
var MapOverlay = require('../map-overlay/map-overlay.js');

var gameBackground;

var curCameraLocation;
var startLocation;

module.exports.init = function() {
    // background
    gameBackground = new PIXI.Sprite();
    gameBackground.position.x = 0;
    gameBackground.position.y = 0;
    gameBackground.width = Constants.screenWidth;
    gameBackground.height = Constants.screenHeight;

    return gameBackground;
};

// change the location when playing a sequence
function changeSeqLocation(node, callback) {
    if ((node.tagName != "LOCATION") || (node.parentElement.tagName != "SEQUENCE")) {
        return;
    }
    callback = callback || Constants.nullFunction;
    BlackOverlay.blackTransition(function() {
        var name = node.getAttribute('name');
        var skin = node.getAttribute('skin');
        gameBackground.texture = PIXI.Texture.fromImage(
            Constants.locationPath + name + "/" + skin + ".png");
        ObjectManager.clearMapObjects();
        ObjectManager.changeMapObjects(name, node.getAttribute("clear") == "true");
        ObjectManager.clearSeqObjects();
        if (node.children.length > 0) {
            var child = node.children[0];
            while (child) {
                if (child.tagName == "OBJECT") {
                    ObjectManager.addSeqObject(child);
                }
                child = child.nextElementSibling;
            }
        }
        curCameraLocation = name;
    }, callback);
}
module.exports.changeSeqLocation = changeSeqLocation;

function changeMapLocation(name, callback, middleSynchronous) {
    if (!MapManager.locationExist(name)) {
        return;
    }
    BlackOverlay.blackTransition(function() {
        middleSynchronous();
        var newLocation = MapManager.getGameLocation(name);
        gameBackground.texture = PIXI.Texture.fromImage(
            Constants.locationPath + newLocation.name + "/" + newLocation.skin + ".png");
        ObjectManager.clearMapObjects();
        ObjectManager.changeMapObjects(name, false);
        curCameraLocation = name;
    }, callback);
}

// change the location in roaming mode
function gotoLocation(name, callback, middleSynchronous) {
    if (!MapManager.locationExist(name)) {
        return;
    }
    callback = callback || Constants.nullFunction;
    middleSynchronous = middleSynchronous || Constants.nullFunction;
    changeMapLocation(name, function() {
        var gameLocation = MapManager.getGameLocation(name);
        if (gameLocation.sequence) {
            DialogManager.playSequence(gameLocation.sequence, function() {
                var sequence = gameLocation.sequence;
                if (gameLocation.sequence.getAttribute("displayOnce") == "true") {
                    SaveManager.saveSeeDisplayOnceSeq(gameLocation.sequence, name);
                    gameLocation.sequence = null;
                }
                var child = sequence.nextElementSibling;
                function nextAction(child) {
                    if ((!child) || (child.tagName == 'OBJECT')) {
                        callback();
                        return;
                    }
                    if (child.tagName == "COMPLETE_QUEST") {
                        QuestManager.playCompleteQuest(child, function() {
                            nextAction(child.nextElementSibling);
                        });
                    } else if (child.tagName == "UNLOCK_QUEST") {
                        QuestManager.playUnlockQuest(child, function() {
                            nextAction(child.nextElementSibling);
                        });
                    } else if (child.tagName == "EXTERNAL_ACTION") {
                        ExternalManager.playExternalAction(child);
                        nextAction(child.nextElementSibling);
                    } else if (child.tagName == "CHANGE_START_LOCATION") {
                        changeStartLocation(child.textContent);
                        nextAction(child.nextElementSibling);
                    } else {
                        nextAction(child.nextElementSibling);
                    }
                }
                nextAction(child);
            });
        } else {
            callback();
        }
    }, middleSynchronous);
}
module.exports.gotoLocation = gotoLocation;

module.exports.goBackToCurCamLocation = function(callback, middleSynchronous) {
    verifyCurCamLocation();
    gotoLocation(curCameraLocation, callback, middleSynchronous);
}

// close a story, need to verify whether curCameraLocation is still valid
// return whether current camera location is valid
verifyCurCamLocation = function() {
    var valid = MapManager.locationExist(curCameraLocation);
    curCameraLocation = valid ? curCameraLocation : startLocation;
    if (!MapManager.locationExist(curCameraLocation)) {
        console.error("startLocation/curCameraLocation is corrupted");
    }
    return valid;
}
module.exports.verifyCurCamLocation = verifyCurCamLocation;

function changeStartLocation(loc) {
    if (loc && MapManager.locationExist(loc)) {
        startLocation = loc;
    }
}
module.exports.changeStartLocation = changeStartLocation;

function getStartLocation(loc) {
    return startLocation;
}
module.exports.getStartLocation = getStartLocation;

gotoStartLocation = function(callback, middleSynchronous) {
    gotoLocation(startLocation, callback, middleSynchronous);
}
module.exports.gotoStartLocation = gotoStartLocation;

// return a callback function that check ensure valid current location before proceeding
function verifyGotoStart(callback) {
    return function() {
        if (!verifyCurCamLocation()) {
            gotoStartLocation(callback, function() {
                MapOverlay.setVisibility(true);
            });
        }
    }
}
module.exports.verifyGotoStart = verifyGotoStart;

},{"../black-overlay/black-overlay.js":1,"../constants/constants.js":2,"../dialog-manager/dialog-manager.js":3,"../external-manager/external-manager.js":4,"../map-manager/map-manager.js":8,"../map-overlay/map-overlay.js":9,"../object-manager/object-manager.js":10,"../quest-manager/quest-manager.js":11,"../save-manager/save-manager.js":12}],8:[function(require,module,exports){
var ObjectManager = require('../object-manager/object-manager.js')
var LocationManager = require('../location-manager/location-manager.js');

var gameMap = {};

function processMap(map) {
    for (var i=0; i<map.children.length; i++) {
        var rawLocation = map.children[i];
        processMapLocation(rawLocation);
    }
    if (!LocationManager.getStartLocation()) {
        LocationManager.changeStartLocation(map.children[0].getAttribute("name"));
    }
}
module.exports.processMap = processMap;

function createGameLocation(name, skin, objects) {
    return {name: name, skin: skin, objects: objects, sequence: null};
}

function addSeqAndObjects(child, gameLocation) {
    if ((child) && (child.tagName == "SEQUENCE")) {
        gameLocation.sequence = child;
        child = child.nextElementSibling;
    }
    while (child) {
        if (child.tagName == "OBJECT") {
            gameLocation.objects.addChild(ObjectManager.parseObject(child));
        } else if (child.tagName == "TEMP_OBJECT") {
            ObjectManager.processTempObject(gameLocation, child);
        }
        child = child.nextElementSibling;
    }
}

function processMapLocation(node) {
    if ((node.tagName != 'LOCATION') || (node.parentElement.tagName != 'MAP')) {
        return;
    }
    var name = node.getAttribute("name");
    var skin = node.getAttribute("skin");
    var gameLocation;
    var child = node.children[0];
    var objects = new PIXI.Container();
    gameLocation = createGameLocation(name, skin, objects);
    gameMap[name] = gameLocation;
    addSeqAndObjects(child, gameLocation);
    return gameLocation;
}

function processEffectsLocation(node) {
    if ((node.tagName != 'LOCATION') || (node.parentElement.tagName != 'EFFECTS')) {
        return;
    }
    var name = node.getAttribute("name");
    var skin = node.getAttribute("skin");
    var gameLocation;
    var child = node.children[0];
    gameLocation = gameMap[name];
    gameLocation.skin = skin;
    if (node.getAttribute("clear") == "true") {
        gameLocation.objects.removeChildren();
    }
    addSeqAndObjects(child, gameLocation);
    return gameLocation;
}
module.exports.processEffectsLocation = processEffectsLocation;

function clearMap() {
    gameMap = {};
}
module.exports.clearMap = clearMap;

function getGameLocation(locName) {
    if (locationExist(locName)) {
        return gameMap[locName];
    }
}
module.exports.getGameLocation = getGameLocation;

function locationExist(locName) {
    return !(!(gameMap[locName]));
}
module.exports.locationExist = locationExist;

},{"../location-manager/location-manager.js":7,"../object-manager/object-manager.js":10}],9:[function(require,module,exports){
var Constants = require('../constants/constants.js');

var hasNotification;
var wristDeviceFunction;

var mapOverlay;
var wristDeviceButton;

module.exports.init = function(wristDeviceFunc) {
    // map overlay, always appear in roaming mode
    mapOverlay = new PIXI.Container();
    wristDeviceButton = new PIXI.Sprite.fromImage(Constants.uiPath + 'wristDeviceButton.png');
    wristDeviceButton.position.set(50, 50);
    wristDeviceButton.interactive = true;
    wristDeviceButton.buttonMode = true;
    wristDeviceFunction = wristDeviceFunc;
    function openWristDevice() {
        wristDeviceFunction();
    }
    wristDeviceButton
        .on('click', openWristDevice)
        .on('tap', openWristDevice);

    mapOverlay.addChild(wristDeviceButton);
    mapOverlay.visible = false;

    return mapOverlay;
}

function sendNotification(callback) {
    var oldFunction = wristDeviceFunction;
    changeWristDeviceFunction(function() {
        changeWristDeviceFunction(oldFunction);
        hasNotification = false;
        callback();
    });
    hasNotification = true;
    var blinkTween;
    function blink() {
        if (!hasNotification) {
            blinkTween.kill();
            return;
        }
        blinkTween = TweenLite.to(wristDeviceButton, 0.1, {
            alpha: 0.1,
            ease: Power0.easeIn,
            onComplete: function() {
                setTimeout(function() {
                    blinkTween = TweenLite.to(wristDeviceButton, 0.1, {
                        alpha: 1,
                        ease: Power0.easeOut,
                        onComplete: function() {
                            setTimeout(blink, 300);
                        }
                    });
                }, 100);
            }
        });
    }
    blink();
}
module.exports.sendNotification = sendNotification;

function changeWristDeviceFunction(newFunc) {
    wristDeviceFunction = newFunc;
}
module.exports.changeWristDeviceFunction = changeWristDeviceFunction;

function setVisibility(value) {
    mapOverlay.visible = value;
}
module.exports.setVisibility = setVisibility;

},{"../constants/constants.js":2}],10:[function(require,module,exports){
var Constants = require('../constants/constants.js');
var LocationManager = require('../location-manager/location-manager.js');
var MapManager = require('../map-manager/map-manager.js');
var DialogManager = require('../dialog-manager/dialog-manager.js');
var QuestManager = require('../quest-manager/quest-manager.js');
var SaveManager = require('../save-manager/save-manager.js');
var ExternalManager = require('../external-manager/external-manager.js');
var MapOverlay = require('../map-overlay/map-overlay.js');
var Utils = require('../utils/utils.js');
var FilterEffects = require('../filter-effects/filter-effects.js');

var mapObjects;
var sequenceObjects;
var objectOverlay;

var removeTempObjFuncs = {};
module.exports.init = function() {
    var container = new PIXI.Container();
    // map objects
    mapObjects = new PIXI.Container();
    container.addChild(mapObjects);
    // sequenceObjects
    sequenceObjects = new PIXI.Container();
    sequenceObjects.visible = false;
    container.addChild(sequenceObjects);
    // map objects overlay, to disable map objects' interactivity
    objectOverlay = new PIXI.Graphics();
    objectOverlay.interactive = true;
    objectOverlay.beginFill(0, 0);
    objectOverlay.drawRect(0, 0, Constants.screenWidth, Constants.screenHeight);
    objectOverlay.endFill();
    objectOverlay.hitArea = new PIXI.Rectangle(0, 0, Constants.screenWidth, Constants.screenHeight);
    objectOverlay.visible = false; // hide it first
    container.addChild(objectOverlay);

    return container;
}

function createGlowTexture(node) {
    var glowObject = parseStaticObject(node);
    return FilterEffects.createGlowTexture(glowObject);
}

function parseInteractivity(node, object, callback) {
    callback = callback || Constants.nullFunction;
    if (node.children.length > 0) {
        object.interactive = true;
        object.buttonMode = true;
        var glowTexture;
        var originalTexture = object.texture;
        function nextAction(i) {
            if (i >= node.children.length) {
                callback();
                return;
            }
            var child = node.children[i];
            if (child.tagName == "GOTO_LOCATION") {
                // close this <OBJECT>
                nextAction(node.children.length);
                LocationManager.gotoLocation(child.textContent);
            } else if (child.tagName == "SEQUENCE") {
                DialogManager.playSequence(child, function(){
                    nextAction(i+1);
                });
            } else if (child.tagName == "COMPLETE_QUEST") {
                QuestManager.playCompleteQuest(child, function() {
                    nextAction(i+1);
                });
            } else if (child.tagName == "UNLOCK_QUEST") {
                QuestManager.playUnlockQuest(child, function() {
                    nextAction(i+1);
                });
            } else if (child.tagName == "EXTERNAL_ACTION") {
                ExternalManager.playExternalAction(child);
                nextAction(i+1);
            } else if (child.tagName == "CHANGE_START_LOCATION") {
                LocationManager.changeStartLocation(child.textContent);
                nextAction(i+1);
            } else {
                nextAction(i+1);
            }
        }
        function onClick() {
            nextAction(0);
        }
        object
            .on('click', onClick)
            .on('tap', onClick)
            .on('mouseover', function() {
                if (!glowTexture) {
                    glowTexture = createGlowTexture(node);
                }
                object.texture = glowTexture;
            })
            .on('mouseout', function() {
                object.texture = originalTexture;
            });
    }
    return object;
}

function parseObject(node) {
    if (node.tagName != 'OBJECT') {
        return;
    }
    return parseInteractivity(node, parseStaticObject(node));
}
module.exports.parseObject = parseObject;

function createGameObject(texture, x, y, scale) {
    var object = new PIXI.Sprite(texture);
    object.anchor.set(0.5, 0.5);
    object.position.x = x + object.width/2;
    object.position.y = y + object.height/2;
    object.scale.x = object.scale.y = scale || 1;
    return object;
}

function parseStaticObject(node) {
    var name = node.getAttribute("name");
    var skin = node.getAttribute("skin") || 'normal';
    var texture = PIXI.Texture.fromImage(Constants.objectPath + name + "/" + skin + ".png");
    x = parseInt(node.getAttribute("x"));
    y = parseInt(node.getAttribute("y"));
    scale = parseInt(node.getAttribute("scale")) || 1;
    return createGameObject(texture, x, y, scale);
}
module.exports.parseStaticObject = parseStaticObject;

function parsePauseObject(node, onClick) {
    var object = parseStaticObject(node);
    if ((node.children.length > 0) && (node.children[0].tagName == "CONTINUE")) {
        object.interactive = true;
        object.buttonMode = true;
        var glowTexture;
        var originalTexture = object.texture;
        object
            .on('click', onClick)
            .on('tap', onClick)
            .on('mouseover', function() {
                if (!glowTexture) {
                    glowTexture = createGlowTexture(node);
                }
                object.texture = glowTexture;
            })
            .on('mouseout', function() {
                object.texture = originalTexture;
            });
    }
    return object;
}
module.exports.parsePauseObject = parsePauseObject;

function processTempObject(gameLocation, node) {
    if (node.tagName != 'TEMP_OBJECT') {
        return;
    }
    var object = parseStaticObject(node);
    var storyId = Utils.getStoryAncestor(node).id;
    if (!removeTempObjFuncs[storyId]) {
        removeTempObjFuncs[storyId] = {};
    }
    removeTempObjFuncs[storyId][node.id] = function() {
        gameLocation.objects.removeChild(object);
    }
    gameLocation.objects.addChild(parseInteractivity(node, object, function() {
        removeTempObjFuncs[storyId][node.id]();
        SaveManager.saveClickTempObject(node, storyId);
    }));
}
module.exports.processTempObject = processTempObject;

function removeTempObject(storyId, objectId) {
    if (removeTempObjFuncs[storyId][objectId]) {
        removeTempObjFuncs[storyId][objectId]();
    }
}
module.exports.removeTempObject = removeTempObject;

function clearMapObjects() {
    mapObjects.removeChildren();
}
module.exports.clearMapObjects = clearMapObjects;

function changeMapObjects(locName, willClear) {
    if ((MapManager.locationExist(locName)) && (!willClear)) {
        mapObjects.addChild(MapManager.getGameLocation(locName).objects);
    }
}
module.exports.changeMapObjects = changeMapObjects;

function setSeqObjectsVisibility(flag) {
    sequenceObjects.visible = flag;
}
module.exports.setSeqObjectsVisibility = setSeqObjectsVisibility;

function clearSeqObjects() {
    sequenceObjects.removeChildren();
}
module.exports.clearSeqObjects = clearSeqObjects;

function addSeqObject(node) {
    if (node.tagName != 'OBJECT') {
        return;
    }
    sequenceObjects.addChild(parseStaticObject(node));
}
module.exports.addSeqObject = addSeqObject;

function setMapObjectsInteractivity(flag) {
    objectOverlay.visible = !flag;
    MapOverlay.setVisibility(flag);
}
module.exports.setMapObjectsInteractivity = setMapObjectsInteractivity;

},{"../constants/constants.js":2,"../dialog-manager/dialog-manager.js":3,"../external-manager/external-manager.js":4,"../filter-effects/filter-effects.js":5,"../location-manager/location-manager.js":7,"../map-manager/map-manager.js":8,"../map-overlay/map-overlay.js":9,"../quest-manager/quest-manager.js":11,"../save-manager/save-manager.js":12,"../utils/utils.js":16}],11:[function(require,module,exports){
var Constants = require('../constants/constants.js');
var LocationManager = require('../location-manager/location-manager.js');
var DialogManager = require('../dialog-manager/dialog-manager.js');
var MapManager = require('../map-manager/map-manager.js');
var StoryManager = require('../story-manager/story-manager.js');
var SaveManager = require('../save-manager/save-manager.js');
var Utils = require('../utils/utils.js');
var ExternalManager = require('../external-manager/external-manager.js');

var loadedQuests = {};
var activeQuests = {};

function loadQuests(story) {
    if (story.tagName !== "STORY") {
        return;
    }
    var quests = {};
    loadedQuests[story.id] = quests;
    var child = story.children[0];
    while (child) {
        // check whether child is a <QUEST>
        if (child.tagName == "QUEST") {
            quests[child.id] = child;
        }
        child = child.nextElementSibling;
    }
}
module.exports.loadQuests = loadQuests;

function unloadQuests(storyId) {
    loadedQuests[storyId] = null;
    activeQuests[storyId] = null;
}
module.exports.unloadQuests = unloadQuests;

function playCompleteQuest(node, callback) {
    if (node.tagName != "COMPLETE_QUEST") {
        return;
    }
    var storyAncestor = Utils.getStoryAncestor(node);
    completeQuest(storyAncestor.id, node.textContent, callback);
}
module.exports.playCompleteQuest = playCompleteQuest;

function playUnlockQuest(node, callback) {
    if (node.tagName != "UNLOCK_QUEST") {
        return;
    }
    var storyAncestor = Utils.getStoryAncestor(node);
    unlockQuest(storyAncestor.id, node.textContent, callback);
}
module.exports.playUnlockQuest = playUnlockQuest;

function unlockQuest(storyId, questId, callback) {
    callback = callback || Constants.nullFunction;
    var quests = loadedQuests[storyId];
    if (!quests) {
        return;
    }
    var quest = quests[questId];
    if (!quest) {
        return;
    }
    // check whether this quest is already active
    if ((activeQuests[storyId]) && (activeQuests[storyId][questId])) {
        callback();
        return;
    }
    if (!activeQuests[storyId]) {
        activeQuests[storyId] = {};
    }
    // apply effects first
    applyEffects(quest.children[0]);
    SaveManager.saveUnlockQuest(storyId, questId);
    activeQuests[storyId][questId] = quest;
    // play the opening sequence
    playOpening(storyId, questId, callback);
}
module.exports.unlockQuest = unlockQuest;

function playOpening(storyId, questId, callback) {
    if (!activeQuests[storyId][questId]) {
        return;
    }
    callback = callback || Constants.nullFunction;
    var quest = activeQuests[storyId][questId];
    DialogManager.playSequence(quest.children[1], function() {
        SaveManager.unmarkPending();
        var child = quest.children[2];
        function nextAction(child) {
            if (!child) {
                callback();
                return;
            }
            if (child.tagName == "COMPLETE_QUEST") {
                playCompleteQuest(child, function() {
                    nextAction(child.nextElementSibling);
                });
            } else if (child.tagName == "UNLOCK_QUEST") {
                playUnlockQuest(child, function() {
                    nextAction(child.nextElementSibling);
                });
            } else if (child.tagName == "EXTERNAL_ACTION") {
                ExternalManager.playExternalAction(child);
                nextAction(child.nextElementSibling);
            } else if (child.tagName == "CHANGE_START_LOCATION") {
                LocationManager.changeStartLocation(child.textContent);
                nextAction(child.nextElementSibling);
            } else {
                nextAction(child.nextElementSibling);
            }
        }
        nextAction(child);
    });
}
module.exports.playOpening = playOpening;

function completeQuest(storyId, questId, callback) {
    callback = callback || Constants.nullFunction;
    if ((!activeQuests[storyId]) || (!activeQuests[storyId][questId])) {
        return;
    }
    if (!activeQuests[storyId][questId].nextElementSibling) {
        // last quest, close this story
        StoryManager.closeStory(storyId, callback);
        return;
    }
    var quest = activeQuests[storyId][questId];
    var needUpdate = quest.children[0].children.length > 0;
    activeQuests[storyId][questId] = null;
    if (needUpdate) {
        LocationManager.goBackToCurCamLocation(callback, function() {
            SaveManager.removeActions({storyId: storyId, questId: questId}, true);
        });
    } else {
        SaveManager.removeActions({storyId: storyId, questId: questId}, false);
        callback();
    }
}
module.exports.completeQuest = completeQuest;

function unlockLastQuest(storyId, callback) {
    callback = callback || Constants.nullFunction;
    var story = StoryManager.getLoadedStory(storyId);
    if (!story) {
        return;
    }
    var lastChild = story.children[story.children.length-1];
    if (lastChild && (lastChild.tagName == "QUEST")) {
        unlockQuest(storyId, lastChild.id, callback);
    }
}
module.exports.unlockLastQuest = unlockLastQuest;

function applyEffects(node) {
    if (node.tagName != "EFFECTS") {
        return;
    }
    var child = node.children[0];
    while (child) {
        if (child.tagName != "LOCATION") {
            return;
        }
        MapManager.processEffectsLocation(child);
        child = child.nextElementSibling;
    }
}

// this is for when loading saved game or updating game state, it does not trigger opening sequence like unlockQuest
function activateQuest(storyId, questId) {
    var quest = loadedQuests[storyId][questId];
    // register this quest as active
    activeQuests[storyId] = activeQuests[storyId] || {};
    activeQuests[storyId][questId] = quest;
    applyEffects(quest.children[0]);
}
module.exports.activateQuest = activateQuest;

},{"../constants/constants.js":2,"../dialog-manager/dialog-manager.js":3,"../external-manager/external-manager.js":4,"../location-manager/location-manager.js":7,"../map-manager/map-manager.js":8,"../save-manager/save-manager.js":12,"../story-manager/story-manager.js":13,"../utils/utils.js":16}],12:[function(require,module,exports){
var LocationManager = require('../location-manager/location-manager.js');
var QuestManager = require('../quest-manager/quest-manager.js');
var StoryManager = require('../story-manager/story-manager.js');
var MapManager = require('../map-manager/map-manager.js');
var QuestManager = require('../quest-manager/quest-manager.js');
var ObjectManager = require('../object-manager/object-manager.js')
var Utils = require('../utils/utils.js');

var actionSequence = [];
var saveFunction;

module.exports.init = function(saveFunc, saveData, callback) {
    saveFunction = saveFunc;
    if (saveData) {
        saveData = JSON.parse(saveData);
        actionSequence = saveData.actionSequence;
        var storyXMLs = [];
        // TODO: this is assuming that all 'loadStory' appear at the start
        // This may not be the case. Need to improve
        for (var i=0; i<actionSequence.length; i++) {
            if (actionSequence[i].type == 'loadStory') {
                storyXMLs.push(actionSequence[i].storyId);
            }
        }

        StoryManager.loadStoryXML(storyXMLs, false, function() {
            LocationManager.changeStartLocation(saveData.startLocation);
            if (hasPending()) {
                var secondLast = actionSequence[actionSequence.length-2];
                if (secondLast.type == 'loadStory') {
                    StoryManager.unlockFirstQuest(secondLast.storyId, LocationManager.verifyGotoStart(callback));
                } else if (secondLast.type == 'unlockQuest') {
                    QuestManager.playOpening(secondLast.storyId, secondLast.questId, LocationManager.verifyGotoStart(callback));
                } else {
                    unmarkPending();
                    LocationManager.verifyGotoStart(callback)();
                    console.error('something wrong with pending');
                }
            } else {
                LocationManager.verifyGotoStart(callback)();
            }
        });
    }
}

// pending means a story is loaded but the opening quest is not unlocked yet
// or a quest is unlocked but the opening sequence hasn't been played
function markPending() {
    actionSequence.push({type: 'pending'});
}

function unmarkPending() {
    var last = actionSequence.pop();
    if (last.type !== 'pending') {
        console.error("The pending logic is wrong");
    }
    saveGame();
}
module.exports.unmarkPending = unmarkPending;

function hasPending() {
    return actionSequence[actionSequence.length-1].type === 'pending';
}
module.exports.hasPending = hasPending;

function removeActions(filters, willUpdate) {
    var properties = Object.keys(filters);
    var newActionSequence = [];
    for (var i=0; i < actionSequence.length; i++) {
        var willCopy = false;
        for (var j=0; j < properties.length; j++) {
            var property = properties[j];
            if (actionSequence[i][property] != filters[property]) {
                willCopy = true;
                break;
            }
        }
        if (willCopy) {
            newActionSequence.push(actionSequence[i]);
        }
    }
    actionSequence = newActionSequence;
    if (willUpdate) {
        updateGameMap();
    }
    saveGame();
}
module.exports.removeActions = removeActions;

function saveUnlockQuest(storyId, questId) {
    actionSequence.push({type:'unlockQuest', storyId: storyId, questId: questId});
    markPending();
    saveGame();
}
module.exports.saveUnlockQuest = saveUnlockQuest;

function saveLoadStories(stories) {
    stories.forEach(function(storyId) {
        actionSequence.push({type: 'loadStory', storyId: storyId});
    })
    markPending();
    saveGame();
}
module.exports.saveLoadStories = saveLoadStories;

function saveGame() {
    saveFunction(JSON.stringify({
        actionSequence: actionSequence,
        startLocation: LocationManager.getStartLocation()
    }));
}

function updateGameMap() {
    // a rather expensive operation
    // using naive solution
    MapManager.clearMap();
    for (var i=0; i<actionSequence.length; i++) {
        var action = actionSequence[i];
        if (action.type == 'loadStory') {
            var story = StoryManager.getLoadedStory(action.storyId);
            if (!story) {
                console.error('story ' + action.storyId + ' is not loaded yet');
                return;
            }
            if ((story.children[0]) && (story.children[0].tagName == 'MAP')) {
                MapManager.processMap(story.children[0]);
            }
        } else if (action.type == 'unlockQuest') {
            QuestManager.activateQuest(action.storyId, action.questId);
        } else if (action.type == 'seeDisplayOnceSequence') {
            MapManager.getGameLocation(action.locationName).sequence = null;
        } else if (action.type == 'clickTempObject') {
            ObjectManager.removeTempObject(action.storyId, action.objectId);
        }
    }
}
module.exports.updateGameMap = updateGameMap;

function saveSeeDisplayOnceSeq(node, locName) {
    if (node.tagName != 'SEQUENCE') {
        return;
    }
    var storyAncestor = Utils.getStoryAncestor(node);
    var action = {type: 'seeDisplayOnceSequence', locationName: locName, storyId: storyAncestor.id};
    var quest = node.parentNode.parentNode.parentNode;
    if (quest.tagName == "QUEST") {
        action.questId = quest.id;
    }
    actionSequence.push(action);
    saveGame();
}
module.exports.saveSeeDisplayOnceSeq = saveSeeDisplayOnceSeq;

function saveClickTempObject(node, storyId) {
    if (node.tagName != 'TEMP_OBJECT') {
        return;
    }
    var action = {type: 'clickTempObject', storyId: storyId, objectId: node.id};
    if (node.parentElement.parentElement.parentElement.tagName == "QUEST") {
        action.questId = node.parentElement.parentElement.parentElement.id;
    }
    actionSequence.push(action);
    saveGame();
}
module.exports.saveClickTempObject = saveClickTempObject;

},{"../location-manager/location-manager.js":7,"../map-manager/map-manager.js":8,"../object-manager/object-manager.js":10,"../quest-manager/quest-manager.js":11,"../story-manager/story-manager.js":13,"../utils/utils.js":16}],13:[function(require,module,exports){
var Constants = require('../constants/constants.js');
var QuestManager = require('../quest-manager/quest-manager.js');
var LocationManager = require('../location-manager/location-manager.js');
var SaveManager = require('../save-manager/save-manager.js');
var BlackOverlay = require('../black-overlay/black-overlay.js');

var loadedStories = {};

var loadingOverlay;
var loadingText;

module.exports.init = function() {
    loadingOverlay = new PIXI.Container();
    blackOverlay = new PIXI.Graphics();
    blackOverlay.beginFill(0, 1);
    blackOverlay.drawRect(0, 0, Constants.screenWidth, Constants.screenHeight);
    blackOverlay.endFill();
    blackOverlay.hitArea = new PIXI.Rectangle(0, 0, Constants.screenWidth, Constants.screenHeight);
    blackOverlay.interactive = true;
    blackOverlay.alpha = 0.8;
    loadingOverlay.addChild(blackOverlay);
    loadingText = new PIXI.Text('Loading...', {
        font: 2*Constants.fontSize + "px Arial",
        fill: 'white',
    });
    loadingText.anchor.set(0.5, 0.5);
    loadingText.position.set(Constants.screenWidth/2, Constants.screenHeight/2);
    loadingOverlay.addChild(loadingText);
    loadingOverlay.visible = false;

    return loadingOverlay;
}

function getLoadedStory(storyId) {
    return loadedStories[storyId];
}
module.exports.getLoadedStory = getLoadedStory;

function unlockFirstQuest(storyId, callback) {
    var story = loadedStories[storyId];
    if (!story) {
        return;
    }
    callback = callback || Constants.nullFunction;
    SaveManager.unmarkPending();
    var child = story.children[0];
    if (child && (child.tagName == "QUEST")) {
        QuestManager.unlockQuest(storyId, child.id, callback);
    } else if (child.nextElementSibling && (child.nextElementSibling.tagName == "QUEST")) {
        QuestManager.unlockQuest(storyId, child.nextElementSibling.id, callback);
    } else {
        callback();
    }
}
module.exports.unlockFirstQuest = unlockFirstQuest;

function loadStory(storyXML, callback) {
    if (loadedStories[storyXML]) {
        return;
    }
    loadStoryXML([storyXML], true, function() {
        unlockFirstQuest(storyXML, LocationManager.verifyGotoStart(callback));
    });
}
module.exports.loadStory = loadStory;

function processStory(story) {
    if (loadedStories[story.id]) {
        return;
    }
    loadedStories[story.id] = story;
    // process quests
    QuestManager.loadQuests(story);
}

function loadStoryXML(storyXMLs, willSave, callback) {
    callback = callback || Constants.nullFunction;
    loadingOverlay.visible = true;
    var downloaded = {};
    var downloadRequestSent = {};
    var willBeDownloaded = storyXMLs.slice();
    var storyDependencies = {};
    // download all needed XML files
    function download(i, storyXMLs, callback) {
        if (i >= storyXMLs.length) {
            return;
        }
        // check whether this story has been downloaded or will be downloaded
        var curId = storyXMLs[i];
        if (loadedStories[curId] || downloadRequestSent[curId]) {
            download(i+1, storyXMLs, callback);
        // } else if (loadingStories.indexOf(curId) !== -1) {
        //     throw new Error("Circular dependencies");
        } else {
            // download the story
            downloadRequestSent[curId] = true;
            $.ajax({
                type: "GET",
                url: Constants.storyXMLPath + curId + ".story.xml",
                dataType: "xml",
                success: function(xml) {
                    var story = xml.children[0];
                    downloaded[curId] = story;
                    // check and load dependencies
                    var dependencies = story.getAttribute("dependencies");
                    var notDownloading = [];
                    if (dependencies) {
                        storyDependencies[curId] = dependencies.split(" ");
                        notDownloading = storyDependencies[curId].filter(function(id) {
                            return (!loadedStories[id]) && (willBeDownloaded.indexOf(id) === -1);
                        });
                    } else {
                        storyDependencies[curId] = [];
                    }
                    willBeDownloaded = willBeDownloaded.concat(notDownloading);
                    if (notDownloading.length > 0) {
                        download(0, notDownloading, callback);
                    } else {
                        // figure out whether all files have been downloaded
                        var allRequestSent = willBeDownloaded.reduce(function(prev, cur) {
                            return prev && downloadRequestSent[cur];
                        }, true);
                        if ((allRequestSent) && (Object.keys(downloaded).length == willBeDownloaded.length)) {
                            callback();
                        }
                    }
                },
                error: function() {
                    loadingOverlay.visible = false;
                    console.error("Cannot find story " + curId);
                }
            });
            download(i+1, storyXMLs, callback);
        }
    }
    download(0, storyXMLs, function() {
        // figure out load order of dependencies
        var sorted = [];
        var visited = {};
        var visiting = {};
        function dfs(storyId) {
            if (visiting[storyId]) {
                throw new Error("Circular dependencies");
            } else if (!(loadedStories[storyId] || visited[storyId])) {
                visiting[storyId] = true;
                storyDependencies[storyId].forEach(dfs);
                visited[storyId] = true;
                visiting[storyId] = false;
                sorted.push(storyId);
            }
        }
        var index = 0;
        while (index < willBeDownloaded.length) {
            dfs(willBeDownloaded[index]);
            while (willBeDownloaded[index] && (visited[willBeDownloaded[index]])) {
                index++;
            }
        }
        // load quests and assets
        var assetsToLoadTable = {};
        PIXI.loader.reset();
        sorted.forEach(function(storyId) {
            processStory(downloaded[storyId]);
            markAssetsToLoad(downloaded[storyId], assetsToLoadTable);
        });
        preloadAssets(assetsToLoadTable, function() {
            if (willSave) {
                SaveManager.saveLoadStories(sorted);
            }
            SaveManager.updateGameMap();
            loadingOverlay.visible = false;
            callback();
        });
    });
}
module.exports.loadStoryXML = loadStoryXML;

function closeStory(storyId, callback) {
    if (!loadedStories[storyId]) {
        return;
    }
    callback = callback || Constants.nullFunction;
    BlackOverlay.blackScreen(function() {
        loadedStories[storyId] = null;
        QuestManager.unloadQuests(storyId);
        SaveManager.removeActions({storyId: storyId}, true);
        LocationManager.verifyCurCamLocation();
        LocationManager.goBackToCurCamLocation(callback);
    });
}
module.exports.closeStory = closeStory;

function preloadAssets(assetsToLoadTable, callback) {
    var assets = Object.keys(assetsToLoadTable);

    if (assets.length == 0) {
        callback();
    } else {
        for (var i=0; i<assets.length; i++) {
            PIXI.loader.add(assets[i], assets[i]);
        }

        PIXI.loader.load(callback);
    }
}

function markAssetsToLoad(story, assetsToLoadTable) {
    var node;
    var resName;
    var i;
    var nodes = story.getElementsByTagName("LOCATION");
    for (i=0; i<nodes.length; i++) {
        node = nodes[i];
        var name = node.getAttribute("name");
        var skin = node.getAttribute("skin") || "normal";
        resName = Constants.locationPath + name + "/" + skin + ".png";
        if (!PIXI.utils.TextureCache[resName]) {
            assetsToLoadTable[resName] = true;
        }
    }
    nodes = story.getElementsByTagName("OBJECT");
    for (i=0; i<nodes.length; i++) {
        node = nodes[i];
        var name = node.getAttribute("name");
        var skin = node.getAttribute("skin") || "normal";
        resName = Constants.objectPath + name + "/" + skin + ".png";
        if (!PIXI.utils.TextureCache[resName]) {
            assetsToLoadTable[resName] = true;
        }
    }
    nodes = story.getElementsByTagName("TEMP_OBJECT");
    // same as normal object
    for (i=0; i<nodes.length; i++) {
        node = nodes[i];
        var name = node.getAttribute("name");
        var skin = node.getAttribute("skin") || "normal";
        resName = Constants.objectPath + name + "/" + skin + ".png";
        if (!PIXI.utils.TextureCache[resName]) {
            assetsToLoadTable[resName] = true;
        }
    }
    nodes = story.getElementsByTagName("IMAGE");
    for (i=0; i<nodes.length; i++) {
        node = nodes[i];
        resName = Constants.imgPath + node.textContent;
        if (!PIXI.utils.TextureCache[resName]) {
            assetsToLoadTable[resName] = true;
        }
    }
}

},{"../black-overlay/black-overlay.js":1,"../constants/constants.js":2,"../location-manager/location-manager.js":7,"../quest-manager/quest-manager.js":11,"../save-manager/save-manager.js":12}],14:[function(require,module,exports){
var Constants = require('./constants/constants.js');
var LocationManager = require('./location-manager/location-manager.js');
var ObjectManager = require('./object-manager/object-manager.js');
var DialogManager = require('./dialog-manager/dialog-manager.js');
var QuestManager = require('./quest-manager/quest-manager.js');
var StoryManager = require('./story-manager/story-manager.js');
var SaveManager = require('./save-manager/save-manager.js');
var ExternalManager = require('./external-manager/external-manager.js');
var BlackOverlay = require('./black-overlay/black-overlay.js');
var MapOverlay = require('./map-overlay/map-overlay.js');
var Utils = require('./utils/utils.js');

//-----GLOBAL-----
var renderer;
var stage;
//-----LOAD FONTS----
WebFont.load({
    google: {
        families: ['Ubuntu Mono', 'Fredoka One']
    }
});
//--------LOGIC--------
module.exports.init = function (container, saveData, hookHandlers, saveFunc, wristDeviceFunc, callback) {
    renderer = PIXI.autoDetectRenderer(Constants.screenWidth, Constants.screenHeight,{backgroundColor : 0x000000});
    container.append(renderer.view);
    Utils.saveRenderer(renderer);

    // create the root of the scene graph
    stage = new PIXI.Container();
    // create necessary layers
    var locationLayers = LocationManager.init();
    stage.addChild(locationLayers);
    var objectLayers = ObjectManager.init();
    stage.addChild(objectLayers);
    stage.addChild(MapOverlay.init(wristDeviceFunc));
    var dialogLayers = DialogManager.init();
    stage.addChild(dialogLayers);
    stage.addChild(BlackOverlay.init());
    stage.addChild(StoryManager.init());

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(stage);
    }
    animate();

    SaveManager.init(saveFunc, saveData, callback);

    // a pixi.container on top of everything that is exported
    stage.addChild(ExternalManager.init(hookHandlers));
}

module.exports.getExternalOverlay = ExternalManager.getExternalOverlay;

module.exports.gotoLocation = LocationManager.gotoLocation;

module.exports.loadStory = StoryManager.loadStory;

module.exports.unlockQuest = QuestManager.unlockQuest;
module.exports.completeQuest = QuestManager.completeQuest;
module.exports.unlockLastQuest = QuestManager.unlockLastQuest;

module.exports.sendNotification = MapOverlay.sendNotification;
module.exports.changeWristDeviceFunction = MapOverlay.changeWristDeviceFunction;

},{"./black-overlay/black-overlay.js":1,"./constants/constants.js":2,"./dialog-manager/dialog-manager.js":3,"./external-manager/external-manager.js":4,"./location-manager/location-manager.js":7,"./map-overlay/map-overlay.js":9,"./object-manager/object-manager.js":10,"./quest-manager/quest-manager.js":11,"./save-manager/save-manager.js":12,"./story-manager/story-manager.js":13,"./utils/utils.js":16}],15:[function(require,module,exports){
var StoryPlayer = require('./story-xml-player.js');
var GameManager = require('./game-manager.js')

GameManager($('#game-display'));

window.unlockQuest = function() {
    StoryPlayer.unlockQuest($('#storyId').val(), $('#questId').val());
}

window.unlockLastQuest = function() {
    StoryPlayer.unlockLastQuest($('#storyIdLastQuest').val());
}

window.loadStory = function() {
    StoryPlayer.loadStory($('#storyIdLoad').val(), function(){});
}

window.seeProgress = function() {
    if(typeof(Storage) !== "undefined") {
        // Code for localStorage/sessionStorage.
        console.log(localStorage.getItem('cs1101s'));
    }
}

window.resetProgress = function() {
    if(typeof(Storage) !== "undefined") {
        // Code for localStorage/sessionStorage.
        localStorage.removeItem('cs1101s');
    }
}

},{"./game-manager.js":6,"./story-xml-player.js":14}],16:[function(require,module,exports){
function getStoryAncestor(node) {
    var storyAncestor = node.parentElement;
    while ((storyAncestor) && (storyAncestor.tagName != "STORY")) {
        storyAncestor = storyAncestor.parentElement;
    }
    return storyAncestor;
}
module.exports.getStoryAncestor = getStoryAncestor;

var renderer;
module.exports.saveRenderer = function(aRenderer) {
    renderer = aRenderer;
}
module.exports.getRenderer = function() {
    return renderer;
}

},{}]},{},[15]);
