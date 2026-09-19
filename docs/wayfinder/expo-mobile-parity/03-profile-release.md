# 03 Profile Release

- [x] Remove NativeWind TextInput crash trigger.
- [x] Own profile renders in signed Release.
- [x] Other profile renders read-only.
- [x] Edit-on-blur persists against production.
- [x] Keyboard and cold restart pass.
- [ ] Theme variants pass.

September 19: both native platforms exposed the own-name editor and focused it without
changing the name. Another writer's name remained plain text after tapping; no editor or
keyboard appeared. Theme transition defects were reproduced on iOS and fixed in source;
corrected native verification remains open. See [parity review](./09-parity-review.md).
