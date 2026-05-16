import { createInitialGame, countDiscsByPlayer } from "@reversi/core";
import "./style.css";

const game = createInitialGame();
const counts = countDiscsByPlayer(game.board);

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <main>
        <h1>Reversi Web</h1>
        <p>This package is a minimal Vite shell for future web UI work.</p>
        <dl>
            <div>
                <dt>Black</dt>
                <dd>${counts.B}</dd>
            </div>
            <div>
                <dt>White</dt>
                <dd>${counts.W}</dd>
            </div>
        </dl>
    </main>
`;
