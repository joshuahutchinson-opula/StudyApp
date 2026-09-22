import { db } from "./db.js";

// Every route reached by a resource id alone (a page, a task, a card...)
// needs to verify that resource actually belongs to the authenticated user
// before mutating it — otherwise any logged-in user could edit any other
// user's data just by guessing a UUID. Shared here since several route
// files need "does this page belong to this user" via its binder.
export async function pageBelongsToUser(pageId: string, userId: string): Promise<boolean> {
  const page = await db.page.findUnique({
    where: { id: pageId },
    select: { binder: { select: { userId: true } } },
  });
  return page?.binder.userId === userId;
}

export async function binderBelongsToUser(binderId: string, userId: string): Promise<boolean> {
  const binder = await db.binder.findUnique({ where: { id: binderId }, select: { userId: true } });
  return binder?.userId === userId;
}
