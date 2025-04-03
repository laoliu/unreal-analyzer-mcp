import fs from 'fs';
export enum LogLevel {
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR"
  }
export class Logger {
    private logPath: string;
  
    constructor(logPath: string = 'app.log') {
      this.logPath = logPath;
    }
  
    log(level: LogLevel, message: string) {
      const entry = `${new Date().toISOString()} [${level}] ${message}\n`;
      fs.appendFile(this.logPath, entry, (err) => { // 异步写入
        if (err) console.error('日志写入失败:', err);
      });
    }
  }
  
//   // 使用示例
//   const logger = new Logger();
//   logger.log(LogLevel.INFO, '用户登录成功');