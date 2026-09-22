export interface MockNotification {
  id: string;
  type:
    "reply" | "like" | "follow" | "system" | "file_approved" | "file_rejected";
  title: string;
  content: string;
  // 与 type 一样收敛为字面量联合：消费方可能据此解析跳转目标，拼错应在编译期报错
  //（contribution 的 PointReferenceType 已是同一做法）
  referenceType: "post" | "comment" | "user" | "file" | "competition";
  referenceId: string;
  isRead: boolean;
  createdAt: string;
}

// 冻结：模块级数组是共享可变状态，任何消费方原地改动都会泄漏给所有 import。
// 现有消费方（NotificationBell）用的是 map 生成新数组再赋值，故冻结不影响它。
export const mockNotifications: MockNotification[] = Object.freeze([
  {
    id: "n1",
    type: "reply",
    title: "notificationData.titles.reply",
    content: "notificationData.contents.n1",
    referenceType: "post",
    referenceId: "post-1",
    isRead: false,
    createdAt: "2026-07-27T10:30:00Z",
  },
  {
    id: "n2",
    type: "like",
    title: "notificationData.titles.like",
    content: "notificationData.contents.n2",
    referenceType: "comment",
    referenceId: "comment-5",
    isRead: false,
    createdAt: "2026-07-27T09:15:00Z",
  },
  {
    id: "n3",
    type: "follow",
    title: "notificationData.titles.follow",
    content: "notificationData.contents.n3",
    referenceType: "user",
    referenceId: "user-wangwu",
    isRead: false,
    createdAt: "2026-07-26T22:00:00Z",
  },
  {
    id: "n4",
    type: "file_approved",
    title: "notificationData.titles.fileApproved",
    content: "notificationData.contents.n4",
    referenceType: "file",
    referenceId: "file-2",
    isRead: true,
    createdAt: "2026-07-26T18:00:00Z",
  },
  {
    id: "n5",
    type: "system",
    title: "notificationData.titles.system",
    content: "notificationData.contents.n5",
    referenceType: "competition",
    referenceId: "comp-1",
    isRead: true,
    createdAt: "2026-07-25T12:00:00Z",
  },
  {
    id: "n6",
    type: "like",
    title: "notificationData.titles.like",
    content: "notificationData.contents.n6",
    referenceType: "post",
    referenceId: "post-3",
    isRead: true,
    createdAt: "2026-07-25T08:00:00Z",
  },
]) as MockNotification[];
