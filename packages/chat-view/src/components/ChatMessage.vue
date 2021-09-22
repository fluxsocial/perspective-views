<template>
  <div class="message-item-wrapper" ref="messageWrapper">
    <div class="message-item__reply" v-if="replyMessage">
      <j-icon
        style="align-self: flex-end"
        size="xs"
        name="arrow-90deg-right"
      ></j-icon>
      <j-flex gap="300">
        <span nomargin>{{ replyMessage.author?.username }}:</span>
        <div style="flex: 1" v-html="replyMessage.content"></div>
      </j-flex>
    </div>
    <div
      class="message-item"
      :class="{ 'message-item--is-replying': isReplying }"
      ref="messageItem"
    >
      <div class="message-item__left-column">
        <j-avatar
          class="message-item__avatar"
          @click="handleProfileClick"
          v-if="showAvatar"
          :hash="message.author.did"
          :src="message.author?.profilePicture"
        />

        <j-tooltip placement="top" v-else>
          <j-timestamp
            slot="title"
            :value="message.timestamp"
            datestyle="medium"
            timestyle="short"
          ></j-timestamp>
          <j-timestamp
            class="message-item__timestamp"
            hour="numeric"
            minute="numeric"
            :value="message.timestamp"
          ></j-timestamp>
        </j-tooltip>
      </div>
      <div class="message-item__right-column">
        <div class="message-item__message-info" v-if="showAvatar">
          <j-text
            @click="handleProfileClick"
            slot="trigger"
            color="black"
            nomargin
            weight="500"
            class="message-item__username"
            >{{ message.author.username }}
          </j-text>
          <j-tooltip placement="top">
            <j-timestamp
              slot="title"
              :value="message.timestamp"
              dateStyle="medium"
              timeStyle="short"
            ></j-timestamp>
            <j-timestamp
              class="message-item__timestamp"
              relative
              :value="message.timestamp"
            ></j-timestamp>
          </j-tooltip>
        </div>
        <div
          class="message-item__message"
          @click="onMessageClick"
          v-html="message.content"
        ></div>
        <div class="message-item__reactions">
          <button
            class="message-item__reaction"
            :class="{
              'message-item__reaction--me': checkIfAgentMadeReaction(
                reaction.content
              ),
            }"
            @click="() => onEmojiClick(reaction.content)"
            :key="i"
            v-for="(reaction, i) in sortedReactions"
          >
            <span>{{ reaction.content }}</span>
            <span>{{ reaction.count }}</span>
          </button>
        </div>
      </div>

      <div class="message-item__toolbar">
        <j-tooltip placement="top" title="Add reaction">
          <j-button ref="emojiButton" variant="ghost" size="sm"> 😀 </j-button>
        </j-tooltip>
        <j-tooltip placement="top" title="Reply">
          <j-button
            @click="() => $emit('replyClick')"
            variant="ghost"
            size="sm"
          >
            ⤵️
          </j-button>
        </j-tooltip>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import tippy from "tippy.js";
import { Reaction } from "../types";
import getMe from "../api/getMe";
import { LinkExpression, Agent } from "@perspect3vism/ad4m";

export default defineComponent({
  emits: [
    "mentionClick",
    "profileClick",
    "replyClick",
    "addReaction",
    "removeReaction",
  ],
  props: {
    message: {
      type: Object,
      required: true,
    },
    replyMessage: Object,
    showAvatar: Boolean,
    isReplying: Boolean,
  },
  data() {
    return {
      me: null as Agent | null,
      toolbarOpen: false,
    };
  },
  async mounted() {
    this.me = await getMe();
    this.createEmojiPicker();
  },
  computed: {
    html() {
      return this.message.content;
    },
    sortedReactions(): {
      [x: string]: { authors: Array<string>; content: string; count: number };
    } {
      const reactions = (this.message.reactions as Array<LinkExpression>) || [];
      return reactions.reduce((acc: any, reaction: LinkExpression) => {
        const previous = acc[reaction.data.target] || { authors: [], count: 0 };
        return {
          ...acc,
          [reaction.data.target]: {
            authors: [...previous.authors, reaction.author],
            content: reaction.data.target,
            count: previous.count + 1,
          },
        };
      }, {});
    },
  },
  methods: {
    checkIfAgentMadeReaction(unicode: string) {
      return this.message.reactions.some(
        (reaction: LinkExpression) =>
          reaction.author === this.me?.did && reaction.data.target === unicode
      );
    },
    createEmojiPicker() {
      const emojiPicker = document.createElement("emoji-picker");

      emojiPicker.addEventListener("emoji-click", (e: any) =>
        this.onEmojiClick(e.detail.unicode)
      );

      emojiPicker.style.display = "block";

      tippy(this.$refs.emojiButton as HTMLElement, {
        content: emojiPicker,
        trigger: "click",
        appendTo: document.body,
        interactive: true,
        onShow: () => {
          this.toolbarOpen = true;
        },
        onHide: () => {
          this.toolbarOpen = false;
        },
      });
    },
    async onEmojiClick(unicode: string) {
      const me = await getMe();
      const alreadyMadeReaction = this.message.reactions.find(
        (reaction: LinkExpression) =>
          reaction.author === me.did && reaction.data.target === unicode
      );
      if (alreadyMadeReaction) {
        this.$emit("removeReaction", alreadyMadeReaction);
      } else {
        this.$emit("addReaction", unicode);
      }
    },
    onMessageClick() {},
    handleProfileClick() {
      this.$emit("profileClick", this.message.did);
    },
  },
});
</script>
