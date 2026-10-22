# Sin Hunter's Board

An 1889 cork evidence board for a CAIN one-shot: pin up notes, telegrams and
old photographs about the sin you're hunting, and tie them together with
coloured string.

**Live site:** https://endermage99.github.io/cain-hunters-board/

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
  board to the screen and **Room** zooms out to the whole room. Drag empty
  space to pan.
- **Case file:** **Export PNG** saves a picture of the whole board, with the
  board itself tucked inside the file, so **Open file** on that PNG brings
  the working board back. **Save file** saves the same thing as `.json`.
  Removing, clearing and opening can all be undone from the message that
  appears.

The page opens on an example case. **Clear board** starts your own.

The board hangs from a picture rail in a Victorian room, drawn to scale: a
grandfather clock, a bust on a pedestal, a sofa and tea table, a china
cabinet, and two sash windows looking across a London street at dusk, where
people, cabs, an omnibus and a brewer's dray pass gas-lit shopfronts. The
street loops without cuts, and holds still if your system asks for reduced
motion.

## Files

- `index.html` - the page
- `css/board.css` - all styling
- `js/board.js` - the board, the photo ageing and the PNG export
- `js/street.js` - the animated street outside the windows
- `img/cork.jpg` - the cork texture
- `img/room/` - room and street textures
- `img/decor/` - furniture and objects in the room

Plain HTML, CSS and JavaScript with no build step. Opened straight from disk
everything works except Export PNG, which browsers block for `file://`
pages; use the live site or any local server (`npx serve`, `python -m
http.server`).

## Credits

- Wallpaper: William Morris, *St James* (1880/81), public domain, via
  [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Morris_St_James_1880.jpg)
- Wood, floorboards, brick and cobblestone textures: [Poly Haven](https://polyhaven.com)
  (CC0): Dark Wood, Wood Floor Worn, Dark Brick Wall, Cobblestone 02
- Furniture and objects: renders of [Poly Haven](https://polyhaven.com/models) models (CC0):
  Vintage Grandfather Clock 01, Side Table Tall 01, Marble Bust 01, Vintage
  Cabinet 01, Vintage Oil Lamp, Book Encyclopedia Set 01, Mantel Clock 01,
  Potted Plant 01, Sofa 03, Round Wooden Table 01, Tea Set 01, Treasure Chest,
  Brass Candleholders, Chinese Armchair, Vintage Suitcase