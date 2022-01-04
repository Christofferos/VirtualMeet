import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import Canvas from '../components/Canvas';
import { Spacer } from '../components/Spacer';
import {
  BG_COLOR,
  CANVAS_WIDTH,
  DELAY_BETWEEN_ROUNDS,
  FLASH_COLOR,
  FRAME_RATE,
  GRID_SIZE,
  PLAYER_1_COLOR,
  PLAYER_2_COLOR,
  POWER_UP_COLOR,
  WALL_COLOR,
  WALL_SIZE,
  WINNING_SCORE,
} from '../utils/constants';
import { Rect } from '../utils/rectangleModule';
/* Color scheme: 050A28, 0E1D34, 1A1A1A. green, red. */

const SOLID_WALL_IMG = new Image();
const MOVABLE_WALL_IMG = new Image();
const HEALTH_IMG = new Image();
SOLID_WALL_IMG.src =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADISURBVChTHY/LCkVQFIZ/23FLJIkBAyLKRDHxosoTeQHKZSRjmTHQxmnvNf3WfxPatv26roPjOBAEAdd1Yds2mKaJ+75B5nnGMAwcpGmKKIqgaRp0XUcQBCB5nsN1XTzPg3Ecsa4rf6yqCoZh4CeKIgfTNHG1LMuo6xpN0/AowsD3faCUwrZtFEWBvu+xLAve9wXZ9x1lWcL3fViWheM4uJuqqvA8D7/zPMFiGGQXhiHvE8cxsiwDkSSJ2yuKwtWsZJIkfCalFH8wHlog6tnoiAAAAABJRU5ErkJggg==';
MOVABLE_WALL_IMG.src =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAFmSURBVChTPY9LK0QBHMV/c+/MuGZwPRrDDEnNeOWVqIsiRbKQZqNsfQMrlvMFLJRPIAsL2dhISZJHxgzjVR6LixHCYF64jKu5Zc7mnFOnc/5/0+vcpP4sV6Oay8lgYydAb2eHwT6fj3RgCe/pAuJEf4M/+m1hZnEVdJ2T0zNub24pc7lxOp3cp9IUV3oQrit7Ua1u2lqaCIWPcRQX4fh6QL264DMW5eBc5bKwGVEqcfkPgwEKEnek3p7Jjd/Tp5/zKubzpAnGQk+XgjAyNEBVbSNKIkSX/R1NsBAxOw3/v5BMfSDYbbnIssxuXhvbSRnr7zcVP49G2J58wBw5IpMRvV6PPxgKMawFkK0CkbSNPCmHeN0ghVW1XEY/0TQNU/J4XV/bO2J+ZTP7UAb/enxsFIskIU55En7ZlsOLzZ29qa7Gm9VyTKW1VML0uDyr76pRHI0KW/thuttbDFYUxWg2r0xT7y7iD8aUkyyRVJCtAAAAAElFTkSuQmCC';
HEALTH_IMG.src =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAACaSURBVChTVY/BCsIwEERf2kZNhSJa8SAeRPD/f60tKkrTddLUgwtDdpjZ3YkDzKigrmG9gsmECYYBxyh11yZDxjgK0cz5zLeNFdoAZQlNA04LC+HY5r7yOPPBePbZ9KsYMz+dKajDv5gqGRK6TgZlotrA5TrHnYXbHbwGQ9AJhZmn0s33I79JXEps+eZhD/2gkMqdTFPEfV58AS86O1tc/01yAAAAAElFTkSuQmCC';

