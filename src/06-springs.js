// Layer 06 · Springs — physics stepping and stability.
// Read the chapter first (docs/06-springs.md). Each comment below is a spec; the tests check it.
(function (MS) {
  /**
   * The force a spring and its damper put on a mass at `position`, moving at
   * `velocity`, while the spring pulls it toward `target`:
   *   force = −stiffness × (position − target) − damping × velocity
   * config is { stiffness, damping, mass }. Any missing value (or a missing
   * config) takes Remotion's default: stiffness 100, damping 10, mass 1.
   */
  function springForce(position, velocity, target, config) {
    throw MS.todo("springForce");
  }

  /**
   * Move a spring forward by dt seconds. state is { position, velocity }.
   * Update the velocity first (acceleration = force ÷ mass), then move the
   * position using the NEW velocity. Return a new state object; don't change
   * the one passed in.
   *   stepSpring({ position: 1, velocity: 0 }, 0, { stiffness: 100, damping: 0, mass: 1 }, 0.01)
   *     → { position: 0.99, velocity: -1 }
   */
  function stepSpring(state, target, config, dt) {
    throw MS.todo("stepSpring");
  }

  /**
   * Like Remotion's spring(): where is a spring at `frame`, if it starts at
   * rest at `from` on frame 0 and is pulled toward `to`?
   * Simulate it with stepSpring in steps of 1 ms (dt = 0.001). Frame n is
   * Math.round(1000 × n ÷ fps) steps from the start. from defaults to 0 and
   * to to 1; config is passed on as it is.
   */
  function spring({ frame, fps, from = 0, to = 1, config } = {}) {
    throw MS.todo("spring");
  }

  /**
   * The damping ratio: damping ÷ (2 × √(stiffness × mass)), with the same
   * defaults. Below 1 the spring overshoots and bounces; from 1 up it doesn't.
   */
  function dampingRatio(config) {
    throw MS.todo("dampingRatio");
  }

  /**
   * The first frame from which spring() stays within threshold × |to − from|
   * of `to` (exactly on the edge counts as within) for every frame up to
   * 10 seconds (frame 10 × fps). Return Infinity if it's still outside at
   * 10 seconds.
   */
  function settleFrame({ fps, from = 0, to = 1, config, threshold = 0.005 } = {}) {
    throw MS.todo("settleFrame");
  }

  Object.assign(MS, { springForce, stepSpring, spring, dampingRatio, settleFrame });
})(globalThis.MS = globalThis.MS || {});
