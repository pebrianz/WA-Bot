import P from "pino"

const pino = P.default

export default pino({ timestamp: () => `,"time":"${new Date().toJSON()}"` });
