// Translucent copy of the Target drawn on the Player's spot so differences show as offsets.
import { createCharacterView } from './characterView.js';

export function createGhost(scene, { color, opacity }) {
  const view = createCharacterView(scene, { palette: { ghost: color }, ghost: true, opacity });
  let builtVersion = -1;
  return {
    update(visible, target, x, z) {
      view.setVisible(visible);
      if (!visible) return;
      if (builtVersion !== target.version) { view.build(target.body.dims); builtVersion = target.version; }
      view.applyPose(target.pose);
      view.setPosition(x, z);
    },
    dispose: () => view.dispose(),
  };
}
