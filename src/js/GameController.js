import themes from './themes';
import generateTeam, { generateTeamPositions } from './generators';
import tooltips from './helpers/tooltips';
import { moveIndices, attackIndices } from './helpers/reachIndices';
import {calculateAttack, healthAfterAttack} from './helpers/attack';
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
    this.gamePlay.drawUi(themes.prairie);
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));

    this.generateTeams();

    this.gamePlay.redrawPositions(this.positions);
  }

  generateTeams() {
    const { boardSize } = this.gamePlay;

    const allowedTypes = [Bowman, Magician, Swordsman];
    const notAllowedTypes = [Daemon, Undead, Vampire];

    const allies = generateTeam(allowedTypes, 1, 2);
    const enemies = generateTeam(notAllowedTypes, 1, 2);

    const alliesPositions = generateTeamPositions([0, boardSize - 1], [0, 1], 2);
    const enemiesPositions = generateTeamPositions(
      [0, boardSize - 1],
      [boardSize - 2, boardSize - 1],
      2,
    );

    this.alliesTeam = [];
    this.enemyTeam = [];

    allies.forEach((humanCharacter, i) => {
      const positionedCharacter = new PositionedCharacter(humanCharacter, alliesPositions[i]);
      this.alliesTeam.push(positionedCharacter);
    });
    enemies.forEach((computerCharacter, i) => {
      const positionedCharacter = new PositionedCharacter(computerCharacter, enemiesPositions[i]);
      this.enemyTeam.push(positionedCharacter);
    });

    this.positions = [...this.alliesTeam, ...this.enemyTeam];
  }

  onCellClick(index) {
    // TODO: react to click
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
        }
        else {
          this.gamePlay.deselectCell(this.selectedPosCharacter.position);
          this.selectedPosCharacter.position = index;
          this.positions = [...this.alliesTeam, ...this.enemyTeam];
          this.gamePlay.redrawPositions(this.positions);
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
      }
      else {
        this.enemyTeam.forEach((enemy) => {
          if (enemy.position === index) {
              enemy.character.health = healthAfterAttack(this.selectedPosCharacter, enemy);
          }
        });
        this.enemyTeam = this.enemyTeam.filter((enemy) => {
          return enemy.character.health !== 0;
        });
        this.positions = [...this.alliesTeam, ...this.enemyTeam];
        this.gamePlay.redrawPositions(this.positions);
      }  
    }  
    else {
      GamePlay.showError('You can only select a playable character');
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
      } else if (attackIdxs.includes(index) && currentPosCharacter.length && this.enemyTeam.map(a => a.position).includes(index)) {
        this.gamePlay.setCursor(cursors.crosshair);
        this.gamePlay.redCell(index);
        this.gamePlay.showDamage(index, calculateAttack(this.selectedPosCharacter, currentPosCharacter[0])).then((res) => {

        });
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
}
