---
name: edge-sidebar-history-migration
description: Recover Microsoft Edge sidebar/App Tower shortcut URLs and convert them into an importable Side Shortcuts Popout backup.
---

# Edge Sidebar History Migration

Use this skill when a user wants to move Microsoft Edge sidebar/App Tower links into Side Shortcuts Popout after Edge removes or hides the built-in sidebar app list.

## Workflow

1. Choose the input mode:
   - Direct Edge profile export with `-EdgeProfilePath`.
   - Already exported JSON / Markdown list with `-InputPath`.
2. For direct Edge export, use the profile directory or its `Preferences` file:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\edge-sidebar-migrate\edge-sidebar-migrate.ps1 export-edge `
     -EdgeProfilePath "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default" `
     -OutputPath .\Side-Shortcuts-Popout-edge-sidebar-backup.json `
     -ShortcutListOutputPath .\edge-sidebar-link-list.json
   ```

3. For an already exported list, run:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\edge-sidebar-migrate\edge-sidebar-migrate.ps1 convert `
     -InputPath .\path\to\edge-sidebar-list.md `
     -OutputPath .\Side-Shortcuts-Popout-edge-sidebar-backup.json
   ```

4. Ask the user to review the generated JSON if the recovered source was noisy or inferred from browser history.
5. Import from Side Shortcuts Popout Options -> Import -> Merge.
6. Verify by checking that the shortcut count and titles match the recovered list.

## Data Contract

Each shortcut should have:

```json
{
  "title": "ChatGPT",
  "url": "https://chat.openai.com/",
  "mobile": true
}
```

The generated backup uses:

```json
{
  "version": 1,
  "app": "side-shortcuts-popout",
  "shortcuts": []
}
```

Shortcut IDs are deterministic from URL, so repeated imports with Merge do not create duplicates for the same URL.

## Edge 149 Notes

Edge 149 removes the built-in sidebar app list UI. Direct export still works when the profile `Preferences` file keeps the old sidebar URL records. If the script reports that only titles remain, Edge has likely cleaned the URL records; use a pre-cleanup `Preferences` backup or an already exported list.

## When LLM Judgment Helps

Use LLM judgment only for recovering or cleaning the source list, for example:

- Deciding which entries from browser history were likely old Edge sidebar apps.
- Normalizing long product URLs to canonical home URLs.
- Assigning readable titles to recovered URLs.

Do not use LLM judgment for the actual import file format. Use the CLI so the output stays deterministic.
