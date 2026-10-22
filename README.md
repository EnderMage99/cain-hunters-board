# Sin Hunter's Board

An 1889 cork evidence board for a CAIN one-shot: pin up notes, telegrams and
old photographs about the sin you're hunting, and tie them together with
coloured string.

**Live site:** https://endermage99.github.io/sin-hunters-board/

## Using it

No accounts. The board is kept in your own browser, so save a copy to keep
it or hand it to your players.

- **Pin up:** Note, Index card, Telegram, Heading and Photograph. Any picture
  you add is aged into an 1880s albumen print on a cabinet card. You can
  also drop image files onto the board or paste one.
- **Move and write:** drag to move, double-click to write, drag the corner
  handle to resize. A selected item also has Write, Tilt and Remove.
- **String:** press **Tie string** (or pick a colour), then click two items.
  Click a string to recolour or cut it.
- **View:** the − / + buttons or Ctrl + scroll zoom; the percentage fits the
  board to the screen. Drag empty cork to pan.
- **Case file:** **Export PNG** saves a picture of the whole board, with the
  board itself tucked inside the file, so **Open file** on that PNG brings
  the working board back. **Save file** saves the same thing as `.json`.
  Removing, clearing and opening can all be undone from the message that
  appears.

The page opens on an example case. **Clear board** starts your own.

## Files

- `index.html` - the page
- `css/board.css` - all styling
- `js/board.js` - the board, the photo ageing and the PNG export
- `img/cork.jpg` - the cork texture

Plain HTML, CSS and JavaScript with no build step. Opened straight from disk
everything works except Export PNG, which browsers block for `file://`
pages; use the live site or any local server (`npx serve`, `python -m
http.server`).
