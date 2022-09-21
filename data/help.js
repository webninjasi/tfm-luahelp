var tagsMessage = "See various html tags you can use <a href=\"tags.html\">here</a>";
var customHelpData = {
  "tree": [
    {
      "name": "tfm.get.room.uniquePlayers",
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
      "name": "tfm.get.room.xmlMapInfo.currentMap",
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
  ],
  "events": [
    {
      "name": "eventContactListener",
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
  ],
  "functions": [
    {
      "name": "system.bindKeyboard",
      "examples": [
        [null, "32", "'true'", "'true'"],
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
  ],
};