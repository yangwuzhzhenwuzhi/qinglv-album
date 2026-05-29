# Couple Travel Album Design

## Goal

Build a local-first single-page web app for a couple to record travel memories, view visited places on a China map, and spin a wheel to decide where to go next.

## Scope

The first version stores all data in the browser with `localStorage`. It does not require login, a server, a database, or cloud sync.

Included:
- Add, edit, and delete travel records.
- Store destination province, city, date, mood tag, memory text, and photos.
- Show a warm photo-album style home view with simple stats.
- Highlight visited provinces on a China map.
- Show specific city names and memories in cards.
- Maintain a wishlist for future destinations.
- Spin a wheel to randomly pick one wishlist destination.

Not included in the first version:
- Multi-device sync.
- User accounts.
- Real backend photo upload.
- Collaborative editing.
- Route planning or real travel booking.

## User Experience

The page should feel warm, clean, and romantic without becoming childish. The first screen should immediately show that this is a couple's shared travel album, with a memory-focused layout rather than a marketing landing page.

Primary sections:
- Header summary: title, days together, visited province count, travel record count, photo count.
- Memory records: card grid showing destination, date, tag, text, and photos.
- Record editor: modal or side panel for adding and editing records.
- China footprint map: province-level highlights based on saved records.
- Travel wheel: animated wheel using wishlist destinations.
- Wishlist manager: add and remove future destinations used by the wheel.

## Data Model

Travel record:
- `id`: stable unique string.
- `province`: province-level location used for map highlighting.
- `city`: specific city or place name shown in records.
- `date`: travel date.
- `tag`: short mood or theme label.
- `memory`: free text.
- `photos`: array of locally encoded image data URLs.
- `createdAt`: timestamp.
- `updatedAt`: timestamp.

Wishlist item:
- `id`: stable unique string.
- `name`: destination name.
- `province`: optional province for future map use.

Settings:
- `coupleStartDate`: optional date used to calculate days together.
- `albumTitle`: display title.

## Storage

Use `localStorage` with a single app key, for example `coupleTravelAlbum:v1`.

Photos are stored as data URLs for the first version. The UI should keep expectations modest: this is suitable for a small personal album, not thousands of full-resolution photos.

## Map Design

Use a province-level China map in the first version. Each saved record contributes its `province` to the highlighted set.

Map behavior:
- Visited provinces use a distinct highlight color.
- Unvisited provinces use a quiet neutral color.
- Clicking or hovering a province can show the related records if the implementation library supports it cleanly.
- Record cards remain the source of truth for exact city names.

## Wheel Design

The wheel uses wishlist destinations as segments. If the wishlist is empty, the wheel area shows an empty state asking the user to add destinations.

Spin behavior:
- User clicks a spin button.
- Wheel animates for a short duration.
- The selected destination is displayed prominently.
- The result does not automatically create a travel record.

## Error Handling

Handle these states gracefully:
- No travel records yet.
- No wishlist destinations yet.
- Image upload fails or an unsupported file is selected.
- `localStorage` is unavailable or full.
- Existing saved data is malformed.

For malformed saved data, reset to safe defaults instead of breaking the page.

## Testing

Manual verification should cover:
- Create, edit, and delete a travel record.
- Upload one or more photos.
- Reload the browser and confirm data persists.
- Add and remove wishlist items.
- Spin the wheel and confirm it selects a wishlist item.
- Confirm visited provinces update after record changes.
- Check layout on desktop and mobile viewport sizes.

## Implementation Notes

Prefer a small frontend app with plain data boundaries:
- `storage` helpers for load/save/reset.
- record and wishlist state management in the main app component.
- reusable components for stats, record form, record cards, map, and wheel.

Keep the first implementation local and focused. A backend can be added later by replacing the storage layer without changing the core UI concepts.
