# Disable Chrome Flags

Since we're using HTTP (not HTTPS), we don't need any special flags.

## Steps to Clean Up

1. Go to `chrome://flags/`

2. Search for "unsafely-treat-insecure-origin-as-secure"
   - Set it to **Disabled**

3. Search for "temporary-unexpire-flags"
   - Disable any M141, M140, M139, M118 flags you enabled earlier

4. Click **Relaunch** at bottom of page

5. After Chrome restarts, the extension should work perfectly with HTTP

