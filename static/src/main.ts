import Game from './Game';
import Ui from './Ui';
import Net from './Net';

export let game: Game;
export let net: Net;
export let ui: Ui;

window.onload = () => {
  game = new Game();
  ui = new Ui();
  net = new Net();
}