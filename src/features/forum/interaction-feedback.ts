// 论坛互动（点赞/收藏/评论/转发/举报）写入失败时的统一反馈。
//
// 抽出来是因为多处调用方（PostInteractions / CommentSection）的处理必须一致，
// 尤其是「已经被全局对话框承接的错误不重复提示」这条。复制到每个组件里，两边迟早会分叉。

import { t } from "~/lib/i18n";
import { dispatchOpenLoginModal } from "~/features/shell/common/shell-events";
import { isPermissionDeniedHandled } from "~/lib/http/permission-denied";
import type { AppError } from "~/lib/errors/error-codes";

export function reportInteractionFailure(error: AppError): void {
  // 越权拒绝：HTTP 层已广播 lkm:permission-denied，全站单例 PermissionDeniedDialog
  // 会弹「无权限」，这里再弹一次就是两个框。
  // 判据是「是否已被承接」而不是 `cause === 403`——403 远不止越权一种
  //（匿名/令牌失效、板块禁言、非属主都是 403），按状态码一刀切会把它们变成静默失败。
  if (isPermissionDeniedHandled(error)) return;
  // 令牌过期/失效 → 401，引导登录比报一句「操作失败」有用。
  // 刻意**不**把 403 也算进来：403 里既有「没带令牌」（core/ports/authz.py 的
  // _parse_bearer 优先于令牌校验，抛 FORBIDDEN）、也有板块禁言/非属主之类的业务拒绝，
  // 一律弹登录浮层会指错方向；它们退到下面的通用提示，至少是可见的。
  if (error.cause === 401) {
    dispatchOpenLoginModal();
    return;
  }
  console.warn("[forum] 互动写入失败:", error);
  alert(t("messages.operationFailed"));
}
