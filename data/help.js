var tagsMessage = "See various html tags you can use <a href=\"tags.html\">here</a>";
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
        "contact=\"groundId\" attribute can be used in the map XML to trigger this event."
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
              "the vampire who contamined the player (or nil if it hasn't been contamined by another player)",
            ],
          },
        ],
      },
    }
  ],
  "functions": [
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
        tagsMessage,
      ],
    },
    {
      "name": "tfm.exec.addImage",
      "examples": [
        ["'149a49e4b38.jpg'", "'!1'"],
      ],
      "descriptions": [
        "You can request to host an image on <a href=\"https://atelier801.com/topic?f=6&t=893819&p=1\">Module Image Upload Center</a>",
      ],
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
              "minimum 500 milliseconds"
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
        "description": "the new timer id (also 1st argument of the callback function)",
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
    },
    {
      "name": "system.savePlayerData",
      "restricted": "moduleteam",
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
      "name": "tfm.exec.setRoomPassword",
      "restricted": "modules",
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
        "description": "current interval settings",
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
        "list": ["playerName", "achievementCode", "amount"],
      },
    },
    {
      "name": "tfm.exec.giveConsumables",
      "restricted": "events",
    },
    {
      "name": "tfm.exec.removePhysicObject",
      "descriptions": [
        "lua=\"groundId\" attribute can be used in the map XML to be able remove the ground using this function."
      ],
    },
    {
      "name": "tfm.exec.movePhysicObject",
      "descriptions": [
        "lua=\"groundId\" attribute can be used in the map XML to be able move the ground using this function."
      ],
    },
  ],
};