const wallDim = 4;
const DEFAULT_GAME_STATE = {
  players: [
    {
      id: 1,
      fireRateDelay: 100,
      pos: {
        x: 1,
        y: 1,
      },
      directionPreference: [],
      dxdy: {
        x: 0,
        y: 0,
      },
      dir: 'UP',
      bullets: [],
      reload: false,
      lives: 3,
      inventorySpace: 3,
      inventoryAction: false,
      inventoryCooldown: false,
      playersize: WALL_SIZE,
    },
    {
      id: 2,
      fireRateDelay: 100,
      pos: {
        x: GRID_SIZE - wallDim - 1,
        y: GRID_SIZE - wallDim - 1,
      },
      directionPreference: [],
      dxdy: {
        x: 0,
        y: 0,
      },
      dir: 'UP',
      bullets: [],
      reload: false,
      lives: 3,
      inventorySpace: 3,
      inventoryCooldown: false,
      playersize: WALL_SIZE,
    },
  ],
  walls: {
    wallsize: WALL_SIZE,
    solid: [],
    movable: [],
  },
  food: {},
  scores: { P1: 0, P2: 0 },
  gridsize: GRID_SIZE,
};

interface IGame {
  emitGameState: (state: any) => void;
  emitGameOver: (roomName: string, winner: number, state: any) => void;
  playerN: number;
}

