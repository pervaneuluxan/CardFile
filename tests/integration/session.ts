/** Mutable fake session shared by the auth mock and the tests. */
export const testSession: { user: { id: string; name: string; email: string } | null } = {
  user: null,
};

export function signInAs(id: string) {
  testSession.user = { id, name: `User ${id}`, email: `${id}@example.test` };
}
