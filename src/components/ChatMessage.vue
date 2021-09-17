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
          :hash="did"
          :src="profileImg"
        />

        <j-tooltip placement="top" v-else>
          <j-timestamp
            slot="title"
            :value="timestamp"
            datestyle="medium"
            timestyle="short"
          ></j-timestamp>
          <j-timestamp
            class="message-item__timestamp"
            hour="numeric"
            minute="numeric"
            :value="timestamp"
          ></j-timestamp>
        </j-tooltip>
      </div>
      <div class="message-item__right-column">
        <div class="message-item__message-info" v-if="showAvatar">
          <j-text
            @click="handleProfileClick"
            slot="trigger"
            :id="username"
            color="black"
            nomargin
            weight="500"
            class="message-item__username"
            >{{ username }}
          </j-text>
          <j-tooltip placement="top">
            <j-timestamp
              slot="title"
              :value="timestamp"
              dateStyle="medium"
              timeStyle="short"
            ></j-timestamp>
            <j-timestamp
              class="message-item__timestamp"
              relative
              :value="timestamp"
            ></j-timestamp>
          </j-tooltip>
        </div>
        <div
          class="message-item__message"
          @click="onMessageClick"
          v-html="message"
        ></div>
        <div class="message-item__reactions">
          <j-button
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
import { Reaction } from "../types";

export default defineComponent({
  emits: ["mentionClick", "profileClick", "replyClick", "emojiClick"],
  props: {
    did: String,
    replyMessage: Object,
    reactions: Array,
    timestamp: String,
    username: String,
    message: String,
    profileImg: String,
    showAvatar: Boolean,
    isReplying: Boolean,
  },
  data() {
    return {
      toolbarOpen: false,
    };
  },
  mounted() {
    const emojiPicker = document.createElement("emoji-picker");

    emojiPicker.addEventListener("emoji-click", (event: any) => {
      this.$emit("emojiClick", event.detail);
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
  computed: {
    html() {
      return this.message;
    },
    sortedReactions(): Object {
      const reactions = (this.reactions as Array<Reaction>) || [];
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
    onMessageClick() {
      console.log("message click");
    },
    handleProfileClick() {
      this.$emit("profileClick", this.did);
    },
  },
});
</script>
