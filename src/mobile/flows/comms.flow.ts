import ChatPage from '../pages/comms/chat.page';
import CallPage from '../pages/comms/call.page';
import GroupPage from '../pages/comms/group.page';
import MessengerPage from '../pages/client/messenger.page';

/**
 * High-level messaging/calling actions. Used by single-device specs and by
 * multiremote specs (where each global driver — `client`, `cpo`, `client2` —
 * is one participant; switch the active driver before calling these).
 */
export const CommsFlow = {
  /** Open Messenger and ensure the conversation list is showing. */
  async openMessenger(): Promise<void> {
    await MessengerPage.open();
    await ChatPage.backToList();
  },

  async openConversation(title: string): Promise<void> {
    if (!(await ChatPage.isListActive(3000))) await ChatPage.backToList();
    await ChatPage.openConversation(title);
  },

  async sendMessage(text: string): Promise<void> {
    await ChatPage.sendMessage(text);
  },

  async expectMessage(text: string, timeoutMs = 20000): Promise<boolean> {
    return ChatPage.hasMessage(text, timeoutMs);
  },

  /* ---- calls ---- */

  async startAudioCall(): Promise<void> {
    await ChatPage.audioCallButton.waitForDisplayed({ timeout: 10000 });
    await ChatPage.audioCallButton.click();
  },

  async startVideoCall(): Promise<void> {
    await ChatPage.videoCallButton.waitForDisplayed({ timeout: 10000 });
    await ChatPage.videoCallButton.click();
  },

  async answerCall(): Promise<void> {
    await CallPage.answer();
  },

  async endCall(): Promise<void> {
    await CallPage.end();
  },

  /* ---- groups ---- */

  async openGroupInfo(groupTitle: string): Promise<void> {
    await GroupPage.open(groupTitle);
  },

  async startGroupCall(): Promise<void> {
    await GroupPage.groupCallButton.click();
  },

  async startGroupVideoCall(): Promise<void> {
    await GroupPage.groupVideoButton.click();
  },
};
