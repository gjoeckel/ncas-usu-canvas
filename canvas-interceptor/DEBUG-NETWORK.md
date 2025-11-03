# Debug Network Requests

The extension should be intercepting requests. Let's verify what Chrome is actually seeing.

## Steps to Debug:

1. **Open Canvas course page**

2. **Open DevTools** (F12)

3. **Go to Network tab**

4. **Look for these files:**
   - `ncas2.css`
   - `ncas2.js`

5. **Check the Details:**
   - What URL shows in the "Request URL" column?
   - Should be redirected to `localhost:3000` if extension working
   - If showing AWS URL, extension isn't redirecting

6. **Check Response Headers:**
   - Click on the file
   - Look at "Response Headers"
   - Should show `X-Served-By: Canvas-Interceptor` if coming from our server

7. **Check Response Content:**
   - Click on the file
   - Look at "Response" or "Preview" tab
   - Can you see the 80% width CSS rule?
   - Or do you see old code?

## If Extension Not Working:
- Make sure version is 0.3.2
- Toggle extension off/on
- Check Service Worker console for errors

