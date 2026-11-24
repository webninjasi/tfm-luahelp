var tagsMessage = "Supports formatting with <a class=\"doc-link\" href=\"tags.html\">HTML tags</a>.";
var customHelpData = {
  "tree": [
    {
      "name": "tfm.get.room.uniquePlayers",
      "restricted": "moduleteam",
      "value": "1",
    },
    {
      "name": "tfm.get.room.xmlMapInfo",
    },
    {
      "name": "tfm.get.room.xmlMapInfo.permCode",
      "value": "22",
    },
    {
      "name": "tfm.get.room.xmlMapInfo.author",
      "value": "Lays#1146",
    },
    {
      "name": "tfm.get.room.xmlMapInfo.mapCode",
      "value": "7785550",
    },
    {
      "name": "tfm.get.room.xmlMapInfo.xml",
      "value": escapeHTML('<C><P F="0" /><Z><S><S L="800" X="400" H="50" Y="400" T="6" P="0,0,0.3,0.2,0,0,0,0" /></S><D><T Y="375" X="100" /><F Y="210" X="700" /></D><O /></Z></C>'),
    },
    {
      "name": "tfm.get.room.currentMap",
      "value": "@7785550",
    },
    {
      "name": "tfm.get.room.name",
      "value": "*#test",
    },
    {
      "name": "tfm.get.room.community",
      "value": "xx",
    },
    {
      "name": "tfm.get.room.language",
      "value": "int",
    },
    {
      "name": "system.giveEventGift",
      "restricted": "events",
    },
    {
      "name": "system.loadFile",
      "restricted": "moduleteam",
    },
    {
      "name": "system.loadPlayerData",
      "restricted": "moduleteam",
    },
    {
      "name": "system.newTimer",
      "restricted": "modules",
    },
    {
      "name": "system.removeTimer",
      "restricted": "modules",
    },
    {
      "name": "system.saveFile",
      "restricted": "moduleteam",
    },
    {
      "name": "system.savePlayerData",
      "restricted": "moduleteam",
    },
    {
      "name": "tfm.exec.chatMessage",
      "restricted": "modules",
    },
    {
      "name": "tfm.exec.getPlayerSync",
      "restricted": "modules",
    },
    {
      "name": "tfm.exec.lowerSyncDelay",
      "restricted": "modules",
    },
    {
      "name": "tfm.exec.setPlayerSync",
      "restricted": "modules",
    },
    {
      "name": "tfm.exec.setRoomMaxPlayers",
      "restricted": "modules",
    },
    {
      "name": "tfm.exec.setPlayerLook",
      "restricted": "moduleteam",
    },
    {
      "name": "tfm.exec.setRoomPassword",
      "restricted": "modules",
    },
    {
      "name": "system.luaEventLaunchInterval",
      "restricted": "events",
    },
    {
      "name": "system.setLuaEventBanner",
      "restricted": "events",
    },
    {
      "name": "system.openEventShop",
      "restricted": "events",
    },
    {
      "name": "tfm.exec.giveConsumables",
      "restricted": "events",
    },
    {
      "name": "system.giveAdventurePoint",
      "restricted": "events",
    },
  ],
  "events": [
    {
      "name": "eventContactListener",
      "descriptions": [
        "Add a contact=\"groundId\" attribute in the map XML to trigger this event for a map ground."
      ],
      "parameters": {
        "details": [
          {
            "name": "contactInfos",
            "descriptions": [
              "speedX (Float)",
              "speedY (Float)",
              "playerX (Float)",
              "playerY (Float)",
              "contactX (Float)",
              "contactY (Float)",
            ],
          },
        ],
      },
    },
    {
      "name": "eventSummoningEnd",
      "parameters": {
        "details": [
          {
            "name": "objectDescription",
            "descriptions": [
              "id (Int)",
              "type (Int)",
              "baseType (Int)",
              "x (Int)",
              "y (Int)",
              "vx (Int)",
              "vy (Int)",
              "angle (Int)",
              "ghost (Boolean)",
              "colors (Table)",
            ],
          },
        ],
      },
    },
    {
      "name": "eventFileLoaded",
      "restricted": "moduleteam",
    },
    {
      "name": "eventFileSaved",
      "restricted": "moduleteam",
    },
    {
      "name": "eventPlayerDataLoaded",
      "restricted": "moduleteam",
    },
    {
      "name": "eventPlayerVampire",
      "parameters": {
        "list": ["vampire"],
        "details": [
          {
            "name": "vampire",
            "type": "String",
            "descriptions": [
              "the vampire who infected the player (nil if no other player infected them)",
            ],
          },
        ],
      },
    }
  ],
  "functions": [
    {
      "name": "tfm.exec.addPhysicObject",
      "examples": [
        [1, "400", "200", "{\n\ttype = 1,\n\twidth = 100,\n\theight = 100,\n\tmiceCollision = false,\n\tgroundCollision = false\n}"],
      ],
    },
    {
      "name": "system.bindKeyboard",
      "examples": [
        [null, "32", "true", "true"],
      ],
    },
    {
      "name": "ui.addTextArea",
      "descriptions": [
        tagsMessage,
      ],
    },
    {
      "name": "ui.updateTextArea",
      "descriptions": [
        tagsMessage,
      ],
    },
    {
      "name": "tfm.exec.chatMessage",
      "descriptions": [
        tagsMessage,
      ],
      "restricted": "modules",
    },
    {
      "name": "print",
      "descriptions": [
        "Displays a value in the special #lua channel. There is no size limit.",
        "Tables show their keys and values, but nested tables may display oddly.",
        "Avoid printing a table that refers to itself, directly or through another table. Printing it never finishes, so the script may crash from runtime limits.",
        tagsMessage,
      ],
      "parameters": {
        "list": ["value"],
        "details": [
          {
            "name": "value",
            "type": "Any",
            "descriptions": [
              "the value to print",
            ],
          },
        ],
      },
    },
    {
      "name": "tfm.exec.addImage",
      "examples": [
        ["'149a49e4b38.jpg'", "'!1'"],
      ],
      "descriptions": {
        "replace": true,
        "list": [
          "Displays an image on screen or attaches it to a player, object, or other game element.",
          "You can request image hosting at the <a class=\"doc-link\" href=\"https://atelier801.com/topic?f=6&amp;t=893819&amp;p=1\" target=\"_blank\" rel=\"noopener noreferrer\">Module Image Upload Center</a>.",
        ],
      },
      "parameters": {
        "details": [
          {
            "name": "imageId",
            "descriptions": [
              "for example \"149a49e4b38.jpg\""
            ],
          },
        ],
      },
    },
    {
      "name": "tfm.exec.removeImage",
      "parameters": {
        "details": [
          {
            "name": "imageId",
            "descriptions": [
              "the id returned by tfm.exec.addImage, not the image file name"
            ],
          },
        ],
      },
    },
    {
      "name": "tfm.exec.playSound",
      "examples": [
        ["'cite18/voix/en/marion-bonjour-4'", "100"],
      ],
    },
    {
      "name": "system.giveEventGift",
      "restricted": "events",
    },
    {
      "name": "system.loadFile",
      "restricted": "moduleteam",
      "descriptions": [
        "This function can only be called every 10 seconds.",
      ],
    },
    {
      "name": "system.loadPlayerData",
      "restricted": "moduleteam",
    },
    {
      "name": "system.newTimer",
      "restricted": "modules",
      "parameters": {
        "details": [
          {
            "name": "time",
            "descriptions": [
              "at least 500 milliseconds"
            ],
          },
          {
            "name": "arg1",
            "descriptions": {
              replace: true,
              list: ["2nd argument of the callback function"],
            },
          },
          {
            "name": "arg2",
            "descriptions": {
              replace: true,
              list: ["3rd argument of the callback function"],
            },
          },
          {
            "name": "arg3",
            "descriptions": {
              replace: true,
              list: ["4th argument of the callback function"],
            },
          },
          {
            "name": "arg4",
            "descriptions": {
              replace: true,
              list: ["5th argument of the callback function"],
            },
          },
        ]
      },
      "returns": {
        "description": "the new timer id, also passed as the first argument of the callback",
      },
      "examples": [
        ["function(timerId, arg1, arg2, arg3, arg4)\n\tprint(timerId)\tprint(arg1+arg2+arg3+arg4)\nend", "false", "1", "2", "3", "4"],
      ],
    },
    {
      "name": "system.removeTimer",
      "restricted": "modules",
    },
    {
      "name": "system.saveFile",
      "restricted": "moduleteam",
      "descriptions": [
        "This function can only be called every 10 seconds.",
      ],
    },
    {
      "name": "system.savePlayerData",
      "restricted": "moduleteam",
      "parameters": {
        "details": [
          {
            "name": "data",
            "descriptions": [
              "at most 5000 characters",
            ],
          },
        ]
      },
    },
    {
      "name": "tfm.exec.playEmote",
      "parameters": {
        "details": [
          {
            "name": "emoteArg",
            "descriptions": [
              "for the flag emote (10), the country code",
              "Country codes are uppercase. You can view flags at http://www.transformice.com/images/x_divers/x_drapeaux/TR.png",
              "You can also use these image paths:",
              ["M1", "M2", "M5", "M6", "M_0", "M_1", "M_2", "M_3", "M_4"].map(
                x => "../../" + x
              ).join('<br>')
            ],
          },
        ]
      },
    },
    {
      "name": "tfm.exec.getPlayerSync",
      "restricted": "modules",
      "returns": {
        "type": "String",
        "description": "the sync player's name, or nil",
      },
    },
    {
      "name": "tfm.exec.lowerSyncDelay",
      "restricted": "modules",
    },
    {
      "name": "tfm.exec.setPlayerSync",
      "restricted": "modules",
    },
    {
      "name": "tfm.exec.setRoomMaxPlayers",
      "restricted": "modules",
    },
    {
      "name": "tfm.exec.setRoomPassword",
      "restricted": "modules",
    },
    {
      "name": "tfm.exec.setPlayerLook",
      "restricted": "moduleteam",
    },
    {
      "name": "system.luaEventLaunchInterval",
      "restricted": "events",
      "parameters": {
        "details": [
          {
            "name":"interval",
            "default_value": "40",
          },
          {
            "name":"random",
            "default_value": "20",
          }
        ]
      },
      "returns": {
        "type": "Table",
        "description": "the current interval settings",
      },
    },
    {
      "name": "system.setLuaEventBanner",
      "restricted": "events",
    },
    {
      "name": "system.openEventShop",
      "restricted": "events",
    },
    {
      "name": "system.giveAdventurePoint",
      "restricted": "events",
      "parameters": {
        "list": {
          "replace": true,
          "list": ["playerName", "achievementCode", "amount"],
        },
      },
    },
    {
      "name": "tfm.exec.giveConsumables",
      "restricted": "events",
    },
    {
      "name": "tfm.exec.removePhysicObject",
      "descriptions": [
        "Add a lua=\"groundId\" attribute in the map XML to remove a map ground with this function."
      ],
    },
    {
      "name": "tfm.exec.movePhysicObject",
      "descriptions": [
        "Add a lua=\"groundId\" attribute in the map XML to move a map ground with this function."
      ],
    },
    {
      "name": "tfm.exec.setPlayerCollision",
      "descriptions": [
        "categoryBits says what a player or object is, and maskBits says what it collides with.",
        "<b>A collision only happens if both sides allow each other.</b>",
        "See <a class=\"doc-link\" href=\"https://www.iforce2d.net/b2dtut/collision-filtering\" target=\"_blank\" rel=\"noopener noreferrer\">iforce2d - Collision filtering</a> for more details.",
        "The <a class=\"doc-link\" href=\"collision.html\">Collision Calculator</a> can work out categoryBits and maskBits for you."
      ],
      "parameters": {
        "details": [
          {
            "name": "collisionType",
            "descriptions": [
              "-1 = collisions depend on categoryBits and maskBits",
              "0 = no collision",
              "1 = collision with grounds and shaman objects",
              "2 = collision with grounds/objects and mice",
              "3 = collision with grounds/objects, mice and ghost objects/grounds",
              "4 = collision with grounds/objects and ghost objects/grounds",
              "5 = collision with mice only",
            ],
          },
          {
            "name": "categoryBits",
            "descriptions": [
              "2^0 = 1 = mice",
              "2^1 = 2 = colliding mice",
              "2^2 = 4 = shaman objects and ground",
              "2^3 = 8 = ghost shaman objects and grounds",
              "2^4 = 16 = only mice colliding ground",
              "Higher powers of 2 can be used as custom collision categories, likely up to the 32-bit integer limit.",
            ],
          },
          {
            "name": "maskBits",
            "descriptions": [
              "2^0 = 1 = mice (default maskBits = 4 + 2)",
              "2^1 = 2 = colliding mice (4 + 2 + 1)",
              "2^2 = 4 = shaman objects and grounds (8 + 4 + 2 + 1)",
              "2^3 = 8 = ghost shaman objects and grounds (8 + 4)",
              "2^4 = 16 = only mice colliding ground (1 + 2)"
            ],
          },
        ],
      },
    },
    {
      "name": "debug.getCurrentThreadName",
      "returns": {
        "type": "String",
        "description": "the thread name, \"Module\" in tribe houses",
      },
    },
  ],
};

