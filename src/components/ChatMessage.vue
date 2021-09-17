<template>
  <div class="message-item-wrapper" ref="messageWrapper">
    <div class="message-item__reply" v-if="replyMessage">
      <j-icon size="xs" name="arrow-90deg-down"></j-icon>
      <div v-html="replyMessage.content"></div>
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
          :hash="message.did"
          :src="profile?.profilePicture"
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
            >{{ profile?.username }}
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
          <j-button
            @click="() => $emit('emojiClick', reaction.content)"
            size="xs"
            variant="subtle"
            :key="i"
            v-for="(reaction, i) in sortedReactions"
          >
            {{ reaction.content }}
            <span>{{ reaction.count }}</span>
          </j-button>
        </div>
      </div>
      <div class="message-item__toolbar" :class="{}">
        <j-tooltip placement="top" title="Add emoji">
          <j-button ref="emojiButton" variant="ghost" size="sm">
            <j-icon size="sm" name="emoji-smile" />
          </j-button>
        </j-tooltip>
        <j-tooltip placement="top" title="Reply">
          <j-button
            @click="() => $emit('replyClick')"
            variant="ghost"
            size="sm"
          >
            <j-icon size="sm" name="reply" />
          </j-button>
        </j-tooltip>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import genereateHTML from "../components/TipTap/generateHTML";
import tippy from "tippy.js";
import getProfile from "../api/getProfile";
import { Reaction, Message } from "../types";

export default defineComponent({
  emits: ["mentionClick", "profileClick", "replyClick", "emojiClick"],
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
      profile: {} as any,
      toolbarOpen: false,
    };
  },
  async mounted() {
    this.createEmojiPicker();

    this.profile = await getProfile({
      did: this.message.author,
      languageAddress: "QmTtP2WXQ8BXLeQ7FMnpmuDZvHttYTcJwuGMXVREBkFJPf",
    });
  },
  computed: {
    html() {
      return this.message.content;
    },
    sortedReactions(): Object {
      const reactions = (this.message.reactions as Array<Reaction>) || [];
      return reactions.reduce((acc: any, reaction: Reaction) => {
        const previous = acc[reaction.content] || { authors: [], count: 0 };
        return {
          ...acc,
          [reaction.content]: {
            authors: [...previous.authors, reaction.author],
            content: reaction.content,
            count: previous.count + 1,
          },
        };
      }, {});
    },
  },
  methods: {
    createEmojiPicker() {
      const emojiPicker = document.createElement("emoji-picker");

      emojiPicker.addEventListener("emoji-click", (event: any) => {
        this.$emit("emojiClick", event.detail.unicode);
      });

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
    onMessageClick() {
      console.log("message click");
    },
    handleProfileClick() {
      this.$emit("profileClick", this.message.did);
    },
  },
});
</script>
