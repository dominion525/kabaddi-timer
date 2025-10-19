import log from 'loglevel';

// 環境別のデフォルトログレベル設定
const defaultLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';
log.setDefaultLevel(defaultLevel);

// Named loggers for different modules
export const webSocketLogger = log.getLogger('WebSocket');
export const gameSessionLogger = log.getLogger('GameSession');
export const gameStateLogger = log.getLogger('GameState');
export const timerLogger = log.getLogger('Timer');
export const qrModalLogger = log.getLogger('QRModal');
export const controlPanelLogger = log.getLogger('ControlPanel');
export const appLogger = log.getLogger('App');

// デフォルトロガー
export const logger = log;

// 各Named loggerのデフォルトレベルを設定
webSocketLogger.setDefaultLevel(defaultLevel);
gameSessionLogger.setDefaultLevel(defaultLevel);
gameStateLogger.setDefaultLevel(defaultLevel);
timerLogger.setDefaultLevel(defaultLevel);
qrModalLogger.setDefaultLevel(defaultLevel);
controlPanelLogger.setDefaultLevel(defaultLevel);
appLogger.setDefaultLevel(defaultLevel);
