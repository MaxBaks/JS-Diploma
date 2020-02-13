import { loadPartialConfig } from '@babel/core';
import themes from './themes';
import levels, { levelUp } from './levels';
import generateTeam, { generateTeamPositions, getCharacterCount } from './generators';
import tooltips from './helpers/tooltips';
import { moveIndices, attackIndices } from './helpers/reachIndices';
import { calculateAttack, healthAfterAttack } from './helpers/attack';
import GamePlay from './GamePlay';
import cursors from './cursors';

import Bowman from './Classes/Bowman';
import Daemon from './Classes/Daemon';
import Magician from './Classes/Magician';
import Swordsman from './Classes/Swordsman';
import Undead from './Classes/Undead';
import Vampire from './Classes/Vampire';
import PositionedCharacter from './PositionedCharacter';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
  }

  init() {
    // TODO: add event listeners to gamePlay events
    // TODO: load saved states from stateService
    const loadData = this.stateService.load();

    if (loadData === null) {
      this.currentLevel = 1;
      this.turn = 1;
      this.gamePlay.drawUi(themes[levels.get(this.currentLevel)]);
      this.generateTeams(true);
      this.gamePlay.redrawPositions(this.positions);
    } else {
      this.onLoadGame(loadData);
    }

    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addNewGameListener(this.onNewGame.bind(this));
    this.gamePlay.addSaveGameListener(this.onSaveGame.bind(this));
    this.gamePlay.addLoadGameListener(this.onLoadGame.bind(this));
  }

  generateTeams(isNewGame) {
    const { boardSize } = this.gamePlay;

    const allowedTypes = this.currentLevel === 1 ? [Bowman, Swordsman] : [Bowman, Magician, Swordsman];
    const notAllowedTypes = [Daemon, Undead, Vampire];

    if (isNewGame) {
      this.alliesTeam = [];
      const allies = generateTeam(allowedTypes, this.currentLevel, 2);
      const alliesPositions = generateTeamPositions([0, boardSize - 1], [0, 1], 2);
      allies.forEach((humanCharacter, i) => {
        const positionedCharacter = new PositionedCharacter(humanCharacter, alliesPositions[i]);
        this.alliesTeam.push(positionedCharacter);
      });
    } else {
      this.alliesTeam.forEach((allie, i) => {
        allie.character = levelUp(allie.character);
      });
      const newAllies = generateTeam(allowedTypes, this.currentLevel - 1, this.currentLevel === 2 ? 1 : 2);
      const newAlliesPositions = generateTeamPositions([0, boardSize - 1], [0, 1], this.currentLevel === 2 ? 1 : 2);
      newAllies.forEach((humanCharacter, i) => {
        const positionedCharacter = new PositionedCharacter(humanCharacter, newAlliesPositions[i]);
        this.alliesTeam.push(positionedCharacter);
      });
    }

    const enemies = generateTeam(notAllowedTypes, this.currentLevel, this.alliesTeam.length);
    const enemiesPositions = generateTeamPositions(
      [0, boardSize - 1],
      [boardSize - 2, boardSize - 1],
      getCharacterCount(this.currentLevel, this.alliesTeam.length),
    );

    this.enemyTeam = [];
    enemies.forEach((computerCharacter, i) => {
      const positionedCharacter = new PositionedCharacter(computerCharacter, enemiesPositions[i]);
      this.enemyTeam.push(positionedCharacter);
    });

    this.positions = [...this.alliesTeam, ...this.enemyTeam];
  }

  onCellClick(index) {
    // TODO: react to click
    if (this.turn === 1) {
      const posCharacter = this.positions.filter((pos) => pos.position === index);
      if (
        posCharacter.length
        && ['bowman', 'swordsman', 'magician'].includes(posCharacter[0].character.type)
      ) {
        if (this.selectedPosCharacter !== undefined) {
          this.gamePlay.deselectCell(this.selectedPosCharacter.position);
        }
        this.gamePlay.selectCell(index);
        this.selectedPosCharacter = posCharacter[0];
      } else if (!posCharacter.length) {
        if (this.selectedPosCharacter !== undefined) {
          const moveIdxs = moveIndices(
            this.selectedPosCharacter.character.type,
            this.gamePlay.boardSize,
            this.selectedPosCharacter.position,
          );

          if (!moveIdxs.includes(index)) {
            GamePlay.showError('Too long to move!');
          } else {
            this.gamePlay.deselectCell(this.selectedPosCharacter.position);
            this.selectedPosCharacter.position = index;
            this.positions = [...this.alliesTeam, ...this.enemyTeam];
            this.gamePlay.redrawPositions(this.positions);
            this.turn = 0;
            if (this.enemyTeam.length === 0) {
              this.onWinningRound();
            } else {
              setTimeout(() => {
                this.enemyMove();
              }, 500);
            }
          }
        }
      } else if (
        posCharacter.length
        && ['undead', 'vampire', 'daemon'].includes(posCharacter[0].character.type)
        && this.selectedPosCharacter !== undefined
      ) {
        const attackIdxs = attackIndices(
          this.selectedPosCharacter.character.type,
          this.gamePlay.boardSize,
          this.selectedPosCharacter.position,
        );

        if (!attackIdxs.includes(index)) {
          GamePlay.showError('Cannot reach to the enemy!');
        } else {
          this.enemyTeam.forEach((enemy) => {
            if (enemy.position === index) {
              enemy.character.health = healthAfterAttack(this.selectedPosCharacter, enemy);
            }
          });
          this.gamePlay.deselectCell(this.selectedPosCharacter.position);
          this.enemyTeam = this.enemyTeam.filter((enemy) => enemy.character.health !== 0);
          this.positions = [...this.alliesTeam, ...this.enemyTeam];
          this.gamePlay.redrawPositions(this.positions);
          this.turn = 0;
          if (this.enemyTeam.length === 0) {
            this.onWinningRound();
          } else {
            setTimeout(() => {
              this.enemyMove();
            }, 500);
          }
        }
      } else {
        GamePlay.showError('You can only select a playable character');
      }
    }
  }

  onCellEnter(index) {
    // TODO: react to mouse enter
    const posCharacter = this.positions.filter((pos) => pos.position === index);
    if (posCharacter.length) {
      const {
        level, attack, defence, health,
      } = posCharacter[0].character;
      const message = tooltips({
        level,
        attack,
        defence,
        health,
      });
      this.gamePlay.showCellTooltip(message, index);
      this.gamePlay.setCursor(cursors.pointer);
    } else {
      this.gamePlay.setCursor(cursors.auto);
    }

    if (this.selectedPosCharacter !== undefined) {
      const currentPosCharacter = this.positions.filter((pos) => pos.position === index);
      const moveIdxs = moveIndices(
        this.selectedPosCharacter.character.type,
        this.gamePlay.boardSize,
        this.selectedPosCharacter.position,
      );
      const attackIdxs = attackIndices(
        this.selectedPosCharacter.character.type,
        this.gamePlay.boardSize,
        this.selectedPosCharacter.position,
      );

      if (moveIdxs.includes(index) && !currentPosCharacter.length) {
        this.gamePlay.setCursor(cursors.pointer);
        this.gamePlay.greenCell(index);
      } else if (attackIdxs.includes(index) && currentPosCharacter.length && this.enemyTeam.map((a) => a.position).includes(index)) {
        this.gamePlay.setCursor(cursors.crosshair);
        this.gamePlay.redCell(index);
        this.gamePlay.showDamage(index, calculateAttack(this.selectedPosCharacter, currentPosCharacter[0])).then((res) => {
        });
      } else if (this.alliesTeam.map((a) => a.position).includes(index)) {
        this.gamePlay.setCursor(cursors.auto);
      } else if (index !== this.selectedPosCharacter.position) {
        this.gamePlay.setCursor(cursors.notallowed);
      }
    }
  }

  onCellLeave(index) {
    // TODO: react to mouse leave
    this.gamePlay.hideCellTooltip(index);
    this.gamePlay.degreenCell(index);
    this.gamePlay.deredCell(index);
  }

  onNewGame() {
    this.selectedPosCharacter = undefined;
    this.stateService.save(null);
    this.init();
  }


  enemyMove() {
    const enemyCanAttack = [];
    this.enemyTeam.forEach((enemy) => {
      const attackIdxs = attackIndices(
        enemy.character.type,
        this.gamePlay.boardSize,
        enemy.position,
      );
      const alliesPositions = this.alliesTeam.map((x) => x.position);
      const hasAlliesForAttack = attackIdxs.some((v) => alliesPositions.includes(v));

      if (hasAlliesForAttack) {
        enemyCanAttack.push(enemy);
      }
    });
    if (enemyCanAttack.length > 1) {
      this.selectedPosCharacter = enemyCanAttack.sort((prev, next) => next.character.attack - prev.character.attack)[0];
    }
    if (enemyCanAttack.length === 1) {
      this.selectedPosCharacter = enemyCanAttack[0];
    }
    if (enemyCanAttack.length === 0) {
      this.selectedPosCharacter = this.enemyTeam[Math.floor(Math.random() * this.enemyTeam.length)];
    }

    if (enemyCanAttack.length !== 0) {
      const attackIdxs = attackIndices(
        this.selectedPosCharacter.character.type,
        this.gamePlay.boardSize,
        this.selectedPosCharacter.position,
      );
      const alliesPositions = this.alliesTeam.map((x) => x.position);
      const alliesForAttack = attackIdxs.find((x) => alliesPositions.includes(x));
      this.alliesTeam.forEach((allie) => {
        if (allie.position === alliesForAttack) {
          allie.character.health = healthAfterAttack(this.selectedPosCharacter, allie);
        }
      });
      this.alliesTeam = this.alliesTeam.filter((allie) => allie.character.health !== 0);
      this.positions = [...this.alliesTeam, ...this.enemyTeam];
      this.gamePlay.redrawPositions(this.positions);
      this.turn = 1;
      if (this.alliesTeam.length === 0) {
        this.onGameOver();
      }
    } else {
      const moveIdxs = moveIndices(
        this.selectedPosCharacter.character.type,
        this.gamePlay.boardSize,
        this.selectedPosCharacter.position,
      );

      const alliesPositions = this.alliesTeam.map((x) => x.position);
      const enemiesPositions = this.enemyTeam.filter((x) => x.position !== this.selectedPosCharacter.position).map((x) => x.position);
      const allowedMovePositions = moveIdxs.filter((move) => !alliesPositions.includes(move) && !enemiesPositions.includes(move));
      this.selectedPosCharacter.position = allowedMovePositions[Math.floor(Math.random() * moveIdxs.length)];
      this.positions = [...this.alliesTeam, ...this.enemyTeam];
      this.gamePlay.redrawPositions(this.positions);
      this.turn = 1;
      this.selectedPosCharacter = undefined;
      if (this.alliesTeam.length === 0) {
        this.onGameOver();
      }
    }
  }

  onGameOver() {
    GamePlay.showMessage('Game over!');
  }

  onWinningRound() {
    GamePlay.showMessage('You won!');
    if (this.currentLevel < 4) {
      this.currentLevel++;
      this.stateService.save({
        level: this.currentLevel,
        allies: this.alliesTeam,
      });
      this.init();
    }
  }

  onSaveGame() {
    this.stateService.save({
      allies: this.alliesTeam,
      enemies: this.enemyTeam,
      currentTurn: this.turn,
      level: this.currentLevel,
    });
  }

  onLoadGame(loadData) {
    if (loadData.enemies === undefined) {
      this.currentLevel = loadData.level;
      this.gamePlay.drawUi(themes[levels.get(this.currentLevel)]);
      this.alliesTeam = loadData.allies;
      this.turn = 1;
      this.generateTeams(false);
      this.gamePlay.redrawPositions(this.positions);
    } else {
      this.currentLevel = loadData.level;
      this.gamePlay.drawUi(themes[levels.get(this.currentLevel)]);
      this.selectedPosCharacter = undefined;
      this.alliesTeam = loadData.allies;
      this.enemyTeam = loadData.enemies;
      this.positions = [...this.alliesTeam, ...this.enemyTeam];
      this.gamePlay.redrawPositions(this.positions);

      this.turn = loadData.currentTurn;
      if (this.turn === 0) {
        this.enemyMove();
      }
    }
  }
}
