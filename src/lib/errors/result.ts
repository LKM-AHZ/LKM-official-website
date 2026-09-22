// 统一 Result 类型 — 从 neverthrow 重导出，作为项目唯一权威来源
//
// 用法（AppError 定义在 ~/lib/errors/error-codes，本模块只做 Result 的重导出）：
//   import { ok, err, type Result } from '~/lib/errors/result';
//   import { AppError } from '~/lib/errors/error-codes';
//   function doThing(): Result<Data, AppError> { ... }
export {
  ok,
  err,
  okAsync,
  errAsync,
  type Result,
  type ResultAsync,
} from "neverthrow";
