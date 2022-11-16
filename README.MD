# Scrabble Backend

This project is a Backend for the popular word game [Scrabble](https://de.wikipedia.org/wiki/Scrabble#Buchstabensteine). It provides a api to create rooms for players to gather and all the functionality to play the game.

---

## Host your own

1. install node, npm
2. clone this repo
3. navigate into the project
4. run `npm i && npm run dev`

---

## API

- Parameters marked with **?** are optional
- Properties marked with **?** can be undefined
- All responses are in **JSON**

#### Base Rest API

Every endpoint will server under the **root Path:** `/api/v1`

Responses will have a `content` property where everything response related is located. If an Error occurs a `error` and `errorMessage` property will be send with the response. In a successful request both `error` and `errorMessage` will be undefined.

- Structure

    - `content` : data of response 
    - `error?` : short error message
    - `errorMessage?` : longer more particular error message 

##### Endpoints

<details>
<summary><code>POST</code> <b>Create room:</b> <code>/room/create</code></summary>
    Endpoint for creating a room to play a scrabble game

-   **URL:** `/room/create`
-   **Method:** `POST`
-   **URL Params:**
    `id?=[string]`Custom id for your room with which other user can join easily. If no id is provided a random one will be used.
      `visibility?=['PUBLIC' | 'PRIVATE']` public if the room should be listed as opened room. I no visibility is provided 'PUBLIC' will be the default value.
-   **Body:** **-**

-   **Response:**
    -   If id already exists
        -   **Code:** `400`🔴
        -   **Problem:** A currently open room already has this id
        -   **Example:** sending over id=test, but a room with this id already exists.
            ```json
            {
        	    "error": "ClientError",
        	    "errorMessage": "id already in use",
        	    "content": { "roomID": "test" }
            }
            ```

    - Id is free
        -   **Code:** `200`🟢
        -   **Example:** sending over id=test
            ```json
            {
              "content": 
                  {
                    "message": "room created",
                    "roomID": "test",
                    "roomJoinUrl": "ws://localhost:8808/ws/test"
                  }
            }
            ```
</details>
<br>
<details>
<summary><code>GET</code> <b>Check room:</b> <code>/room/exists</code></summary>
    Endpoint for checking if a room with a specific id already exists

-   **URL:** `/room/exists`
-   **Method:** `GET`
-   **URL Params:**
    `id?=[string]`id to check for.
-   **Body:** **-**

-   **Response:**
    -   No id provided
        -   **Code:** `400`🔴
        -   **Problem:** No id was provided
        -   **Example:** sending over no id.
            ```json
            {
              "error": "ClientError",
              "errorMessage": "no id provided",
              "content": {}
            }
            ```
    -   Room with id does not exist
        -   **Code:** `400`🔴
        -   **Problem:** No room with the given id exists
        -   **Example:** sending over an id="notexisting" of a non existing room.
            ```json
            {
              "error": "RoomNotExisting",
              "errorMessage": "room with the given id does not exist",
              "content": {
                "idToCheck": "notexisting"
              }
            }
            ```
    -   Game running or ended
        -   **Code:** `400`🔴
        -   **Problem:** Game is already playing or game ended 
        -   **Example:** sending over an id to a room which is already in play state.
            ```json
            {
              "error": "GameRunning",
              "errorMessage": "game is already running or has ended",
              "content": {"gameState" : "playing"}
            }
            ```

    - Id provided
        -   **Code:** `200`🟢
        -   **Example:** sending over id=test
            ```json
            {
              "content": 
                  {
                    "idToCheck": "test",
                    "exists": false
                  }
            }
            ```
</details>
<br>
<details>
<summary><code>GET</code> <b>Get open rooms:</b> <code>/room/opened</code></summary>
    Endpoint for checking if a room with a specific id already exists

-   **URL:** `/room/opened`
-   **Method:** `GET`
-   **URL Params:** **-**
-   **Body:** **-**

-   **Response:**
      - Open rooms
        -   **Code:** `200`🟢
        -   **Example:**
            ```json
             {
              "content": [
                {
                  "roomID": "test",
                  "roomJoinUrl": "http://localhost:8808/ws/test",
                  "playerCount": 1,
                  "gameState": "waiting",
                  "host": "Steve"
                }
              ]
            }
            ```
</details>

<br>

#### WS Endpoint

To provided a ongoing connection of server and client to constantly share the game state a WS connection will be established. To join a Scrabble room you connect to the WS Endpoint `/ws/[id]` with the id being the room you want to join. Additionally a name parameter can be added to get a custom name otherwise a random name will be chosen for you.If the custom name is already used you will also get a random one. If no room with the given id is open no connection will be closed.

> For establishing a websocket connection you must use the `ws` protocol instead of `http` / `https`

Example Endpoint:

    ws://localhost:8808/ws/test   or   ws://localhost:8808/ws/test?name=Steve
      
##### Handling communication

To handle the communication each message has a `action` to define what to do with the payload.

* Structure
    - `action` : specific action so you know what to do with the data
    - `message` : payload with data to work with

* Example
    ```json
    {
        "action": "player:joined",
        "message": { "name": "Steve", "host": true }
    }
    ```

##### Actions

| Action            | Transmitter |Description                                                                                               |
|-------------------|-------------|-----------------------------------------------------------------------------------------------------------|
| `game:start`      | Client      | send to start the game                                                                                    |
| `game:started`    | Server      | send if the host started the game                                                                         |
| `game:end`        | Server      | send when the game ends with all data about the winner                                                    |
| `player:joined`   | Server      | send when a player joins the room or when you join a room with people in it so you know who's in the room |
| `player:left`     | Server      | send when a player leaves a room                                                                          |
| `player:self`     | Server      | send when a player joins a room to know who he is                                                                           |
| `game:next`       | Server      | send to the current player when it is his turn                                                            |
| `game:state`      | Server      | send after every turn with the new state of the game                                                      |
| `game:move:trade` | Client      | send to trade in your turn                                                                                |
| `game:move:skip`  | Client      | send to skip your turn                                                                                    |
| `game:move:place` | Client      | send to place letters on the board
| `game:move:forfeit` | Client      | send to forfeit the game

##### Messages

* **Server**

    <details>
    <summary><code>player:joined</code></summary>
        Send from the server after a client joins in a room or if you join in a room with players in it so you know who's in there. Contains information about the players name and if they are the host of the game.

    * **Action:** `player:joined`
    * **Message:** 
        + `name` : string
        + `host` : boolean
    * **Example:**
        ```json
        {
          "action": "player:joined",
          "message": {
            "name": "Steve",
            "host": true,
          }
        }
        ```
    </details>

    <br>

    <details>
    <summary><code>player:left</code></summary>
        Send from the server after a client leaves a room. Contains information about the players name.

    * **Action:** `player:left`
    * **Message:** 
        + `name` : string
        + `host` : boolean
    * **Example:**
        ```json
        {
          "action": "player:left",
          "message": {
            "name": "Steve",
            "host": true
          }
        }
        ```
    </details>

    <br>

    <details>
    <summary><code>player:self</code></summary>
        Send from the server after a client joins a room only to the joining client. Contains information about his name.

    * **Action:** `player:self`
    * **Message:** 
        + `name` : string
        + `host` : boolean
    * **Example:**
        ```json
        {
          "action": "player:self",
          "message": {
            "name": "Steve",
            "host": true
          }
        }
        ```
    </details>

    <br>

    <details>
    <summary><code>game:started</code></summary>
        Send from the server after the host started a game to notify the client with the given settings of the game.

    * **Action:** `game:started`
    * **Message:** **-**
    * **Example:**
        ```json
        {
          "action": "game:started",
          "message": 
          {
            "objectiveType": "TIME",
            "minutes": 123,
            "points": 0
          }
        }
        ```
    </details>

    <br>

    <details>
    <summary><code>game:end</code></summary>
        Send from the server after the game ends. Contains information about all players and the score and the winner.

    * **Action:** `game:end`
    * **Message:** 
        * `players` : { [playerName] : number }
        * `winner` : { name: string, points: number }

    * **Example:**
        ```json
        {
          "action": "game:end",
          "message": {
              "players": {
                "Steve": 10
              },
              "winner": {
                "name": "Steve",
                "points": 10
              }
          }
        }
        ```
    </details>

    <br>

    <details>
    <summary><code>game:state</code></summary>
        Send from the server after each turn. Contains information about the board, bag and current player and all players with the points.

    * **Action:** `game:state`
    * **Message:** 
        * `bag` : { tiles : { char: string, points : number }[] }
        * `board` : { x: number, y: number, placedTile: { char: string, points: number }, factor?: 2 | 3, type?: 'WORD' | 'LETTER', used?: boolean }[][]
        * `players` : { [name: string] : {points: number, timeLeft: number} } Each player name with his current points and his time left in milliseconds
        * `currentPlayer` : string

    * **Example:**
        ```json
        {
          "action": "game:state",
          "message": 
            {
              "bag": {
                "tiles": [
                  {
                    "char": "R",
                    "points": 1
                  },
                  {
                    "char": "U",
                    "points": 1
                  },
                   ...
                ]
              },
              "board": [
                [
                  {
                    "x": 0,
                    "y": 0,
                    "placedTile": null,
                    "factor": 3,
                    "type": "WORD",
                    "used": false
                  },
                  {
                    "x": 0,
                    "y": 1,
                    "placedTile": null
                  },
                  {
                    "x": 0,
                    "y": 2,
                    "placedTile": null
                  },
                ...
                ],
                ...
              ],
              "currentPlayer": "Steve",
              "players": 
                {
                 "sleepy lizard": {
                    "points": 0,
                    "timeLeft": 5999999
                  },
                  "tired crow": {
                      "points": 0,
                      "timeLeft": 5999999
                  }
                }
          }
        }
        ```
    </details>

    <br>

    <details>
    <summary><code>game:next</code></summary>
        Send from the server to the client who's turn it is and on start to everyone. Contains information about the players bench

    * **Action:** `game:next`
    * **Message:** 
        * `benchOwner` : string
        * `bench` : { owner: string, maxTiles: number, tilesOnHand: { char: string, points: number }[], points: number }

    * **Example:**
        ```json
        {
          "action": "game:next",
          "message": {
            "benchOwner": "Steve",
            "bench": {
              "owner": "Steve",
              "maxTiles": 7,
              "tilesOnHand": [
                {
                  "char": "E",
                  "points": 1
                },
                {
                  "char": "T",
                  "points": 1
                },
                {
                  "char": "S",
                  "points": 1
                },
              ],
              "points": 0
            }
          }
        }
        ```
    </details>

<br>

* **Client**

  <details>
    <summary><code>game:start</code></summary>
    Send from the host of the room to start the game. Additionally a game objective can be provided.

    * **Objectives**
      * `BASE`: game ends if bag is empty and one player empties his bench
      * `TIME`: game ends if time runs out or `BASE`
      * `POINT`: game ends if a player reaches the points or `BASE`
      * `SEPARATED_TIME`: each player's time runs separately on their turn and game ends if `BASE`. Player gets a point deduction if his time runs into the negative

    * **Action:** `game:start`
    * **Message:** 
        + `objectiveType?` : BASE | TIME | POINT | SEPARATED_TIME Objective of the game
        + `minutes?` : number Minutes to play if objective set to TIME | SEPARATED_TIME
        + `points?` : number Points to reach if objective set to POINT
    * **Example:**
        ```json
        {
          "action": "game:start",
          "message": 
            {
              "objectiveType" : "TIME", 
              "minutes": 10
            }
        }
        ```
    </details>

    <br>

  <details>
    <summary><code>game:move:trade</code></summary>
        Send from the client to make his move. Takes n number of tiles which should be traded for new ones in a bag

    * **Action:** `game:move:trade`
    * **Message:** 
        + `message` : string[] Tiles from your bench which should be traded
    * **Example:**
        ```json
        {
          "action": "game:move:trade",
          "message": ["A", "b", "c"]
        }
        ```
    </details>

    <br>

     <details>
    <summary><code>game:move:skip</code></summary>
        Send from the client to skip his turn if for example you don't know a word to place.

    * **Action:** `game:move:skip`
    * **Message:** **-**
    * **Example:**
        ```json
        {
          "action": "game:move:skip",
          "message": {}
        }
        ```
    </details>

    <br>

    <details>
    <summary><code>game:move:place</code></summary>
        Send from the client to place a word. Contains an array of positions and the responding letter which should be on that position.

    * **Action:** `game:move:place`
    * **Message:**
      * `message` : { x: number, y: number, char: string }[] Letters from your bench you want to place with the position where you want to place them
    * **Example:**
        ```json
        {
          "action": "game:move:place",
          "message":[
            {"x": 6, "y": 8, "char": "B"},
            {"x": 7, "y": 8, "char": "E"},
            {"x": 8, "y": 8, "char": "E"}
        ]
        }
        ```
    </details>

    <br>

    <details>
    <summary><code>game:move:forfeit</code></summary>
        Send from the client to forfeit a game.

    * **Action:** `game:move:forfeit`
    * **Message:** **-**
    * **Example:**
        ```json
        {
          "action": "game:move:forfeit",
          "message": {}
        }
        ```
    </details>