// Corrections for /luahelp text and parameters on latest+
// text: exact description replacements, params: fixes for one parameter of one entry
var luaHelpFixes = {
  "paramNames": {
    "Achievement code.": "achievementCode",
    "Amount": "amount",
    "Channel": "channel",
  },
  "params": {
    "debug.disableEventLog": {
      "activate": { "description": "true disables the event log, false enables it" },
    },
    "system.bindKeyboard": {
      "activate": { "description": "whether the key should be listened to" },
    },
    "system.bindMouse": {
      "active": { "description": "whether mouse clicks should be listened to" },
    },
    "tfm.exec.addImage": {
      "imageId": { "description": "the image file name" },
    },
    "tfm.exec.addJoint": {
      "jointDef": { "description": "the joint description" },
    },
    "tfm.exec.addShamanObject": {
      "options": { "default_value": "nil" },
    },
    "tfm.exec.giveConsumables": {
      "playerName": { "description": "the player to give consumables to" },
      "amount": { "type": "Int", "default_value": "1" },
    },
    "tfm.exec.newGame": {
      "flipped": { "descriptions": ["whether to mirror the map horizontally: true mirrors it, false doesn't, and nil lets the game decide"] },
    },
    "tfm.exec.playMusic": {
      "music": { "description": "the music path from the sounds list, not a full URL" },
      "targetPlayer": { "type": "String" },
    },
    "tfm.exec.playSound": {
      "sound": { "description": "the sound path from the sounds list, not a full URL" },
      "targetPlayer": { "type": "String" },
    },
    "tfm.exec.setAutoMapFlipMode": {
      "flipped": { "descriptions": ["whether following maps are mirrored horizontally: true always, false never, and nil lets the game decide"] },
    },
    "tfm.exec.setPlayerLook": {
      "look": { "type": "String" },
    },
    "tfm.exec.setPlayerNightMode": {
      "playerName": { "default_value": "nil" },
    },
    "tfm.exec.setPlayerSync": {
      "playerName": { "default_value": "nil" },
    },
    "tfm.exec.snow": {
      "snowballPower": { "description": "the power of the snowballs" },
    },
    "tfm.exec.stopMusic": {
      "targetPlayer": { "type": "String" },
    },
    "ui.addPopup": {
      "targetPlayer": { "default_value": "nil" },
    },
  },
  "text": {
    "Deactivates the events log.": "Enables or disables the event log, which shows each triggered event and how long it ran, like \"Lua eventLoop executed in 0 ms.\" It's disabled by default.",
    "Get current lua thread name.": "Gets the current Lua thread name.",
    "Listens to the player's keyboard events.": "Listens for a key on a player's keyboard and triggers eventKeyboard.",
    "the player you want to listen keyboard events from": "the player to listen to",
    "the code of the key you want to listen": "the key code to listen for",
    "to accurately listen for player movement (both arrows and wasd/zqsd keys), you can use 0 (left), 1 (up), 2 (right) or 3 (down)": "to listen for player movement on both arrows and WASD/ZQSD keys, use 0 (left), 1 (up), 2 (right), or 3 (down)",
    "regular AS3 keycodes can be found on http://help.adobe.com/fr_FR/FlashPlatform/reference/actionscript/3/flash/ui/Keyboard.html": "regular AS3 key codes are listed at http://help.adobe.com/fr_FR/FlashPlatform/reference/actionscript/3/flash/ui/Keyboard.html",
    "whether it should listen for the press event, or the release one": "true listens for key presses, false for key releases",
    "Listens to a player's mouse events.": "Listens for a player's mouse clicks and triggers eventMouse.",
    "the player you want to listen mouse events from": "the player to listen to",
    "Prevents a module command (commands starting with « ! ») to be displayed in the room. If the supplied command is nil, the parameter will apply to all the commands.": "Prevents a module command (starting with « ! ») from being displayed in the room. If command is nil, this applies to all commands.",
    "whether the command should be hided": "whether the command should be hidden",
    "Deactivates the lua script running.": "Stops the running Lua script.",
    "Gives adventure points to a player..": "Gives adventure points to a player.",
    "Target player.": "the target player",
    "The achievement code to increase.": "the achievement code to increase",
    "The amount value.": "the amount to add",
    "Gives an event reward to the targeted player.": "Gives an event reward to a player.",
    "Requests the loading of a data file. The event eventFileLoaded is triggered when the file gets loaded.": "Requests loading a data file. eventFileLoaded is triggered when it finishes.",
    "Requests the loading of the player's data for this module. The event eventPlayerDataLoaded is triggered when the player data gets loaded.": "Requests loading a player's data for this module. eventPlayerDataLoaded is triggered when it finishes.",
    "the player about whom you want to get the data": "the player whose data to load",
    "Set or get the timer interval between two events.": "Sets or gets the timer interval between two events.",
    "Timer interval in min (default 40 min), can't be less than 40 min.": "the timer interval in minutes, can't be less than 40",
    "Random added  interval in min (default 20 min).": "the random interval to add, in minutes",
    "The function to call": "the function to call",
    "the number of milliseconds that the function call should be delayed by": "the delay before calling the function, in milliseconds",
    "Open the shop of the specified event.": "Opens the shop of the specified event.",
    "Event name.": "the event name",
    "Target player name.": "the target player's name",
    "Requests the saving of a data file (throttled to one per minute). The event eventFileSaved is triggered when the file get saved.": "Requests saving a data file. eventFileSaved is triggered when it finishes.",
    "the identifier (from 0 to 99) of the file to write the data in": "the file identifier, from 0 to 99",
    "Saves module data about a player. Please note that this data is per player and per Lua dev, so take care not to overwrite data from another one of your modules.": "Saves a player's module data. This data is stored per player and per Lua developer, so avoid overwriting data from your other modules.",
    "the player about whom you want to save data": "the player whose data to save",
    "Set the login event banner.": "Sets the login event banner.",
    "Banner id.": "the banner identifier",
    "Add defilante bonus.": "Adds a Defilante bonus.",
    "Bonus type (see tfm.enum.bonus)": "the bonus type (see tfm.enum.bonus)",
    "X position.": "the x position",
    "Y position.": "the y position",
    "Identifier.": "the bonus identifier",
    "Angle (deg).": "the angle in degrees",
    "Make the bonus visible or not.": "whether the bonus is visible",
    "Send only to this specific player.": "the player to apply this to (if nil, applies to all players)",
    "Adds conjuration to the map. Note: Grid coordinate are regular coordinate divided by 10 (as conjuration is a 10x10 pixel square).": "Adds a conjuration to the map. Grid coordinates are regular coordinates divided by 10, since a conjuration is a 10x10 pixel square.",
    "Image scale X": "the horizontal scale",
    "Image scale Y": "the vertical scale",
    "Image rotation in radian": "the rotation in radians",
    "Image alpha": "the opacity, from 0 to 1",
    "Image anchor X (0..1)": "the horizontal anchor, from -1 to 1",
    "Image anchor Y (0..1)": "the vertical anchor, from -1 to 1",
    "Use a fade in to display the image.": "whether to fade the image in",
    "Adds a joint between two physic objects. . Note: In map XML codes, you can also add a « lua=\"id\" » property in a joint definition to be able to interact with it with LUA code.": "Adds a joint between two physic objects. In map XML, add a « lua=\"id\" » property to a joint definition to control it from Lua.",
    "Add an NPC to the current map.": "Adds an NPC to the current map.",
    "NPC name.": "the NPC name",
    "The NPC definition": "the NPC definition",
    "title (Int): NPC title.": "title (Int): the NPC title",
    "look (String): NPC look.": "look (String): the NPC look",
    "x (int): X position.": "x (Int): the x position",
    "y (int): Y position.": "y (Int): the y position",
    "female (bool): Set True if the NPC is female.": "female (Boolean): true if the NPC is female",
    "lookLeft (bool): Set True to make the NPC look to the left.": "lookLeft (Boolean): true makes the NPC look left",
    "lookAtPlayer (bool): Set True to make the NPC look to the player.": "lookAtPlayer (Boolean): true makes the NPC look at the player",
    "interactive (Boolean): If true, player will be able to click on it.": "interactive (Boolean): true lets players click it, which triggers eventTalkToNPC",
    "fixedXSpeed (Number), fixedYSpeed (Number), contactListener (bool)": "fixedXSpeed (Number), fixedYSpeed (Number), contactListener (Boolean)",
    "Tie a player to a balloon.": "Attaches a balloon to a player.",
    "Attach or dettach the balloon.": "whether to attach or detach the balloon",
    "Balloon color [1-4].": "the balloon color, from 1 to 4",
    "Make the balloon transparent.": "whether the balloon is a ghost (transparent) object",
    "whether the spawned object should be transparent": "whether the object is a ghost (transparent) object",
    "Balloon speed.": "the balloon speed",
    "Deactivates the automatic afk death.": "Disables automatic AFK death.",
    "whether the deactivation should be active": "true disables it, false enables it again",
    "Deactivates all shaman skills.": "Disables all shaman skills.",
    "Deactivates the automatic renewal of rounds.": "Disables automatic new rounds.",
    "Deactivates the automatic scoring management.": "Disables automatic scoring.",
    "Deactivates the automatic selection of shaman.": "Disables automatic shaman selection.",
    "Deactivates the automatic remaining time change to 20s (when the shaman dies for example).": "Disables the automatic change of remaining time to 20 seconds, for example when the shaman dies.",
    "Deactivates physical consumables (like in racing and bootcamp rooms).": "Disables physical consumables, like in racing and bootcamp rooms.",
    "Enables or disables the shaman objects prespawn preview.": "Enables or disables the preview of shaman objects while the shaman places them. When disabled, objects seem to spawn instantly for other players.",
    "Sets whether the following maps should be flipped (always, never, or TFM's default behaviour).": "Sets whether following maps are mirrored horizontally: always, never, or decided by the game.",
    "whether the prespawn preview should not be displayed": "true hides the prespawn preview",
    "Throws an explosion.": "Creates an explosion.",
    "Froze a player.": "Freezes a player.",
    "Freeze or unfreeze": "whether to freeze or unfreeze the player",
    "Display or not ice on the mouse.": "whether to show ice on the mouse",
    "Get current player sync.": "Gets the current sync player.",
    "Gives consumables to the targeted player.": "Gives consumables to a player.",
    "Allows to link players like in soulmate maps.": "Links two players like in soulmate maps.",
    "Lowers the synchronization delay of a player to 400ms max": "Lowers a player's synchronization delay to a maximum of 400 ms.",
    "the angle of the the object": "the angle of the object",
    "whether the specified position an offset to apply to the current one, or the absolute one": "whether the specified position is an offset to apply to the current one, or the absolute one",
    "whether the specified speed an offset to apply to the current one, or the absolute one": "whether the specified speed is an offset to apply to the current one, or the absolute one",
    "Starts a new game": "Starts a new round with a new map.",
    "Play a music. A music can be stopped. Musics list can be found here : http://audio.atelier801.com/sounds.html": "Plays music, which can be stopped with tfm.exec.stopMusic. A list of sounds is available at http://audio.atelier801.com/sounds.html",
    "Channel of the music. Only one music can be played per channel. If a music is playing, it will be stopped.": "the music channel. Only one track can play per channel, so a track already playing will be stopped.",
    "Volume of the sound (0-100).": "the volume, from 0 to 100",
    "If the music should be looping.": "whether the music should loop",
    "If the music should start with a fading.": "whether the music should fade in",
    "Send only to this specific player (if nil, applies to all players).": "the player who will hear it (if nil, applies to all players)",
    "Play a sound. Sounds list can be found here : http://audio.atelier801.com/sounds.html": "Plays a sound. A list of sounds is available at http://audio.atelier801.com/sounds.html",
    "X position of the sound. If not nil, the further away the player is, the more the sound is reduced.": "the x position of the sound. If set, the sound gets quieter the further away the player is.",
    "Y position of the sound.": "the y position of the sound",
    "Makes a player enter the hole. It only works if the player already has a cheese!": "Makes a player enter the hole. This only works if the player already has the cheese.",
    "Remove a defilante bonus.": "Removes a Defilante bonus.",
    "Use a fade out to remove the image.": "whether to fade the image out",
    "Enable 'Aie' mode when mice can die when they hit something too hard. Last until the next map.": "Enables 'Aie' mode, where mice die when they hit something too hard. Lasts until the next map.",
    "Enabled or disable 'Aie' mode.": "whether 'Aie' mode is enabled",
    "Sensibility of the 'Aie' mode.": "the sensitivity of 'Aie' mode",
    "Target player (nil for all player in room).": "the target player (if nil, applies to all players)",
    "Sets the game remaining time.": "Sets the remaining round time.",
    "the player whose nickname  should be colored": "the player whose nickname should be colored",
    "Set the collision type for a player.": "Sets the collision type of a player.",
    "Targeted player name (if playerName is * target all player in the room).": "the target player's name (* targets all players in the room)",
    "Collision type : 1=normal, 2=Collide with mice, can be 0, 3, 4 or 5 but no idea what it do.": "the collision type",
    "If collision type is -1, you can set the category bits by hand.": "the category bits, used when collisionType is -1",
    "If collision type is -1, you can set the mask bits by hand.": "the mask bits, used when collisionType is -1",
    "Set the world gravity and wind scale for a player.": "Sets the gravity and wind scale of a player.",
    "Targeted player name.": "the target player's name",
    "Gravity scale value.": "the gravity scale",
    "Wind scale value.": "the wind scale",
    "Change a player's look.": "Changes a player's look.",
    "Look string.": "the look string",
    "Set the night mode for a player.": "Sets night mode for a player.",
    "Enable or disable the night mode.": "whether night mode is enabled",
    "Targeted player name. If nil affect all player in room.": "the target player's name (if nil, applies to all players)",
    "the player who should get his or her score changed": "the player whose score should change",
    "Set current player sync.": "Sets the current sync player.",
    "Target player name (Nil to let the server decide, 'none' to disable sync).": "the target player's name (nil lets the server decide, 'none' disables sync)",
    "the player's nickname who will have another shaman mode": "the player whose shaman mode should change",
    "Set the world gravity.": "Sets the world gravity.",
    "Gravity on x axis.": "the gravity on the x axis",
    "Gravity on y axis": "the gravity on the y axis",
    "Stop a playing music.": "Stops a playing music track.",
    "Music channel to stop.": "the music channel to stop",
    "the width in pixels of the popup (if 0, it will be ajusted to the text width)": "the width of the popup in pixels (if 0, it fits the text width)",
    "the width in pixels of the text area (if 0, it will be ajusted to the text width)": "the width of the text area in pixels (if 0, it fits the text width)",
    "the height in pixels of the text area (if 0, it will be ajusted to the text height)": "the height of the text area in pixels (if 0, it fits the text height)",
    "the player whom the text area will disappear (if nil, applies to all players)": "the player who will no longer see the text area (if nil, applies to all players)",
    "Set the background color. Last one game.": "Sets the background color for one round.",
    "Background color.": "the background color",
    "the player who will get displayed the new text (if nil, applies to all players)": "the player who will see the new text (if nil, applies to all players)",
    "This event is triggered when the player does an emote.": "This event is triggered when a player does an emote.",
    "the name of the file": "the file identifier",
    "This event is triggered when a player presses a key.": "This event is triggered when a player presses or releases a key bound with system.bindKeyboard.",
    "the player who typed the key": "the player who pressed or released the key",
    "the code of the typed key": "the key code",
    "whether it was the press event, or the release one": "true for a key press, false for a key release",
    "the horizontal coordinate of the player when he or she typed the key": "the player's horizontal position at that moment",
    "the vertical coordinate of the player when he or she typed the key": "the player's vertical position at that moment",
    "the horizontal velocity of the player when he or she typed the key": "the player's horizontal velocity at that moment",
    "the vertical velocity of the player when he or she typed the key": "the player's vertical velocity at that moment",
    "This event is triggered when a player perfoms a mouse click.": "This event is triggered when a player bound with system.bindMouse clicks.",
    "This event is triggered when a player grab a defilante bonus.": "This event is triggered when a player grabs a Defilante bonus.",
    "The player who grabbed the bonus.": "the player who grabbed the bonus",
    "Bonus identifier.": "the bonus identifier",
    "This event triggers when a player enters the hole.": "This event is triggered when a player enters the hole.",
    "any string for a type 2 poup": "any string for a type 2 popup",
    "This event is triggered when a player cancels an object invocation.": "This event is triggered when a player cancels summoning an object.",
    "This event triggers when a player has finished an invocation.": "This event is triggered when a player finishes summoning an object.",
    "the kind of the object": "the kind of object",
    "Text event links are anchors tags links beginning with the \"event:\" string (e.g. : <a href=\"event:callbackString\">Click here</a>).": "Text event links are anchor tags whose link starts with \"event:\" (for example <a href=\"event:callbackString\">Click here</a>).",
    "If the link eventName begins with '#clear,' the text area will be cleared, and the received eventName will be the text following the coma.": "If the link eventName begins with '#clear,' the text area is cleared, and the received eventName is the text following the comma.",
    "the color picked (-1 if the player didn't picked one))": "the color picked (-1 if the player didn't pick one)",
    "This event is triggered when a player hit a ground with a contact listener.": "This event is triggered when a player hits a ground with a contact listener.",
    "Collision informations": "the collision information",
    "This event is triggered when a player click on a NPC.": "This event is triggered when a player clicks on an NPC.",
    "The player who talk to the NPC": "the player who talked to the NPC",
    "The NPC name": "the NPC name",
  },
};
