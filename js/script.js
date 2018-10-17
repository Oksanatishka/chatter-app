// Use jQuery's #ready function to initialize your #app .
$(document).ready(function() {
    /* start the external action and say hello */
    console.log('App is alive');
    // onload functions
    listChannels(compareNew);
    loadEmojis();

    console.log('App is initialized');

    // counting chars in input
    setCharCountListener();
    // listen for enter in message
    setFocusListeners();
    // starting the timer function
    myTimerFunction('start');

    getLocation();
});

/** #10 global #array of channels #arr*/
var channels = [yummy, sevencontinents, killerapp, firstpersononmars, octoberfest];

/** create global variable */
var currentChannel;

/** We simply initialize it with the channel selected by default - sevencontinents */
currentChannel = sevencontinents;

/** Store my current (sender) location */
var currentLocation = {
    latitude: 0,
    longitude: 0,
    timestamp: 0,
    what3words: 'not.yet.received'
};

function getLocation() {
    if ('geolocation' in navigator) {
        console.log('geolocation is available.');
    } else {
        alert('Geolocation is not available in this browser!');
    }
    navigator.geolocation.getCurrentPosition(
        function(pos) {
            currentLocation.latitude = pos.coords.latitude;
            currentLocation.longitude = pos.coords.longitude;
            currentLocation.timestamp = pos.timestamp;
            console.log(
                'Position received: ',
                currentLocation.longitude,
                ', ',
                currentLocation.latitude,
                ' at ',
                new Date(currentLocation.timestamp).toLocaleString()
            );
            getW3WLocation();
        },
        function(err) {
            switch (err.code) {
                case 1: //PERMISSION_DENIED
                    alert('Permission denied: ' + err.message);
                    break;
                case 2: //POSITION_UNAVAILABLE
                    alert('Position unavailable: ' + err.message);
                    break;
                case 3: //TIMEOUT
                    alert('Timeout: ' + err.message);
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10e3,
            maximumAge: 0
        }
    );
}

function getW3WLocation() {
    $.getJSON(
        'https://api.what3words.com/v2/reverse?coords=' +
            currentLocation.latitude +
            '%2C' +
            currentLocation.longitude +
            '&key=PMGO0NJB&lang=en&format=json&display=full',
        function(data) {
            currentLocation.what3words = data.words;
            console.log(data);
        }
    );
}

function getChannels() {
    $.getJSON('https://tumwlfe-mooc.srv.mwn.de:3131/channels', function(data) {
        console.log(data);
    });
}

function myTimerFunction(startTimer) {
    if (startTimer === 'start') {
        // start timer
        var myTimer = setInterval(function() {
            var arrayIndices = [];
            $(currentChannel.messages).each(function(index, value) {
                value.update();
                if ($.isEmptyObject(value.jQueryObject)) {
                    arrayIndices.push(index);
                }
            });
            for (i = arrayIndices.length; i > 0; i--) {
                currentChannel.messages.splice(arrayIndices[i - 1], 1);
                currentChannel.messageCount -= 1;
                console.log('splice arrayIndices ', arrayIndices[i - 1]);
            }
            showMessages();
            console.log('Updating message elements...');
        }, 10e3); //every ten seconds
    } else {
        // stop timer if necessary
        clearInterval(myTimer);
    }
}
/**
 * Switch channels name in the right app bar
 * @param channelObject
 */
function switchChannel(channelObject, channelElement) {
    // Log the channel switch
    console.log('Tuning in to channel', channelObject);

    // Write the new channel to the right app bar using object property
    document.getElementById('channel-name').innerHTML = channelObject.name;

    // change the channel location using object property
    document.getElementById('channel-location').innerHTML =
        'by <a href="https://w3w.co/' +
        channelObject.createdBy +
        '" target="_blank"><strong>' +
        channelObject.createdBy +
        '</strong></a>';

    //#9 selector adjusted for #btns #str
    $('#channel-star i').removeClass('fas far');
    $('#channel-star i').addClass(channelObject.starred ? 'fas' : 'far');

    /* highlight the selected #channel.
       This is inefficient (jQuery has to search all channel list items), but we'll change it later on */
    $('#channels li').removeClass('selected');
    $(channelElement).addClass('selected');

    /* store selected channel in global variable */
    currentChannel = channelObject;

    // #10 #new: switching channels aborts "create new channel"-mode
    abortCreationMode();
}

/* liking a channel on #click */
function star() {
    // Toggling star
    // #9 selector adjusted for #btns #str
    $('#channel-star i').toggleClass('far');
    $('#channel-star i').toggleClass('fas');

    // toggle star also in data model
    currentChannel.starred = !currentChannel.starred;

    // toggle star also in list
    // $('#tab-bar .selected').trigger('click');
    $('#channels .selected .fa-star').removeClass('fas far');
    $('#channels .selected .fa-star').addClass(currentChannel.starred ? 'fas' : 'far');
}

/**
 * Function to select the given tab
 * @param tabId #id of the tab
 */
function selectTab(tabId) {
    $('#tab-bar button').removeClass('selected');
    console.log('Changing to tab', tabId);
    $(tabId).addClass('selected');
}

/**
 * toggle (show/hide) the emojis menu
 */
function toggleEmojis() {
    /* #10 #add/load #emojis when menu is toggled */
    /*
    var emojis = require('emojis-list');    // It is more #suitable to put this in another function "loadEmojis();"
    $('#emojis').empty();                   // (see below) and call loadEmojis() in the body's onload event listener
    for (emoji in emojis) {
        $('#emojis').append(emojis[emoji]);
    }
    */

    $('#emojis').toggle(); // #toggle
}

/* #10 #add ing #emojis with this function and calling it in the body's onload event listener is more #suitable */
function loadEmojis() {
    var emojis = require('emojis-list');
    $('#emojis').empty();
    for (emoji in emojis) {
        var emojiParagraph = $('<p></p>')
            .html(emojis[emoji] + ' ')
            .on('click', function() {
                var emojiStr = $(this).html();
                emojiStr = emojiStr.split(' ');
                var charCountStr = $('#char-count').html();
                charCountStr = charCountStr.split('/');
                if (parseInt(charCountStr[0]) <= 138) {
                    $('#message').val($('#message').val() + emojiStr[0]);
                    $('#message').trigger('input');
                    toggleEmojis();
                } else {
                    alert('Message is not allowed to have more than 140 characters.');
                }
            });
        $('#emojis').append(emojiParagraph);
    }
}

/**
 * This constructor function creates a new chat #message.
 * @param text `String` a message text
 * @constructor
 */
function Message(text) {
    // copy my location
    this.createdBy = currentLocation.what3words;
    this.latitude = currentLocation.latitude;
    this.longitude = currentLocation.longitude;
    // set dates
    this.createdOn = new Date(); //now
    this.expiresOn = new Date(Date.now() + 1 * 20 * 1000); // mins * secs * msecs
    // set text
    this.text = text;
    // own message
    this.own = true;
    this.jQueryObject = {};
    this.update = function() {
        this.jQueryObject
            .find('em')
            .html(Math.round(((this.expiresOn - Date.now()) / 60 / 1000) * 10) / 10 + ' min. left');
        if (this.expiresOn - Date.now() < 3e5 && this.expiresOn - Date.now() >= 1) {
            this.jQueryObject.find('em').css('color', '#3F51B5');
        } else if (this.expiresOn - Date.now() < 1) {
            console.log(this);
            this.jQueryObject.remove();
            console.log('del');
            //evtl über delete flag lösen
            this.jQueryObject = {};
            console.log(this);
        } else {
            this.jQueryObject.find('em').css('color', 'black');
        }
    };
}

function sendMessage() {
    // #10 only send #messages if text is not #empty
    var text = $('#message').val();
    //check text
    if (text.length == 0) {
        //exit if no text
        alert('Please enter some text');
        return;
    }

    // Creating and logging a message with content from the input field
    var message = new Message(text);
    console.log('New message:', message);

    // #10 #push the new #message to the current channel's messages array
    currentChannel.messages.push(message);

    // #10 #increase the messageCount of the current channel
    currentChannel.messageCount += 1;

    // Adding the message to the messages-div
    // $('#messages').append(createMessageElement(message));
    currentChannel.jQueryObject = createMessageElement(message);
    showMessages();

    // messages will scroll to a certain point if we apply a certain height, in this case the overall scrollHeight of the messages-div that increases with every message;
    $('#messages').scrollTop($('#messages').prop('scrollHeight'));

    // clear the #message input
    $('#message').val('');
    $('#char-count').html('0/140');
}

/**
 * This function makes an html element out of message objects' properties.
 * @param messageObject a chat message object
 * @returns html element
 */
function createMessageElement(messageObject) {
    // Calculating the expiresIn-time from the expiresOn-property
    var expiresIn = Math.round((messageObject.expiresOn - Date.now()) / 1000 / 60);
    // Creating a message-element
    var messageElement = $(
        '<div><h3><a><strong></strong></a><em></em></h3><p></p><button></button></div>'
    );
    messageElement
        .addClass('message')
        .addClass(messageObject.own ? 'own' : '')
        .find('a')
        .attr({
            href: 'http://w3w.co/' + messageObject.createdBy,
            target: '_blank'
        })
        .end()
        .find('strong')
        .html(messageObject.createdBy)
        .end()
        .find('em')
        .before(messageObject.createdOn.toLocaleString())
        .html(expiresIn + ' min. left')
        .end()
        .find('p')
        .html(messageObject.text)
        .end()
        .find('button')
        .addClass('accent')
        .html('+5 min.')
        .end();
    messageObject.jQueryObject = messageElement;
    return messageElement;
}

/* #10 Three #compare functions to #sort channels */
/**
 * #Compares two channels by their amount of messages for #10#sort
 * @param channelA
 * @param channelB
 * @returns {Number} first if < 0
 */
function compareTrending(channelA, channelB) {
    return channelB.messageCount - channelA.messageCount;
}

/**
 * #Compares two channels by their creation date for #10#sort
 * @param channelA
 * @param channelB
 * @returns {number}
 */
function compareNew(channelA, channelB) {
    return channelB.createdOn - channelA.createdOn;
}

/**
 * #Compares two channels by being favorites for #10#sort
 * @param channelA
 * @param channelB
 * @returns {number}
 */
function compareFavorites(channelA, channelB) {
    return channelA.starred ? -1 : 1;
}

function listChannels(criterion) {
    // #10 #sorting: #sort channels#array by the criterion #parameter
    channels.sort(criterion);

    // #10 #sorting #duplicate: empty list
    $('#channels ul').empty();

    /* #10 append channels from #array with a #for loop */
    for (i = 0; i < channels.length; i++) {
        var liElement = createChannelElement(channels[i]);
        $('#channels ul').append(liElement);
        if (channels[i] === currentChannel) {
            switchChannel(currentChannel, liElement);
        }
    }
}

/**
 * #10 #new: This constructor function creates a new channel object.
 * @param name `String` a channel name
 * @constructor
 */
function Channel(name) {
    // copy my location
    this.createdBy = currentLocation.what3words;
    // set dates
    this.createdOn = new Date(); //now
    this.expiresIn = 60; // this is just temporary
    // set name
    this.name = name;
    // set favourite
    this.starred = false;
    // set messages array and message count
    this.messages = [];
    this.messageCount = 0;
}

/**
 * #10 #new
 * This function creates a channel object and pushes it to the global 'channels' array.
 * It also calls the function 'sendMessage()' to deal with the initial message on channel creation.
 */
function createChannel() {
    // #10 #new: #name of the channel
    var name = $('#new-channel').val();
    //initial message
    var text = $('#message').val();
    // Check whether channel #name input field is #valid.
    if (name.length == 0 || name.search(' ') > -1 || name.search('#') == -1) {
        alert('Enter valid channel name! ("#" at the beginning, no spaces)');
        return;
        // Check whether message input field is #valid.
    } else if (!text) {
        alert('Enter an initial message!');
        return;
    } else {
        // #10 #new #store
        // Create new channel object by calling the constructor.
        var channel = new Channel(name);
        // Set new channel as currentChannel.
        currentChannel = channel;
        // Push new channel object to 'channels' array.
        channels.push(channel);
        // Create DOM element of new channel object and append it to channels list.
        $('#channels ul').append(createChannelElement(channel));
        // Log channel creation.
        console.log('New channel: ' + channel);
        // Send initial message.
        sendMessage();
        // Empty channel name input field.
        $('#new-channel').val('');
        // Return to normal view.
        abortCreationMode();
        // #show #new channel's data
        document.getElementById('channel-name').innerHTML = channel.name;
        document.getElementById('channel-location').innerHTML =
            'by <a href="http://w3w.co/' +
            channel.createdBy +
            '" target="_blank"><strong>' +
            channel.createdBy +
            '</strong></a>';
    }
}

/**
 * This function creates a new jQuery channel <li> element out of a given object
 * @param channelObject a channel object
 * @returns {HTMLElement}
 */
function createChannelElement(channelObject) {
    /* this HTML is build in jQuery below:
     <li>
     {{ name }}
        <span class="channel-meta">
            <i class="far fa-star"></i>
            <i class="fas fa-chevron-right"></i>
        </span>
     </li>
     */

    // create a channel
    var channel = $('<li>')
        .text(channelObject.name)
        .click(function() {
            switchChannel(channelObject, this);
        });

    // create and append channel meta
    var meta = $('<span>')
        .addClass('channel-meta')
        .appendTo(channel);

    // The star including star functionality.
    // Since we don't need any further children, we don't need any variables (references)
    $('<i>')
        .addClass('fa-star')
        .addClass(channelObject.starred ? 'fas' : 'far')
        .appendTo(meta);

    // boxes for some additional metadata
    $('<span>')
        .text(channelObject.expiresIn + ' min')
        .appendTo(meta);
    $('<span>')
        .text(channelObject.messageCount + ' new')
        .appendTo(meta);

    // The chevron
    $('<i>')
        .addClass('fas')
        .addClass('fa-chevron-right')
        .appendTo(meta);

    // return the complete channel
    return channel;
}

/**
 * #10 #new: This function enables the "create new channel"-mode
 */
function initCreationMode() {
    //#10 #new: swapping the right app-bar
    $('#right-app-bar').hide();
    $('#app-bar-create').addClass('show');

    //#10 #new #clear all messages in the container
    $('#messages').empty();

    //#10 #new: swapping "send" with "create" button
    $('#button-send').hide();
    $('#button-create').show();
}

/**
 * #10 #new: This function ends the "create new channel"-mode
 */
function abortCreationMode() {
    //#10 #new: #abort restores the previously selected channel
    $('#right-app-bar').show();
    $('#app-bar-create').removeClass('show');
    $('#button-create').hide();
    $('#button-send').show();
    showMessages();
}

function showMessages() {
    $('#messages').empty();
    $.each(currentChannel.messages, function(index, value) {
        // adding onclick listener
        $(value.jQueryObject).click(function() {
            value.expiresOn = new Date(value.expiresOn.getTime() + 3e5);
            value.update();
            console.log('click');
        });
        // Adding the message to the messages-div
        $('#messages').append(value.jQueryObject);
        value.update();
    });
    // // messages will scroll to a certain point if we apply a certain height, in this case the overall scrollHeight of the messages-div that increases with every message;
    // $('#messages').scrollTop($('#messages').prop('scrollHeight'));
}

function setCharCountListener() {
    $('#message').on('input', function() {
        var inputStr = $('#message').val();
        var charCount = inputStr.length;
        $('#char-count').html(charCount + '/140');
    });
}

function setFocusListeners() {
    $('#message').on('focus', function() {
        $('#message').on('keypress', function(event) {
            if (event.which == 13 || event.keyCode == 13) {
                sendMessage();
            }
        });
    });
    $('#message').on('blur', function() {
        $('#message').off('keypress');
    });
}