export const Game = forwardRef(({ emitGameState, emitGameOver, playerN }: IGame, ref) => {
  const [gameState, setGameState] = useState<any>(DEFAULT_GAME_STATE);
  const refState = useRef<any>(DEFAULT_GAME_STATE);
  const flashRef = useRef<number[]>([0, 0]);

  useImperativeHandle(ref, () => ({
    getGameStatePeer(state: any) {
      const opponentID = playerN === 1 ? 0 : 1;
      const opponentPlayer = state.players[opponentID];
      setGameState((prevState: any) => ({
        ...prevState,
        players: prevState.players.map((p: any) => {
          if (p.id === opponentID + 1) return opponentPlayer;
          else return p;
        }),
        walls: state.walls,
        food: state.food.x ? state.food : prevState.food,
      }));
      refState.current.players[opponentID] = opponentPlayer;
      refState.current.walls = state.walls;
      refState.current.food = state.food.x ? state.food : gameState.food;
    },
  }));

  // FROM LEFT TO RIGHT. TOP TO BOTTOM.
  const initializePlayingField = useCallback(() => {
    const gameStateTemp = gameState;
    for (let i = 16; i < 36; i += wallDim) {
      gameStateTemp.walls.solid.push({ x: 10, y: i });
    }
    for (let i = 56; i < 76; i += wallDim) {
      gameStateTemp.walls.solid.push({ x: 10, y: i });
    }
    for (let i = 10; i < 32; i += wallDim) {
      gameStateTemp.walls.solid.push({ x: i, y: 87 });
    }
    for (let i = 26; i < 34; i += wallDim) {
      gameStateTemp.walls.solid.push({ x: i, y: 8 });
    }
    for (let i = 24; i < 52; i += wallDim) {
      gameStateTemp.walls.solid.push({ x: 26, y: i });
    }
    for (let i = 0; i < 8; i += wallDim) {
      gameStateTemp.walls.solid.push({ x: 64, y: i });
    }
    for (let i = 60; i < 80; i += wallDim) {
      gameStateTemp.walls.solid.push({ x: i, y: 87 });
    }
    for (let i = 40; i < 64; i += wallDim) {
      gameStateTemp.walls.solid.push({ x: 71, y: i });
    }
    for (let i = 20; i < 36; i += wallDim) {
      gameStateTemp.walls.solid.push({ x: 86, y: i });
    }
    for (let i = 52; i < 72; i += wallDim) {
      gameStateTemp.walls.solid.push({ x: 86, y: i });
    }
    // Movable walls
    gameStateTemp.walls.movable.push({ x: 3, y: 32 });
    gameStateTemp.walls.movable.push({ x: 3, y: 56 });
    gameStateTemp.walls.movable.push({ x: 93, y: 32 });
    gameStateTemp.walls.movable.push({ x: 93, y: 52 });
    gameStateTemp.walls.movable.push({ x: 45, y: 96 });
    for (let i = 44; i < 58; i += wallDim + 1) {
      gameStateTemp.walls.movable.push({ x: i, y: 4 });
    }
    for (let i = 20; i < 32; i += wallDim + 1) {
      gameStateTemp.walls.movable.push({ x: i, y: 76 });
    }
    for (let i = 72; i < 84; i += wallDim + 1) {
      gameStateTemp.walls.movable.push({ x: 60, y: i });
    }
    for (let i = 12; i < 20; i += wallDim + 1) {
      gameStateTemp.walls.movable.push({ x: 72, y: i });
    }
    gameStateTemp.walls.movable.push({ x: 77, y: 17 });
    const generatedWalls = {
      solid: gameStateTemp.walls.solid,
      movable: gameStateTemp.walls.movable,
      wallsize: WALL_SIZE,
    };
    setGameState((prevState: any) => ({
      ...prevState,
      walls: generatedWalls,
    }));
    refState.current.walls = generatedWalls;
  }, [gameState]);

  const resetGameState = useCallback(
    (scoreInput: number[]) => {
      const TEMP_DEFAULT_STATE = DEFAULT_GAME_STATE;
      TEMP_DEFAULT_STATE.scores.P1 = scoreInput[0];
      TEMP_DEFAULT_STATE.scores.P2 = scoreInput[1];
      TEMP_DEFAULT_STATE.players.forEach((player) => {
        if (player.id === 1) {
          player.pos.x = 1;
          player.pos.y = 1;
        } else if (player.id === 2) {
          player.pos.x = GRID_SIZE - wallDim - 1;
          player.pos.y = GRID_SIZE - wallDim - 1;
        }
        player.lives = 3;
      });
      TEMP_DEFAULT_STATE.walls = { wallsize: WALL_SIZE, solid: [], movable: [] };
      initializePlayingField();
      return TEMP_DEFAULT_STATE;
    },
    [initializePlayingField],
  );

  const randomFood = useCallback(() => {
    if (playerN !== 0) return;
    const food = {
      x: Math.floor(GRID_SIZE / 4 + Math.random() * (GRID_SIZE / 2)),
      y: Math.floor(GRID_SIZE / 4 + Math.random() * (GRID_SIZE / 2)),
    };
    setGameState((prevState: any) => ({ ...prevState, food: food }));
    refState.current.food = food;
  }, [playerN]);

  const collision = useCallback((player: any, checkForMovableWall: boolean, gameState: any) => {
    if (!gameState) return false;
    let x1 = 0;
    // let x2 = 0;
    let y1 = 0;
    // let y2 = 0;
    // Check one step ahead
    if (player.dir === 'LEFT') {
      x1 = player.pos.x - 1;
      y1 = player.pos.y;
      // x2 = player.pos.x - 1;
      // y2 = player.pos.y;
    } else if (player.dir === 'UP') {
      x1 = player.pos.x;
      y1 = player.pos.y - 1;
      // x2 = player.pos.x;
      // y2 = player.pos.y - 1;
    } else if (player.dir === 'RIGHT') {
      x1 = player.pos.x + 1;
      y1 = player.pos.y;
      // x2 = player.pos.x + 1;
      // y2 = player.pos.y;
    } else if (player.dir === 'DOWN') {
      x1 = player.pos.x;
      y1 = player.pos.y + 1;
      // x2 = player.pos.x;
      // y2 = player.pos.y + 1;
    }
    const playerSize = 4;
    const wallSize = 4;
    let playerRect = new Rect(x1, y1, playerSize, playerSize);
    const border1 = new Rect(GRID_SIZE, 0, wallSize, GRID_SIZE); // right |
    const border2 = new Rect(-4, 0, wallSize, GRID_SIZE); // left |
    const border3 = new Rect(-4, -4, GRID_SIZE + 4, wallSize); // upper ---
    const border4 = new Rect(-4, GRID_SIZE, GRID_SIZE + 4, wallSize); // lower ---
    if (
      (playerRect.intersects(border1) ||
        playerRect.intersects(border2) ||
        playerRect.intersects(border3) ||
        playerRect.intersects(border4)) &&
      checkForMovableWall === false
    ) {
      return true;
    }
    let wx1, wy1;
    let wall, wallRect;
    // Solid walls
    for (let i = 0; i < gameState.walls.solid.length; i++) {
      wall = gameState.walls.solid[i];
      wx1 = wall.x;
      wy1 = wall.y;
      wallRect = new Rect(wx1, wy1, wallSize, wallSize);
      if (wallRect.intersects(playerRect) && checkForMovableWall === false) {
        return true;
      }
    }
    // Movable walls
    for (let i = 0; i < gameState.walls.movable.length; i++) {
      wall = gameState.walls.movable[i];
      wx1 = wall.x;
      wy1 = wall.y;
      wallRect = new Rect(wx1, wy1, wallSize, wallSize);
      if (wallRect.intersects(playerRect)) {
        if (checkForMovableWall) {
          gameState.walls.movable.splice(i, 1);
        }
        return true;
      }
    }
    return false;
  }, []);

  const livesUpdate = useCallback((playerID, player) => {
    console.log('3A');
    setGameState((prevState: any) => ({
      ...prevState,
      players: prevState.players.map((p: any) => {
        if (p.id === playerID + 1) return player;
        else return p;
      }),
      food: {},
    }));
    refState.current.players[playerID] = player;
    refState.current.food = {};
  }, []);

  const playerUpdate = useCallback(
    (player: any) => {
      console.log('3');
      setGameState((prevState: any) => ({
        ...prevState,
        players: prevState.players.map((p: any) => {
          if (p.id === playerN + 1) return player;
          else return p;
        }),
      }));
      refState.current.players[playerN] = player;
    },
    [playerN],
  );

  const hasClientMoved = useCallback(
    (gameState: any, prevGameState: any) => {
      const { x: p1NowX, y: p1NowY } = gameState.players[0].pos;
      const { x: p2NowX, y: p2NowY } = gameState.players[1].pos;
      const { x: p1HistoryX, y: p1HistoryY } = prevGameState.players[0].pos;
      const { x: p2HistoryX, y: p2HistoryY } = prevGameState.players[1].pos;
      const clientMoved =
        (playerN === 0 && (p1NowX !== p1HistoryX || p1NowY !== p1HistoryY)) ||
        (playerN === 1 && (p2NowX !== p2HistoryX || p2NowY !== p2HistoryY));
      return clientMoved;
    },
    [playerN],
  );

  /* ### [GameLoop]: Loops until game over. ### */
  const gameLoop = useCallback(
    (state: any, prevGameState: any) => {
      if (!state) return false;
      const playerOne = state.players[0];
      const player1Rect = new Rect(playerOne.pos.x, playerOne.pos.y, 4, 4);
      const playerTwo = state.players[1];
      const player2Rect = new Rect(playerTwo.pos.x, playerTwo.pos.y, 4, 4);
      // Move P1
      if (!collision(playerOne, false, state)) {
        playerOne.pos.x += playerOne.dxdy.x;
        playerOne.pos.y += playerOne.dxdy.y;
        if (playerN === 0 && hasClientMoved(state, prevGameState)) playerUpdate(playerOne);
      }
      // Move P2
      if (!collision(playerTwo, false, state)) {
        playerTwo.pos.x += playerTwo.dxdy.x;
        playerTwo.pos.y += playerTwo.dxdy.y;
        if (playerN === 1 && hasClientMoved(state, prevGameState)) playerUpdate(playerTwo);
      }
      updateBullets(state, playerOne, playerTwo, player1Rect, player2Rect);
      /* [FOOD EATEN] */
      if (state.food !== null) {
        const food = new Rect(state.food.x, state.food.y, 2, 2);
        if (food.intersects(player1Rect)) {
          if (playerOne.lives < 3) playerOne.lives++;
          livesUpdate(0, playerOne);
          setTimeout(() => {
            randomFood();
          }, 10000);
        } else if (food.intersects(player2Rect)) {
          if (playerTwo.lives < 3) playerTwo.lives++;
          livesUpdate(1, playerTwo);
          setTimeout(() => {
            randomFood();
          }, 10000);
        }
      }
      /* ## IMPORTANT for P1 ## */
      if (playerOne.lives <= 0) return 2;
      // ## !IDEA: Make it so that gold can be collected, and upgrade some feature in-game. ##
      /* ## IMPORTANT for P2 ## */
      if (playerTwo.lives <= 0) return 1;
      return false;
    },
    [collision, hasClientMoved, playerN, playerUpdate, randomFood],
  );

  const paintGame = useCallback((context: any, state: any) => {
    if (!state) return;
    const food = state.food;
    const gridsize = state.gridsize;
    const gridRatio = CANVAS_WIDTH / gridsize; // 8.5
    const playerSize = state.players[0].playersize; // 34
    const wallSize = state.walls.wallsize; // 34
    // CANVAS
    context.fillStyle = BG_COLOR;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_WIDTH); // (x, y, width, height)
    // POWERUPS
    context.fillStyle = POWER_UP_COLOR;
    context.drawImage(
      HEALTH_IMG,
      food.x * gridRatio,
      food.y * gridRatio,
      gridRatio * 2,
      gridRatio * 2,
    );
    // context.fillRect(food.x * gridRatio, food.y * gridRatio, gridRatio * 2, gridRatio * 2);
    // BULLETS
    context.fillStyle = '#ff6600';
    for (let i = 0; i < state.players[0].bullets.length; i++) {
      context.fillRect(
        state.players[0].bullets[i].x * gridRatio,
        state.players[0].bullets[i].y * gridRatio,
        gridRatio,
        gridRatio,
      );
    }
    for (let i = 0; i < state.players[1].bullets.length; i++) {
      context.fillRect(
        state.players[1].bullets[i].x * gridRatio,
        state.players[1].bullets[i].y * gridRatio,
        gridRatio,
        gridRatio,
      );
    }
    // WALLS SOLID
    context.fillStyle = WALL_COLOR;
    if (state.walls.solid.length !== 0) {
      state.walls.solid.forEach((wall: any) => {
        context.drawImage(
          SOLID_WALL_IMG,
          wall.x * gridRatio,
          wall.y * gridRatio,
          wallSize,
          wallSize,
        );
        // context.fillRect(wall.x * gridRatio, wall.y * gridRatio, wallSize, wallSize);
      });
    }
    // WALLS MOVABLE
    context.fillStyle = '#ccccff';
    if (state.walls.movable.length !== 0) {
      state.walls.movable.forEach((wall: any) => {
        context.drawImage(
          MOVABLE_WALL_IMG,
          wall.x * gridRatio,
          wall.y * gridRatio,
          wallSize,
          wallSize,
        );
        // context.fillRect(wall.x * gridRatio, wall.y * gridRatio, wallSize, wallSize);
      });
    }

    // INDICATE PLAYERS WITH FLASHES
    // Player 1
    context.fillStyle = flashRef.current[0] ? FLASH_COLOR : PLAYER_1_COLOR;
    if (flashRef.current[0]) flashRef.current[0]--;
    context.fillRect(
      state.players[0].pos.x * gridRatio,
      state.players[0].pos.y * gridRatio,
      playerSize,
      playerSize,
    );
    // P1 Lives
    if (state.players[0].lives > 0)
      for (let i = 0; i < state.players[0].lives; i++) {
        context.fillRect(
          state.players[0].pos.x * gridRatio + i * 7,
          state.players[0].pos.y * gridRatio - 6,
          5,
          5,
        );
      }
    // P1 Inventory
    context.fillStyle = '#66ffff';
    for (let i = 3; i > state.players[0].inventorySpace; i--) {
      context.fillRect(
        state.players[0].pos.x * gridRatio + 36,
        state.players[0].pos.y * gridRatio + 18 - 6 * i,
        4,
        4,
      );
    }
    // P1 Reload
    context.fillStyle = '#ffff00';
    if (state.players[0].reload === false)
      context.fillRect(
        state.players[0].pos.x * gridRatio - 5,
        state.players[0].pos.y * gridRatio + 1,
        3,
        12,
      );
    // P2
    context.fillStyle = flashRef.current[1] ? FLASH_COLOR : PLAYER_2_COLOR;
    if (flashRef.current[1]) flashRef.current[1]--;
    context.fillRect(
      state.players[1].pos.x * gridRatio,
      state.players[1].pos.y * gridRatio,
      playerSize,
      playerSize,
    );
    // P2 Lives
    if (state.players[1].lives > 0)
      for (let i = 0; i < state.players[1].lives; i++) {
        context.fillRect(
          state.players[1].pos.x * gridRatio + i * 7,
          state.players[1].pos.y * gridRatio - 6,
          5,
          5,
        );
      }
    // P2 Inventory
    context.fillStyle = '#66ffff';
    for (let i = 3; i > state.players[1].inventorySpace; i--) {
      context.fillRect(
        state.players[1].pos.x * gridRatio + 36,
        state.players[1].pos.y * gridRatio + 18 - 6 * i,
        4,
        4,
      );
    }
    // P2 Reload
    context.fillStyle = '#ffff00';
    if (state.players[1].reload === false) {
      context.fillRect(
        state.players[1].pos.x * gridRatio - 5,
        state.players[1].pos.y * gridRatio + 1,
        3,
        12,
      );
    }
  }, []);

  const startGameInterval = useCallback(() => {
    let prevGameState = gameState;
    let intervalId = setInterval(() => intervalIdProcedure(refState.current), 1000 / FRAME_RATE);
    const intervalIdProcedure = (gameState: any) => {
      let winner = gameLoop(gameState, prevGameState);
      if (!winner) {
        if (hasClientMoved(gameState, prevGameState)) {
          prevGameState = gameState;
          emitGameState(gameState);
        }
      } else {
        let p1Score = gameState.scores.P1;
        let p2Score = gameState.scores.P2;
        if (winner === 1 || winner === -1) p1Score++;
        if (winner === 2 || winner === -1) p2Score++;
        /* emitGameOver(roomName, winner, {
              P1: gameState.scores.P1,
              P2: gameState.scores.P2,
            }); */
        if (Math.max(p1Score, p2Score) < WINNING_SCORE) {
          /* clearInterval(intervalId); */
          const state = resetGameState([p1Score, p2Score]);
          // randomFood();
          setGameState(state);
          refState.current = state;
          /* setTimeout(
                () =>
                  (intervalId = setInterval(
                    () => intervalIdProcedure(refState.current),
                    1000 / FRAME_RATE,
                  )),
                DELAY_BETWEEN_ROUNDS,
              ); */
        } else {
          const state = resetGameState([p1Score, p2Score]);
          setGameState(state);
        }
      }
    };
  }, [gameState, gameLoop, hasClientMoved, emitGameState, resetGameState]);

  const wallDropAllowed = useCallback(
    (player: any) => {
      const playerSize = 4;
      const wallSize = 4;
      let space;
      if (player.dir === 'UP') {
        space = new Rect(player.pos.x, player.pos.y - wallSize, wallSize, wallSize);
      } else if (player.dir === 'DOWN') {
        space = new Rect(player.pos.x, player.pos.y + playerSize, wallSize, wallSize);
      } else if (player.dir === 'LEFT') {
        space = new Rect(player.pos.x - wallSize, player.pos.y, wallSize, wallSize);
      } else if (player.dir === 'RIGHT') {
        space = new Rect(player.pos.x + playerSize, player.pos.y, wallSize, wallSize);
      }
      // Check if movable wall instersects with other movable walls.
      /* for (let i = 0; i < gameState.walls.movable.length; i++) {
            if (
              space?.intersects(
                new Rect(
                  gameState.walls.movable[i].x,
                  gameState.walls.movable[i].y,
                  wallSize,
                  wallSize,
                ),
              )
            ) {
              return false;
            }
          } */
      gameState.walls.movable.push({ x: space?.x, y: space?.y });
      return true;
    },
    [gameState],
  );

  const keyPressedUpdate = useCallback(
    (keyCode: number) => {
      const player = refState.current.players[playerN];
      if (!player) return;
      if (keyCode === 71) {
        if (player.reload === false) {
          if (player.dir === 'UP') {
            player.bullets.push({ x: player.pos.x + 1, y: player.pos.y, dir: 'UP' });
          } else if (player.dir === 'DOWN') {
            player.bullets.push({ x: player.pos.x + 1, y: player.pos.y + 4, dir: 'DOWN' });
          } else if (player.dir === 'LEFT') {
            player.bullets.push({ x: player.pos.x, y: player.pos.y + 1, dir: 'LEFT' });
          } else if (player.dir === 'RIGHT') {
            player.bullets.push({ x: player.pos.x + 4, y: player.pos.y + 1, dir: 'RIGHT' });
          }
          player.reload = true;
          setTimeout(() => {
            player.reload = false;
          }, 500);
        }
      } else if (keyCode === 72) {
        if (player.inventoryCooldown === false) {
          player.inventoryCooldown = true;
          // Pick up wall
          if (player.inventorySpace - 1 >= 0 && collision(player, true, gameState)) {
            player.inventorySpace--;
          }
          // Drop wall
          else if (player.inventorySpace !== 3 && wallDropAllowed(player)) {
            player.inventorySpace++;
          }
          setTimeout(() => {
            player.inventoryCooldown = false;
          }, 500);
        }
      } else {
        if (!player.directionPreference.includes(keyCode)) {
          player.directionPreference.push(keyCode);
        }
        const dxdy = calculateDirection(player);
        player.dxdy.x = dxdy[0];
        player.dxdy.y = dxdy[1];
      }
      console.log('7');
      setGameState((prevState: any) => ({
        ...prevState,
        players: prevState.players.map((p: any) => {
          if (p.id === playerN + 1) {
            return player;
          } else return p;
        }),
      }));
      refState.current.players[playerN] = player;
      emitGameState(refState.current);
    },
    [collision, emitGameState, gameState, playerN, wallDropAllowed],
  );

  const keyReleasedUpdate = useCallback(
    (keyCode: any) => {
      const player = refState.current.players[playerN];
      if (!player) return;
      if (player.directionPreference.includes(keyCode)) {
        const newDirectionPreference = [];
        const searchValue = keyCode;
        for (let i = 0; i < player.directionPreference.length; i++) {
          if (player.directionPreference[i] !== searchValue) {
            newDirectionPreference.push(player.directionPreference[i]);
          }
        }
        player.directionPreference = newDirectionPreference;
      }
      const dxdy = calculateDirection(player);
      player.dxdy.x = dxdy[0];
      player.dxdy.y = dxdy[1];
      console.log('8');
      setGameState((prevState: any) => ({
        ...prevState,
        players: prevState.players.map((p: any) => {
          if (p.id === playerN + 1) {
            return player;
          } else return p;
        }),
      }));
      refState.current.players[playerN] = player;
      emitGameState(refState.current);
    },
    [emitGameState, playerN],
  );

  useEffect(() => {
    initializePlayingField();
    randomFood();
    startGameInterval();
    console.log('5');
    window.addEventListener(
      'keydown',
      (e: KeyboardEvent) => {
        keyPressedUpdate(e.keyCode);
      },
      false,
    );
    window.addEventListener(
      'keyup',
      (e: KeyboardEvent) => {
        keyReleasedUpdate(e.keyCode);
      },
      false,
    );
    return () => {
      window.removeEventListener('keydown', (e: KeyboardEvent) => keyPressedUpdate(e.keyCode));
      window.removeEventListener('keyup', (e: KeyboardEvent) => keyReleasedUpdate(e.keyCode));
    };
  }, []);

  const calculateDirection = (player: any) => {
    let dx = 0;
    let dy = 0;
    if (player.directionPreference.length > 0) {
      switch (player.directionPreference[player.directionPreference.length - 1]) {
        case 37: {
          dx = -1;
          player.dir = 'LEFT';
          return [dx, dy];
        }
        case 38: {
          dy = -1;
          player.dir = 'UP';
          return [dx, dy];
        }
        case 39: {
          dx = 1;
          player.dir = 'RIGHT';
          return [dx, dy];
        }
        case 40: {
          dy = 1;
          player.dir = 'DOWN';
          return [dx, dy];
        }
      }
    }
    return [0, 0];
  };

  const updateBullets = (state: any, p1: any, p2: any, p1Rect: any, p2Rect: any) => {
    // Move bullets
    p1.bullets.forEach((bullet: any) => {
      if (bullet.dir === 'UP') {
        bullet.y -= 3;
      } else if (bullet.dir === 'DOWN') {
        bullet.y += 3;
      } else if (bullet.dir === 'LEFT') {
        bullet.x -= 3;
      } else if (bullet.dir === 'RIGHT') {
        bullet.x += 3;
      }
    });
    p2.bullets.forEach((bullet: any) => {
      if (bullet.dir === 'UP') {
        bullet.y -= 3;
      } else if (bullet.dir === 'DOWN') {
        bullet.y += 3;
      } else if (bullet.dir === 'LEFT') {
        bullet.x -= 3;
      } else if (bullet.dir === 'RIGHT') {
        bullet.x += 3;
      }
    });
    // Check for collision
    for (let i = 0; i < p1.bullets.length; i++) {
      const bulletRect = new Rect(p1.bullets[i].x, p1.bullets[i].y, 1, 1);
      if (p2Rect.intersects(bulletRect)) {
        p2.lives--;
        flashRef.current[1] = 5;
        p1.bullets.splice(i, 1);
        break;
      } else {
        for (let k = 0; k < state.walls.solid.length; k++) {
          if (
            bulletRect.intersects(new Rect(state.walls.solid[k].x, state.walls.solid[k].y, 4, 4))
          ) {
            p1.bullets.splice(i, 1);
            break;
          }
        }
        for (let k = 0; k < state.walls.movable.length; k++) {
          if (
            bulletRect.intersects(
              new Rect(state.walls.movable[k].x, state.walls.movable[k].y, 4, 4),
            )
          ) {
            p1.bullets.splice(i, 1);
            break;
          }
        }
      }
    }
    for (let i = 0; i < p2.bullets.length; i++) {
      const bulletRect = new Rect(p2.bullets[i].x, p2.bullets[i].y, 1, 1);
      if (p1Rect.intersects(bulletRect)) {
        p1.lives--;
        flashRef.current[0] = 5;
        p2.bullets.splice(i, 1);
        break;
      } else {
        for (let k = 0; k < state.walls.solid.length; k++) {
          if (
            bulletRect.intersects(new Rect(state.walls.solid[k].x, state.walls.solid[k].y, 4, 4))
          ) {
            p2.bullets.splice(i, 1);
            break;
          }
        }
        for (let k = 0; k < state.walls.movable.length; k++) {
          if (
            bulletRect.intersects(
              new Rect(state.walls.movable[k].x, state.walls.movable[k].y, 4, 4),
            )
          ) {
            p2.bullets.splice(i, 1);
            break;
          }
        }
      }
    }
  };

  return (
    <>
      <div
        style={{
          backgroundImage: 'linear-gradient(to bottom right, #050a28, #1a1a1a)',
          width: '99.5vw',
          height: '94.5vh',
        }}
      >
        <div id="gameScreen" style={{ height: '90vh' }}>
          <div
            style={{
              height: '80vh',
              justifyContent: 'center',
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Canvas draw={paintGame} state={gameState} />

            <span style={{ display: 'flex', flexDirection: 'row' }}>
              <span style={{ color: 'red', fontSize: '40px' }}>P1: </span>
              <span style={{ fontSize: '40px' }}>{gameState.scores.P1} Pts.</span>
              <Spacer width={15} />
              <span style={{ color: 'green', fontSize: '40px' }}>P2: </span>
              <span style={{ fontSize: '40px' }}>{gameState.scores.P2} Pts.</span>
            </span>

            <div
              className="postGame"
              style={{
                display: 'none',
                width: '200px',
                top: '40%',
                backgroundColor: 'rgba(14, 29, 52, 0.8)',
                position: 'absolute',
                left: '50%',
                marginLeft: '-100px',
                paddingTop: '50px',
                paddingBottom: '50px',
                textAlign: 'center',
                borderRadius: '5px',
                color: 'white',
                fontSize: '25px',
              }}
            >
              <span className="countdown"></span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
