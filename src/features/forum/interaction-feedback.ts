// 论坛互动（点赞/收藏/评论）写入失败时的统一反馈。
//
// 抽出来是因为两处调用方（PostInteractions / CommentSection）的处理必须一致，
// 尤其是「403 不在这里提示」这条：HTTP 层已按报文分类广播 lkm:permission-denied，
// 由全站单例 PermissionDeniedDialog 弹「无权限」，这里再弹一次就是两个框。
// 复制一份到第二个组件里，两边迟早会分叉。

import { t } from "~/lib/i18n";
import { dispatchOpenLoginModal } from "~/features/shell/common/shell-events";
import type { AppError } from "~/lib/errors/error-codes";

export function reportInteractionFailure(error: AppError): void {
  // 会话过期/未登录：引导登录，而不是报一句「操作失败」
  if (error.cause === 401) {
    dispatchOpenLoginModal();
    return;
  }
  // 403 已由全局无权限对话框承接（见文件头注释）
  if (error.cause === 403) return;
  console.warn("[forum] 互动写入失败:", error);
  alert(t("messages.operationFailed"));
}
