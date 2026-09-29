export function DeleteButton() {
  const copy = "Permanently delete";
  const update = { active: false, deleted_at: new Date() };
  return { copy, update };
}
