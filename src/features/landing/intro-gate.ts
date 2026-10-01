/**
 * The hero intro waits on this gate so it plays under the preloader's curtain
 * instead of behind it. Opened by the preloader, or immediately when it is skipped.
 */
let openGate: () => void = () => {};

export const introGate = new Promise<void>(resolve => {
  openGate = resolve;
});

export const openIntroGate = () => openGate();
