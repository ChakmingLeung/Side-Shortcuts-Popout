# Edge Sidebar History Migration

Microsoft Edge is retiring the built-in sidebar app list / App Tower. This CLI exports recovered Edge sidebar links from an Edge profile, or converts an already exported URL list into a Side Shortcuts Popout backup file that can be imported from the extension Options page.

The CLI does not modify browser storage directly. It creates a normal backup JSON file, so users can review it before importing.

## Files

- `edge-sidebar-shortcuts.json` - sample recovered Edge sidebar shortcuts.
- `edge-sidebar-migrate.ps1` - CLI entrypoint.
- `edge-sidebar-to-backup.ps1` - internal converter kept as a compatibility entrypoint.
- `test-edge-sidebar-migrate.ps1` - black-box tests for Edge profile export and file conversion.
- `SKILL.md` - short agent workflow for recovering sidebar entries and producing the import file.

## CLI

```text
edge-sidebar-migrate.ps1 export-edge -EdgeProfilePath <Edge profile dir or Preferences file>
edge-sidebar-migrate.ps1 convert -InputPath <JSON or Markdown list>
edge-sidebar-migrate.ps1 help
```

## Input modes

1. **Direct Edge profile export** - read the Edge profile `Preferences` file with `-EdgeProfilePath`.
2. **Already exported file** - read a JSON / Markdown shortcut list with `-InputPath`.

Both modes produce the same Side Shortcuts Popout backup format.

## Edge 149 support

Edge 149 removes the built-in sidebar app list UI, but some profiles may still keep the old sidebar URL records in `Preferences`. In that case, direct export works:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\edge-sidebar-migrate\edge-sidebar-migrate.ps1 export-edge `
  -EdgeProfilePath "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default" `
  -OutputPath .\Side-Shortcuts-Popout-edge-sidebar-backup.json `
  -ShortcutListOutputPath .\edge-sidebar-link-list.json
```

If Edge has already cleaned the URL records, the script reports that only sidebar titles remain. Use a pre-cleanup `Preferences` backup or an already exported URL list in that case.

## Input formats

JSON array:

```json
[
  { "title": "ChatGPT", "url": "https://chat.openai.com/", "mobile": true }
]
```

Side Shortcuts Popout backup JSON is also accepted; the script reads its `shortcuts` array.

Markdown list:

```markdown
1. ChatGPT -- https://chat.openai.com/
2. Claude -- https://claude.ai/
- [Perplexity](https://www.perplexity.ai/)
```

## Usage

Convert the included sample exported list:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\edge-sidebar-migrate\edge-sidebar-migrate.ps1 convert `
  -InputPath .\tools\edge-sidebar-migrate\edge-sidebar-shortcuts.json
```

With custom input/output:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\edge-sidebar-migrate\edge-sidebar-migrate.ps1 convert `
  -InputPath .\my-edge-sidebar-list.md `
  -OutputPath .\Side-Shortcuts-Popout-edge-sidebar-backup.json
```

Force every imported shortcut to desktop mode:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\edge-sidebar-migrate\edge-sidebar-migrate.ps1 convert `
  -InputPath .\tools\edge-sidebar-migrate\edge-sidebar-shortcuts.json `
  -Desktop
```

Then open Side Shortcuts Popout Options, choose **Import**, and choose **Merge**.

## Test

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\edge-sidebar-migrate\test-edge-sidebar-migrate.ps1
```

## Notes

- Shortcut IDs are deterministic from URL, so importing the same generated file with **Merge** updates the same entries instead of creating duplicates.
- Titles are trimmed to the extension's 40-character limit.
- Only `http` and `https` URLs are exported.
- Mobile mode defaults to `true`, matching the extension's default for newly added shortcuts. Use `-Desktop` or set `"mobile": false` per item when needed.
