export class GameSession {
    state;
    connections = new Set();
    gameState;
    constructor(state) {
        this.state = state;
        this.gameState = {
            teamA: { name: 'チームA', score: 0 },
            teamB: { name: 'チームB', score: 0 },
            lastUpdated: Date.now()
        };
    }
    async fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === '/websocket') {
            if (request.headers.get('Upgrade') !== 'websocket') {
                return new Response('Expected Upgrade: websocket', { status: 426 });
            }
            const webSocketPair = new WebSocketPair();
            const [client, server] = Object.values(webSocketPair);
            await this.handleSession(server);
            return new Response(null, {
                status: 101,
                webSocket: client,
            });
        }
        return new Response('Not found', { status: 404 });
    }
    async handleSession(webSocket) {
        webSocket.accept();
        this.connections.add(webSocket);
        await this.loadGameState();
        this.sendToClient(webSocket, {
            type: 'game_state',
            data: this.gameState,
            timestamp: Date.now()
        });
        webSocket.addEventListener('message', async (event) => {
            try {
                const message = JSON.parse(event.data);
                await this.handleAction(message.action);
            }
            catch (error) {
                this.sendToClient(webSocket, {
                    type: 'error',
                    data: 'Invalid message format',
                    timestamp: Date.now()
                });
            }
        });
        webSocket.addEventListener('close', () => {
            this.connections.delete(webSocket);
        });
        webSocket.addEventListener('error', () => {
            this.connections.delete(webSocket);
        });
    }
    async loadGameState() {
        const stored = await this.state.storage.get('gameState');
        if (stored) {
            this.gameState = stored;
        }
    }
    async saveGameState() {
        this.gameState.lastUpdated = Date.now();
        await this.state.storage.put('gameState', this.gameState);
    }
    async handleAction(action) {
        switch (action.type) {
            case 'SCORE_UPDATE':
                if (action.team === 'teamA') {
                    this.gameState.teamA.score = Math.max(0, this.gameState.teamA.score + action.points);
                }
                else {
                    this.gameState.teamB.score = Math.max(0, this.gameState.teamB.score + action.points);
                }
                break;
            case 'RESET_SCORES':
                this.gameState.teamA.score = 0;
                this.gameState.teamB.score = 0;
                break;
            case 'SET_TEAM_NAME':
                if (action.team === 'teamA') {
                    this.gameState.teamA.name = action.name;
                }
                else {
                    this.gameState.teamB.name = action.name;
                }
                break;
            default:
                return;
        }
        await this.saveGameState();
        this.broadcastState();
    }
    broadcastState() {
        const message = {
            type: 'game_state',
            data: this.gameState,
            timestamp: Date.now()
        };
        const messageString = JSON.stringify(message);
        for (const connection of this.connections) {
            try {
                connection.send(messageString);
            }
            catch (error) {
                this.connections.delete(connection);
            }
        }
    }
    sendToClient(webSocket, message) {
        try {
            webSocket.send(JSON.stringify(message));
        }
        catch (error) {
            this.connections.delete(webSocket);
        }
    }
}
//# sourceMappingURL=game-session.js.map